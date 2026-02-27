import { useState, useEffect } from 'react';
import { Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { BreathingCircle } from '@/components/BreathingCircle';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ResonanceTest } from '@/components/ResonanceTest';
import { Button } from '@/components/ui/button';
import { useBreathingTimer } from '@/hooks/useBreathingTimer';
import { breathingStore } from '@/store/breathingStore';
import { loadSettings, saveSettings } from '@/lib/storage';
import { cn } from '@/lib/utils';


function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resonanceTestOpen, setResonanceTestOpen] = useState(false);
  const { phase, isRunning, currentCycle, secondsRemaining, totalSecondsRemaining, toggle, reset, settings } = useBreathingTimer();


  const [inited, setInited] = useState(false);

  useEffect(() => {
    const initSettings = async () => {
      const saved = await loadSettings();
      if (saved) {
        breathingStore.updateSettings(saved);
      }
      setInited(true);
    };
    initSettings();
  }, []);

  useEffect(() => {
    if (inited) {
      saveSettings(settings)
    }
  }, [settings, inited])

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

      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-5">
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center gap-4 relative mb-4">
            <BreathingCircle
              phase={phase}
              secondsRemaining={secondsRemaining}
              totalSeconds={breathingStore.getTotalSeconds()}
            />

          </div>

          {phase !== 'idle' && (
            <div className="text-text-secondary pt-8">
              {settings.totalMinutes > 0 ? (
                <>Time remaining: {Math.floor(totalSecondsRemaining / 60)}:{(totalSecondsRemaining % 60).toFixed(0).padStart(2, '0')}</>
              ) : (
                <>Cycle {currentCycle}</>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-1">
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
          {settings.inhaleSeconds % 1 === 0 ? settings.inhaleSeconds : settings.inhaleSeconds.toFixed(1)}-
          {settings.holdSeconds % 1 === 0 ? settings.holdSeconds : settings.holdSeconds.toFixed(1)}-
          {settings.exhaleSeconds % 1 === 0 ? settings.exhaleSeconds : settings.exhaleSeconds.toFixed(1)}-
          {settings.holdAfterExhaleSeconds % 1 === 0 ? settings.holdAfterExhaleSeconds : settings.holdAfterExhaleSeconds.toFixed(1)} Breathing
        </p>
      </footer>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenResonanceTest={() => setResonanceTestOpen(true)}
      />

      <ResonanceTest
        isOpen={resonanceTestOpen}
        onClose={() => setResonanceTestOpen(false)}
      />
    </div>
  )
}

export default App;
