import { type BackgroundMusicType, type SoundType } from '@/store/breathingStore'

class AudioManager {
  private audioContext: AudioContext | null = null
  private backgroundNode: AudioBufferSourceNode | null = null
  private backgroundGain: GainNode | null = null
  private backgroundFilter: BiquadFilterNode | null = null
  private lfoNode: OscillatorNode | null = null
  private customAudioElement: HTMLAudioElement | null = null
  private isInitialized = false

  async init(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.audioContext = new AudioContext()
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  async ensureContext(): Promise<AudioContext | null> {
    if (!this.audioContext) {
      await this.init()
    }
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
    return this.audioContext
  }

  soundVolume = 0.5
  soundType: SoundType = 'breath'
  setSoundVolume(value: number) {
    this.soundVolume = value/100
  }
  async playBeepSound(stage: 'inhale' | 'hold' | 'exhale', sec: number = 0.5) {
    const audioCtx = await this.ensureContext()
    if (!audioCtx) return
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    const now = audioCtx.currentTime
    oscillator.type = 'sine' // 只有正弦波最温和

    if (stage === 'inhale') {
      oscillator.frequency.setValueAtTime(220, now)
      oscillator.frequency.exponentialRampToValueAtTime(400, now + sec)
    } else if (stage === 'hold') {
      oscillator.frequency.setValueAtTime(330, now)
    } else if (stage === 'exhale') {
      oscillator.frequency.setValueAtTime(400, now)
      oscillator.frequency.exponentialRampToValueAtTime(220, now + sec)
    }

    // 修复：使用极短的指数淡入淡出 (Attack/Release)
    gainNode.gain.setValueAtTime(0.0001, now)
    const volume = this.soundVolume * 0.8
    gainNode.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.1
    )
    gainNode.gain.setValueAtTime(volume, now + sec - 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + sec)

    oscillator.start()
    oscillator.stop(now + sec)
  }
  async beep(frequency: number, duration = 1000) {
    const audioCtx = await this.ensureContext()
    if (!audioCtx) return
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine' // 正弦波比较柔和

    oscillator.start()
    // 渐弱效果，防止爆音
    gainNode.gain.linearRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + duration / 1000
    )

    setTimeout(() => {
      oscillator.stop()
    }, duration)
  }

  get toneVolume() {
    return this.soundVolume * 0.8
  }

  toneFadeTime = 0.7

  /**
   *
   * @param duration 单位秒
   * @returns
   */
  async playInhaleTone(duration: number): Promise<void> {
    if (this.soundType === 'beep') return this.playBeepSound('inhale', )

    const ctx = await this.ensureContext()
    if (!ctx) return

    // 1. 使用粉红噪声（Pink Noise）比棕色噪声更像真实气流，更清脆
    const noiseBuffer = this.createPinkNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true

    // 2. 关键：使用带通滤波器 (Bandpass) 模拟呼吸道的共振感
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 4.0 // 较高的Q值能产生更明显的“呼啸”质感，但更柔和

    const gainNode = ctx.createGain()
    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    const now = ctx.currentTime

    // 3. 频率包络：吸气时频率逐渐升高，模拟吸入感
    filter.frequency.setValueAtTime(400, now)
    // filter.frequency.exponentialRampToValueAtTime(1000, now + duration)

    // 4. 音量包络：使用指数级淡入淡出，彻底消除“刺耳”感
    gainNode.gain.setValueAtTime(0.0001, now)

    gainNode.gain.exponentialRampToValueAtTime(
      this.toneVolume,
      now + this.toneFadeTime
    )
    gainNode.gain.exponentialRampToValueAtTime(
      this.toneVolume,
      now + duration - this.toneFadeTime
    )
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    source.start(now)
    source.stop(now + duration)
  }

  async playExhaleTone(duration: number): Promise<void> {
    if (this.soundType === 'beep') return this.playBeepSound('exhale', )

    const ctx = await this.ensureContext()
    if (!ctx) return

    const noiseBuffer = this.createPinkNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 3.0 // 呼气比吸气稍微松散一点

    const gainNode = ctx.createGain()
    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    const now = ctx.currentTime

    // 频率包络：呼气时频率迅速由高转低，模拟放松感
    filter.frequency.setValueAtTime(300, now)
    // filter.frequency.exponentialRampToValueAtTime(300, now + duration)
    const volume = this.soundVolume * 0.8

    // 音量包络：呼气开始时较快达到峰值，然后缓缓衰减
    gainNode.gain.setValueAtTime(0.0001, now)
    gainNode.gain.exponentialRampToValueAtTime(volume, now + this.toneFadeTime)
    gainNode.gain.exponentialRampToValueAtTime(
      volume,
      now + duration - this.toneFadeTime
    )
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    source.start(now)
    source.stop(now + duration)
  }

  async playHoldTone(duration: number): Promise<void> {
    if (this.soundType === 'beep') {
      return this.playBeepSound('hold')
      return this.beep(380)
    }
    const ctx = await this.ensureContext()
    if (!ctx) return

    // // 屏息时用一个极其微弱的正弦波模拟体内的“静谧感”或心跳背景音
    // const oscillator = ctx.createOscillator()
    // const gainNode = ctx.createGain()

    // oscillator.connect(gainNode)
    // gainNode.connect(ctx.destination)

    // oscillator.type = 'sine'
    // oscillator.frequency.setValueAtTime(100, ctx.currentTime) // 很低的沉浸音

    // const now = ctx.currentTime

    // gainNode.gain.setValueAtTime(0.001, now)
    // gainNode.gain.linearRampToValueAtTime(this.toneVolume * 0.05, now + 0.5) // 音量极低 (0.05)
    // gainNode.gain.linearRampToValueAtTime(0.001, now + duration)

    // oscillator.start(now)
    // oscillator.stop(now + duration)
  }

  async playCycleComplete(): Promise<void> {
    const ctx = await this.ensureContext()
    if (!ctx) return

    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime)

      const startTime = ctx.currentTime + i * 0.1
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.3)
    })
  }

  async startBackgroundMusic(
    volume: number = 50,
    musicType: BackgroundMusicType = 'ocean',
    customMusicUrl?: string | null
  ): Promise<void> {
    if (musicType === 'custom' && customMusicUrl) {
      // Custom MP3 file
      const ctx = await this.ensureContext()
      if (!ctx) return

      this.stopBackgroundMusic()
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

    // Use built-in noise types
    await this.startBackgroundMusicByType(volume, musicType)
  }

  setBackgroundVolume(volume: number): void {
    if (this.backgroundGain) {
      this.backgroundGain.gain.value = (volume / 100) * 0.3
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = (volume / 100) * 0.5
    }
  }

  stopBackgroundMusic(): void {
    if (this.backgroundNode) {
      try {
        this.backgroundNode.stop()
      } catch {
        /* ignore */
      }
      this.backgroundNode.disconnect()
      this.backgroundNode = null
    }
    if (this.backgroundGain) {
      this.backgroundGain.disconnect()
      this.backgroundGain = null
    }
    if (this.backgroundFilter) {
      this.backgroundFilter.disconnect()
      this.backgroundFilter = null
    }
    if (this.lfoNode) {
      try {
        this.lfoNode.stop()
      } catch {
        /* ignore */
      }
      this.lfoNode.disconnect()
      this.lfoNode = null
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause()
      this.customAudioElement = null
    }
  }

  // Generate pink noise buffer (more natural sounding)
  private createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = 4 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    let b0, b1, b2, b3, b4, b5, b6
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.969 * b2 + white * 0.153852
      b3 = 0.8665 * b3 + white * 0.3104856
      b4 = 0.55 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.016898
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
      output[i] *= 0.11
      b6 = white * 0.115926
    }
    return buffer
  }

  // Generate brown noise buffer
  private createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    let lastOut = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      output[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = output[i]
      output[i] *= 3.5
    }
    return buffer
  }

  // Start background music with specific type
  async startBackgroundMusicByType(
    volume: number = 50,
    type: BackgroundMusicType = 'ocean'
  ): Promise<void> {
    const ctx = await this.ensureContext()
    if (!ctx) return

    this.stopBackgroundMusic()

    if (type === 'custom') return

    const noiseBuffer =
      type === 'fire' || type === 'sea'
        ? this.createBrownNoiseBuffer(ctx)
        : this.createPinkNoiseBuffer(ctx)

    this.backgroundNode = ctx.createBufferSource()
    this.backgroundNode.buffer = noiseBuffer
    this.backgroundNode.loop = true

    this.backgroundFilter = ctx.createBiquadFilter()
    this.backgroundGain = ctx.createGain()
    this.backgroundGain.gain.value = (volume / 100) * 0.3

    // Configure based on type
    switch (type) {
      case 'ocean': {
        // Ocean waves - cyclical volume and frequency changes
        this.backgroundFilter.type = 'lowpass'
        this.backgroundFilter.frequency.value = 400

        this.lfoNode = ctx.createOscillator()
        this.lfoNode.type = 'sine'
        this.lfoNode.frequency.value = 0.125 // ~8 second cycle

        const lfoGain = ctx.createGain()
        lfoGain.gain.value = 0.5
        this.lfoNode.connect(lfoGain)
        lfoGain.connect(this.backgroundGain.gain)

        this.backgroundGain.gain.value = 0.001
        const now = ctx.currentTime
        const period = 8
        for (let i = 0; i < 100; i++) {
          const t = now + i * period
          this.backgroundGain.gain.exponentialRampToValueAtTime(
            (volume / 100) * 0.6,
            t + 3
          )
          this.backgroundFilter.frequency.exponentialRampToValueAtTime(
            800,
            t + 3
          )
          this.backgroundGain.gain.exponentialRampToValueAtTime(
            0.01,
            t + period
          )
          this.backgroundFilter.frequency.exponentialRampToValueAtTime(
            300,
            t + period
          )
        }
        this.lfoNode.start()
        break
      }

      case 'wind': {
        // Strong cyclical wind
        this.backgroundFilter.type = 'bandpass'
        this.backgroundFilter.Q.value = 5
        this.backgroundFilter.frequency.value = 800

        this.lfoNode = ctx.createOscillator()
        this.lfoNode.type = 'sine'
        this.lfoNode.frequency.value = 0.15

        const windLfoGain = ctx.createGain()
        windLfoGain.gain.value = (600 * volume) / 100
        this.lfoNode.connect(windLfoGain)
        windLfoGain.connect(this.backgroundFilter.frequency)

        const windVolLfo = ctx.createGain()
        windVolLfo.gain.value = (0.3 * volume) / 100
        this.lfoNode.connect(windVolLfo)
        windVolLfo.connect(this.backgroundGain.gain)

        this.lfoNode.start()
        break
      }

      case 'rain':
        this.backgroundFilter.type = 'lowpass'
        this.backgroundFilter.frequency.value = 1500
        this.backgroundGain.gain.value = (volume / 100) * 0.4
        break

      case 'fire':
        this.backgroundFilter.type = 'lowpass'
        this.backgroundFilter.frequency.value = 400
        this.backgroundGain.gain.value = (volume / 100) * 0.6
        break

      case 'windLight': {
        this.backgroundFilter.type = 'bandpass'
        this.backgroundFilter.frequency.value = 800

        this.lfoNode = ctx.createOscillator()
        this.lfoNode.type = 'sine'
        this.lfoNode.frequency.value = 0.1

        const lightWindLfoGain = ctx.createGain()
        lightWindLfoGain.gain.value = 500
        this.lfoNode.connect(lightWindLfoGain)
        lightWindLfoGain.connect(this.backgroundFilter.frequency)

        this.lfoNode.start()
        this.backgroundGain.gain.value = (volume / 100) * 0.3
        break
      }

      case 'sea':
        this.backgroundFilter.type = 'lowpass'
        this.backgroundFilter.frequency.value = 150
        this.backgroundGain.gain.value = (volume / 100) * 0.8
        break

      case 'whiteNoise':
      default:
        this.backgroundFilter.type = 'lowpass'
        this.backgroundFilter.frequency.value = 400
        break
    }

    this.backgroundNode.connect(this.backgroundFilter)
    this.backgroundFilter.connect(this.backgroundGain)
    this.backgroundGain.connect(ctx.destination)

    this.backgroundNode.start()
  }
}

export const audioManager = new AudioManager()
