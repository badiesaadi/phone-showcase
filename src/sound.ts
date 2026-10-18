let ac: any;
export const soundOn = () => localStorage.getItem('snd') === '1';
export const setSound = (v: boolean) => localStorage.setItem('snd', v ? '1' : '0');
export function tick(f = 900) { if (!soundOn()) return; try { ac = ac || new (window.AudioContext || (window as any).webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.frequency.value = f; g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.0001, t + .06); o.connect(g); g.connect(ac.destination); o.start(); o.stop(t + .07); } catch {} }
