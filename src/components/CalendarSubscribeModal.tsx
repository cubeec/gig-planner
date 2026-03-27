'use client';

import { useState } from 'react';

interface Props {
  onClose: () => void;
}

export default function CalendarSubscribeModal({ onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // On Vercel the origin will be the real domain; locally it'll be localhost:3000
  const calendarUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/calendar`
      : '/api/calendar';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select the input text
      const el = document.getElementById('cal-url-input') as HTMLInputElement | null;
      el?.select();
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ zIndex: 1000 }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-lg font-bold text-gray-900">Odebírat kalendář</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Zavřít"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-gray-600">
            Přidej tento odkaz do své kalendářové aplikace — nové koncerty se budou
            synchronizovat automaticky.
          </p>

          {/* URL + copy button */}
          <div className="flex gap-2">
            <input
              id="cal-url-input"
              type="text"
              readOnly
              value={calendarUrl}
              className="flex-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg font-mono text-gray-700 focus:outline-none select-all"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {copied ? '✓ Zkopírováno' : 'Kopírovat'}
            </button>
          </div>

          {/* App instructions */}
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-lg mt-0.5">📱</span>
              <div>
                <p className="font-semibold">Google Calendar</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Nastavení → Přidat kalendář → Z URL → vložit odkaz
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-lg mt-0.5">🍎</span>
              <div>
                <p className="font-semibold">Apple Kalendář</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Soubor → Nový odběr kalendáře → vložit odkaz
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-lg mt-0.5">📧</span>
              <div>
                <p className="font-semibold">Outlook</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Přidat kalendář → Přihlásit se k odběru z webu → vložit odkaz
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
