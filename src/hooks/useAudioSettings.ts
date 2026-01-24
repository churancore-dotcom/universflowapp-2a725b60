import { useState, useEffect, useCallback } from 'react';

interface AudioSettings {
  selectedPreset: string;
  selectedQuality: string;
  spatialAudio: boolean;
  dynamicNormalization: boolean;
  customBands: number[];
}

const STORAGE_KEY = 'audio_settings';

const defaultSettings: AudioSettings = {
  selectedPreset: 'flat',
  selectedQuality: '320',
  spatialAudio: false,
  dynamicNormalization: true,
  customBands: [0, 0, 0, 0, 0],
};

export const useAudioSettings = () => {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load audio settings:', e);
    }
    return defaultSettings;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save audio settings:', e);
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
};

export type { AudioSettings };
