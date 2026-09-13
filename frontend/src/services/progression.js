/**
 * ═══════════════════════════════════════════════════════════════
 * PROGRESSION SERVICE — RunTime Arena
 * Authoritative source of truth: backend mission_completion
 * Client-side optimistic cache: localStorage('runtime_arena_progress')
 * ═══════════════════════════════════════════════════════════════
 */

import { getPlayerAnalytics } from './api';

const PROGRESS_CACHE_KEY = 'runtime_arena_progress';

/**
 * Read cached progress from localStorage (fast sync read for initial render).
 * Format: { "flight-101": ["01", "02", "03"], ... }
 */
export function getLocalProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Optimistically record mission completion into localStorage.
 */
export function recordLocalCompletion(moduleId, missionId) {
  if (!moduleId || !missionId) return;
  try {
    const current = getLocalProgress();
    const moduleMissions = new Set(current[moduleId] || []);
    moduleMissions.add(String(missionId).padStart(2, '0'));
    current[moduleId] = Array.from(moduleMissions).sort();
    localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('[Progression] Failed to write local progress cache:', err);
  }
}

/**
 * Fetch authoritative progression from backend database.
 * Updates local cache and returns the authoritative completed map.
 */
export async function getAuthoritativeProgress(userId) {
  const local = getLocalProgress();
  if (!userId) return local;

  try {
    const analytics = await getPlayerAnalytics(userId);
    const serverMap = {};

    if (Array.isArray(analytics?.missions)) {
      for (const m of analytics.missions) {
        if (!serverMap[m.module_id]) serverMap[m.module_id] = new Set();
        serverMap[m.module_id].add(String(m.mission_id).padStart(2, '0'));
      }
    }

    // Merge: Server is authoritative, but retain any un-synced local clears
    const merged = { ...local };
    for (const [mod, sMissions] of Object.entries(serverMap)) {
      merged[mod] = Array.from(new Set([...(merged[mod] || []), ...sMissions])).sort();
    }

    localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('[Progression] Backend progress fetch failed, using local cache:', err);
    return local;
  }
}

/**
 * Check whether a specific module is unlocked.
 *
 * Rules:
 * - flight-101: Always unlocked.
 * - vault-breach: Unlocked ONLY if flight-101 missions 01, 02, 03 are complete (or dev bypass).
 * - space-rescue: Always coming-soon.
 * - other: locked.
 */
export function isModuleUnlocked(moduleId, progressMap = {}) {
  // Developer override flag for testing
  if (import.meta.env.VITE_DEV_UNLOCK_MODULES === 'true') {
    return true;
  }

  if (moduleId === 'flight-101') {
    return true;
  }

  if (moduleId === 'vault-breach') {
    const flightMissions = progressMap['flight-101'] || [];
    const has01 = flightMissions.includes('01');
    const has02 = flightMissions.includes('02');
    const has03 = flightMissions.includes('03');
    return has01 && has02 && has03;
  }

  return false;
}

/**
 * Check whether a module has all of its missions completed.
 */
export function isModuleCompleted(moduleId, totalMissions = 3, progressMap = {}) {
  const missions = progressMap[moduleId] || [];
  return missions.length >= totalMissions;
}
