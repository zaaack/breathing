import { LocalStore } from 'nstate';

export type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale';

export interface BreathingPattern {
  id: string;
  name: string;
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  holdAfterExhaleSeconds: number;
  isBuiltIn?: boolean;
}

export const builtInPatterns: BreathingPattern[] = [
  { id: '4-7-8', name: '4-7-8 Relaxing', inhaleSeconds: 4, holdSeconds: 7, exhaleSeconds: 8, holdAfterExhaleSeconds: 0, isBuiltIn: true },
  { id: '4-0-4-0', name: '4-0-4-0 Simple', inhaleSeconds: 4, holdSeconds: 0, exhaleSeconds: 4, holdAfterExhaleSeconds: 0, isBuiltIn: true },
  { id: '4-4-4-4', name: '4-4-4-4 Box', inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 4, holdAfterExhaleSeconds: 4, isBuiltIn: true },
  { id: '4-0-8-0', name: '4-0-8-0 Calming', inhaleSeconds: 4, holdSeconds: 0, exhaleSeconds: 8, holdAfterExhaleSeconds: 0, isBuiltIn: true },
  { id: '5-5-5-5', name: '5-5-5-5 Balanced', inhaleSeconds: 5, holdSeconds: 5, exhaleSeconds: 5, holdAfterExhaleSeconds: 5, isBuiltIn: true },
  { id: '6-0-6-0', name: '6-0-6-0 Easy', inhaleSeconds: 6, holdSeconds: 0, exhaleSeconds: 6, holdAfterExhaleSeconds: 0, isBuiltIn: true },
];

export type BackgroundMusicType = 'whiteNoise' | 'ocean' | 'wind' | 'rain' | 'fire' | 'windLight' | 'sea' | 'custom';
export type SoundType = 'beep' | 'noise';
export interface BreathingSettings {
  inhaleSeconds: number
  holdSeconds: number
  exhaleSeconds: number
  holdAfterExhaleSeconds: number
  totalMinutes: number
  soundEnabled: boolean
  soundType: SoundType
  backgroundMusicEnabled: boolean
  backgroundMusicVolume: number
  backgroundMusicType: BackgroundMusicType
  customMusicUrl: string | null
  currentPatternId: string
  customPatterns: BreathingPattern[]
}

export interface BreathingState {
  phase: BreathingPhase;
  isRunning: boolean;
  currentCycle: number;
  secondsRemaining: number;
  totalSecondsRemaining: number;
  settings: BreathingSettings;
}

const defaultSettings: BreathingSettings = {
  inhaleSeconds: 4,
  holdSeconds: 7,
  exhaleSeconds: 8,
  holdAfterExhaleSeconds: 0,
  totalMinutes: 5,
  soundEnabled: true,
  soundType: 'beep',
  backgroundMusicEnabled: false,
  backgroundMusicVolume: 50,
  backgroundMusicType: 'ocean',
  customMusicUrl: null,
  currentPatternId: '4-7-8',
  customPatterns: [],
};

export const initialState: BreathingState = {
  phase: 'idle',
  isRunning: false,
  currentCycle: 0,
  secondsRemaining: 0,
  totalSecondsRemaining: 0,
  settings: defaultSettings,
};

class BreathingStore extends LocalStore<BreathingState> {
  constructor() {
    super(initialState, 'breathing');
  }

  setPhase(phase: BreathingPhase) {
    this.setState({ phase });
  }

  setRunning(isRunning: boolean) {
    this.setState({ isRunning });
  }

  setCurrentCycle(currentCycle: number) {
    this.setState({ currentCycle });
  }

  setSecondsRemaining(secondsRemaining: number) {
    this.setState({ secondsRemaining });
  }

  setTotalSecondsRemaining(totalSecondsRemaining: number) {
    this.setState({ totalSecondsRemaining });
  }

  updateSettings(settings: Partial<BreathingSettings>) {
    this.setState((state) => ({
      settings: { ...state.settings, ...settings },
    }));
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
    }));
  }

  addCustomPattern(pattern: BreathingPattern) {
    this.setState((state) => ({
      settings: {
        ...state.settings,
        customPatterns: [...state.settings.customPatterns, pattern],
      },
    }));
  }

  removeCustomPattern(patternId: string) {
    this.setState((state) => ({
      settings: {
        ...state.settings,
        customPatterns: state.settings.customPatterns.filter(p => p.id !== patternId),
      },
    }));
  }

  setCustomMusicUrl(url: string | null) {
    this.setState((state) => ({
      settings: {
        ...state.settings,
        customMusicUrl: url,
      },
    }));
  }

  reset() {
    this.setState({
      phase: 'idle',
      isRunning: false,
      currentCycle: 0,
      secondsRemaining: 0,
      totalSecondsRemaining: 0,
    });
  }

  start() {
    this.setState((state) => {
      const totalSeconds = state.settings.totalMinutes > 0 ? state.settings.totalMinutes * 60 : 0;
      return {
        isRunning: true,
        currentCycle: state.currentCycle || 1,
        phase: 'inhale',
        secondsRemaining: state.settings.inhaleSeconds,
        totalSecondsRemaining: totalSeconds,
      };
    });
  }

  toggle() {
    const { isRunning, phase } = this.state;
    if (isRunning) {
      this.setRunning(false);
    } else {
      if (phase === 'idle') {
        this.start();
      } else {
        this.setRunning(true);
      }
    }
  }
}

export const breathingStore = new BreathingStore();
