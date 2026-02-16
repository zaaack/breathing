import { useEffect, useCallback, useRef } from 'react';
import { breathingStore, type BreathingPhase } from '@/store/breathingStore';
import { audioManager } from '@/lib/audio';

export function useBreathingTimer() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const state = breathingStore.useState();

  const getNextPhase = useCallback((currentPhase: BreathingPhase): { phase: BreathingPhase; duration: number } | null => {
    const { settings, totalSecondsRemaining } = state;

    // Check if time is up (for minute-based countdown)
    if (settings.totalMinutes > 0 && totalSecondsRemaining <= 0) {
      return null;
    }

    switch (currentPhase) {
      case 'inhale':
        if (settings.holdSeconds > 0) {
          return { phase: 'hold', duration: settings.holdSeconds };
        }
        return { phase: 'exhale', duration: settings.exhaleSeconds };
      case 'hold':
        return { phase: 'exhale', duration: settings.exhaleSeconds };
      case 'exhale':
        if (settings.holdAfterExhaleSeconds > 0) {
          return { phase: 'holdAfterExhale', duration: settings.holdAfterExhaleSeconds };
        }
        // For infinite mode (totalMinutes = 0), continue forever
        // For timed mode, we check in tick() instead
        return { phase: 'inhale', duration: settings.inhaleSeconds };
      case 'holdAfterExhale':
        // For infinite mode (totalMinutes = 0), continue forever
        // For timed mode, we check in tick() instead
        return { phase: 'inhale', duration: settings.inhaleSeconds };
      default:
        return null;
    }
  }, [state]);

  const tick = useCallback(async () => {
    const currentState = state;

    if (!currentState.isRunning || currentState.phase === 'idle') return;

    // Decrement total seconds remaining for countdown
    if (currentState.settings.totalMinutes > 0) {
      const newTotalSeconds = currentState.totalSecondsRemaining - 1;
      if (newTotalSeconds <= 0) {
        breathingStore.reset();
        audioManager.stopBackgroundMusic();
        return;
      }
      breathingStore.setTotalSecondsRemaining(newTotalSeconds);
    }

    const newSecondsRemaining = currentState.secondsRemaining - 1;

    if (newSecondsRemaining <= 0) {
      const next = getNextPhase(currentState.phase);

      if (!next) {
        breathingStore.reset();
        audioManager.stopBackgroundMusic();
        return;
      }

      if (next.phase === 'inhale' && (currentState.phase === 'exhale' || currentState.phase === 'holdAfterExhale')) {
        breathingStore.setCurrentCycle(currentState.currentCycle + 1);
        if (currentState.settings.soundEnabled) {
          // await audioManager.playCycleComplete();
        }
      }

      breathingStore.setPhase(next.phase);
      breathingStore.setSecondsRemaining(next.duration);

      if (currentState.settings.soundEnabled) {
        if (next.phase === 'inhale') {
          await audioManager.playInhaleTone(next.duration, currentState.settings.backgroundMusicEnabled);
        } else if (next.phase === 'hold') {
          await audioManager.playHoldTone(
            next.duration,
            currentState.settings.backgroundMusicEnabled
          )
        } else if (next.phase === 'exhale') {
          await audioManager.playExhaleTone(
            next.duration,
            currentState.settings.backgroundMusicEnabled
          )
        } else if (next.phase === 'holdAfterExhale') {
          await audioManager.playHoldAfterExhaleTone(
            next.duration,
            currentState.settings.backgroundMusicEnabled
          )
        }
      }
    } else {
      breathingStore.setSecondsRemaining(newSecondsRemaining);
    }
  }, [getNextPhase, state]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (state.isRunning && state.phase !== 'idle') {
      timerRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isRunning, state.phase, tick]);

  useEffect(() => {
    if (state.isRunning && state.phase === 'inhale' && state.secondsRemaining === state.settings.inhaleSeconds) {
      if (state.settings.backgroundMusicEnabled) {
        const customUrl = state.settings.backgroundMusicType === 'custom' ? state.settings.customMusicUrl : null;
        audioManager.startBackgroundMusic(state.settings.backgroundMusicVolume, state.settings.backgroundMusicType, customUrl);
      }
    }
  }, [state.isRunning, state.settings]);

  const start = useCallback(async () => {
    await audioManager.init();
    breathingStore.start();

    if (state.settings.soundEnabled) {
      await audioManager.playInhaleTone(
        state.settings.inhaleSeconds,
        state.settings.backgroundMusicEnabled
      )
    }
    if (state.settings.backgroundMusicEnabled) {
      const customUrl = state.settings.backgroundMusicType === 'custom' ? state.settings.customMusicUrl : null;
      audioManager.startBackgroundMusic(state.settings.backgroundMusicVolume, state.settings.backgroundMusicType, customUrl);
    }
  }, [state.settings]);

  const toggle = useCallback(async () => {
    await audioManager.init();
    const currentState = state;

    if (!currentState.isRunning && currentState.phase === 'idle') {
      breathingStore.start();
      if (currentState.settings.soundEnabled) {
        await audioManager.playInhaleTone(
          state.settings.inhaleSeconds,
          currentState.settings.backgroundMusicEnabled
        )
      }
      if (currentState.settings.backgroundMusicEnabled) {
        const customUrl = currentState.settings.backgroundMusicType === 'custom' ? currentState.settings.customMusicUrl : null;
        audioManager.startBackgroundMusic(currentState.settings.backgroundMusicVolume, currentState.settings.backgroundMusicType, customUrl);
      }
    } else if (currentState.isRunning) {
      breathingStore.setRunning(false);
      audioManager.stopBackgroundMusic();
    } else {
      breathingStore.setRunning(true);
      if (currentState.settings.backgroundMusicEnabled) {
        const customUrl = currentState.settings.backgroundMusicType === 'custom' ? currentState.settings.customMusicUrl : null;
        audioManager.startBackgroundMusic(currentState.settings.backgroundMusicVolume, currentState.settings.backgroundMusicType, customUrl);
      }
    }
  }, [state]);

  const reset = useCallback(() => {
    breathingStore.reset();
    audioManager.stopBackgroundMusic();
  }, []);

  return {
    ...state,
    start,
    toggle,
    reset,
  };
}
