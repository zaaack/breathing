import { LocalStore } from 'nstate';

export type BreathingPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

export interface BreathingSettings {
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  totalCycles: number;
  soundEnabled: boolean;
  backgroundMusicEnabled: boolean;
  backgroundMusicVolume: number;
}

export interface BreathingState {
  phase: BreathingPhase;
  isRunning: boolean;
  currentCycle: number;
  secondsRemaining: number;
  settings: BreathingSettings;
}

const defaultSettings: BreathingSettings = {
  inhaleSeconds: 4,
  holdSeconds: 7,
  exhaleSeconds: 8,
  totalCycles: 4,
  soundEnabled: true,
  backgroundMusicEnabled: false,
  backgroundMusicVolume: 50,
};

export const initialState: BreathingState = {
  phase: 'idle',
  isRunning: false,
  currentCycle: 0,
  secondsRemaining: 0,
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

  updateSettings(settings: Partial<BreathingSettings>) {
    this.setState((state) => ({
      settings: { ...state.settings, ...settings },
    }));
  }

  reset() {
    this.setState({
      phase: 'idle',
      isRunning: false,
      currentCycle: 0,
      secondsRemaining: 0,
    });
  }

  start() {
    this.setState((state) => ({
      isRunning: true,
      currentCycle: state.currentCycle || 1,
      phase: 'inhale',
      secondsRemaining: state.settings.inhaleSeconds,
    }));
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
