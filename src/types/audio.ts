export interface FrequencyBands {
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  treble: number;
}

export interface BeatDetectionResult {
  isBeat: boolean;
  intensity: number;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AudioContextState {
  isInitialized: boolean;
  sampleRate: number;
  baseLatency: number;
  outputLatency: number;
}

export interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  type: string;
  channels: number;
  sampleRate: number;
}

export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'm4a' | 'aac';

export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  frequencyBands: FrequencyBands;
  beatDetection: BeatDetectionResult;
  averageFrequency: number;
  peak: number;
  rms: number;
}