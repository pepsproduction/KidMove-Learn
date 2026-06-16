import { state } from '../app/state.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.speechSynth = window.speechSynthesis || null;
    this.thaiVoice = null;
    
    // Find Thai voice if available
    if (this.speechSynth) {
      const loadVoices = () => {
        this.thaiVoice = this.getThaiVoice();
      };
      
      loadVoices();
      if (this.speechSynth.onvoiceschanged !== undefined) {
        this.speechSynth.onvoiceschanged = loadVoices;
      }
    }
  }

  getThaiVoice() {
    if (!this.speechSynth) return null;
    const voices = this.speechSynth.getVoices();
    
    // 1. Prefer Google Thai online voice
    let voice = voices.find(v => v.lang.toLowerCase().replace('_', '-').includes('th-th') && v.name.includes('Google'));
    
    // 2. Prefer Microsoft Pattara Online or natural voices
    if (!voice) {
      voice = voices.find(v => v.lang.toLowerCase().replace('_', '-').includes('th-th') && (v.name.includes('Online') || v.name.includes('Natural')));
    }
    
    // 3. Any exact th-TH match
    if (!voice) {
      voice = voices.find(v => v.lang.toLowerCase().replace('_', '-').includes('th-th'));
    }
    
    // 4. Any voice containing 'th' in language code
    if (!voice) {
      voice = voices.find(v => v.lang.toLowerCase().includes('th'));
    }
    
    return voice;
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
        // Small bouncy click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'pick':
        // Quick upward chirp for picking items
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'correct':
        // A happy chime (two rising notes)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;

      case 'completion':
        // Funfare major arpeggio
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.35);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;

      case 'incorrect':
        // Warm sliding down note (gentle, not harsh)
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

  getEnglishVoice() {
    if (!this.speechSynth) return null;
    const voices = this.speechSynth.getVoices();
    
    // 1. Prefer Google US English
    let voice = voices.find(v => v.lang.toLowerCase().replace('_', '-').includes('en-us') && v.name.includes('Google'));
    
    // 2. Any en-US or en-GB
    if (!voice) {
      voice = voices.find(v => v.lang.toLowerCase().replace('_', '-').includes('en-us'));
    }
    if (!voice) {
      voice = voices.find(v => v.lang.toLowerCase().replace('_', '-').includes('en-gb'));
    }
    
    // 3. Any en
    if (!voice) {
      voice = voices.find(v => v.lang.toLowerCase().includes('en'));
    }
    
    return voice;
  }

  // Voice narration in Thai or English using browser speech synthesis
  speak(textTh, textEn) {
    if (!state.get('soundEnabled') || !this.speechSynth) return;

    // Cancel any active speech to avoid overlaps
    this.speechSynth.cancel();

    const langSetting = state.get('voiceLang') || 'th';
    const textToSpeak = (langSetting === 'en' && textEn) ? textEn : textTh;
    const langCode = langSetting === 'en' ? 'en-US' : 'th-TH';

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langCode;
    utterance.rate = 1.0; // Normal speaking rate for kids
    utterance.pitch = langSetting === 'en' ? 1.0 : 1.1; // slightly higher pitch for Thai

    let selectedVoice = null;
    if (langSetting === 'en') {
      selectedVoice = this.getEnglishVoice();
    } else {
      // Dynamic lookup backup if voices loaded late
      if (!this.thaiVoice) {
        this.thaiVoice = this.getThaiVoice();
      }
      selectedVoice = this.thaiVoice;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    this.speechSynth.speak(utterance);
  }
}

export const audioManager = new AudioManager();
