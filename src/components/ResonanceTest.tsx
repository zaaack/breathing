import { X, Play, Pause, ChevronRight, Star, CheckCircle } from 'lucide-react';
import { breathingStore, resonanceTestFrequencies } from '@/store/breathingStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useState, useEffect } from 'react';
import { audioManager } from '@/lib/audio';
import { cn } from '@/lib/utils';
import { BreathingCircle } from './BreathingCircle';

interface ResonanceTestProps {
  isOpen: boolean;
  onClose: () => void;
}

type TestPhase = 'intro' | 'testing' | 'rating' | 'completed';

export function ResonanceTest({ isOpen, onClose }: ResonanceTestProps) {
  const state = breathingStore.useState();
  const { resonanceTest, settings, phase, isRunning, secondsRemaining, totalSecondsRemaining } = state;
  const [testPhase, setTestPhase] = useState<TestPhase>('intro');
  const [testDuration, setTestDuration] = useState(2)
  const [skipRating, setSkipRating] = useState(true)

  const currentFrequency = resonanceTestFrequencies[resonanceTest.currentFrequencyIndex];

  // 监听 totalSecondsRemaining，当接近 0 时进入评分阶段
  useEffect(() => {
    if (resonanceTest.isActive && totalSecondsRemaining <= 0) {
      setTestPhase('rating');
      if (skipRating) {
        handleNextFrequency()
      }
    }
  }, [resonanceTest.isActive, isRunning, totalSecondsRemaining]);

  const handleStartTest = async () => {
    await audioManager.init();
    audioManager.soundType = settings.soundType;
    audioManager.setSoundVolume(settings.soundVolume);

    const freq = resonanceTestFrequencies[0];

    // 设置呼吸参数和总时长
    breathingStore.updateSettings({
      inhaleSeconds: freq.inhaleSeconds,
      exhaleSeconds: freq.exhaleSeconds,
      holdSeconds: 0,
      holdAfterExhaleSeconds: 0,
      totalMinutes: testDuration,
    });

    // 标记 resonance test 开始
    breathingStore.startResonanceTest(testDuration);
    setTestPhase('testing');

    // 开始呼吸
    await breathingStore.start();

  };

  const handleTogglePause = () => {
    if (isRunning) {
      breathingStore.setRunning(false);
    } else {
      breathingStore.setRunning(true);
    }
  };

  const handleRating = (rating: number) => {
    breathingStore.updateResonanceTestRating(rating);
  };

  const handleNextFrequency = async () => {
    await audioManager.init();
    const nextIndex = resonanceTest.currentFrequencyIndex + 1;

    if (nextIndex >= resonanceTestFrequencies.length) {
      breathingStore.completeResonanceTest();
      setTestPhase('completed');
      return;
    }

    const nextFreq = resonanceTestFrequencies[nextIndex];

    audioManager.soundType = settings.soundType;
    audioManager.setSoundVolume(settings.soundVolume);

    // 更新呼吸参数和总时长
    breathingStore.updateSettings({
      inhaleSeconds: nextFreq.inhaleSeconds,
      exhaleSeconds: nextFreq.exhaleSeconds,
      totalMinutes: testDuration,
    });

    // 设置 resonance test 状态
    breathingStore.nextResonanceTestFrequency();

    // 开始呼吸
    await breathingStore.start();

    setTestPhase('testing');

  };

  const handleCancel = () => {
    breathingStore.cancelResonanceTest();
    setTestPhase('intro');
    onClose();
  };

  const handleApplyResonantFrequency = () => {
    if (resonanceTest.resonantFrequency) {
      const freq = resonanceTest.resonantFrequency;
      breathingStore.applyPattern({
        id: 'resonance',
        name: `${freq.breathsPerMinute} BPM Resonance`,
        inhaleSeconds: freq.inhaleSeconds,
        exhaleSeconds: freq.exhaleSeconds,
        holdSeconds: 0,
        holdAfterExhaleSeconds: 0,
      });
    }
    breathingStore.exitResonanceTest();
    setTestPhase('intro');
    onClose();
  };

  const handleClose = () => {
    if (resonanceTest.isActive) {
      breathingStore.cancelResonanceTest();
    }
    setTestPhase('intro');
    onClose();
  };

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl p-6 mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text">
            Resonance Frequency Test
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Intro Phase */}
        {testPhase === 'intro' && (
          <div className="space-y-6">
            <div className="text-text-secondary text-sm leading-relaxed">
              <p className="mb-3">
                This test will help you find your personal resonance breathing
                frequency using the Lehrer method.
              </p>
              <p className="mb-3">
                The test will cycle through 6 different breathing rates from 7.0
                to 4.5 breaths per minute. After each rate, you'll rate how
                comfortable it felt.
              </p>
              <p>
                The most comfortable rate is likely your resonance frequency.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">
                  Duration per frequency
                </span>
                <span className="text-text font-medium">
                  {testDuration} min
                </span>
              </div>
              <Slider
                value={[testDuration]}
                onValueChange={([val]) => setTestDuration(val)}
                min={0.5}
                max={10}
                step={0.5}
              />
              <p className="text-xs text-text-secondary">
                Total test time: {testDuration * 6} minutes
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary pr-5">Skip rating</span>
              <Switch checked={skipRating} onCheckedChange={setSkipRating} />
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm font-medium text-text mb-2">
                Test Frequencies:
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {resonanceTestFrequencies.map((freq, index) => (
                  <div key={index} className="text-text-secondary">
                    {freq.breathsPerMinute} BPM
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleStartTest} className="w-full" size="lg">
              <Play className="w-4 h-4 mr-2" />
              Start Test
            </Button>
          </div>
        )}

        {/* Testing Phase */}
        {testPhase === 'testing' && resonanceTest.isActive && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-sm text-text-secondary mb-1">
                Frequency {resonanceTest.currentFrequencyIndex + 1} of{' '}
                {resonanceTestFrequencies.length}
              </div>
              <div className="text-3xl font-bold text-primary mb-2">
                {currentFrequency.breathsPerMinute} BPM
              </div>
              <div className="text-sm text-text-secondary">
                Inhale: {currentFrequency.inhaleSeconds}s | Exhale:{' '}
                {currentFrequency.exhaleSeconds}s
              </div>
            </div>

            <BreathingCircle
              phase={phase}
              secondsRemaining={secondsRemaining}
              size={150}
            />

            <div className="text-center">
              <div className="text-4xl font-bold text-text tabular-nums">
                {formatTime(totalSecondsRemaining)}
              </div>
              <div className="text-sm text-text-secondary mt-1">
                Time remaining
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleTogglePause}
                className="flex-1"
                variant={isRunning ? 'secondary' : 'default'}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Rating Phase */}
        {testPhase === 'rating' && !resonanceTest.isCompleted && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-sm text-text-secondary mb-1">
                Rate your experience at
              </div>
              <div className="text-3xl font-bold text-primary mb-4">
                {currentFrequency.breathsPerMinute} BPM
              </div>
              <p className="text-text-secondary text-sm">
                How comfortable did this breathing rate feel?
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => {
                const currentRating =
                  resonanceTest.ratings[resonanceTest.currentFrequencyIndex]
                return (
                  <button
                    key={rating}
                    onClick={() => handleRating(rating)}
                    className={cn(
                      'p-3 rounded-lg transition-all',
                      currentRating === rating
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-white/5 text-text-secondary hover:bg-white/10 border-2 border-transparent'
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <Star
                        className={cn(
                          'w-6 h-6',
                          currentRating !== null && currentRating >= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : ''
                        )}
                      />
                      <span className="text-xs mt-1">{rating}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="text-center text-xs text-text-secondary">
              <div>1 = Very uncomfortable</div>
              <div>5 = Very comfortable</div>
            </div>

            <Button
              onClick={handleNextFrequency}
              className="w-full"
              disabled={
                resonanceTest.ratings[resonanceTest.currentFrequencyIndex] ===
                null
              }
            >
              {resonanceTest.currentFrequencyIndex <
              resonanceTestFrequencies.length - 1 ? (
                <>
                  Next Frequency
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  View Results
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Completed Phase */}
        {resonanceTest.isCompleted && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text mb-2">
                Test Complete!
              </h3>
            </div>

            {resonanceTest.resonantFrequency ? (
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <p className="text-sm text-text-secondary mb-2">
                  Your Resonance Frequency:
                </p>
                <div className="text-3xl font-bold text-primary mb-1">
                  {resonanceTest.resonantFrequency.breathsPerMinute} BPM
                </div>
                <p className="text-sm text-text-secondary">
                  Inhale: {resonanceTest.resonantFrequency.inhaleSeconds}s |
                  Exhale: {resonanceTest.resonantFrequency.exhaleSeconds}s
                </p>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-text-secondary">
                  No ratings were provided. Please try the test again.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-text">All Ratings:</h4>
              <div className="grid grid-cols-3 gap-2">
                {resonanceTestFrequencies.map((freq, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-2 rounded-lg text-center text-sm',
                      resonanceTest.resonantFrequency?.breathsPerMinute ===
                        freq.breathsPerMinute
                        ? 'bg-primary/20 border border-primary/50'
                        : 'bg-white/5'
                    )}
                  >
                    <div className="text-text">{freq.breathsPerMinute} BPM</div>
                    <div className="flex justify-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'w-3 h-3',
                            resonanceTest.ratings[index] !== null &&
                              resonanceTest.ratings[index] >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-white/20'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {resonanceTest.resonantFrequency && (
                <Button
                  onClick={handleApplyResonantFrequency}
                  className="flex-1"
                >
                  Apply This Frequency
                </Button>
              )}
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
