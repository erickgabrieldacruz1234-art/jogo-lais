import { SYNTH } from "./sfx";

class AudioManager {
  constructor() {
    this.musicAudio = null;
    this.isMusicMuted = false;
    this.isSfxMuted = false;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.8;
    this.isAudioUnlocked = false;

    this.sfxSources = {
      pickup: "/assets/audio/sfx/pickup.wav",
      dialogue_letter: "/assets/audio/sfx/dialogue_letter.wav",
      button_click: "/assets/audio/sfx/button_click.wav",
      portal_activate: "/assets/audio/sfx/portal_activate.wav",
      quest_complete: "/assets/audio/sfx/quest_complete.wav"
    };

    this.sfxPool = {};
    this.initAudio();
  }

  initAudio() {
    this.musicAudio = new Audio("/assets/audio/music/romantic_theme.wav");
    this.musicAudio.loop = true;
    this.musicAudio.volume = this.musicVolume;

    // Pre-cache SFX elements
    Object.keys(this.sfxSources).forEach((key) => {
      this.sfxPool[key] = [];
      for (let i = 0; i < 3; i++) {
        const audio = new Audio(this.sfxSources[key]);
        audio.volume = this.sfxVolume;
        this.sfxPool[key].push(audio);
      }
    });

    // Auto unlock on first interaction
    const unlock = () => {
      if (!this.isAudioUnlocked) {
        this.isAudioUnlocked = true;
        if (!this.isMusicMuted) {
          this.musicAudio.play().catch(() => {});
        }
      }
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("pointerdown", unlock);
    };

    window.addEventListener("keydown", unlock);
    window.addEventListener("pointerdown", unlock);
  }

  playMusic() {
    if (this.isMusicMuted || !this.musicAudio) return;
    this.musicAudio.play().catch(() => {});
  }

  setMusicVolume(v) {
    if (this.musicAudio) this.musicAudio.volume = v;
  }

  pauseMusic() {
    if (this.musicAudio) {
      this.musicAudio.pause();
    }
  }

  toggleMusic() {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.isMusicMuted) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
    return !this.isMusicMuted;
  }

  playSfx(name) {
    if (this.isSfxMuted) return;
    if (SYNTH[name]) {
      try {
        SYNTH[name]();
      } catch (e) {}
      return;
    }

    // Use pooled audio
    const pool = this.sfxPool[name];
    if (pool) {
      const available = pool.find((a) => a.paused || a.ended) || pool[0];
      try {
        available.currentTime = 0;
        available.volume = this.sfxVolume;
        available.play().catch(() => {
          this.playSynthesizedFallback(name);
        });
      } catch (e) {
        this.playSynthesizedFallback(name);
      }
    } else {
      this.playSynthesizedFallback(name);
    }
  }

  // Web Audio API Synthesizer fallback
  playSynthesizedFallback(name) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.synthCtx) this.synthCtx = new AudioCtx();
      if (this.synthCtx.state === "suspended") this.synthCtx.resume();

      const osc = this.synthCtx.createOscillator();
      const gain = this.synthCtx.createGain();
      osc.connect(gain);
      gain.connect(this.synthCtx.destination);

      const now = this.synthCtx.currentTime;

      if (name === "pickup") {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (name === "button_click") {
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (name === "portal_activate") {
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.6);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch (e) {}
  }
}

export const audio = new AudioManager();
