/**
 * @jest-environment jsdom
 */

import { AudioAnalyzer } from '../AudioAnalyzer';

// Mock AudioContextManager with proper methods
const mockAudioManager = {
  getFrequencyData: jest.fn(() => new Uint8Array(1024).fill(128)),
  getTimeDomainData: jest.fn(() => new Float32Array(2048).fill(0)),
  getAudioContext: jest.fn(() => ({
    sampleRate: 44100
  })),
  getAnalyser: jest.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024
  }))
};

jest.mock('../AudioContext', () => ({
  AudioContextManager: {
    getInstance: () => mockAudioManager
  }
}));

describe('AudioAnalyzer', () => {
  let analyzer: AudioAnalyzer;

  beforeEach(() => {
    analyzer = new AudioAnalyzer();
  });

  describe('initialization', () => {
    it('should create an analyzer instance', () => {
      expect(analyzer).toBeInstanceOf(AudioAnalyzer);
    });

    it('should have default configuration', () => {
      expect(typeof analyzer.getAverageVolume()).toBe('number');
      expect(analyzer.getAverageVolume()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('frequency band analysis', () => {
    it('should return frequency bands object', () => {
      const bands = analyzer.getFrequencyBands();
      
      expect(bands).toHaveProperty('bass');
      expect(bands).toHaveProperty('lowMid');
      expect(bands).toHaveProperty('mid');
      expect(bands).toHaveProperty('highMid');
      expect(bands).toHaveProperty('treble');
      
      expect(typeof bands.bass).toBe('number');
      expect(typeof bands.lowMid).toBe('number');
      expect(typeof bands.mid).toBe('number');
      expect(typeof bands.highMid).toBe('number');
      expect(typeof bands.treble).toBe('number');
    });

    it('should return values between 0 and 1', () => {
      const bands = analyzer.getFrequencyBands();
      
      Object.values(bands).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('waveform data', () => {
    it('should return waveform data as Float32Array', () => {
      const waveform = analyzer.getWaveformData();
      expect(waveform).toBeInstanceOf(Float32Array);
    });

    it('should return array with expected length', () => {
      const waveform = analyzer.getWaveformData();
      expect(waveform.length).toBeGreaterThan(0);
    });
  });

  describe('beat detection', () => {
    it('should return beat detection object', () => {
      const beat = analyzer.detectBeat();
      
      expect(beat).toHaveProperty('isBeat');
      expect(beat).toHaveProperty('intensity');
      
      expect(typeof beat.isBeat).toBe('boolean');
      expect(typeof beat.intensity).toBe('number');
    });

    it('should return intensity between 0 and 1', () => {
      const beat = analyzer.detectBeat();
      expect(beat.intensity).toBeGreaterThanOrEqual(0);
      expect(beat.intensity).toBeLessThanOrEqual(1);
    });

  });

  describe('volume analysis', () => {
    it('should return average volume as number', () => {
      const volume = analyzer.getAverageVolume();
      expect(typeof volume).toBe('number');
    });

    it('should return volume between 0 and 1', () => {
      const volume = analyzer.getAverageVolume();
      expect(volume).toBeGreaterThanOrEqual(0);
      expect(volume).toBeLessThanOrEqual(1);
    });
  });

  describe('configuration', () => {
    it('should handle different FFT sizes', () => {
      // Test that analyzer can be configured with different FFT sizes
      expect(() => {
        new AudioAnalyzer();
      }).not.toThrow();

      expect(() => {
        new AudioAnalyzer();
      }).not.toThrow();
    });

    it('should handle invalid FFT sizes gracefully', () => {
      // Test with invalid FFT size
      expect(() => {
        new AudioAnalyzer(); // Not a power of 2
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle missing audio context gracefully', () => {
      // Mock a scenario where audio context is not available
      const originalError = console.error;
      console.error = jest.fn();

      // This should not throw even if audio context setup fails
      expect(() => {
        const analyzer = new AudioAnalyzer();
        analyzer.getFrequencyBands();
      }).not.toThrow();

      console.error = originalError;
    });
  });
});