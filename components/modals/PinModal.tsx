'use client';

import { useRef, useState } from 'react';

export function PinModal({
  onVerify,
  onClose
}: {
  onVerify: (token: string) => void;
  onClose: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function focusInput(i: number) {
    inputs.current[i]?.focus();
    inputs.current[i]?.select();
  }

  async function submit(pin: string) {
    setLoading(true);
    setError(false);
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (!r.ok) throw new Error();
      const { token } = await r.json();
      onVerify(token);
    } catch {
      setError(true);
      setDigits(['', '', '', '', '', '']);
      focusInput(0);
      setTimeout(() => setError(false), 500);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);

    if (val && i < 5) {
      focusInput(i + 1);
    }

    if (next.every(d => d)) {
      void submit(next.join(''));
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      focusInput(i - 1);
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = text[i] || '';
    setDigits(next);
    const firstEmpty = next.findIndex(d => !d);
    focusInput(firstEmpty >= 0 ? firstEmpty : 5);
    if (next.every(d => d)) {
      void submit(next.join(''));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20 modal-backdrop" onClick={onClose} />
      <div
        className={`relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-5 modal-content ${error ? 'animate-shake' : ''}`}
      >
        <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mb-4" />
        <h3
          className="text-base font-bold text-[#3d281c] mb-1 text-center"
          style={{ fontFamily: 'Noto Serif SC, serif' }}
        >
          输入 PIN 码
        </h3>
        <p className="text-xs text-[#8b6f5e] text-center mb-5">
          请输入 6 位数字 PIN 码以继续操作
        </p>

        <div className="flex justify-center gap-2.5 mb-4" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onFocus={e => e.target.select()}
              disabled={loading}
              className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none transition-colors
                ${error ? 'border-red-400 bg-red-50 text-red-500' : d ? 'border-[#d48b60] bg-[#fdf5ec] text-[#3d281c]' : 'border-[#efd8c3]/60 bg-white text-[#3d281c]'}
                focus:border-[#d48b60] focus:bg-[#fdf5ec]
                disabled:opacity-50`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center mb-3">PIN 码错误，请重试</p>
        )}

        {loading && (
          <p className="text-xs text-[#8b6f5e] text-center mb-3">验证中...</p>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-white border border-[#efd8c3]/60 text-[#5c3d2a] rounded-xl font-medium active:scale-[0.98] transition-transform text-sm"
        >
          取消
        </button>
      </div>
    </div>
  );
}
