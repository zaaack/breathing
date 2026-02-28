import { cn } from '@/lib/utils';
import { breathingStore, type BreathingPhase } from '@/store/breathingStore';

interface BreathingCircleProps {
  phase: BreathingPhase;
  secondsRemaining: number;
  size?: number;
}

const phaseColors: Record<BreathingPhase, string> = {
  idle: 'bg-white/20',
  inhale: 'bg-primary',
  hold: 'bg-secondary',
  exhale: 'bg-accent',
  holdAfterExhale: 'bg-purple-400',
};

const phaseBorderColors: Record<BreathingPhase, string> = {
  idle: 'border-white/20',
  inhale: 'border-primary',
  hold: 'border-secondary',
  exhale: 'border-accent',
  holdAfterExhale: 'border-purple-400',
}


const phaseGlows: Record<BreathingPhase, string> = {
  idle: 'shadow-none',
  inhale: 'shadow-[0_0_60px_rgba(110,231,183,0.6)]',
  hold: 'shadow-[0_0_60px_rgba(244,114,182,0.6)]',
  exhale: 'shadow-[0_0_60px_rgba(96,165,250,0.6)]',
  holdAfterExhale: 'shadow-[0_0_60px_rgba(192,132,252,0.6)]',
};

const phaseLabels: Record<string, string> = {
  idle: 'Ready',
  inhale: 'Inhale',
  hold: 'Hold',
  exhale: 'Exhale',
  holdAfterExhale: 'Hold',
}
export function BreathingCircle({ phase, secondsRemaining, size = 200 }: BreathingCircleProps) {
  const totalSeconds = breathingStore.getTotalSeconds(phase)
  const getScale = () => {
    if (phase === 'idle' || totalSeconds === 0) return 0.3;
    const max = 1;

    switch (phase) {
      case 'inhale':
        // return 0 + (progress * 1.5);
        return max;
      case 'hold':
        return max
      case 'exhale':
        // return 1.5 - (progress * 1.5);
        return 0.3
      case 'holdAfterExhale':
        return 0.3;
      default:
        return 0.3;
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn(
          'rounded-full transition-transform duration-1000 ease-in-out border-2 border-solid ',
          // phaseColors[phase],
          phaseGlows[phase],
          phaseBorderColors[phase]
          // phase !== 'idle' && 'animate-glow'
        )}
        style={{
          width: size,
          height: size,
          // transform: `scale(${getScale()})`,
          // transitionDuration: `${totalSeconds}s`,
        }}
      />
      <div
        className={cn(
          `absolute rounded-full bg-bg/30 backdrop-blur-sm transition-transform  ease-in-out overflow-hidden`,
          phaseColors[phase]
        )}
        style={{
          width: size,
          height: size,
          transform: `scale(${getScale()})`,
          transitionDuration: `${totalSeconds}s`,
        }}
      >
        <div className={cn('w-full h-full bg-bg/30 ')} />
      </div>

      <div
        className={cn(
          'text-3xl md:text-4xl font-semibold transition-colors duration-300 absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 text-center',
          phase === 'inhale' && 'text-primary',
          phase === 'hold' && 'text-secondary',
          phase === 'exhale' && 'text-accent',
          phase === 'holdAfterExhale' && 'text-purple-400',
          phase === 'idle' && 'text-text'
        )}
      >
        {phaseLabels[phase]}
        {phase !== 'idle' && (
          <div className="text-3xl md:text-4xl font-bold text-text tabular-nums">
            {secondsRemaining.toFixed(0)}
          </div>
        )}
      </div>
    </div>
  )
}
