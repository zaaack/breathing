import { useState, useEffect } from 'react';
import { Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { BreathingCircle } from '@/components/BreathingCircle';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Button } from '@/components/ui/button';
import { useBreathingTimer } from '@/hooks/useBreathingTimer';
import { breathingStore, type BreathingState } from '@/store/breathingStore';
import { loadSettings, saveSettings } from '@/lib/storage';
import { cn } from '@/lib/utils';

const phaseLabels: Record<string, string> = {
  idle: 'Ready',
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
  holdAfterExhale: 'Hold',
};

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { phase, isRunning, currentCycle, secondsRemaining, toggle, reset } = useBreathingTimer();
  const settings = breathingStore.useState((state: BreathingState) => state.settings);

  const getTotalSeconds = () => {
    switch (phase) {
      case 'inhale':
        return settings.inhaleSeconds;
      case 'hold':
        return settings.holdSeconds;
      case 'exhale':
        return settings.exhaleSeconds;
      case 'holdAfterExhale':
        return settings.holdAfterExhaleSeconds;
      default:
        return 0;
    }
  };

  useEffect(() => {
    const initSettings = async () => {
      const saved = await loadSettings();
      if (saved) {
        breathingStore.updateSettings(saved);
      }
    };
    initSettings();
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-6">
        <h1 className="text-2xl font-semibold text-text">Breathing Timer</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-8">
          <div className="flex flex-col items-center gap-4 relative mb-4">
            <BreathingCircle
              phase={phase}
              secondsRemaining={secondsRemaining}
              totalSeconds={getTotalSeconds()}
            />

            <div
              className={cn(
                'text-4xl md:text-5xl font-semibold transition-colors duration-300 absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2',
                phase === 'inhale' && 'text-primary',
                phase === 'hold' && 'text-secondary',
                phase === 'exhale' && 'text-accent',
                phase === 'holdAfterExhale' && 'text-purple-400',
                phase === 'idle' && 'text-text'
              )}
            >
              {phaseLabels[phase]}
              {phase !== 'idle' && (
                <div className="text-7xl md:text-8xl font-bold text-text tabular-nums">
                  {secondsRemaining}
                </div>
              )}
            </div>
          </div>

          {phase !== 'idle' && currentCycle > 0 && (
            <div className="text-text-secondary">
              Cycle {currentCycle} of {settings.totalCycles}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button onClick={toggle} size="lg" className="min-w-[140px]">
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {phase === 'idle' ? 'Start' : 'Resume'}
                </>
              )}
            </Button>

            <Button variant="secondary" size="icon" onClick={reset}>
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-text-secondary text-sm">
        <p>
          {settings.inhaleSeconds}-{settings.holdSeconds}-{settings.exhaleSeconds}-{settings.holdAfterExhaleSeconds} Breathing
        </p>
      </footer>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

export default App;
