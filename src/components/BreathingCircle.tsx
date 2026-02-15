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
};

const phaseGlows: Record<BreathingPhase, string> = {
  idle: 'shadow-none',
  inhale: 'shadow-[0_0_60px_rgba(110,231,183,0.6)]',
  hold: 'shadow-[0_0_60px_rgba(244,114,182,0.6)]',
  exhale: 'shadow-[0_0_60px_rgba(96,165,250,0.6)]',
};

export function BreathingCircle({ phase, secondsRemaining, totalSeconds }: BreathingCircleProps) {
  const getScale = () => {
    if (phase === 'idle' || totalSeconds === 0) return 1;
    
    const progress = 1 - (secondsRemaining / totalSeconds);
    
    switch (phase) {
      case 'inhale':
        return 1 + (progress * 0.5);
      case 'hold':
        return 1.5;
      case 'exhale':
        return 1.5 - (progress * 0.5);
      default:
        return 1;
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={cn(
          'rounded-full transition-all duration-1000 ease-in-out',
          phaseColors[phase],
          phaseGlows[phase],
          phase !== 'idle' && 'animate-glow'
        )}
        style={{
          width: '200px',
          height: '200px',
          transform: `scale(${getScale()})`,
        }}
      />
      <div
        className="absolute rounded-full bg-bg/30 backdrop-blur-sm"
        style={{
          width: '160px',
          height: '160px',
          transform: `scale(${getScale()})`,
        }}
      />
    </div>
  );
}
