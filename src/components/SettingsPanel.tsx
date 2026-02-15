import { X, Volume2, Music, Clock, Repeat } from 'lucide-react';
import { breathingStore, type BreathingSettings } from '@/store/breathingStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { audioManager } from '@/lib/audio';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const settings = breathingStore.useState((state: { settings: BreathingSettings }) => state.settings);

  const handleSettingChange = (key: keyof BreathingSettings, value: number | boolean) => {
    breathingStore.updateSettings({ [key]: value });

    if (key === 'backgroundMusicVolume') {
      audioManager.setBackgroundVolume(value as number);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-surface border-l border-white/10 p-6 overflow-y-auto animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Breathing Duration</span>
            </div>

            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Inhale</span>
                  <span className="text-primary font-medium">{settings.inhaleSeconds}s</span>
                </div>
                <Slider
                  value={[settings.inhaleSeconds]}
                  onValueChange={([val]) => handleSettingChange('inhaleSeconds', val)}
                  min={2}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Hold</span>
                  <span className="text-secondary font-medium">{settings.holdSeconds}s</span>
                </div>
                <Slider
                  value={[settings.holdSeconds]}
                  onValueChange={([val]) => handleSettingChange('holdSeconds', val)}
                  min={2}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Exhale</span>
                  <span className="text-accent font-medium">{settings.exhaleSeconds}s</span>
                </div>
                <Slider
                  value={[settings.exhaleSeconds]}
                  onValueChange={([val]) => handleSettingChange('exhaleSeconds', val)}
                  min={2}
                  max={10}
                  step={1}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-secondary">
              <Repeat className="w-4 h-4" />
              <span className="text-sm font-medium">Cycles</span>
            </div>
            <div className="space-y-2 pl-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Total cycles</span>
                <span className="text-text font-medium">{settings.totalCycles}</span>
              </div>
              <Slider
                value={[settings.totalCycles]}
                onValueChange={([val]) => handleSettingChange('totalCycles', val)}
                min={0}
                max={20}
                step={1}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm font-medium">Sound Effects</span>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <Music className="w-4 h-4" />
                <span className="text-sm font-medium">Background Music</span>
              </div>
              <Switch
                checked={settings.backgroundMusicEnabled}
                onCheckedChange={(checked) => handleSettingChange('backgroundMusicEnabled', checked)}
              />
            </div>

            {settings.backgroundMusicEnabled && (
              <div className="space-y-2 pl-6">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Volume</span>
                  <span className="text-text font-medium">{settings.backgroundMusicVolume}%</span>
                </div>
                <Slider
                  value={[settings.backgroundMusicVolume]}
                  onValueChange={([val]) => handleSettingChange('backgroundMusicVolume', val)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
