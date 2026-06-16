import { state } from '../app/state.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.speechSynth = window.speechSynthesis || null;
    this.thaiVoice = null;
    this.englishVoice = null;
    this.voicesReady = false;
    
    if (this.speechSynth) {
      const loadVoices = () => {
        const voices = this.speechSynth.getVoices();
        if (voices.length > 0) {
          this.thaiVoice = this._findThaiVoice(voices);
          this.englishVoice = this._findEnglishVoice(voices);
          this.voicesReady = true;
        }
      };
      
      loadVoices();
      if (this.speechSynth.onvoiceschanged !== undefined) {
        this.speechSynth.onvoiceschanged = loadVoices;
      }
      // Some browsers (Chrome on Windows) need a small delay
      setTimeout(loadVoices, 200);
      setTimeout(loadVoices, 1000);
    }
  }

  _findThaiVoice(voices) {
    // 1. Google th-TH
    let v = voices.find(v => v.lang.toLowerCase().startsWith('th') && v.name.includes('Google'));
    // 2. Microsoft Online Thai (Pattara, Niwat, Achara)
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('th') && (v.name.includes('Online') || v.name.includes('Natural')));
    // 3. Any th-TH
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('th-'));
    // 4. Any th
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('th'));
    return v || null;
  }

  _findEnglishVoice(voices) {
    // 1. Google en-US
    let v = voices.find(v => v.lang.toLowerCase().startsWith('en-us') && v.name.includes('Google'));
    // 2. Any en-US
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('en-us'));
    // 3. en-GB
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('en-gb'));
    // 4. Any en
    if (!v) v = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    return v || null;
  }

  // Debug: list all available voices to console
  listVoices() {
    if (!this.speechSynth) { console.log('No speechSynth'); return []; }
    const voices = this.speechSynth.getVoices();
    console.log('=== Available Voices ===');
    voices.forEach((v, i) => console.log(`[${i}] ${v.name} | ${v.lang} | local:${v.localService}`));
    console.log(`Thai voice found: ${this.thaiVoice ? this.thaiVoice.name + ' / ' + this.thaiVoice.lang : 'NONE'}`);
    console.log(`English voice found: ${this.englishVoice ? this.englishVoice.name + ' / ' + this.englishVoice.lang : 'NONE'}`);
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
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'pick':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'correct':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
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
        osc.start(now);
        osc.stop(now + 0.6);
        break;

      case 'incorrect':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  }

  // Core speak method — supports bilingual (Thai / English) based on voiceLang state
  speak(textTh, textEn) {
    if (!state.get('soundEnabled') || !this.speechSynth) return;
    this.speechSynth.cancel();

    const langSetting = state.get('voiceLang') || 'th';
    const textToSpeak = (langSetting === 'en' && textEn) ? textEn : textTh;
    const langCode = langSetting === 'en' ? 'en-US' : 'th-TH';

    // Re-lookup voices if not loaded yet
    if (!this.voicesReady || (langSetting === 'th' && !this.thaiVoice) || (langSetting === 'en' && !this.englishVoice)) {
      const voices = this.speechSynth.getVoices();
      if (voices.length > 0) {
        this.thaiVoice = this._findThaiVoice(voices);
        this.englishVoice = this._findEnglishVoice(voices);
        this.voicesReady = true;
      }
    }

    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(textToSpeak);
      utt.lang = langCode;
      utt.rate = 0.95;
      utt.pitch = langSetting === 'en' ? 1.0 : 1.1;

      const selectedVoice = langSetting === 'en' ? this.englishVoice : this.thaiVoice;
      if (selectedVoice) utt.voice = selectedVoice;

      this.speechSynth.speak(utt);
    };

    // If voices still not ready, retry after short delay
    if (!this.voicesReady) {
      setTimeout(() => {
        const voices = this.speechSynth.getVoices();
        this.thaiVoice = this._findThaiVoice(voices);
        this.englishVoice = this._findEnglishVoice(voices);
        this.voicesReady = true;
        doSpeak();
      }, 300);
    } else {
      doSpeak();
    }
  }
}

export const audioManager = new AudioManager();
