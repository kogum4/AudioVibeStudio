import {
  BrowserCompatibilityTester,
  quickCompatibilityCheck,
  getBrowserRecommendation,
  FeatureDetection
} from '../browserCompatibility';

// Mock browser APIs for testing
const mockAudioContext = jest.fn();
const mockMediaRecorder = jest.fn();
const mockFileReader = jest.fn();

// Mock global objects
Object.defineProperty(window, 'AudioContext', {
  value: mockAudioContext,
  configurable: true
});

Object.defineProperty(window, 'MediaRecorder', {
  value: mockMediaRecorder,
  configurable: true
});

Object.defineProperty(window, 'FileReader', {
  value: mockFileReader,
  configurable: true
});

Object.defineProperty(window, 'Promise', {
  value: Promise,
  configurable: true
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: jest.fn(),
  configurable: true
});

// Mock navigator
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  configurable: true
});

// Mock performance
Object.defineProperty(performance, 'now', {
  value: jest.fn(() => Date.now()),
  configurable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true
});

// Mock fetch
Object.defineProperty(window, 'fetch', {
  value: jest.fn(),
  configurable: true
});

// Mock Object.assign
Object.defineProperty(Object, 'assign', {
  value: Object.assign,
  configurable: true
});

describe('BrowserCompatibilityTester', () => {
  let tester: BrowserCompatibilityTester;

  beforeEach(() => {
    tester = new BrowserCompatibilityTester();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create tester instance', () => {
      expect(tester).toBeInstanceOf(BrowserCompatibilityTester);
    });

    it('should have available tests', () => {
      const tests = tester.getAvailableTests();
      expect(tests.length).toBeGreaterThan(0);
      expect(tests).toContain('audioContext');
      expect(tests).toContain('canvas2d');
      expect(tests).toContain('fileReader');
    });
  });

  describe('feature testing', () => {
    it('should test individual features', () => {
      const audioFeature = tester.testFeature('audioContext');
      expect(audioFeature).toBeTruthy();
      expect(audioFeature!.name).toBe('Web Audio API');
      expect(typeof audioFeature!.isSupported).toBe('boolean');
      expect(typeof audioFeature!.fallbackAvailable).toBe('boolean');
      expect(typeof audioFeature!.description).toBe('string');
    });

    it('should return null for unknown features', () => {
      const unknownFeature = tester.testFeature('unknownFeature');
      expect(unknownFeature).toBeNull();
    });

    it('should test canvas 2D support', () => {
      const canvasFeature = tester.testFeature('canvas2d');
      expect(canvasFeature).toBeTruthy();
      expect(canvasFeature!.name).toBe('Canvas 2D');
      expect(canvasFeature!.isSupported).toBe(true); // jsdom supports canvas
    });

    it('should test WebGL support', () => {
      const webglFeature = tester.testFeature('webgl');
      expect(webglFeature).toBeTruthy();
      expect(webglFeature!.name).toBe('WebGL');
      expect(webglFeature!.fallbackAvailable).toBe(true);
    });

    it('should test ES6 features', () => {
      const promiseFeature = tester.testFeature('es6Promise');
      expect(promiseFeature).toBeTruthy();
      expect(promiseFeature!.isSupported).toBe(true);

      const classFeature = tester.testFeature('es6Classes');
      expect(classFeature).toBeTruthy();
      expect(classFeature!.isSupported).toBe(true);
    });
  });

  describe('full compatibility testing', () => {
    it('should perform full compatibility test', () => {
      const report = tester.testBrowserCompatibility();
      
      expect(report).toHaveProperty('browser');
      expect(report).toHaveProperty('version');
      expect(report).toHaveProperty('isCompatible');
      expect(report).toHaveProperty('supportedFeatures');
      expect(report).toHaveProperty('unsupportedFeatures');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('score');
      
      expect(typeof report.isCompatible).toBe('boolean');
      expect(typeof report.score).toBe('number');
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(report.supportedFeatures)).toBe(true);
      expect(Array.isArray(report.unsupportedFeatures)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should detect Chrome browser', () => {
      const report = tester.testBrowserCompatibility();
      expect(report.browser).toBe('Chrome');
      expect(report.version).toBe('120');
    });

    it('should calculate compatibility score', () => {
      const report = tester.testBrowserCompatibility();
      expect(report.score).toBeGreaterThan(0);
      
      // With most features supported in test environment, score should be high
      expect(report.score).toBeGreaterThan(70);
    });

    it('should provide recommendations', () => {
      const report = tester.testBrowserCompatibility();
      expect(report.recommendations.length).toBeGreaterThan(0);
      
      if (report.isCompatible) {
        expect(report.recommendations[0]).toContain('fully supports');
      }
    });
  });

  describe('browser detection', () => {
    it('should detect Firefox', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        configurable: true
      });
      
      const report = tester.testBrowserCompatibility();
      expect(report.browser).toBe('Firefox');
      expect(report.version).toBe('120');
    });

    it('should detect Safari', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
        configurable: true
      });
      
      const report = tester.testBrowserCompatibility();
      expect(report.browser).toBe('Safari');
      expect(report.version).toBe('16');
    });

    it('should detect Edge', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        configurable: true
      });
      
      const report = tester.testBrowserCompatibility();
      expect(report.browser).toBe('Edge');
      expect(report.version).toBe('120');
    });

    it('should handle unknown browsers', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Some Unknown Browser/1.0',
        configurable: true
      });
      
      const report = tester.testBrowserCompatibility();
      expect(report.browser).toBe('Unknown');
      expect(report.version).toBe('Unknown');
    });
  });
});

describe('Quick compatibility check', () => {
  it('should return true for compatible environment', () => {
    const isCompatible = quickCompatibilityCheck();
    expect(typeof isCompatible).toBe('boolean');
    // In test environment with mocks, should be true
    expect(isCompatible).toBe(true);
  });

  it('should return false when critical features missing', () => {
    // Remove a critical feature
    const originalAudioContext = window.AudioContext;
    delete (window as any).AudioContext;
    delete (window as any).webkitAudioContext;
    
    const isCompatible = quickCompatibilityCheck();
    expect(isCompatible).toBe(false);
    
    // Restore
    (window as any).AudioContext = originalAudioContext;
  });
});

describe('Browser recommendation', () => {
  it('should recommend Chrome', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true
    });
    
    const recommendation = getBrowserRecommendation();
    expect(recommendation).toContain('Chrome');
    expect(recommendation).toContain('Recommended');
  });

  it('should provide Firefox recommendation', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      configurable: true
    });
    
    const recommendation = getBrowserRecommendation();
    expect(recommendation).toContain('Firefox');
    expect(recommendation).toContain('Good compatibility');
  });

  it('should warn about Safari limitations', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      configurable: true
    });
    
    const recommendation = getBrowserRecommendation();
    expect(recommendation).toContain('Safari');
    expect(recommendation).toContain('Limited compatibility');
  });
});

describe('Feature detection utilities', () => {
  it('should detect Web Audio API', () => {
    expect(FeatureDetection.hasWebAudio()).toBe(true);
  });

  it('should detect MediaRecorder API', () => {
    expect(FeatureDetection.hasMediaRecorder()).toBe(true);
  });

  it('should detect File API', () => {
    expect(FeatureDetection.hasFileAPI()).toBe(true);
  });

  it('should test localStorage safely', () => {
    expect(FeatureDetection.hasLocalStorage()).toBe(true);
    
    // Test with localStorage throwing error
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage disabled');
    });
    
    expect(FeatureDetection.hasLocalStorage()).toBe(false);
    
    // Restore
    localStorageMock.setItem.mockRestore();
  });

  it('should detect drag and drop support', () => {
    expect(FeatureDetection.hasDragDrop()).toBe(true);
  });

  it('should detect WebGL support', () => {
    // WebGL detection might return false in jsdom environment
    expect(typeof FeatureDetection.hasWebGL()).toBe('boolean');
  });
});

describe('Integration scenarios', () => {
  it('should provide comprehensive report for modern browser', () => {
    // Simulate a modern Chrome browser
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true
    });
    
    const tester = new BrowserCompatibilityTester();
    const report = tester.testBrowserCompatibility();
    
    expect(report.browser).toBe('Chrome');
    expect(report.isCompatible).toBe(true);
    expect(report.score).toBeGreaterThan(80);
    expect(report.supportedFeatures.length).toBeGreaterThan(report.unsupportedFeatures.length);
  });

  it('should handle legacy browser scenario', () => {
    // Simulate missing features
    const originalPromise = window.Promise;
    const originalFetch = window.fetch;
    
    delete (window as any).Promise;
    delete (window as any).fetch;
    
    const tester = new BrowserCompatibilityTester();
    const report = tester.testBrowserCompatibility();
    
    expect(report.unsupportedFeatures.length).toBeGreaterThan(0);
    expect(report.score).toBeLessThan(100);
    
    // Restore
    (window as any).Promise = originalPromise;
    (window as any).fetch = originalFetch;
  });

  it('should provide actionable recommendations', () => {
    const tester = new BrowserCompatibilityTester();
    const report = tester.testBrowserCompatibility();
    
    expect(report.recommendations.length).toBeGreaterThan(0);
    
    const hasActionableAdvice = report.recommendations.some(rec => 
      rec.includes('Update') || 
      rec.includes('Try') || 
      rec.includes('Enable') ||
      rec.includes('✓')
    );
    
    expect(hasActionableAdvice).toBe(true);
  });
});