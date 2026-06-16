import { state } from '../app/state.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Thai TTS Strategy
//
//  Google Translate TTS blocks direct browser requests from external origins.
//  Solution: route through a free CORS-proxy server that fetches Google TTS
//  server-to-server (allowed), then returns audio with CORS headers.
//
//  Priority order:
//    1. corsproxy.io   → Google Translate TTS (tw-ob client)
//    2. allorigins.win → Google Translate TTS
//    3. corsproxy.io   → googleapis.com (alternate domain)
//    4. Direct Google TTS URLs (may work in some networks / future)
//    5. Web Speech API (no Thai = likely silent, but won't crash)
// ─────────────────────────────────────────────────────────────────────────────

const GOOGLE_TTS = (q, len) =>
  `https://translate.google.com/translate_tts?ie=UTF-8&q=${q}&tl=th&client=tw-ob&prev=input&total=1&idx=0&textlen=${len}`;

const GOOGLE_TTS_ALT = (q, len) =>
  `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${q}&tl=th&client=tw-ob&textlen=${len}`;

class AudioManager {
  constructor() {
    this.ctx = null;
    this.speechSynth = window.speechSynthesis || null;
    this.englishVoice = null;
    this.currentThaiAudio = null;

    if (this.speechSynth) {
      const loadVoices = () => {
        const voices = this.speechSynth.getVoices();
        if (voices.length > 0) this.englishVoice = this._findEnglishVoice(voices);
      };
      loadVoices();
      if (this.speechSynth.onvoiceschanged !== undefined) {
        this.speechSynth.onvoiceschanged = loadVoices;
      }
      setTimeout(loadVoices, 500);
    }
  }

  _findEnglishVoice(voices) {
    let v = voices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.name.includes('Google'));
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('en-us'));
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('en-gb'));
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    return v || null;
  }

  listVoices() {
    const voices = this.speechSynth ? this.speechSynth.getVoices() : [];
    console.log('=== Available Voices ===');
    voices.forEach((v, i) => console.log(`[${i}] ${v.name} | ${v.lang} | local:${v.localService}`));
    console.log(`English voice: ${this.englishVoice ? this.englishVoice.name : 'NONE'}`);
    console.log(`Thai voice: Google Translate TTS via CORS proxy`);
    return voices;
  }

  // ── Web Audio (sound effects) ─────────────────────────────────────────────
  initContext() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  playSound(type) {
    if (!state.get('soundEnabled')) return;
    this.initContext();
    const osc  = this.ctx.createOscillator();
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
        osc.start(now); osc.stop(now + 0.08); break;
      case 'pick':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.12); break;
      case 'correct':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25); break;
      case 'completion':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.35);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now); osc.stop(now + 0.6); break;
      case 'incorrect':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3); break;
    }
  }

  // ── Thai TTS ──────────────────────────────────────────────────────────────
  _speakThai(text) {
    // Stop any currently playing Thai audio
    if (this.currentThaiAudio) {
      this.currentThaiAudio.pause();
      this.currentThaiAudio.src = '';
      this.currentThaiAudio = null;
    }
    if (this.speechSynth) this.speechSynth.cancel();

    const q   = encodeURIComponent(text);
    const len = text.length;

    const directUrl  = GOOGLE_TTS(q, len);
    const altUrl     = GOOGLE_TTS_ALT(q, len);

    // Build ordered list of URLs to try.
    // CORS-proxy URLs first: the proxy server fetches Google TTS server-to-server
    // (Google allows this), then returns the audio to us with CORS headers.
    const urls = [
      `https://corsproxy.io/?url=${encodeURIComponent(directUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(altUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(altUrl)}`,
      directUrl,   // Direct — may work in some corporate/school networks
      altUrl,
    ];

    let urlIdx = 0;

    const tryNext = () => {
      if (urlIdx >= urls.length) {
        // Absolute last resort — Web Speech API with th-TH
        // On systems without Thai voice this will be silent, but won't throw
        console.warn('[TTS] All proxy strategies failed. Falling back to Web Speech API.');
        if (this.speechSynth) {
          const utt = new SpeechSynthesisUtterance(text);
          utt.lang = 'th-TH';
          utt.rate = 0.85;
          this.speechSynth.speak(utt);
        }
        return;
      }

      const url   = urls[urlIdx++];
      const audio = new Audio(url);
      this.currentThaiAudio = audio;

      let settled = false;
      const onFail = (reason) => {
        if (settled) return;
        settled = true;
        console.warn(`[TTS] Strategy ${urlIdx} failed (${reason}), trying next…`);
        audio.src = '';
        tryNext();
      };

      audio.onerror = () => onFail('onerror');
      audio.play().catch(e => onFail(e.message || 'play() rejected'));
    };

    tryNext();
  }

  // ── English TTS ───────────────────────────────────────────────────────────
  _speakEnglish(text) {
    if (!this.speechSynth) return;
    this.speechSynth.cancel();
    if (!this.englishVoice) {
      this.englishVoice = this._findEnglishVoice(this.speechSynth.getVoices());
    }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = 'en-US';
    utt.rate  = 0.95;
    utt.pitch = 1.0;
    if (this.englishVoice) utt.voice = this.englishVoice;
    this.speechSynth.speak(utt);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  speak(textTh, textEn) {
    if (!state.get('soundEnabled')) return;
    const lang = state.get('voiceLang') || 'th';
    if (lang === 'en' && textEn) {
      if (this.currentThaiAudio) {
        this.currentThaiAudio.pause();
        this.currentThaiAudio.src = '';
        this.currentThaiAudio = null;
      }
      this._speakEnglish(textEn);
    } else {
      this._speakThai(textTh);
    }
  }
}

export const audioManager = new AudioManager();
