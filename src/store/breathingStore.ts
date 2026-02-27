import { audioManager } from '@/lib/audio'
import { LocalStore } from 'nstate'

export type BreathingPhase =
  | 'idle'
  | 'inhale'
  | 'hold'
  | 'exhale'
  | 'holdAfterExhale'

export interface BreathingPattern {
  id: string
  name: string
  inhaleSeconds: number
  holdSeconds: number
  exhaleSeconds: number
  holdAfterExhaleSeconds: number
  isBuiltIn?: boolean
}

export const builtInPatterns: BreathingPattern[] = [
  {
    id: '4-7-8',
    name: '4-7-8 Relaxing',
    inhaleSeconds: 4,
    holdSeconds: 7,
    exhaleSeconds: 8,
    holdAfterExhaleSeconds: 0,
    isBuiltIn: true,
  },
  {
    id: '4-0-4-0',
    name: '4-0-4-0 Simple',
    inhaleSeconds: 4,
    holdSeconds: 0,
    exhaleSeconds: 4,
    holdAfterExhaleSeconds: 0,
    isBuiltIn: true,
  },
  {
    id: '4-4-4-4',
    name: '4-4-4-4 Box',
    inhaleSeconds: 4,
    holdSeconds: 4,
    exhaleSeconds: 4,
    holdAfterExhaleSeconds: 4,
    isBuiltIn: true,
  },
  {
    id: '4-0-8-0',
    name: '4-0-8-0 Calming',
    inhaleSeconds: 4,
    holdSeconds: 0,
    exhaleSeconds: 8,
    holdAfterExhaleSeconds: 0,
    isBuiltIn: true,
  },
  {
    id: '5-0-5-0',
    name: '5-0-5-0 Resonance',
    inhaleSeconds: 5,
    holdSeconds: 0,
    exhaleSeconds: 5,
    holdAfterExhaleSeconds: 0,
    isBuiltIn: true,
  },
  {
    id: '6-0-6-0',
    name: '6-0-6-0 Easy',
    inhaleSeconds: 6,
    holdSeconds: 0,
    exhaleSeconds: 6,
    holdAfterExhaleSeconds: 0,
    isBuiltIn: true,
  },
]

export type BackgroundMusicType =
  | 'whiteNoise'
  | 'ocean'
  | 'wind'
  | 'rain'
  | 'fire'
  | 'windLight'
  | 'sea'
  | 'custom'
export type SoundType = 'beep' | 'breath'
export interface BreathingSettings {
  inhaleSeconds: number
  holdSeconds: number
  exhaleSeconds: number
  holdAfterExhaleSeconds: number
  totalMinutes: number
  soundEnabled: boolean
  soundType: SoundType
  soundVolume: number
  backgroundMusicEnabled: boolean
  backgroundMusicVolume: number
  backgroundMusicType: BackgroundMusicType
  customMusicUrl: string | null
  currentPatternId: string
  customPatterns: BreathingPattern[]
}

export interface BreathingState {
  phase: BreathingPhase
  isRunning: boolean
  currentCycle: number
  secondsRemaining: number
  totalSecondsRemaining: number
  settings: BreathingSettings
  resonanceTest: ResonanceTestState
}

const defaultSettings: BreathingSettings = {
  inhaleSeconds: 4,
  holdSeconds: 7,
  exhaleSeconds: 8,
  holdAfterExhaleSeconds: 0,
  totalMinutes: 5,
  soundEnabled: true,
  soundType: 'breath',
  soundVolume: 50,
  backgroundMusicEnabled: false,
  backgroundMusicVolume: 50,
  backgroundMusicType: 'ocean',
  customMusicUrl: null,
  currentPatternId: '4-7-8',
  customPatterns: [],
}

// 共振频率测试相关类型
export interface ResonanceTestFrequency {
  breathsPerMinute: number;
  cycleSeconds: number;
  inhaleSeconds: number;
  exhaleSeconds: number;
}

// 预定义的测试频率（Lehrer法）
export const resonanceTestFrequencies: ResonanceTestFrequency[] = [
  { breathsPerMinute: 7.0, cycleSeconds: 8.57, inhaleSeconds: 4.3, exhaleSeconds: 4.3 },
  { breathsPerMinute: 6.5, cycleSeconds: 9.23, inhaleSeconds: 4.6, exhaleSeconds: 4.6 },
  { breathsPerMinute: 6.0, cycleSeconds: 10, inhaleSeconds: 5, exhaleSeconds: 5 },
  { breathsPerMinute: 5.5, cycleSeconds: 10.9, inhaleSeconds: 5.5, exhaleSeconds: 5.5 },
  { breathsPerMinute: 5.0, cycleSeconds: 12, inhaleSeconds: 6, exhaleSeconds: 6 },
  { breathsPerMinute: 4.5, cycleSeconds: 13.3, inhaleSeconds: 6.65, exhaleSeconds: 6.65 },
]

export interface ResonanceTestState {
  isActive: boolean;
  currentFrequencyIndex: number;
  testDurationPerFrequency: number; // 每档测试时长（分钟）
  secondsRemainingInPhase: number; // 当前频率档剩余时间
  ratings: (number | null)[]; // 每个频率档的评分 (1-5)
  isCompleted: boolean;
  resonantFrequency: ResonanceTestFrequency | null; // 测定结果
}

export const initialResonanceTestState: ResonanceTestState = {
  isActive: false,
  currentFrequencyIndex: 0,
  testDurationPerFrequency: 2, // 默认2分钟
  secondsRemainingInPhase: 0,
  ratings: resonanceTestFrequencies.map(() => null),
  isCompleted: false,
  resonantFrequency: null,
}

export const initialState: BreathingState = {
  phase: 'idle',
  isRunning: false,
  currentCycle: 0,
  secondsRemaining: 0,
  totalSecondsRemaining: 0,
  settings: defaultSettings,
  resonanceTest: initialResonanceTestState,
}

class BreathingStore extends LocalStore<BreathingState> {
  constructor() {
    super(initialState, 'breathing')
  }

  setPhase(phase: BreathingPhase) {
    this.setState({ phase })
  }

  setRunning(isRunning: boolean) {
    this.setState({ isRunning })
  }

  setCurrentCycle(currentCycle: number) {
    this.setState({ currentCycle })
  }

  setSecondsRemaining(secondsRemaining: number) {
    this.setState({ secondsRemaining })
  }

  setTotalSecondsRemaining(totalSecondsRemaining: number) {
    this.setState({ totalSecondsRemaining })
  }

  updateSettings(settings: Partial<BreathingSettings>) {
    if (settings.soundVolume !== undefined) {
      audioManager.setSoundVolume(settings.soundVolume)
    }
    if (settings.soundType === 'breath') {
      settings.backgroundMusicEnabled = false
    }
    if (settings.backgroundMusicVolume !== undefined) {
      audioManager.setBackgroundVolume(settings.backgroundMusicVolume)
    }
    // Play immediately when background music type changes and music is enabled
    if (
      settings.backgroundMusicType &&
      this.state.settings.backgroundMusicEnabled
    ) {
      const customUrl =
        settings.backgroundMusicType === 'custom'
          ? settings.customMusicUrl
          : null
      audioManager.startBackgroundMusic(
        settings.backgroundMusicVolume,
        settings.backgroundMusicType,
        customUrl
      )
    }
    this.setState((state) => ({
      settings: { ...state.settings, ...settings },
    }))
  }

  applyPattern(pattern: BreathingPattern) {
    this.setState((state) => ({
      settings: {
        ...state.settings,
        inhaleSeconds: pattern.inhaleSeconds,
        holdSeconds: pattern.holdSeconds,
        exhaleSeconds: pattern.exhaleSeconds,
        holdAfterExhaleSeconds: pattern.holdAfterExhaleSeconds,
        currentPatternId: pattern.id,
      },
    }))
  }

  addCustomPattern(pattern: BreathingPattern) {
    this.setState((state) => ({
      settings: {
        ...state.settings,
        customPatterns: [...state.settings.customPatterns, pattern],
      },
    }))
  }

  removeCustomPattern(patternId: string) {
    this.setState((state) => ({
      settings: {
        ...state.settings,
        customPatterns: state.settings.customPatterns.filter(
          (p) => p.id !== patternId
        ),
      },
    }))
  }

  setCustomMusicUrl(url: string | null) {
    this.setState((state) => ({
      settings: {
        ...state.settings,
        customMusicUrl: url,
      },
    }))
  }

  reset() {
    this.setState({
      phase: 'idle',
      isRunning: false,
      currentCycle: 0,
      secondsRemaining: 0,
      totalSecondsRemaining: 0,
    })
  }

  async start() {
    this.setState((state) => {
      const totalSeconds =
        state.settings.totalMinutes > 0 ? state.settings.totalMinutes * 60 : 0
      return {
        isRunning: true,
        currentCycle: state.currentCycle || 1,
        phase: 'inhale',
        secondsRemaining: state.settings.inhaleSeconds,
        totalSecondsRemaining: totalSeconds,
      }
    })

      if (this.state.settings.soundEnabled) {
        audioManager.soundType = this.state.settings.soundType
        await audioManager.playInhaleTone(this.state.settings.inhaleSeconds)
      }
  }

  toggle() {
    const { isRunning, phase } = this.state
    if (isRunning) {
      this.setRunning(false)
    } else {
      if (phase === 'idle') {
        this.start()
      } else {
        this.setRunning(true)
      }
    }
  }

  getTotalSeconds = () => {
    const settings = this.state.settings
    switch (this.state.phase) {
      case 'inhale':
        return settings.inhaleSeconds
      case 'hold':
        return settings.holdSeconds
      case 'exhale':
        return settings.exhaleSeconds
      case 'holdAfterExhale':
        return settings.holdAfterExhaleSeconds
      default:
        return 0
    }
  }
  // 共振频率测试相关方法
  startResonanceTest(testDurationMinutes: number = 2) {
    this.setState({
      resonanceTest: {
        ...initialResonanceTestState,
        isActive: true,
        testDurationPerFrequency: testDurationMinutes,
        secondsRemainingInPhase: testDurationMinutes * 60,
        ratings: resonanceTestFrequencies.map(() => null),
      },
    })
  }

  updateResonanceTestRating(rating: number) {
    this.setState((state) => {
      const newRatings = [...state.resonanceTest.ratings]
      newRatings[state.resonanceTest.currentFrequencyIndex] = rating
      return {
        resonanceTest: {
          ...state.resonanceTest,
          ratings: newRatings,
        },
      }
    })
  }

  nextResonanceTestFrequency() {
    const { resonanceTest } = this.state
    const nextIndex = resonanceTest.currentFrequencyIndex + 1

    if (nextIndex >= resonanceTestFrequencies.length) {
      this.completeResonanceTest()
      return
    }

    this.setState((state) => ({
      resonanceTest: {
        ...state.resonanceTest,
        currentFrequencyIndex: nextIndex,
        secondsRemainingInPhase:
          state.resonanceTest.testDurationPerFrequency * 60,
      },
    }))
  }

  decrementResonanceTestTime() {
    this.setState((state) => ({
      resonanceTest: {
        ...state.resonanceTest,
        secondsRemainingInPhase: Math.max(
          0,
          state.resonanceTest.secondsRemainingInPhase - 0.1
        ),
      },
    }))
  }

  completeResonanceTest() {
    const { ratings } = this.state.resonanceTest

    // 找出评分最高的频率
    let maxRating = 0
    let bestIndex = 0
    ratings.forEach((rating, index) => {
      if (rating !== null && rating > maxRating) {
        maxRating = rating
        bestIndex = index
      }
    })

    // 如果有评分，则设置共振频率
    const resonantFrequency =
      maxRating > 0 ? resonanceTestFrequencies[bestIndex] : null

    this.setState((state) => ({
      resonanceTest: {
        ...state.resonanceTest,
        isActive: false,
        isCompleted: true,
        resonantFrequency,
      },
      isRunning: false,
      phase: 'idle',
    }))
  }

  cancelResonanceTest() {
    this.setState({
      resonanceTest: { ...initialResonanceTestState },
      isRunning: false,
      phase: 'idle',
      secondsRemaining: 0,
    })
  }

  exitResonanceTest() {
    this.setState({
      resonanceTest: { ...initialResonanceTestState },
      isRunning: false,
      phase: 'idle',
      secondsRemaining: 0,
    })
  }
}

export const breathingStore = new BreathingStore()
