import { AudioContextManager } from '../audio/AudioContext';
import { VisualEngine } from '../visual/VisualEngine';

export interface ExportSettings {
  format: 'webm' | 'mp4';
  quality: 'low' | 'medium' | 'high';
  fps: number;
  bitrate?: number;
}

export interface ExportProgress {
  percentage: number;
  timeRemaining: number;
  currentFrame: number;
  totalFrames: number;
}

export class VideoExporter {
  private canvas: HTMLCanvasElement;
  private visualEngine: VisualEngine;
  private audioManager: AudioContextManager;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private startTime = 0;
  private audioDuration = 0;
  private progressCallback?: (progress: ExportProgress) => void;

  constructor(canvas: HTMLCanvasElement, visualEngine: VisualEngine) {
    this.canvas = canvas;
    this.visualEngine = visualEngine;
    this.audioManager = AudioContextManager.getInstance();
    this.audioDuration = this.audioManager.getDuration();
  }

  setProgressCallback(callback: (progress: ExportProgress) => void): void {
    this.progressCallback = callback;
  }

  async startExport(settings: ExportSettings): Promise<Blob> {
    if (this.isRecording) {
      throw new Error('Export already in progress');
    }

    return new Promise((resolve, reject) => {
      try {
        this.setupRecording(settings, resolve, reject);
        this.beginRecording();
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupRecording(
    settings: ExportSettings,
    resolve: (blob: Blob) => void,
    reject: (error: Error) => void
  ): void {
    // Get canvas stream
    const canvasStream = this.canvas.captureStream(settings.fps);
    
    // Get audio stream
    const audioStream = this.audioManager.getAudioStream();
    
    // Combine streams
    const combinedStream = new MediaStream();
    
    if (canvasStream) {
      canvasStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
    }
    
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
    }

    // Configure MediaRecorder
    const mimeType = this.getMimeType(settings.format);
    const options: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: settings.bitrate || this.getDefaultBitrate(settings.quality)
    };

    this.mediaRecorder = new MediaRecorder(combinedStream, options);
    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { 
        type: mimeType 
      });
      this.isRecording = false;
      resolve(blob);
    };

    this.mediaRecorder.onerror = () => {
      this.isRecording = false;
      reject(new Error('MediaRecorder error'));
    };
  }

  private beginRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('MediaRecorder not initialized');
    }

    this.isRecording = true;
    this.startTime = performance.now();
    
    // Start audio playback
    this.audioManager.stop();
    this.audioManager.play();
    
    // Start visual engine with audio playing state
    this.visualEngine.setAudioPlaying(true);
    this.visualEngine.start();
    
    // Start recording
    this.mediaRecorder.start(100); // Collect data every 100ms
    
    // Monitor progress
    this.monitorProgress();
    
    // Auto-stop when audio ends
    setTimeout(() => {
      this.stopExport();
    }, this.audioDuration * 1000);
  }

  private monitorProgress(): void {
    if (!this.isRecording) return;

    const currentTime = (performance.now() - this.startTime) / 1000;
    const percentage = Math.min((currentTime / this.audioDuration) * 100, 100);
    const timeRemaining = Math.max(this.audioDuration - currentTime, 0);
    
    // Estimate frames (this is approximate)
    const fps = 30; // Default estimation
    const currentFrame = Math.floor(currentTime * fps);
    const totalFrames = Math.floor(this.audioDuration * fps);

    if (this.progressCallback) {
      this.progressCallback({
        percentage,
        timeRemaining,
        currentFrame,
        totalFrames
      });
    }

    if (this.isRecording) {
      setTimeout(() => this.monitorProgress(), 100);
    }
  }

  stopExport(): void {
    if (!this.isRecording || !this.mediaRecorder) return;

    this.mediaRecorder.stop();
    this.audioManager.stop();
    this.visualEngine.setAudioPlaying(false);
    this.visualEngine.stop();
    this.isRecording = false;
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'webm':
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          return 'video/webm;codecs=vp9,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          return 'video/webm;codecs=vp8,opus';
        } else {
          return 'video/webm';
        }
      case 'mp4':
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) {
          return 'video/mp4;codecs=h264,aac';
        } else {
          return 'video/mp4';
        }
      default:
        return 'video/webm';
    }
  }

  private getDefaultBitrate(quality: string): number {
    switch (quality) {
      case 'low':
        return 1000000; // 1 Mbps
      case 'medium':
        return 2500000; // 2.5 Mbps
      case 'high':
        return 5000000; // 5 Mbps
      default:
        return 2500000;
    }
  }

  isExporting(): boolean {
    return this.isRecording;
  }

  getSupportedFormats(): string[] {
    const formats: string[] = [];
    
    if (MediaRecorder.isTypeSupported('video/webm')) {
      formats.push('webm');
    }
    
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      formats.push('mp4');
    }
    
    return formats;
  }
}