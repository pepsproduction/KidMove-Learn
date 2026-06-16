import { state } from '../app/state.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.speechSynth = window.speechSynthesis || null;
    this.englishVoice = null;
    this.currentThaiAudio = null; // Audio element for Google TTS

    // Load English voice only (for EN mode fallback)
    if (this.speechSynth) {
      const loadVoices = () => {
        const voices = this.speechSynth.getVoices();
        if (voices.length > 0) {
          this.englishVoice = this._findEnglishVoice(voices);
        }
      };
      loadVoices();
      if (this.speechSynth.onvoiceschanged !== undefined) {
        this.speechSynth.onvoiceschanged = loadVoices;
      }
      setTimeout(loadVoices, 500);
    }
  }

  _findEnglishVoice(voices) {
    // 1. Prefer Google US English online
    let v = voices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.name.includes('Google'));
    // 2. Any en-US
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('en-us'));
    // 3. en-GB
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('en-gb'));
    // 4. Any English
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    return v || null;
  }

  // Debug: list all available voices to console
  listVoices() {
    const voices = this.speechSynth ? this.speechSynth.getVoices() : [];
    console.log('=== Available Voices ===');
    voices.forEach((v, i) => console.log(`[${i}] ${v.name} | ${v.lang} | local:${v.localService}`));
    console.log(`English voice: ${this.englishVoice ? this.englishVoice.name + ' / ' + this.englishVoice.lang : 'NONE'}`);
    console.log(`Thai voice: Using Google Translate TTS (no local install needed)`);
    return voices;
  }

  // Lazy-initialize audio context on user interaction
  initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSound(type) {
    if (!state.get('soundEnabled')) return;
    this.initContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now); osc.stop(now + 0.08);
        break;

      case 'pick':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
        break;

      case 'correct':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
        break;

      case 'completion':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.35);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
        break;

      case 'incorrect':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
        break;
    }
  }

  // ─── Thai TTS via Google Translate Audio ───────────────────────────────────
  // Uses the publicly accessible Google Translate TTS endpoint.
  // Works on any device without needing Thai language packs installed.
  _speakThai(text) {
    // Stop any currently playing Thai audio
    if (this.currentThaiAudio) {
      this.currentThaiAudio.pause();
      this.currentThaiAudio.src = '';
      this.currentThaiAudio = null;
    }

    // Split into ≤200-char chunks (Google TTS limit per request)
    const chunks = [];
    let remaining = text;
    while (remaining.length > 0) {
      // Try to break at sentence boundaries (period, exclamation, space)
      let cutAt = Math.min(200, remaining.length);
      if (cutAt < remaining.length) {
        const lastBreak = Math.max(
          remaining.lastIndexOf('!', cutAt),
          remaining.lastIndexOf(' ', cutAt)
        );
        if (lastBreak > 100) cutAt = lastBreak + 1;
      }
      chunks.push(remaining.slice(0, cutAt).trim());
      remaining = remaining.slice(cutAt).trim();
    }

    // Play chunks sequentially
    let chunkIdx = 0;
    const playNextChunk = () => {
      if (chunkIdx >= chunks.length) return;
      const chunk = chunks[chunkIdx++];
      if (!chunk) { playNextChunk(); return; }

      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=th&client=gtx&ttsspeed=0.9`;
      const audio = new Audio(url);
      audio.volume = 1.0;
      this.currentThaiAudio = audio;

      audio.onended = playNextChunk;
      audio.onerror = (e) => {
        console.warn('Google TTS fetch failed, falling back to Web Speech:', e);
        // Hard fallback: use Web Speech with no voice (browser default)
        if (this.speechSynth) {
          this.speechSynth.cancel();
          const utt = new SpeechSynthesisUtterance(chunks.slice(chunkIdx - 1).join(' '));
          utt.lang = 'th-TH';
          utt.rate = 0.9;
          this.speechSynth.speak(utt);
        }
      };

      audio.play().catch(err => {
        console.warn('Audio.play() blocked:', err);
      });
    };

    playNextChunk();
  }

  // ─── English TTS via Web Speech API ───────────────────────────────────────
  _speakEnglish(text) {
    if (!this.speechSynth) return;
    this.speechSynth.cancel();

    // Re-lookup if not found yet
    if (!this.englishVoice) {
      this.englishVoice = this._findEnglishVoice(this.speechSynth.getVoices());
    }

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.95;
    utt.pitch = 1.0;
    if (this.englishVoice) utt.voice = this.englishVoice;
    this.speechSynth.speak(utt);
  }

  // ─── Public API: speak(textTh, textEn) ────────────────────────────────────
  // textEn is optional. If voiceLang === 'th' → uses Google Translate TTS (Thai).
  // If voiceLang === 'en' and textEn provided → uses Web Speech API (English).
  speak(textTh, textEn) {
    if (!state.get('soundEnabled')) return;

    const lang = state.get('voiceLang') || 'th';

    if (lang === 'en' && textEn) {
      // Cancel any playing Thai audio first
      if (this.currentThaiAudio) {
        this.currentThaiAudio.pause();
        this.currentThaiAudio.src = '';
        this.currentThaiAudio = null;
      }
      this._speakEnglish(textEn);
    } else {
      // Cancel any Web Speech
      if (this.speechSynth) this.speechSynth.cancel();
      this._speakThai(textTh);
    }
  }
}

export const audioManager = new AudioManager();
