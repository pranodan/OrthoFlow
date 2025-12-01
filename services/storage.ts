import { HARDCODED_FIREBASE_CONFIG, hasHardcodedConfig } from '../config';

const CONFIG_KEY = 'mediflow_config_v1';

export interface AppConfig {
  firebaseConfig?: any;
}

export const loadConfig = (): AppConfig => {
  // Priority 1: Check config.ts (Best for deployment)
  if (hasHardcodedConfig) {
    return { firebaseConfig: HARDCODED_FIREBASE_CONFIG };
  }

  // Priority 2: Check LocalStorage (Best for quick local testing)
  const stored = localStorage.getItem(CONFIG_KEY);
  return stored ? JSON.parse(stored) : {};
};

export const saveConfig = (config: AppConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const clearConfig = () => {
    localStorage.removeItem(CONFIG_KEY);
};