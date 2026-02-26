import { X, Volume2, Music, Clock, Repeat, Plus, Trash2, FileAudio, Disc, ChevronDown, ChevronUp } from 'lucide-react';
import { breathingStore, builtInPatterns, type BreathingSettings, type BreathingPattern, type BackgroundMusicType, type SoundType } from '@/store/breathingStore';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { audioManager } from '@/lib/audio';
import { useState, useRef } from 'react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Background music options with labels and icons
const backgroundMusicOptions: { type: BackgroundMusicType; label: string; icon: string }[] = [
  { type: 'ocean', label: '🌊 Ocean Waves', icon: '🌊' },
  { type: 'wind', label: '🌬️ Strong Wind', icon: '🌬️' },
  { type: 'rain', label: '🌧️ Rain', icon: '🌧️' },
  { type: 'fire', label: '🔥 Campfire', icon: '🔥' },
  { type: 'windLight', label: '💨 Light Breeze', icon: '💨' },
  { type: 'sea', label: '🌊 Deep Sea', icon: '🌊' },
  { type: 'whiteNoise', label: '📻 White Noise', icon: '📻' },
];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const settings = breathingStore.useState((state: { settings: BreathingSettings }) => state.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI States
  const [isPatternsExpanded, setIsPatternsExpanded] = useState(true);
  const [isMusicExpanded, setIsMusicExpanded] = useState(true);
  const [showCustomPatternForm, setShowCustomPatternForm] = useState(false);

  const [customPatternName, setCustomPatternName] = useState('');
  const [customPatternValues, setCustomPatternValues] = useState({
    inhale: 4, hold: 0, exhale: 4, holdAfterExhale: 0
  });

  const handleSettingChange = (key: keyof BreathingSettings, value: number | boolean | string) => {
    breathingStore.updateSettings({ [key]: value });
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
  const currentPattern = allPatterns.find(p => p.id === settings.currentPatternId);

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
          {/* --- Breathing Pattern Accordion --- */}
          <div className="space-y-3">
            <button
              onClick={() => setIsPatternsExpanded(!isPatternsExpanded)}
              className="flex items-center justify-between w-full text-text-secondary hover:text-text transition-colors"
            >
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4" />
                <span className="text-sm font-medium">Breathing Pattern</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-primary font-medium">
                  {currentPattern?.name}
                </span>
                {isPatternsExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {isPatternsExpanded && (
              <div className="pl-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-2">
                  {allPatterns.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => handlePatternSelect(pattern)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all text-left ${
                        settings.currentPatternId === pattern.id
                          ? 'bg-primary/20 text-primary border border-primary/50'
                          : 'bg-white/5 text-text-secondary hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="font-medium truncate">{pattern.name}</div>
                      <div className="text-xs opacity-70">
                        {pattern.inhaleSeconds % 1 === 0 ? pattern.inhaleSeconds : pattern.inhaleSeconds.toFixed(1)}-
                        {pattern.holdSeconds % 1 === 0 ? pattern.holdSeconds : pattern.holdSeconds.toFixed(1)}-
                        {pattern.exhaleSeconds % 1 === 0 ? pattern.exhaleSeconds : pattern.exhaleSeconds.toFixed(1)}-
                        {pattern.holdAfterExhaleSeconds % 1 === 0 ? pattern.holdAfterExhaleSeconds : pattern.holdAfterExhaleSeconds.toFixed(1)}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setShowCustomPatternForm(!showCustomPatternForm)
                    }
                    className="px-3 py-2 rounded-lg text-sm bg-white/5 text-text-secondary hover:bg-white/10 border border-dashed border-white/20 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Custom</span>
                  </button>
                </div>

                {/* Custom Pattern Form */}
                {showCustomPatternForm && (
                  <div className="p-4 bg-white/5 rounded-lg space-y-3 border border-white/10">
                    <input
                      type="text"
                      placeholder="Pattern name"
                      value={customPatternName}
                      onChange={(e) => setCustomPatternName(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 rounded-lg text-text text-sm border border-white/10 focus:outline-none focus:border-primary/50"
                    />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['inhale', 'hold', 'exhale', 'holdAfterExhale'].map(
                        (key) => (
                          <div key={key} className="space-y-1">
                            <label className="text-text-secondary capitalize">
                              {key.replace('holdAfterExhale', 'Hold After')}
                            </label>
                            <input
                              type="number"
                              min={key.includes('hold') ? '0' : '1'}
                              step="0.1"
                              value={
                                customPatternValues[
                                  key as keyof typeof customPatternValues
                                ]
                              }
                              onChange={(e) =>
                                setCustomPatternValues((v) => ({
                                  ...v,
                                  [key]: parseFloat(e.target.value) || 0,
                                }))
                              }
                              className="w-full px-2 py-1 bg-white/10 rounded text-text border border-white/10"
                            />
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddCustomPattern}
                        disabled={!customPatternName.trim()}
                        className="flex-1 text-xs"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowCustomPatternForm(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Custom List with Delete */}
                {settings.customPatterns.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-white/5">
                    {settings.customPatterns.map((pattern) => (
                      <div
                        key={pattern.id}
                        className="flex items-center justify-between text-xs group"
                      >
                        <span className="text-text-secondary">
                          {pattern.name}
                        </span>
                        <button
                          onClick={() => handleDeleteCustomPattern(pattern.id)}
                          className="text-red-400/50 hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- Rest of the settings --- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Fine-tune Duration</span>
            </div>

            <div className="space-y-4 pl-6">
              {(
                [
                  {
                    label: 'Inhale',
                    key: 'inhaleSeconds',
                    color: 'text-primary',
                  },
                  {
                    label: 'Hold',
                    key: 'holdSeconds',
                    color: 'text-secondary',
                  },
                  {
                    label: 'Exhale',
                    key: 'exhaleSeconds',
                    color: 'text-accent',
                  },
                  {
                    label: 'Hold After',
                    key: 'holdAfterExhaleSeconds',
                    color: 'text-purple-400',
                  },
                ] as const
              ).map((item) => (
                <div key={item.key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className={`${item.color} font-medium`}>
                      {settings[item.key] % 1 === 0 ? settings[item.key] : (settings[item.key] as number).toFixed(1)}s
                    </span>
                  </div>
                  <Slider
                    value={[
                      settings[item.key as keyof BreathingSettings] as number,
                    ]}
                    onValueChange={([val]) =>
                      handleSettingChange(
                        item.key as keyof BreathingSettings,
                        val
                      )
                    }
                    min={item.label.includes('Hold') ? 0 : 1}
                    max={20}
                    step={0.5}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-secondary">
              <Repeat className="w-4 h-4" />
              <span className="text-sm font-medium">Timer</span>
            </div>
            <div className="space-y-2 pl-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">
                  Duration in minutes (0 = infinite)
                </span>
                <span className="text-text font-medium">
                  {settings.totalMinutes} min
                </span>
              </div>
              <Slider
                value={[settings.totalMinutes]}
                onValueChange={([val]) =>
                  handleSettingChange('totalMinutes', val)
                }
                min={0}
                max={60}
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
                onCheckedChange={(checked) =>
                  handleSettingChange('soundEnabled', checked)
                }
              />
            </div>

            {/* Sound Type Selector */}
            {settings.soundEnabled && (
              <>
                <div className="flex gap-2 pl-6 animate-in fade-in duration-200">
                  <button
                    onClick={() => handleSettingChange('soundType', 'breath')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                      settings.soundType === 'breath'
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-white/5 text-text-secondary hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    🌬️ Breath
                  </button>
                  <button
                    onClick={() => handleSettingChange('soundType', 'beep')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                      settings.soundType === 'beep'
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-white/5 text-text-secondary hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    🔔 Beep
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="space-y-2 pt-2  pl-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">Sound Volume</span>
                    <span className="text-text">{settings.soundVolume}%</span>
                  </div>
                  <Slider
                    value={[settings.soundVolume]}
                    onValueChange={([val]) =>
                      handleSettingChange('soundVolume', val)
                    }
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </>
            )}

            {/* Background Music Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <Music className="w-4 h-4" />
                <span className="text-sm font-medium">Background Music</span>
              </div>
              <Switch
                checked={settings.backgroundMusicEnabled}
                onCheckedChange={(checked) => {
                  handleSettingChange('backgroundMusicEnabled', checked)
                  if (checked) {
                    const customUrl =
                      settings.backgroundMusicType === 'custom'
                        ? settings.customMusicUrl
                        : null
                    audioManager.startBackgroundMusic(
                      settings.backgroundMusicVolume,
                      settings.backgroundMusicType,
                      customUrl
                    )
                  } else {
                    audioManager.stopBackgroundMusic()
                  }
                }}
              />
            </div>

            {/* Background Music Accordion */}
            {settings.backgroundMusicEnabled && (
              <div className="animate-in fade-in duration-300  pl-6">
                <button
                  onClick={() => setIsMusicExpanded(!isMusicExpanded)}
                  className="flex items-center justify-between w-full text-text-secondary hover:text-text transition-colors mb-3"
                >
                  <span className="text-xs">Select Sound</span>
                  {isMusicExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {isMusicExpanded && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Built-in Noise Options */}
                    <div className="grid grid-cols-2 gap-2">
                      {backgroundMusicOptions.map((option) => (
                        <button
                          key={option.type}
                          onClick={() =>
                            handleSettingChange(
                              'backgroundMusicType',
                              option.type
                            )
                          }
                          className={`px-3 py-2 rounded-lg text-sm transition-all text-left flex items-center gap-2 ${
                            settings.backgroundMusicType === option.type
                              ? 'bg-primary/20 text-primary border border-primary/50'
                              : 'bg-white/5 text-text-secondary hover:bg-white/10 border border-transparent'
                          }`}
                        >
                          <span>{option.icon}</span>
                          <span className="truncate">
                            {option.label.replace(/^[^\s]+ /, '')}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Custom MP3 Option */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() =>
                          handleSettingChange('backgroundMusicType', 'custom')
                        }
                        className={`w-full px-3 py-2 rounded-lg text-sm transition-all text-left flex items-center gap-2 ${
                          settings.backgroundMusicType === 'custom'
                            ? 'bg-primary/20 text-primary border border-primary/50'
                            : 'bg-white/5 text-text-secondary hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        <FileAudio className="w-4 h-4" />
                        <span>Custom MP3 File</span>
                      </button>

                      {settings.backgroundMusicType === 'custom' && (
                        <div className="pl-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 text-xs"
                          >
                            <FileAudio className="w-4 h-4" />
                            <span>
                              {settings.customMusicUrl
                                ? 'Change MP3'
                                : 'Select MP3'}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Volume Slider */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-secondary">
                          Music Volume
                        </span>
                        <span className="text-text">
                          {settings.backgroundMusicVolume}%
                        </span>
                      </div>
                      <Slider
                        value={[settings.backgroundMusicVolume]}
                        onValueChange={([val]) =>
                          handleSettingChange('backgroundMusicVolume', val)
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
