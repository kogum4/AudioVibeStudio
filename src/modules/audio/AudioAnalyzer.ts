import { AudioContextManager } from './AudioContext';

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

export class AudioAnalyzer {
  private audioManager: AudioContextManager;
  private beatHistory: number[] = [];
  private beatThreshold = 1.15;
  private beatMin = 0.15;
  private lastBeatTime = 0;
  private beatCooldown = 0.1; // 100ms cooldown between beats

  constructor() {
    this.audioManager = AudioContextManager.getInstance();
  }

  getFrequencyBands(): FrequencyBands {
    const frequencyData = this.audioManager.getFrequencyData();
    const bands: FrequencyBands = {
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      treble: 0
    };

    if (frequencyData.length === 0) return bands;

    // Define frequency ranges for each band
    const bassEnd = Math.floor(frequencyData.length * 0.1);
    const lowMidEnd = Math.floor(frequencyData.length * 0.2);
    const midEnd = Math.floor(frequencyData.length * 0.4);
    const highMidEnd = Math.floor(frequencyData.length * 0.7);

    // Calculate average amplitude for each band
    bands.bass = this.calculateAverage(frequencyData, 0, bassEnd);
    bands.lowMid = this.calculateAverage(frequencyData, bassEnd, lowMidEnd);
    bands.mid = this.calculateAverage(frequencyData, lowMidEnd, midEnd);
    bands.highMid = this.calculateAverage(frequencyData, midEnd, highMidEnd);
    bands.treble = this.calculateAverage(frequencyData, highMidEnd, frequencyData.length);

    // Normalize values to 0-1 range
    Object.keys(bands).forEach(key => {
      bands[key as keyof FrequencyBands] = bands[key as keyof FrequencyBands] / 255;
    });

    return bands;
  }

  detectBeat(): BeatDetectionResult {
    const currentTime = performance.now() / 1000;
    const frequencyData = this.audioManager.getFrequencyData();
    
    if (frequencyData.length === 0) {
      return { isBeat: false, intensity: 0 };
    }

    // Focus on bass frequencies for beat detection
    const bassEnd = Math.floor(frequencyData.length * 0.1);
    const bassAverage = this.calculateAverage(frequencyData, 0, bassEnd);

    // Update beat history
    this.beatHistory.push(bassAverage);
    if (this.beatHistory.length > 43) { // ~1 second at 60fps
      this.beatHistory.shift();
    }

    // Calculate dynamic threshold
    const averageVolume = this.beatHistory.reduce((sum, val) => sum + val, 0) / this.beatHistory.length;
    const variance = this.beatHistory.reduce((sum, val) => sum + Math.pow(val - averageVolume, 2), 0) / this.beatHistory.length;
    const dynamicThreshold = averageVolume + Math.sqrt(variance) * this.beatThreshold;

    // Check for beat
    const isBeat = bassAverage > dynamicThreshold && 
                   bassAverage > this.beatMin * 255 &&
                   currentTime - this.lastBeatTime > this.beatCooldown;

    if (isBeat) {
      this.lastBeatTime = currentTime;
    }

    const intensity = Math.min(bassAverage / 255, 1);

    return { isBeat, intensity };
  }

  getWaveformData(): Float32Array {
    const timeDomainData = this.audioManager.getTimeDomainData();
    const normalized = new Float32Array(timeDomainData.length);

    for (let i = 0; i < timeDomainData.length; i++) {
      normalized[i] = ((timeDomainData[i] || 128) - 128) / 128;
    }

    return normalized;
  }

  getAverageVolume(): number {
    const frequencyData = this.audioManager.getFrequencyData();
    if (frequencyData.length === 0) return 0;

    const sum = frequencyData.reduce((acc, val) => acc + val, 0);
    return sum / frequencyData.length / 255;
  }

  private calculateAverage(data: Uint8Array, start: number, end: number): number {
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += (data[i] || 0);
    }
    return sum / (end - start);
  }
}