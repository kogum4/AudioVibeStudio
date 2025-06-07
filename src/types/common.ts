export interface AppState {
  currentScreen: 'upload' | 'editor' | 'export';
  audioFile: File | null;
  isAudioLoaded: boolean;
  selectedEffect: string;
  isExporting: boolean;
  exportProgress: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    size: number;
    type: string;
    duration?: number;
  };
}

export interface ApplicationError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'critical';
}

export interface DeviceCapabilities {
  webgl: boolean;
  mediaRecorder: boolean;
  webAudio: boolean;
  fileAPI: boolean;
  canvas: boolean;
  performance: 'low' | 'medium' | 'high';
  maxTextureSize: number;
  maxCanvasSize: number;
}

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  supportedFormats: {
    audio: string[];
    video: string[];
  };
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorHSV {
  h: number;
  s: number;
  v: number;
}

export interface TimeRange {
  start: number;
  end: number;
  duration: number;
}

export interface KeyframeData {
  time: number;
  value: any;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface AnimationSettings {
  duration: number;
  delay: number;
  repeat: number;
  repeatDelay: number;
  yoyo: boolean;
  easing: string;
}

export interface PresetData {
  id: string;
  name: string;
  description: string;
  effect: string;
  parameters: Record<string, any>;
  thumbnail?: string;
  created: Date;
  modified: Date;
  author?: string;
  tags: string[];
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  autoSave: boolean;
  defaultQuality: string;
  defaultFormat: string;
  showTutorials: boolean;
  advancedMode: boolean;
  language: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncOperation<T> {
  state: LoadingState;
  data?: T;
  error?: string;
  progress?: number;
}

export interface NavigationRoute {
  path: string;
  name: string;
  component: React.ComponentType;
  title: string;
  description?: string;
  icon?: string;
}