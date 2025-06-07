// Main type definitions export file for AudioVibe Studio
// This file aggregates all type definitions for easier importing

// Audio types
export type {
  FrequencyBands,
  BeatDetectionResult,
  AudioPlayerState,
  AudioContextState,
  AudioFileInfo,
  AudioFormat,
  AudioAnalysisData
} from './audio';

// Visual types
export type {
  ParameterDefinition,
  EffectParameter,
  EffectType,
  VisualEffectState,
  RenderingOptions,
  Point2D,
  Point3D,
  Vector3D,
  Particle,
  GeometricShape,
  ThreeDObject,
  ColorStop,
  GradientDefinition,
  WaveformStyle,
  PerformanceMetrics
} from './visual';

// Video types
export type {
  VideoFormat,
  VideoQuality,
  VideoExportSettings,
  VideoExportProgress,
  VideoExportResult,
  MediaRecorderState,
  VideoConstraints,
  AudioConstraints,
  StreamSettings,
  RecordingChunk,
  VideoMetadata
} from './video';

// Common types
export type {
  AppState,
  FileValidationResult,
  ApplicationError,
  DeviceCapabilities,
  BrowserInfo,
  ColorRGB,
  ColorHSL,
  ColorHSV,
  TimeRange,
  KeyframeData,
  AnimationSettings,
  PresetData,
  UserPreferences,
  LoadingState,
  AsyncOperation,
  NavigationRoute
} from './common';