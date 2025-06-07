export class AudioContextManager {
  private static instance: AudioContextManager;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private mediaStreamDestination: MediaStreamAudioDestinationNode | null = null;

  private constructor() {}

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();
    }
  }

  async loadAudioFile(file: File): Promise<AudioBuffer> {
    await this.initialize();
    
    const arrayBuffer = await file.arrayBuffer();
    this.buffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    
    return this.buffer;
  }

  play(): void {
    if (!this.buffer || !this.audioContext || this.isPlaying) return;

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.analyser!);
    this.analyser!.connect(this.audioContext.destination);
    this.analyser!.connect(this.mediaStreamDestination!);

    const offset = this.pauseTime;
    this.source.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.isPlaying = true;

    this.source.onended = () => {
      this.isPlaying = false;
      this.pauseTime = 0;
    };
  }

  pause(): void {
    if (!this.source || !this.audioContext || !this.isPlaying) return;

    this.source.stop();
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.isPlaying = false;
  }

  stop(): void {
    if (!this.source) return;

    this.source.stop();
    this.isPlaying = false;
    this.pauseTime = 0;
  }

  getCurrentTime(): number {
    if (!this.audioContext) return 0;
    
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pauseTime;
  }

  getDuration(): number {
    return this.buffer?.duration || 0;
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    return dataArray;
  }

  getTimeDomainData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    
    return dataArray;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  seek(time: number): void {
    if (!this.buffer || !this.audioContext) return;
    
    if (this.isPlaying) {
      this.pause();
      this.pauseTime = Math.max(0, Math.min(time, this.buffer.duration));
      this.play();
    } else {
      this.pauseTime = Math.max(0, Math.min(time, this.buffer.duration));
    }
  }

  setVolume(_volume: number): void {
    // Note: Web Audio API doesn't have built-in volume control on AudioContext
    // This would typically be implemented with a GainNode
    // For now, we'll store it but not implement until we add GainNode support
  }

  getAnalyzer(): AnalyserNode | null {
    return this.analyser;
  }

  getAudioStream(): MediaStream | null {
    return this.mediaStreamDestination?.stream || null;
  }

  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.source = null;
    this.buffer = null;
  }
}