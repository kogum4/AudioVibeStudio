export type VideoFormat = 'webm' | 'mp4';
export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface VideoExportSettings {
  format: VideoFormat;
  quality: VideoQuality;
  width: number;
  height: number;
  fps: number;
  videoBitrate: number;
  audioBitrate: number;
  duration: number;
}

export interface VideoExportProgress {
  stage: 'preparing' | 'recording' | 'processing' | 'complete' | 'error';
  progress: number;
  currentFrame: number;
  totalFrames: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  processedBytes: number;
  error?: string;
}

export interface VideoExportResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  filename: string;
  size: number;
  duration: number;
  error?: string;
}

export interface MediaRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  isSupported: boolean;
  mimeType: string;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
}

export interface VideoConstraints {
  width: { ideal: number };
  height: { ideal: number };
  frameRate: { ideal: number };
}

export interface AudioConstraints {
  sampleRate: { ideal: number };
  channelCount: { ideal: number };
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

export interface StreamSettings {
  video: VideoConstraints;
  audio: AudioConstraints;
}

export interface RecordingChunk {
  data: Blob;
  timestamp: number;
  type: string;
}

export interface VideoMetadata {
  title?: string;
  description?: string;
  author?: string;
  created: Date;
  modified: Date;
  tags: string[];
  duration: number;
  format: VideoFormat;
  resolution: string;
  frameRate: number;
  bitrate: number;
}