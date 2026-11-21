class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.buffers = {};
    this.musicWanted = false;
    this.musicPaused = false;
    this.audioEl = null;
    this.themeMissing = false;
    this.themeIndex = 0;
    this.synthTimer = null;
    this.synthIndex = 0;
    this.synthNextTime = 0;
    this.beatDuration = 0.18;
  }

  ensure() {
    if (this.ctx) {
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      this.enabled = false;
      return;
    }

    this.ctx = new AudioCtx();
  }

  async load() {
    this.ensure();
    if (!this.ctx) {
      return;
    }

    const names = ['move', 'rotate', 'drop', 'lock', 'clear', 'hold', 'gameover'];

    await Promise.all(names.map(async (name) => {
      try {
        const response = await fetch('audio/' + name + '.wav');
        if (!response.ok) {
          return;
        }
        const data = await response.arrayBuffer();
        this.buffers[name] = await this.decode(data);
      } catch (error) {
      }
    }));
  }

  decode(data) {
    return new Promise((resolve, reject) => {
      const promise = this.ctx.decodeAudioData(data, resolve, reject);
      if (promise && typeof promise.then === 'function') {
        promise.then(resolve).catch(reject);
      }
    });
  }

  playSample(name, volume) {
    if (!this.enabled || !this.ctx || !this.buffers[name]) {
      return false;
    }

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();

    source.buffer = this.buffers[name];
    gain.gain.value = volume === undefined ? 0.85 : volume;

    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();

    return true;
  }

  move() {
    if (!this.playSample('move', 0.5)) {
      this.blip(220, 0.05, 'square', 0.03);
    }
  }

  rotate() {
    if (!this.playSample('rotate', 0.55)) {
      this.blip(330, 0.06, 'square', 0.04);
    }
  }

  drop() {
    if (!this.playSample('drop', 0.8)) {
      this.blip(140, 0.1, 'sawtooth', 0.05);
    }
  }

  lock() {
    if (!this.playSample('lock', 0.7)) {
      this.blip(110, 0.12, 'triangle', 0.06);
    }
  }

  hold() {
    if (!this.playSample('hold', 0.6)) {
      this.blip(440, 0.08, 'sine', 0.04);
    }
  }

  clear(count) {
    if (this.playSample('clear', 0.75)) {
      return;
    }

    const notes = [523, 659, 784, 1047];
    for (let i = 0; i < count && i < notes.length; i++) {
      setTimeout(() => this.blip(notes[i], 0.12, 'square', 0.05), i * 70);
    }
  }

  gameOver() {
    if (this.playSample('gameover', 0.8)) {
      return;
    }

    const notes = [440, 392, 330, 262];
    for (let i = 0; i < notes.length; i++) {
      setTimeout(() => this.blip(notes[i], 0.25, 'sawtooth', 0.06), i * 180);
    }
  }

  blip(freq, duration, type, volume) {
    if (!this.enabled) {
      return;
    }

    this.ensure();
    if (!this.ctx) {
      return;
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume || 0.06, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  startMusic() {
    if (!this.enabled) {
      return;
    }

    this.musicWanted = true;

    if (this.musicPaused) {
      return;
    }

    this.ensure();
    if (!this.ctx) {
      return;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.themeMissing) {
      this.startSynthLoop();
      return;
    }

    if (!this.audioEl) {
      const audio = new Audio(SoundEngine.THEME_CANDIDATES[this.themeIndex]);
      audio.loop = true;
      audio.volume = 0.45;

      audio.addEventListener('error', () => {
        this.themeIndex = this.themeIndex + 1;

        if (this.themeIndex < SoundEngine.THEME_CANDIDATES.length) {
          this.audioEl = null;
          this.startMusic();
          return;
        }

        this.themeMissing = true;
        this.audioEl = null;

        if (this.musicWanted) {
          this.startSynthLoop();
        }
      });

      this.audioEl = audio;
    }

    const element = this.audioEl;
    const playing = this.audioEl.play();

    if (playing && typeof playing.catch === 'function') {
      playing.catch(() => {
        if (this.audioEl === element && !this.themeMissing) {
          this.startSynthLoop();
        }
      });
    }

    this.stopSynth();
  }

  stopMusic() {
    this.musicWanted = false;
    this.musicPaused = false;

    if (this.audioEl) {
      this.audioEl.pause();
    }

    this.stopSynth();
  }

  pauseMusic() {
    this.musicPaused = true;

    if (this.audioEl) {
      this.audioEl.pause();
    }

    this.stopSynth();
  }

  resumeMusic() {
    if (!this.musicPaused) {
      return;
    }

    this.musicPaused = false;

    if (!this.musicWanted) {
      return;
    }

    this.startMusic();
  }

  startSynthLoop() {
    if (this.synthTimer) {
      return;
    }

    this.synthIndex = 0;
    this.synthNextTime = this.ctx.currentTime + 0.1;
    this.synthTimer = setInterval(() => this.schedule(), 60);
  }

  stopSynth() {
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  schedule() {
    if (!this.ctx) {
      return;
    }

    const melody = SoundEngine.MELODY;

    while (this.synthNextTime < this.ctx.currentTime + 0.4) {
      const entry = melody[this.synthIndex];
      const freq = this.noteToFreq(entry[0]);
      const duration = entry[1] * this.beatDuration;

      this.playNote(freq, this.synthNextTime, duration * 0.9, 0.045);

      this.synthNextTime = this.synthNextTime + duration;
      this.synthIndex = (this.synthIndex + 1) % melody.length;
    }
  }

  playNote(freq, time, duration, volume) {
    if (!freq) {
      return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume || 0.05, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  noteToFreq(note) {
    const table = {
      A4: 440.0,
      B4: 493.88,
      C5: 523.25,
      D5: 587.33,
      E5: 659.25,
      F5: 698.46,
      G5: 783.99,
      A5: 880.0,
    };

    return table[note] || 0;
  }

  toggle() {
    this.enabled = !this.enabled;

    if (!this.enabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }

    return this.enabled;
  }
}

SoundEngine.THEME_CANDIDATES = ['audio/theme.mp3', 'audio/theme.wav'];

SoundEngine.MELODY = [
  ['E5', 0.5], ['B4', 0.25], ['C5', 0.25], ['D5', 0.5],
  ['C5', 0.25], ['B4', 0.25], ['A4', 0.5], ['A4', 0.25], ['C5', 0.25],
  ['E5', 0.5], ['D5', 0.25], ['C5', 0.25], ['B4', 0.5], ['C5', 0.25], ['D5', 0.25],
  ['E5', 0.5], ['C5', 0.5], ['A4', 0.5], ['A4', 0.5],

  ['D5', 0.5], ['F5', 0.25], ['A5', 0.5], ['G5', 0.25],
  ['F5', 0.25], ['E5', 0.75], ['C5', 0.25], ['E5', 0.5],
  ['D5', 0.25], ['C5', 0.25], ['B4', 0.5], ['B4', 0.25], ['C5', 0.25],
  ['D5', 0.5], ['E5', 0.5], ['C5', 0.5], ['A4', 0.5], ['A4', 0.5],
];
