/**
 * Read English text aloud with the browser's Web Speech API.
 * Returns false when speech synthesis is unavailable.
 */
export function speak(text: string, opts: { rate?: number; onEnd?: () => void } = {}): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = opts.rate ?? 0.95;
  const voice = synth.getVoices().find(v => v.lang === 'en-US') || synth.getVoices().find(v => v.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  if (opts.onEnd) {
    utterance.onend = opts.onEnd;
    utterance.onerror = opts.onEnd;
  }
  synth.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
