import { X, Volume2, Music, Clock, Repeat, Plus, Trash2, FileAudio, Disc } from 'lucide-react';
import { breathingStore, builtInPatterns, type BreathingSettings, type BreathingPattern } from '@/store/breathingStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { audioManager } from '@/lib/audio';
import { useState, useRef } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const settings = breathingStore.useState((state: { settings: BreathingSettings }) => state.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCustomPatternForm, setShowCustomPatternForm] = useState(false);
  const [customPatternName, setCustomPatternName] = useState('');
  const [customPatternValues, setCustomPatternValues] = useState({
    inhale: 4, hold: 0, exhale: 4, holdAfterExhale: 0
  });

  const handleSettingChange = (key: keyof BreathingSettings, value: number | boolean | string) => {
    breathingStore.updateSettings({ [key]: value });

    if (key === 'backgroundMusicVolume') {
      audioManager.setBackgroundVolume(value as number);
    }
  };

  const handlePatternSelect = (pattern: BreathingPattern) => {
    breathingStore.applyPattern(pattern);
  };

  const handleAddCustomPattern = () => {
    if (!customPatternName.trim()) return;
    
    const newPattern: BreathingPattern = {
      id: `custom-${Date.now()}`,
      name: customPatternName.trim(),
      inhaleSeconds: customPatternValues.inhale,
      holdSeconds: customPatternValues.hold,
      exhaleSeconds: customPatternValues.exhale,
      holdAfterExhaleSeconds: customPatternValues.holdAfterExhale,
      isBuiltIn: false,
    };
    
    breathingStore.addCustomPattern(newPattern);
    setCustomPatternName('');
    setCustomPatternValues({ inhale: 4, hold: 0, exhale: 4, holdAfterExhale: 0 });
    setShowCustomPatternForm(false);
  };

  const handleDeleteCustomPattern = (patternId: string) => {
    breathingStore.removeCustomPattern(patternId);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      breathingStore.setCustomMusicUrl(url);
      breathingStore.updateSettings({ backgroundMusicType: 'custom' });
    }
  };

  const allPatterns = [...builtInPatterns, ...settings.customPatterns];

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
              <Disc className="w-4 h-4" />
              <span className="text-sm font-medium">Breathing Pattern</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pl-6">
              {allPatterns.map((pattern) => (
                <button
                  key={pattern.id}
                  onClick={() => handlePatternSelect(pattern)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    settings.currentPatternId === pattern.id
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : 'bg-white/5 text-text-secondary hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="font-medium truncate">{pattern.name}</div>
                  <div className="text-xs opacity-70">
                    {pattern.inhaleSeconds}-{pattern.holdSeconds}-{pattern.exhaleSeconds}-{pattern.holdAfterExhaleSeconds}
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowCustomPatternForm(!showCustomPatternForm)}
                className="px-3 py-2 rounded-lg text-sm bg-white/5 text-text-secondary hover:bg-white/10 border border-dashed border-white/20 flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Custom</span>
              </button>
            </div>

            {showCustomPatternForm && (
              <div className="pl-6 mt-3 p-4 bg-white/5 rounded-lg space-y-3">
                <input
                  type="text"
                  placeholder="Pattern name"
                  value={customPatternName}
                  onChange={(e) => setCustomPatternName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 rounded-lg text-text placeholder:text-text-secondary/50 border border-white/10 focus:outline-none focus:border-primary/50"
                />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <label className="text-text-secondary">Inhale</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={customPatternValues.inhale}
                      onChange={(e) => setCustomPatternValues(v => ({ ...v, inhale: parseInt(e.target.value) || 1 }))}
                      className="w-full px-2 py-1 bg-white/10 rounded text-text border border-white/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-text-secondary">Hold</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={customPatternValues.hold}
                      onChange={(e) => setCustomPatternValues(v => ({ ...v, hold: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-white/10 rounded text-text border border-white/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-text-secondary">Exhale</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={customPatternValues.exhale}
                      onChange={(e) => setCustomPatternValues(v => ({ ...v, exhale: parseInt(e.target.value) || 1 }))}
                      className="w-full px-2 py-1 bg-white/10 rounded text-text border border-white/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-text-secondary">Hold After</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={customPatternValues.holdAfterExhale}
                      onChange={(e) => setCustomPatternValues(v => ({ ...v, holdAfterExhale: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2 py-1 bg-white/10 rounded text-text border border-white/10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddCustomPattern}
                    disabled={!customPatternName.trim()}
                    className="flex-1"
                  >
                    Save Pattern
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCustomPatternForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {settings.customPatterns.length > 0 && (
              <div className="pl-6 mt-2 space-y-1">
                {settings.customPatterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{pattern.name}</span>
                    <button
                      onClick={() => handleDeleteCustomPattern(pattern.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  min={1}
                  max={20}
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
                  min={0}
                  max={20}
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
                  min={1}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Hold After Exhale</span>
                  <span className="text-purple-400 font-medium">{settings.holdAfterExhaleSeconds}s</span>
                </div>
                <Slider
                  value={[settings.holdAfterExhaleSeconds]}
                  onValueChange={([val]) => handleSettingChange('holdAfterExhaleSeconds', val)}
                  min={0}
                  max={20}
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
                <span className="text-text-secondary">Total cycles (0 = infinite)</span>
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
              <div className="space-y-4 pl-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSettingChange('backgroundMusicType', 'whiteNoise')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                      settings.backgroundMusicType === 'whiteNoise'
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-white/5 text-text-secondary hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    White Noise
                  </button>
                  <button
                    onClick={() => handleSettingChange('backgroundMusicType', 'custom')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                      settings.backgroundMusicType === 'custom'
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-white/5 text-text-secondary hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    MP3 File
                  </button>
                </div>

                {settings.backgroundMusicType === 'custom' && (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2"
                    >
                      <FileAudio className="w-4 h-4" />
                      <span>{settings.customMusicUrl ? 'Change MP3 File' : 'Select MP3 File'}</span>
                    </Button>
                    {settings.customMusicUrl && (
                      <p className="text-xs text-text-secondary truncate">
                        Custom music loaded
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
