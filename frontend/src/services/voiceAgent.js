import {
  getVoiceConfig,
  startVoiceAgent,
  updateVoiceContext,
  speakVoiceAgent,
  stopVoiceAgent,
} from './api';

function withTimeout(promise, milliseconds, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out`)), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

async function safeCleanup(resources) {
  const { ai, micTrack, rtcClient, rtmClient, agentId } = resources;
  try {
    ai?.unsubscribe();
    ai?.destroy();
  } catch (error) {
    console.warn('[Agora Voice] Transcript cleanup failed:', error);
  }
  try {
    micTrack?.stop();
    micTrack?.close();
  } catch (error) {
    console.warn('[Agora Voice] Microphone cleanup failed:', error);
  }
  try {
    if (rtcClient?.connectionState !== 'DISCONNECTED') await rtcClient?.leave();
  } catch (error) {
    console.warn('[Agora Voice] RTC cleanup failed:', error);
  }
  try {
    await rtmClient?.logout();
  } catch (error) {
    console.warn('[Agora Voice] RTM cleanup failed:', error);
  }
  if (agentId) {
    stopVoiceAgent(agentId).catch((error) => {
      console.warn('[Agora Voice] Agent cleanup failed:', error);
    });
  }
}

/**
 * Start the optional voice transport. Every failure is converted to a normal
 * `null` result so the caller can remain in text-only mode.
 */
/**
 * Start the optional voice transport. Returns a structured result:
 * - On success: { ok: true, session: { muted, setMuted, stop } }
 * - On failure: { ok: false, reason: string, message: string }
 *
 * Preserves text-only AI Director fallback without throwing unhandled exceptions.
 */
export async function connectAgoraVoice({ mission, hintLevel, context, onTranscript, onState }) {
  const resources = {};
  try {
    onState?.('CONNECTING');
    console.debug('[Voice] Fetching voice configuration from backend...');

    let config;
    try {
      config = await withTimeout(getVoiceConfig(), 5000, 'Voice configuration');
    } catch (netErr) {
      console.warn('[Voice] Voice configuration fetch failed or timed out:', netErr);
      onState?.('OFF');
      return {
        ok: false,
        reason: 'VOICE_SERVICE_OFFLINE',
        message: 'Voice backend service unreachable or timed out.',
      };
    }

    console.debug('[Voice] Config response received:', {
      available: config?.available,
      reason: config?.reason,
      channel: config?.channel,
      uid: config?.uid,
      hasToken: Boolean(config?.token),
    });

    if (!config?.available) {
      console.warn('[Voice] Voice mode unavailable from backend:', config?.message || config?.reason);
      onState?.('OFF');
      return {
        ok: false,
        reason: config?.reason || 'VOICE_CONFIG_MISSING',
        message: config?.message || 'Voice configuration missing or disabled.',
      };
    }

    // ── Pre-flight microphone permission check ──
    console.debug('[Voice] Checking microphone hardware and permissions...');
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.warn('[Voice] MediaDevices API not supported in this browser context.');
      onState?.('OFF');
      return {
        ok: false,
        reason: 'MICROPHONE_UNSUPPORTED',
        message: 'Browser does not support audio capture API.',
      };
    }

    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.debug('[Voice] Microphone permission granted successfully.');
      testStream.getTracks().forEach((track) => track.stop());
    } catch (micErr) {
      let micReason = 'MICROPHONE_ACCESS_DENIED';
      let micMessage = 'Microphone permission denied by user or system.';

      if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
        micReason = 'MICROPHONE_ACCESS_DENIED';
        micMessage = 'Microphone permission was denied. Please allow microphone access.';
      } else if (micErr.name === 'NotFoundError' || micErr.name === 'DevicesNotFoundError') {
        micReason = 'MICROPHONE_HARDWARE_NOT_FOUND';
        micMessage = 'No audio input hardware found on this system.';
      } else if (micErr.name === 'NotReadableError' || micErr.name === 'TrackStartError') {
        micReason = 'MICROPHONE_IN_USE';
        micMessage = 'Microphone hardware is busy or in use by another application.';
      } else {
        micReason = 'MICROPHONE_ERROR';
        micMessage = micErr.message || 'Unknown microphone initialization error.';
      }

      console.warn('[Voice] Microphone check failed:', micErr.name, micMessage);
      onState?.('OFF');
      return { ok: false, reason: micReason, message: micMessage };
    }

    console.debug('[Voice] Loading Agora Web SDK modules...');
    const [{ default: AgoraRTC }, { default: AgoraRTM }, toolkit] = await Promise.all([
      import('agora-rtc-sdk-ng'),
      import('agora-rtm'),
      import('agora-agent-client-toolkit'),
    ]);

    console.debug('[Voice] Initializing RTC client and joining channel:', config.channel);
    const rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    resources.rtcClient = rtcClient;

    rtcClient.on('user-published', async (user, mediaType) => {
      try {
        await rtcClient.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          console.debug('[Voice] Remote audio track active from agent UID:', user.uid);
        }
      } catch (error) {
        console.warn('[Agora Voice] Remote audio subscribe failed:', error);
      }
    });

    try {
      await withTimeout(
        rtcClient.join(config.app_id, config.channel, config.token, Number(config.uid) || 0),
        8000,
        'Voice channel join',
      );
      console.debug('[Voice] Successfully joined RTC channel');
    } catch (joinErr) {
      console.warn('[Voice] Agora RTC join failed:', joinErr);
      await safeCleanup(resources);
      onState?.('OFF');
      const isExpired = joinErr.message?.toLowerCase().includes('expired') || joinErr.code === 'DYNAMIC_KEY_TIMEOUT';
      return {
        ok: false,
        reason: isExpired ? 'TOKEN_EXPIRED' : 'AGORA_CONNECTION_FAILED',
        message: joinErr.message || 'Failed to join Agora audio channel.',
      };
    }

    // Enable audio volume detection for dynamic HUD states (LISTENING / SPEAKING / THINKING)
    try {
      rtcClient.enableAudioVolumeIndicator();
      rtcClient.on('volume-indicator', (volumes) => {
        const remoteVolume = volumes.find((v) => String(v.uid) !== String(config.uid) && v.level > 10);
        const localVolume = volumes.find((v) => String(v.uid) === String(config.uid) && v.level > 15);
        if (remoteVolume) {
          onState?.('SPEAKING');
        } else if (localVolume) {
          onState?.('THINKING');
        } else {
          onState?.('LISTENING');
        }
      });
    } catch (volErr) {
      console.debug('[Voice] Volume indicator initialization skipped:', volErr);
    }

    // Signaling / transcripts (best-effort)
    try {
      const rtmClient = new AgoraRTM.RTM(config.app_id, String(config.uid));
      resources.rtmClient = rtmClient;
      await withTimeout(rtmClient.login({ token: config.token }), 5000, 'Voice signaling login');
      await withTimeout(rtmClient.subscribe(config.channel), 4000, 'Voice transcript subscription');
      console.debug('[Voice] RTM signaling subscribed');

      const ai = await toolkit.AgoraVoiceAI.init({
        rtcEngine: rtcClient,
        rtmConfig: { rtmEngine: resources.rtmClient },
        renderMode: toolkit.TranscriptHelperMode.TEXT,
        enableLog: false,
      });
      resources.ai = ai;

      const deliveredTurns = new Set();
      ai.on(toolkit.AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (transcript) => {
        const completedAgentTurns = transcript.filter((item) =>
          item.uid !== '0' &&
          item.text?.trim() &&
          item.status !== toolkit.TurnStatus.IN_PROGRESS
        );
        const latest = completedAgentTurns.at(-1);
        if (!latest || deliveredTurns.has(latest.turn_id)) return;
        deliveredTurns.add(latest.turn_id);
        onTranscript?.(latest.text.trim());
      });
      ai.on(toolkit.AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (_, event) => {
        onState?.((event.state || 'LISTENING').toUpperCase());
      });
      ai.subscribeMessage(config.channel);
    } catch (rtmErr) {
      console.debug('[Voice] RTM signaling optional init notice (continuing audio):', rtmErr?.message);
    }

    console.debug('[Voice] Publishing local microphone audio track...');
    const micTrack = await withTimeout(
      AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: 'speech_standard' }),
      8000,
      'Microphone access',
    );
    resources.micTrack = micTrack;
    await rtcClient.publish(micTrack);
    console.debug('[Voice] Local microphone published to channel');

    console.debug('[Voice] Initiating cloud Conversational AI agent session with telemetry context...');
    let started;
    try {
      started = await withTimeout(startVoiceAgent({
        channel: config.channel,
        uid: config.uid,
        context: context || {},
        mission: {
          id: mission?.id,
          title: mission?.title,
          topic: mission?.topic,
          objective: mission?.objective,
        },
        hint_level: hintLevel,
      }), 10000, 'Voice agent start');
    } catch (agentErr) {
      console.warn('[Voice] Agent session start request failed:', agentErr);
      await safeCleanup(resources);
      onState?.('OFF');
      return {
        ok: false,
        reason: 'AGENT_SESSION_FAILED',
        message: agentErr.message || 'Failed to request agent session from backend.',
      };
    }

    if (!started?.available || !started.agent_id) {
      console.warn('[Voice] Agent session returned unavailable:', started);
      await safeCleanup(resources);
      onState?.('OFF');
      const isExpired = started?.message?.includes('401') || started?.message?.toLowerCase().includes('expired');
      return {
        ok: false,
        reason: isExpired ? 'TOKEN_EXPIRED' : (started?.reason || 'AGENT_SESSION_FAILED'),
        message: started?.message || 'Agent session could not be started.',
      };
    }

    resources.agentId = started.agent_id;
    console.debug('[Voice] Voice agent session online. Agent ID:', started.agent_id);
    onState?.('LISTENING');

    let muted = false;
    return {
      ok: true,
      session: {
        get muted() {
          return muted;
        },
        get agentId() {
          return resources.agentId;
        },
        async setMuted(nextMuted) {
          await micTrack.setEnabled(!nextMuted);
          muted = nextMuted;
          onState?.(muted ? 'MUTED' : 'LISTENING');
        },
        async updateContext(newContext) {
          if (resources.agentId) {
            console.debug('[Voice] Syncing gameplay telemetry to voice agent...');
            await updateVoiceContext(resources.agentId, newContext).catch((err) => {
              console.warn('[Voice] Context update failed (non-blocking):', err);
            });
          }
        },
        async speak(text) {
          if (resources.agentId) {
            console.debug('[Voice] Broadcasting in-world voice speech:', text);
            await speakVoiceAgent(resources.agentId, text).catch((err) => {
              console.warn('[Voice] Speak trigger failed (non-blocking):', err);
            });
          }
        },
        async stop() {
          onState?.('OFF');
          await safeCleanup(resources);
        },
      },
    };

  } catch (error) {
    console.warn('[Agora Voice] Unexpected error in voice pipeline:', error);
    onState?.('OFF');
    await safeCleanup(resources);
    return {
      ok: false,
      reason: 'VOICE_INITIALIZATION_ERROR',
      message: error.message || 'Unexpected voice initialization failure.',
    };
  }
}
