import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import Button from '../components/common/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password, 'student');
      loginUser(data.user, data.token);
      navigate('/modules');
    } catch (err) {
      setError(err.message || 'Authentication rejected by security mainframe.');
    } finally {
      setLoading(false);
    }
  }

  // Quick Pilot Authentication presets for demo
  function handleQuickPilot(demoEmail, demoPass) {
    setEmail(demoEmail);
    setPassword(demoPass);
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-12 bg-black select-none">
      {/* Background Atmospherics (Strictly Monochrome) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 cockpit-grid opacity-15" />
        <div className="absolute inset-0 scanlines opacity-35" />
        <div className="absolute inset-0 vignette" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between pb-4 border-b border-[#E2E2E2] font-mono">
        <button
          onClick={() => navigate('/')}
          className="rt-control px-2.5 py-1 text-xs text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>◀</span>
          <span>RETURN TO TITLE</span>
          <span className="text-[9px] text-white border border-[#E2E2E2] px-1 py-0.2 rounded-[2px]">[ESC]</span>
        </button>
        <div className="text-[10px] tracking-[0.25em] text-[#B8BAB9] uppercase">
          SECURE PILOT TERMINAL // CLEARANCE GATEWAY
        </div>
      </header>

      {/* Main Terminal Login Card - rounded-[20px] container */}
      <main className="relative z-10 my-auto py-8 flex justify-center">
        <div className="w-full max-w-md bg-[#444345]/20 border border-[#E2E2E2] p-8 rounded-[20px]">
          {/* Terminal Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E2E2] mb-6">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#B8BAB9] uppercase">
              // RUN TIME ARENA AUTH
            </span>
            <span className="font-mono text-[9px] px-2 py-0.5 bg-[#444345] text-white border border-[#E2E2E2] rounded-[2px]">
              ONLINE
            </span>
          </div>

          <h2 className="font-sans text-2xl font-normal tracking-wide text-white mb-1">
            PILOT IDENTIFICATION
          </h2>
          <p className="font-mono text-xs text-[#B8BAB9] mb-6">
            Enter authorized flight credentials to link your mission progress and AI Game Director telemetry.
          </p>

          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-3 bg-black border border-[#E2E2E2] rounded-[2px]">
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#B8BAB9] mb-2">
              DEMO CALLSIGNS (CLICK TO FILL):
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickPilot('daksh@teamfit.ai', 'demo123')}
                className="rt-control px-2.5 py-1 text-white font-mono text-[10px] cursor-pointer transition-colors"
              >
                PILOT DAKSH
              </button>
              <button
                type="button"
                onClick={() => handleQuickPilot('harry@teamfit.ai', 'demo123')}
                className="rt-control px-2.5 py-1 text-white font-mono text-[10px] cursor-pointer transition-colors"
              >
                PILOT HARRY
              </button>
              <button
                type="button"
                onClick={() => handleQuickPilot('student@teamfit.ai', 'demo123')}
                className="rt-control px-2.5 py-1 text-white font-mono text-[10px] cursor-pointer transition-colors"
              >
                CANDIDATE
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] tracking-widest text-[#B8BAB9] uppercase mb-1.5">
                CALLSIGN / EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pilot@arena.io"
                required
                className="w-full bg-[#444345] border border-[#E2E2E2] focus:border-white text-white placeholder:text-[#E2E2E2] font-mono text-xs px-3.5 py-2.5 rounded-[2px] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-widest text-[#B8BAB9] uppercase mb-1.5">
                AUTHORIZATION KEY
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#444345] border border-[#E2E2E2] focus:border-white text-white placeholder:text-[#E2E2E2] font-mono text-xs px-3.5 py-2.5 rounded-[2px] outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-[#444345] border border-[#E2E2E2] text-[#E2E2E2] font-mono text-xs rounded-[2px]">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
            >
              AUTHENTICATE PILOT
            </Button>
          </form>

          {/* Guest Access Direct Button */}
          <div className="mt-4 pt-4 border-t border-[#E2E2E2] text-center">
            <button
              type="button"
              onClick={() => navigate('/modules')}
              className="rt-control px-3 py-2 font-mono text-xs text-white cursor-pointer transition-colors"
            >
              CONTINUE AS GUEST PILOT →
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pt-4 border-t border-[#E2E2E2] font-mono text-[10px] text-[#B8BAB9] flex justify-between">
        <div>RUN TIME ARENA // AUTHENTICATION SUBSYSTEM</div>
        <div>256-BIT SECURE CHANNEL</div>
      </footer>
    </div>
  );
}
