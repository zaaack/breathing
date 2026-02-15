import { KeyvLocalStorage } from 'keyv-browser';
import type { BreathingSettings } from '@/store/breathingStore';

const storage = new KeyvLocalStorage();

const SETTINGS_KEY = 'breathing-settings';

export async function loadSettings(): Promise<BreathingSettings | undefined> {
  try {
    const settings = await storage.get(SETTINGS_KEY);
    return settings as BreathingSettings | undefined;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return undefined;
  }
}

export async function saveSettings(settings: BreathingSettings): Promise<void> {
  try {
    await storage.set(SETTINGS_KEY, settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export async function clearSettings(): Promise<void> {
  try {
    await storage.delete(SETTINGS_KEY);
  } catch (error) {
    console.error('Failed to clear settings:', error);
  }
}
