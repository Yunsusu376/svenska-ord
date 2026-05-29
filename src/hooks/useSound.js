import { useState, useEffect, useRef, useCallback } from 'react';

function playRaindrop(ctx) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200 + Math.random() * 800, now);
  filter.Q.value = 8;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1800 + Math.random() * 600, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}

export function useSound() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('sound-enabled');
    return saved === null ? true : saved === 'true';
  });
  const ctxRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sound-enabled', enabled);
  }, [enabled]);

  const play = useCallback(() => {
    if (!enabled) return;
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    playRaindrop(ctxRef.current);
  }, [enabled]);

  return { enabled, setEnabled, play };
}
