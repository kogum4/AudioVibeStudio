/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from '../useAudioPlayer';

// Mock the AudioContextManager
const mockAudioManager = {
  loadAudioFile: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  seek: jest.fn(),
  setVolume: jest.fn(),
  getCurrentTime: jest.fn(() => 0),
  getDuration: jest.fn(() => 180),
  isPlaying: jest.fn(() => false),
  getAnalyzer: jest.fn()
};

jest.mock('../../modules/audio/AudioContext', () => ({
  AudioContextManager: {
    getInstance: () => mockAudioManager
  }
}));

// Mock File constructor
class MockFile {
  name: string;
  size: number;
  type: string;

  constructor(name: string, size: number = 1000000, type: string = 'audio/mpeg') {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

global.File = MockFile as any;

describe('useAudioPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [state] = result.current;

    expect(state).toEqual({
      isLoaded: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      error: null
    });
  });

  it('should provide audio controls', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, controls] = result.current;

    expect(controls).toHaveProperty('play');
    expect(controls).toHaveProperty('pause');
    expect(controls).toHaveProperty('stop');
    expect(controls).toHaveProperty('seek');
    expect(controls).toHaveProperty('setVolume');
    expect(controls).toHaveProperty('loadFile');

    expect(typeof controls.play).toBe('function');
    expect(typeof controls.pause).toBe('function');
    expect(typeof controls.stop).toBe('function');
    expect(typeof controls.seek).toBe('function');
    expect(typeof controls.setVolume).toBe('function');
    expect(typeof controls.loadFile).toBe('function');
  });

  it('should load audio file successfully', async () => {
    mockAudioManager.loadAudioFile.mockResolvedValue(undefined);
    mockAudioManager.getDuration.mockReturnValue(180);

    const { result } = renderHook(() => useAudioPlayer());
    const [, controls] = result.current;

    const mockFile = new MockFile('test.mp3') as any;

    await act(async () => {
      await controls.loadFile(mockFile);
    });

    const [state] = result.current;
    expect(state.isLoaded).toBe(true);
    expect(state.duration).toBe(180);
    expect(state.error).toBeNull();
    expect(mockAudioManager.loadAudioFile).toHaveBeenCalledWith(mockFile);
  });

  it('should handle file loading errors', async () => {
    const errorMessage = 'Failed to load audio file';
    mockAudioManager.loadAudioFile.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAudioPlayer());
    const [, controls] = result.current;

    const mockFile = new MockFile('invalid.mp3') as any;

    await act(async () => {
      await controls.loadFile(mockFile);
    });

    const [state] = result.current;
    expect(state.isLoaded).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  it('should play audio when loaded', () => {
    const { result } = renderHook(() => useAudioPlayer());
    
    // First load a file
    act(() => {
      result.current[0] = { ...result.current[0], isLoaded: true };
    });

    const [, controls] = result.current;

    act(() => {
      controls.play();
    });

    expect(mockAudioManager.play).toHaveBeenCalled();
  });

  it('should not play audio when not loaded', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, controls] = result.current;

    act(() => {
      controls.play();
    });

    expect(mockAudioManager.play).not.toHaveBeenCalled();
  });

  it('should pause audio', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, controls] = result.current;

    act(() => {
      controls.pause();
    });

    expect(mockAudioManager.pause).toHaveBeenCalled();
  });

  it('should stop audio', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, controls] = result.current;

    act(() => {
      controls.stop();
    });

    expect(mockAudioManager.stop).toHaveBeenCalled();
  });

  it('should seek to position when loaded', () => {
    const { result } = renderHook(() => useAudioPlayer());
    
    // First load a file
    act(() => {
      result.current[0] = { ...result.current[0], isLoaded: true };
    });

    const [, controls] = result.current;

    act(() => {
      controls.seek(60);
    });

    expect(mockAudioManager.seek).toHaveBeenCalledWith(60);
  });

  it('should not seek when not loaded', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, controls] = result.current;

    act(() => {
      controls.seek(60);
    });

    expect(mockAudioManager.seek).not.toHaveBeenCalled();
  });

  it('should set volume within valid range', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, controls] = result.current;

    act(() => {
      controls.setVolume(0.5);
    });

    expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0.5);

    // Test clamping
    act(() => {
      controls.setVolume(1.5); // Should be clamped to 1
    });

    expect(mockAudioManager.setVolume).toHaveBeenCalledWith(1);

    act(() => {
      controls.setVolume(-0.5); // Should be clamped to 0
    });

    expect(mockAudioManager.setVolume).toHaveBeenCalledWith(0);
  });

  it('should handle play errors gracefully', () => {
    mockAudioManager.play.mockImplementation(() => {
      throw new Error('Playback failed');
    });

    const { result } = renderHook(() => useAudioPlayer());
    
    // First load a file
    act(() => {
      result.current[0] = { ...result.current[0], isLoaded: true };
    });

    const [, controls] = result.current;

    act(() => {
      controls.play();
    });

    const [state] = result.current;
    expect(state.error).toBe('Failed to play audio');
  });
});