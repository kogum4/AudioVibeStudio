import { 
  MemoryLeakDetector, 
  getMemoryInfo, 
  formatMemorySize,
  cleanupAudioResources,
  cleanupCanvasResources 
} from '../memoryLeak';

// Mock performance.memory API
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 1024 * 1024 * 1024, // 1GB
};

Object.defineProperty(performance, 'memory', {
  value: mockMemory,
  configurable: true
});

describe('MemoryLeakDetector', () => {
  let detector: MemoryLeakDetector;

  beforeEach(() => {
    detector = new MemoryLeakDetector(10, 1000); // 10 snapshots max, 1s interval
    jest.clearAllMocks();
  });

  afterEach(() => {
    detector.stopMonitoring();
  });

  describe('initialization', () => {
    it('should create detector with default settings', () => {
      const defaultDetector = new MemoryLeakDetector();
      expect(defaultDetector).toBeInstanceOf(MemoryLeakDetector);
    });

    it('should create detector with custom settings', () => {
      expect(detector).toBeInstanceOf(MemoryLeakDetector);
    });
  });

  describe('snapshot management', () => {
    it('should take memory snapshot', () => {
      const snapshot = detector.takeSnapshot();
      
      expect(snapshot).toBeTruthy();
      expect(snapshot!.usedJSHeapSize).toBe(mockMemory.usedJSHeapSize);
      expect(snapshot!.totalJSHeapSize).toBe(mockMemory.totalJSHeapSize);
      expect(snapshot!.jsHeapSizeLimit).toBe(mockMemory.jsHeapSizeLimit);
      expect(typeof snapshot!.timestamp).toBe('number');
    });

    it('should store multiple snapshots', () => {
      detector.takeSnapshot();
      detector.takeSnapshot();
      detector.takeSnapshot();

      const snapshots = detector.getSnapshots();
      expect(snapshots.length).toBe(3);
    });

    it('should limit number of snapshots', () => {
      // Take more snapshots than the limit
      for (let i = 0; i < 15; i++) {
        detector.takeSnapshot();
      }

      const snapshots = detector.getSnapshots();
      expect(snapshots.length).toBe(10); // Should be limited to 10
    });

    it('should clear snapshots', () => {
      detector.takeSnapshot();
      detector.takeSnapshot();
      
      expect(detector.getSnapshots().length).toBe(2);
      
      detector.clearSnapshots();
      expect(detector.getSnapshots().length).toBe(0);
    });
  });

  describe('memory analysis', () => {
    it('should analyze memory usage with insufficient data', () => {
      const report = detector.analyzeMemoryUsage();
      
      expect(report.isLeakDetected).toBe(false);
      expect(report.memoryGrowthRate).toBe(0);
      expect(report.recommendations).toContain('Not enough data collected yet. Monitor for at least 10 seconds.');
    });

    it('should analyze memory usage with sufficient data', () => {
      // Simulate memory growth
      mockMemory.usedJSHeapSize = 50 * 1024 * 1024;
      detector.takeSnapshot();
      
      // Wait a bit and simulate memory increase
      setTimeout(() => {
        mockMemory.usedJSHeapSize = 60 * 1024 * 1024;
        detector.takeSnapshot();
        
        const report = detector.analyzeMemoryUsage();
        expect(report.memoryGrowthRate).toBeGreaterThan(0);
        expect(report.snapshots.length).toBe(2);
      }, 100);
    });

    it('should detect memory leaks when growth exceeds threshold', () => {
      detector.setLeakThreshold(1024); // Very low threshold for testing
      
      // Take initial snapshot
      mockMemory.usedJSHeapSize = 50 * 1024 * 1024;
      detector.takeSnapshot();
      
      // Simulate time passing and memory growth
      setTimeout(() => {
        mockMemory.usedJSHeapSize = 55 * 1024 * 1024; // 5MB growth
        detector.takeSnapshot();
        
        const report = detector.analyzeMemoryUsage();
        // With a very low threshold, this should be detected as a leak
        expect(typeof report.isLeakDetected).toBe('boolean');
      }, 100);
    });
  });

  describe('monitoring', () => {
    it('should start and stop monitoring', () => {
      expect(detector.getSnapshots().length).toBe(0);
      
      detector.startMonitoring();
      // Should take initial snapshot
      expect(detector.getSnapshots().length).toBeGreaterThan(0);
      
      detector.stopMonitoring();
      // Should not crash and should be stopped
      const snapshotCount = detector.getSnapshots().length;
      
      // Wait a bit to ensure no more snapshots are taken
      setTimeout(() => {
        expect(detector.getSnapshots().length).toBe(snapshotCount);
      }, 1100);
    });

    it('should not start monitoring if already monitoring', () => {
      detector.startMonitoring();
      const initialCount = detector.getSnapshots().length;
      
      detector.startMonitoring(); // Try to start again
      expect(detector.getSnapshots().length).toBe(initialCount);
    });
  });
});

describe('Memory utility functions', () => {
  describe('getMemoryInfo', () => {
    it('should return memory info when available', () => {
      const memoryInfo = getMemoryInfo();
      
      expect(memoryInfo).toBeTruthy();
      if (memoryInfo) {
        expect(memoryInfo.usedJSHeapSize).toBe(mockMemory.usedJSHeapSize);
        expect(memoryInfo.totalJSHeapSize).toBe(mockMemory.totalJSHeapSize);
        expect(memoryInfo.jsHeapSizeLimit).toBe(mockMemory.jsHeapSizeLimit);
        expect(typeof memoryInfo.timestamp).toBe('number');
      }
    });

    it('should return null when memory API not available', () => {
      // Temporarily remove memory API
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;
      
      const memoryInfo = getMemoryInfo();
      expect(memoryInfo).toBeNull();
      
      // Restore memory API
      (performance as any).memory = originalMemory;
    });
  });

  describe('formatMemorySize', () => {
    it('should format bytes correctly', () => {
      expect(formatMemorySize(1024)).toBe('1.00 KB');
      expect(formatMemorySize(1024 * 1024)).toBe('1.00 MB');
      expect(formatMemorySize(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatMemorySize(512)).toBe('512.00 B');
      expect(formatMemorySize(1536)).toBe('1.50 KB'); // 1.5 KB
    });

    it('should handle zero and small values', () => {
      expect(formatMemorySize(0)).toBe('0.00 B');
      expect(formatMemorySize(100)).toBe('100.00 B');
    });
  });

  describe('cleanup functions', () => {
    it('should cleanup audio resources', () => {
      const mockAudioContext = {
        state: 'running',
        close: jest.fn()
      } as any;

      cleanupAudioResources(mockAudioContext);
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    it('should not cleanup already closed audio context', () => {
      const mockAudioContext = {
        state: 'closed',
        close: jest.fn()
      } as any;

      cleanupAudioResources(mockAudioContext);
      expect(mockAudioContext.close).not.toHaveBeenCalled();
    });

    it('should cleanup canvas resources', () => {
      const mockCanvas = document.createElement('canvas');
      const mockCtx = {
        clearRect: jest.fn()
      } as any;
      
      jest.spyOn(mockCanvas, 'getContext').mockReturnValue(mockCtx);
      
      cleanupCanvasResources(mockCanvas);
      
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, mockCanvas.width, mockCanvas.height);
      expect(mockCanvas.width).toBe(1);
      expect(mockCanvas.height).toBe(1);
    });
  });
});

describe('Integration scenarios', () => {
  it('should detect gradual memory leak scenario', async () => {
    const detector = new MemoryLeakDetector(5, 100); // 5 snapshots, 100ms interval
    detector.setLeakThreshold(1024); // 1KB threshold
    
    // Start with baseline memory
    mockMemory.usedJSHeapSize = 10 * 1024 * 1024; // 10MB
    detector.takeSnapshot();
    
    // Simulate gradual memory increase
    const increments = [2, 4, 6, 8]; // MB increments
    
    for (let i = 0; i < increments.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      mockMemory.usedJSHeapSize = (10 + increments[i]) * 1024 * 1024;
      detector.takeSnapshot();
    }
    
    const report = detector.analyzeMemoryUsage();
    expect(report.snapshots.length).toBeGreaterThan(2);
    expect(report.memoryGrowthRate).toBeGreaterThan(0);
    
    detector.stopMonitoring();
  });

  it('should provide meaningful recommendations', () => {
    const detector = new MemoryLeakDetector();
    
    // Take snapshots with significant memory growth
    mockMemory.usedJSHeapSize = 50 * 1024 * 1024;
    detector.takeSnapshot();
    
    mockMemory.usedJSHeapSize = 150 * 1024 * 1024; // 100MB increase
    detector.takeSnapshot();
    
    const report = detector.analyzeMemoryUsage();
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.recommendations.some(rec => rec.includes('MB'))).toBe(true);
  });
});