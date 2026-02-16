import { cn } from '@/lib/utils';
import type { BreathingPhase } from '@/store/breathingStore';

interface BreathingCircleProps {
  phase: BreathingPhase;
  secondsRemaining: number;
  totalSeconds: number;
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

export function BreathingCircle({ phase, secondsRemaining, totalSeconds }: BreathingCircleProps) {
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
          width: '200px',
          height: '200px',
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
          width: '200px',
          height: '200px',
          transform: `scale(${getScale()})`,
          transitionDuration: `${totalSeconds}s`,
        }}
      >
        <div className={cn('w-full h-full bg-bg/30 ')} />
      </div>
    </div>
  )
}
