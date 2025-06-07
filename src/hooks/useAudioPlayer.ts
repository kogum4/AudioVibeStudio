import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioContextManager } from '../modules/audio/AudioContext';

export interface AudioPlayerState {
  isLoaded: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
}

export interface AudioPlayerControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  loadFile: (file: File) => Promise<void>;
}

export function useAudioPlayer(): [AudioPlayerState, AudioPlayerControls] {
  const [state, setState] = useState<AudioPlayerState>({
    isLoaded: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    error: null
  });

  const audioManagerRef = useRef<AudioContextManager | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = AudioContextManager.getInstance();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update current time
  const updateTime = useCallback(() => {
    const manager = audioManagerRef.current;
    if (manager && state.isPlaying) {
      setState(prev => ({
        ...prev,
        currentTime: manager.getCurrentTime()
      }));
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [state.isPlaying]);

  useEffect(() => {
    if (state.isPlaying) {
      updateTime();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [state.isPlaying, updateTime]);

  const loadFile = useCallback(async (file: File): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const manager = audioManagerRef.current;
      if (!manager) {
        throw new Error('Audio manager not initialized');
      }

      await manager.loadAudioFile(file);
      const duration = manager.getDuration();

      setState(prev => ({
        ...prev,
        isLoaded: true,
        duration,
        currentTime: 0,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoaded: false,
        error: error instanceof Error ? error.message : 'Failed to load audio file'
      }));
    }
  }, []);

  const play = useCallback(() => {
    const manager = audioManagerRef.current;
    if (manager && state.isLoaded) {
      try {
        manager.play();
        setState(prev => ({ ...prev, isPlaying: true, error: null }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to play audio'
        }));
      }
    }
  }, [state.isLoaded]);

  const pause = useCallback(() => {
    const manager = audioManagerRef.current;
    if (manager) {
      manager.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const stop = useCallback(() => {
    const manager = audioManagerRef.current;
    if (manager) {
      manager.stop();
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    const manager = audioManagerRef.current;
    if (manager && state.isLoaded) {
      manager.seek(time);
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, [state.isLoaded]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const manager = audioManagerRef.current;
    if (manager) {
      manager.setVolume(clampedVolume);
    }
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const controls: AudioPlayerControls = {
    play,
    pause,
    stop,
    seek,
    setVolume,
    loadFile
  };

  return [state, controls];
}

export function useAudioAnalysis() {
  const [analysisData, setAnalysisData] = useState({
    frequencyBands: { bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0 },
    waveformData: new Float32Array(0),
    beatInfo: { isBeat: false, intensity: 0 },
    volume: 0
  });

  const audioManagerRef = useRef<AudioContextManager | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    audioManagerRef.current = AudioContextManager.getInstance();
    
    const updateAnalysis = () => {
      const manager = audioManagerRef.current;
      if (manager && manager.getIsPlaying()) {
        const frequencyData = manager.getFrequencyData();
        const timeDomainData = manager.getTimeDomainData();
        
        // Simple frequency band analysis
        const bassEnd = Math.floor(frequencyData.length * 0.1);
        const lowMidEnd = Math.floor(frequencyData.length * 0.2);
        const midEnd = Math.floor(frequencyData.length * 0.4);
        const highMidEnd = Math.floor(frequencyData.length * 0.7);
        
        const calculateAverage = (data: Uint8Array, start: number, end: number) => {
          let sum = 0;
          for (let i = start; i < end; i++) {
            sum += (data[i] || 0);
          }
          return sum / (end - start) / 255;
        };

        const frequencyBands = {
          bass: calculateAverage(frequencyData, 0, bassEnd),
          lowMid: calculateAverage(frequencyData, bassEnd, lowMidEnd),
          mid: calculateAverage(frequencyData, lowMidEnd, midEnd),
          highMid: calculateAverage(frequencyData, midEnd, highMidEnd),
          treble: calculateAverage(frequencyData, highMidEnd, frequencyData.length)
        };

        const waveformData = new Float32Array(timeDomainData.length);
        for (let i = 0; i < timeDomainData.length; i++) {
          waveformData[i] = ((timeDomainData[i] || 128) - 128) / 128;
        }

        const volume = frequencyData.reduce((acc, val) => acc + val, 0) / frequencyData.length / 255;
        const beatInfo = { isBeat: frequencyBands.bass > 0.3, intensity: frequencyBands.bass };

        setAnalysisData({
          frequencyBands,
          waveformData,
          beatInfo,
          volume
        });
      }
      animationFrameRef.current = requestAnimationFrame(updateAnalysis);
    };

    updateAnalysis();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return analysisData;
}