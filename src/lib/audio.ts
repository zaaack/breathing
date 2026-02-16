class AudioManager {
  private audioContext: AudioContext | null = null;
  private backgroundNode: AudioBufferSourceNode | null = null;
  private backgroundGain: GainNode | null = null;
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

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
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

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
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

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
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

  async startBackgroundMusic(volume: number = 50, customMusicUrl?: string | null): Promise<void> {
    const ctx = await this.ensureContext()
    if (!ctx) return

    this.stopBackgroundMusic()

    if (customMusicUrl) {
      this.customAudioElement = new Audio(customMusicUrl)
      this.customAudioElement.loop = true
      this.customAudioElement.volume = (volume / 100) * 0.5
      
      try {
        await this.customAudioElement.play()
      } catch (error) {
        console.error('Failed to play custom music:', error)
      }
      return
    }

    // Generate brown noise (softer, more natural)
    const bufferSize = 2 * ctx.sampleRate
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)

    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      output[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = output[i]
      output[i] *= 3.5
    }

    this.backgroundNode = ctx.createBufferSource()
    this.backgroundNode.buffer = noiseBuffer
    this.backgroundNode.loop = true

    this.backgroundGain = ctx.createGain()
    this.backgroundGain.gain.value = (volume / 100) * 0.3

    // Add a low-pass filter for softer sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    this.backgroundNode.connect(filter)
    filter.connect(this.backgroundGain)
    this.backgroundGain.connect(ctx.destination)

    this.backgroundNode.start()
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
      this.backgroundNode.stop();
      this.backgroundNode.disconnect();
      this.backgroundNode = null;
    }
    if (this.backgroundGain) {
      this.backgroundGain.disconnect();
      this.backgroundGain = null;
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement = null;
    }
  }
}

export const audioManager = new AudioManager();
