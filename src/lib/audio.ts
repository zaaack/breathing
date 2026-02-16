import { type BackgroundMusicType } from '@/store/breathingStore';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private backgroundNode: AudioBufferSourceNode | null = null;
  private backgroundGain: GainNode | null = null;
  private backgroundFilter: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private customAudioElement: HTMLAudioElement | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new AudioContext();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  async ensureContext(): Promise<AudioContext | null> {
    if (!this.audioContext) {
      await this.init();
    }
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  async playInhaleTone(): Promise<void> {
    const ctx = await this.ensureContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }

  async playHoldTone(): Promise<void> {
    const ctx = await this.ensureContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);

    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }

  async playExhaleTone(): Promise<void> {
    const ctx = await this.ensureContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }

  async playHoldAfterExhaleTone(): Promise<void> {
    const ctx = await this.ensureContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(330, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }

  async playCycleComplete(): Promise<void> {
    const ctx = await this.ensureContext();
    if (!ctx) return;

    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  async startBackgroundMusic(volume: number = 50, musicType: BackgroundMusicType = 'ocean', customMusicUrl?: string | null): Promise<void> {
    if (musicType === 'custom' && customMusicUrl) {
      // Custom MP3 file
      const ctx = await this.ensureContext();
      if (!ctx) return;

      this.stopBackgroundMusic();
      this.customAudioElement = new Audio(customMusicUrl);
      this.customAudioElement.loop = true;
      this.customAudioElement.volume = (volume / 100) * 0.5;

      try {
        await this.customAudioElement.play();
      } catch (error) {
        console.error('Failed to play custom music:', error);
      }
      return;
    }

    // Use built-in noise types
    await this.startBackgroundMusicByType(volume, musicType);
  }

  setBackgroundVolume(volume: number): void {
    if (this.backgroundGain) {
      this.backgroundGain.gain.value = (volume / 100) * 0.3;
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = (volume / 100) * 0.5;
    }
  }

  stopBackgroundMusic(): void {
    if (this.backgroundNode) {
      try { this.backgroundNode.stop(); } catch { /* ignore */ }
      this.backgroundNode.disconnect();
      this.backgroundNode = null;
    }
    if (this.backgroundGain) {
      this.backgroundGain.disconnect();
      this.backgroundGain = null;
    }
    if (this.backgroundFilter) {
      this.backgroundFilter.disconnect();
      this.backgroundFilter = null;
    }
    if (this.lfoNode) {
      try { this.lfoNode.stop(); } catch { /* ignore */ }
      this.lfoNode.disconnect();
      this.lfoNode = null;
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement = null;
    }
  }

  // Generate pink noise buffer (more natural sounding)
  private createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // Generate brown noise buffer
  private createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    return buffer;
  }

  // Start background music with specific type
  async startBackgroundMusicByType(volume: number = 50, type: BackgroundMusicType = 'ocean'): Promise<void> {
    const ctx = await this.ensureContext();
    if (!ctx) return;

    this.stopBackgroundMusic();

    if (type === 'custom') return;

    const noiseBuffer = type === 'fire' || type === 'sea'
      ? this.createBrownNoiseBuffer(ctx)
      : this.createPinkNoiseBuffer(ctx);

    this.backgroundNode = ctx.createBufferSource();
    this.backgroundNode.buffer = noiseBuffer;
    this.backgroundNode.loop = true;

    this.backgroundFilter = ctx.createBiquadFilter();
    this.backgroundGain = ctx.createGain();
    this.backgroundGain.gain.value = (volume / 100) * 0.3;

    // Configure based on type
    switch (type) {
      case 'ocean': {
        // Ocean waves - cyclical volume and frequency changes
        this.backgroundFilter.type = 'lowpass';
        this.backgroundFilter.frequency.value = 400;

        this.lfoNode = ctx.createOscillator();
        this.lfoNode.type = 'sine';
        this.lfoNode.frequency.value = 0.125; // ~8 second cycle

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.5;
        this.lfoNode.connect(lfoGain);
        lfoGain.connect(this.backgroundGain.gain);

        this.backgroundGain.gain.value = 0.001;
        const now = ctx.currentTime;
        const period = 8;
        for (let i = 0; i < 100; i++) {
          const t = now + i * period;
          this.backgroundGain.gain.exponentialRampToValueAtTime((volume / 100) * 0.6, t + 3);
          this.backgroundFilter.frequency.exponentialRampToValueAtTime(800, t + 3);
          this.backgroundGain.gain.exponentialRampToValueAtTime(0.01, t + period);
          this.backgroundFilter.frequency.exponentialRampToValueAtTime(300, t + period);
        }
        this.lfoNode.start();
        break;
      }

      case 'wind': {
        // Strong cyclical wind
        this.backgroundFilter.type = 'bandpass';
        this.backgroundFilter.Q.value = 5;
        this.backgroundFilter.frequency.value = 800;

        this.lfoNode = ctx.createOscillator();
        this.lfoNode.type = 'sine';
        this.lfoNode.frequency.value = 0.15;

        const windLfoGain = ctx.createGain();
        windLfoGain.gain.value = 600;
        this.lfoNode.connect(windLfoGain);
        windLfoGain.connect(this.backgroundFilter.frequency);

        const windVolLfo = ctx.createGain();
        windVolLfo.gain.value = 0.3;
        this.lfoNode.connect(windVolLfo);
        windVolLfo.connect(this.backgroundGain.gain);

        this.lfoNode.start();
        break;
      }

      case 'rain':
        this.backgroundFilter.type = 'lowpass';
        this.backgroundFilter.frequency.value = 1500;
        this.backgroundGain.gain.value = (volume / 100) * 0.4;
        break;

      case 'fire':
        this.backgroundFilter.type = 'lowpass';
        this.backgroundFilter.frequency.value = 400;
        this.backgroundGain.gain.value = (volume / 100) * 0.6;
        break;

      case 'windLight': {
        this.backgroundFilter.type = 'bandpass';
        this.backgroundFilter.frequency.value = 800;

        this.lfoNode = ctx.createOscillator();
        this.lfoNode.type = 'sine';
        this.lfoNode.frequency.value = 0.1;

        const lightWindLfoGain = ctx.createGain();
        lightWindLfoGain.gain.value = 500;
        this.lfoNode.connect(lightWindLfoGain);
        lightWindLfoGain.connect(this.backgroundFilter.frequency);

        this.lfoNode.start();
        this.backgroundGain.gain.value = (volume / 100) * 0.3;
        break;
      }

      case 'sea':
        this.backgroundFilter.type = 'lowpass';
        this.backgroundFilter.frequency.value = 150;
        this.backgroundGain.gain.value = (volume / 100) * 0.8;
        break;

      case 'whiteNoise':
      default:
        this.backgroundFilter.type = 'lowpass';
        this.backgroundFilter.frequency.value = 400;
        break;
    }

    this.backgroundNode.connect(this.backgroundFilter);
    this.backgroundFilter.connect(this.backgroundGain);
    this.backgroundGain.connect(ctx.destination);

    this.backgroundNode.start();
  }
}

export const audioManager = new AudioManager();
