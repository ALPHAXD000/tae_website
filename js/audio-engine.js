// The Alpha Effect (TAE) — Web Audio Synth + Real Audio Fallback Player

class TaeAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.intervalId = null;
    this.step = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.volume = 0.5;
    this.currentTrack = null;
    this.mediaSource = null;
    this.analyser = null;
    this.frequencyData = null;
    this.audioEl = new Audio();
    this.audioEl.crossOrigin = 'anonymous';
    this.onStateChange = null;
    this.onError = null;
    this.onEnded = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  ensureMediaAnalyser() {
    this.ensureContext();
    if (!this.mediaSource) {
      this.mediaSource = this.ctx.createMediaElementSource(this.audioEl);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.mediaSource.connect(this.analyser);
      this.analyser.connect(this.masterGain);
    }
  }

  getFrequencyData() {
    if (!this.analyser || !this.frequencyData) return null;
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  getCurrentTime() {
    return this.audioEl.currentTime || 0;
  }

  seek(time) {
    if (!Number.isFinite(time) || !Number.isFinite(this.audioEl.duration)) return;
    this.audioEl.currentTime = Math.max(0, Math.min(time, this.audioEl.duration));
  }

  setVolume(val) {
    this.volume = Number(val);
    this.audioEl.volume = this.mediaSource ? 1 : this.volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  triggerSynthStep(rootFreq) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const ratios = [1, 1.189, 1.498, 1.782];
    const freq = rootFreq * ratios[this.step % ratios.length] * (this.step % 8 === 0 ? 0.5 : 1);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = this.step % 4 === 0 ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
    this.step += 1;
  }

  playTrack(track, startTime = 0) {
    this.stop();
    this.currentTrack = track;
    this.isPaused = false;
    this.isPlaying = true;

    if (track.audioUrl) {
      this.ensureMediaAnalyser();
      this.audioEl.volume = 1;
      this.audioEl.src = track.audioUrl;
      const requestedSrc = this.audioEl.src;
      const setStartTime = () => {
        if (this.audioEl.src === requestedSrc && startTime > 0) {
          this.seek(startTime);
        }
      };
      if (this.audioEl.readyState >= 1) {
        setStartTime();
      } else {
        this.audioEl.addEventListener('loadedmetadata', setStartTime, { once: true });
      }
      this.audioEl.onended = () => {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.onStateChange) this.onStateChange(false);
        if (this.onEnded) this.onEnded();
      };
      this.audioEl.onerror = () => {
        if (this.audioEl.src !== requestedSrc) return;
        this.isPlaying = false;
        if (this.onStateChange) this.onStateChange(false);
        if (this.onError) this.onError(new Error(`Unable to load audio file: ${track.audioUrl}`));
      };
      this.audioEl.play().catch((error) => {
        if (this.audioEl.src !== requestedSrc) return;
        this.isPlaying = false;
        if (this.onStateChange) this.onStateChange(false);
        if (this.onError) this.onError(error);
      });
    } else {
      this.audioEl.volume = this.volume;
      this.ensureContext();
      const stepMs = Math.max(120, Math.round((60 / (track.bpm || 120)) * 500));
      this.triggerSynthStep(track.rootFreq || 110);
      this.intervalId = setInterval(() => {
        this.triggerSynthStep(track.rootFreq || 110);
      }, stepMs);
    }

    if (this.onStateChange) this.onStateChange(true);
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.audioEl.pause();
    if (this.onStateChange) this.onStateChange(false);
  }

  resume() {
    if (!this.isPaused || !this.currentTrack) return;
    const track = this.currentTrack;
    this.isPaused = false;
    this.isPlaying = true;

    if (track.audioUrl) {
      this.audioEl.play().catch((error) => {
        if (this.currentTrack !== track || !this.isPlaying) return;
        this.isPlaying = false;
        this.isPaused = true;
        if (this.onStateChange) this.onStateChange(false);
        if (this.onError) this.onError(error);
      });
    } else {
      const stepMs = Math.max(120, Math.round((60 / (track.bpm || 120)) * 500));
      this.intervalId = setInterval(() => {
        this.triggerSynthStep(track.rootFreq || 110);
      }, stepMs);
    }

    if (this.onStateChange) this.onStateChange(true);
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.audioEl.pause();
    if (this.onStateChange) this.onStateChange(false);
  }
}

window.taeAudio = new TaeAudioEngine();
