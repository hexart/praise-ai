import type { ProviderType, ProviderConfig } from './provider';
import type { ChatMode } from './chat';
import type { ThemeMode } from './ui';
export interface AppConfig {
  theme: ThemeMode;
  defaultMode: ChatMode;
  debugMode: boolean;
  autoSave: boolean;
  maxHistoryLength: number;
}
export interface ProviderSettings {
  activeProvider: ProviderType;
  providers: Record<ProviderType, ProviderConfig>;
}
export interface UserPreferences {
  userId: string;
  favoriteMode: ChatMode;
  enableNotifications: boolean;
  enableSounds: boolean;
  language: string;
}
export interface DebugSettings {
  enabled: boolean;
  showPrompts: boolean;
  showTimings: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}