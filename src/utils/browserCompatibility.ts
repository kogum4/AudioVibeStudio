export interface BrowserFeature {
  name: string;
  isSupported: boolean;
  fallbackAvailable: boolean;
  description: string;
}

export interface BrowserCompatibilityReport {
  browser: string;
  version: string;
  isCompatible: boolean;
  supportedFeatures: BrowserFeature[];
  unsupportedFeatures: BrowserFeature[];
  recommendations: string[];
  score: number; // 0-100 compatibility score
}

export class BrowserCompatibilityTester {
  private features: Map<string, () => BrowserFeature> = new Map();

  constructor() {
    this.initializeFeatureTests();
  }

  private initializeFeatureTests(): void {
    // Audio API features
    this.features.set('audioContext', () => ({
      name: 'Web Audio API',
      isSupported: !!(window.AudioContext || (window as any).webkitAudioContext),
      fallbackAvailable: false,
      description: 'Required for audio processing and analysis'
    }));

    this.features.set('mediaRecorder', () => ({
      name: 'MediaRecorder API',
      isSupported: !!window.MediaRecorder,
      fallbackAvailable: false,
      description: 'Required for video export functionality'
    }));

    // Canvas and graphics features
    this.features.set('canvas2d', () => {
      const canvas = document.createElement('canvas');
      return {
        name: 'Canvas 2D',
        isSupported: !!(canvas.getContext && canvas.getContext('2d')),
        fallbackAvailable: false,
        description: 'Required for visual effect rendering'
      };
    });

    this.features.set('webgl', () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return {
        name: 'WebGL',
        isSupported: !!gl,
        fallbackAvailable: true,
        description: 'Optional for advanced 3D effects (fallback to Canvas 2D)'
      };
    });

    // File API features
    this.features.set('fileReader', () => ({
      name: 'File API',
      isSupported: !!window.FileReader,
      fallbackAvailable: false,
      description: 'Required for audio file upload and processing'
    }));

    this.features.set('dragDrop', () => ({
      name: 'Drag and Drop API',
      isSupported: 'draggable' in document.createElement('div'),
      fallbackAvailable: true,
      description: 'Enhanced file upload experience (fallback to file input)'
    }));

    // Performance and timing features
    this.features.set('requestAnimationFrame', () => ({
      name: 'requestAnimationFrame',
      isSupported: !!window.requestAnimationFrame,
      fallbackAvailable: true,
      description: 'Smooth animation rendering (fallback to setTimeout)'
    }));

    this.features.set('performanceNow', () => ({
      name: 'Performance.now()',
      isSupported: !!(performance && performance.now),
      fallbackAvailable: true,
      description: 'High-precision timing (fallback to Date.now())'
    }));

    // Storage features
    this.features.set('localStorage', () => ({
      name: 'Local Storage',
      isSupported: !!window.localStorage,
      fallbackAvailable: true,
      description: 'Settings persistence (fallback to memory storage)'
    }));

    // ES6+ features
    this.features.set('es6Promise', () => ({
      name: 'ES6 Promises',
      isSupported: !!window.Promise,
      fallbackAvailable: false,
      description: 'Required for asynchronous operations'
    }));

    this.features.set('es6Classes', () => {
      try {
        eval('class Test {}');
        return {
          name: 'ES6 Classes',
          isSupported: true,
          fallbackAvailable: false,
          description: 'Required for modern JavaScript features'
        };
      } catch {
        return {
          name: 'ES6 Classes',
          isSupported: false,
          fallbackAvailable: false,
          description: 'Required for modern JavaScript features'
        };
      }
    });

    // Modern API features
    this.features.set('fetch', () => ({
      name: 'Fetch API',
      isSupported: !!window.fetch,
      fallbackAvailable: true,
      description: 'Modern network requests (fallback to XMLHttpRequest)'
    }));

    this.features.set('objectAssign', () => ({
      name: 'Object.assign',
      isSupported: !!Object.assign,
      fallbackAvailable: true,
      description: 'Object manipulation (fallback available via polyfill)'
    }));

    // Codec support
    this.features.set('webmCodec', () => {
      const video = document.createElement('video');
      return {
        name: 'WebM Video Codec',
        isSupported: video.canPlayType('video/webm') !== '',
        fallbackAvailable: true,
        description: 'Preferred video export format (fallback to MP4)'
      };
    });

    this.features.set('mp4Codec', () => {
      const video = document.createElement('video');
      return {
        name: 'MP4 Video Codec',
        isSupported: video.canPlayType('video/mp4') !== '',
        fallbackAvailable: false,
        description: 'Alternative video export format'
      };
    });
  }

  testBrowserCompatibility(): BrowserCompatibilityReport {
    const userAgent = navigator.userAgent;
    const browserInfo = this.parseBrowserInfo(userAgent);
    
    const supportedFeatures: BrowserFeature[] = [];
    const unsupportedFeatures: BrowserFeature[] = [];

    // Test all features
    for (const [, testFunction] of this.features) {
      const feature = testFunction();
      if (feature.isSupported) {
        supportedFeatures.push(feature);
      } else {
        unsupportedFeatures.push(feature);
      }
    }

    const score = this.calculateCompatibilityScore(supportedFeatures, unsupportedFeatures);
    const isCompatible = score >= 70; // Require 70% compatibility
    const recommendations = this.generateRecommendations(unsupportedFeatures, browserInfo);

    return {
      browser: browserInfo.name,
      version: browserInfo.version,
      isCompatible,
      supportedFeatures,
      unsupportedFeatures,
      recommendations,
      score
    };
  }

  private parseBrowserInfo(userAgent: string): { name: string; version: string } {
    // Simple browser detection
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { name: 'Chrome', version: match?.[1] || 'Unknown' };
    }
    
    if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return { name: 'Firefox', version: match?.[1] || 'Unknown' };
    }
    
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      return { name: 'Safari', version: match?.[1] || 'Unknown' };
    }
    
    if (userAgent.includes('Edg')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      return { name: 'Edge', version: match?.[1] || 'Unknown' };
    }

    return { name: 'Unknown', version: 'Unknown' };
  }

  private calculateCompatibilityScore(
    supported: BrowserFeature[], 
    unsupported: BrowserFeature[]
  ): number {
    const totalFeatures = supported.length + unsupported.length;
    if (totalFeatures === 0) return 100;

    // Weight critical features more heavily
    let weightedSupported = 0;
    let totalWeight = 0;

    const criticalFeatures = [
      'Web Audio API', 
      'Canvas 2D', 
      'File API', 
      'ES6 Promises',
      'ES6 Classes'
    ];

    for (const feature of supported) {
      const weight = criticalFeatures.includes(feature.name) ? 2 : 1;
      weightedSupported += weight;
      totalWeight += weight;
    }

    for (const feature of unsupported) {
      const weight = criticalFeatures.includes(feature.name) ? 2 : 1;
      totalWeight += weight;
    }

    return Math.round((weightedSupported / totalWeight) * 100);
  }

  private generateRecommendations(
    unsupportedFeatures: BrowserFeature[], 
    browserInfo: { name: string; version: string }
  ): string[] {
    const recommendations: string[] = [];

    if (unsupportedFeatures.length === 0) {
      recommendations.push('✓ Your browser fully supports AudioVibe Studio!');
      return recommendations;
    }

    recommendations.push(`Browser: ${browserInfo.name} ${browserInfo.version}`);

    const criticalUnsupported = unsupportedFeatures.filter(f => 
      !f.fallbackAvailable && [
        'Web Audio API', 
        'Canvas 2D', 
        'File API', 
        'ES6 Promises'
      ].includes(f.name)
    );

    if (criticalUnsupported.length > 0) {
      recommendations.push('⚠️ Critical features missing:');
      criticalUnsupported.forEach(feature => {
        recommendations.push(`  • ${feature.name}: ${feature.description}`);
      });
    }

    const nonCriticalUnsupported = unsupportedFeatures.filter(f => 
      f.fallbackAvailable || !criticalUnsupported.includes(f)
    );

    if (nonCriticalUnsupported.length > 0) {
      recommendations.push('ℹ️ Optional features missing (fallbacks available):');
      nonCriticalUnsupported.forEach(feature => {
        recommendations.push(`  • ${feature.name}: ${feature.description}`);
      });
    }

    // Browser-specific recommendations
    if (browserInfo.name === 'Safari') {
      recommendations.push('📱 Safari users: Ensure you\'re using Safari 14+ for best compatibility');
    } else if (browserInfo.name === 'Firefox') {
      recommendations.push('🦊 Firefox users: Some video export features may require Firefox 85+');
    } else if (browserInfo.name === 'Chrome') {
      recommendations.push('🔥 Chrome provides the best experience for AudioVibe Studio');
    } else if (browserInfo.name === 'Edge') {
      recommendations.push('🌐 Edge users: Ensure you\'re using Chromium-based Edge for full compatibility');
    }

    if (criticalUnsupported.length > 0) {
      recommendations.push('');
      recommendations.push('🔄 Recommended actions:');
      recommendations.push('  • Update your browser to the latest version');
      recommendations.push('  • Try Chrome, Firefox, or Edge for best compatibility');
      recommendations.push('  • Enable hardware acceleration if available');
    }

    return recommendations;
  }

  // Test specific feature
  testFeature(featureName: string): BrowserFeature | null {
    const testFunction = this.features.get(featureName);
    return testFunction ? testFunction() : null;
  }

  // Get all available feature tests
  getAvailableTests(): string[] {
    return Array.from(this.features.keys());
  }
}

// Quick compatibility check for critical features
export function quickCompatibilityCheck(): boolean {
  const criticalFeatures = [
    () => !!(window.AudioContext || (window as any).webkitAudioContext),
    () => !!document.createElement('canvas').getContext('2d'),
    () => !!window.FileReader,
    () => !!window.Promise
  ];

  return criticalFeatures.every(test => test());
}

// Browser recommendation based on user agent
export function getBrowserRecommendation(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'Chrome (Recommended) - Full feature support';
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox - Good compatibility';
  } else if (userAgent.includes('Edg')) {
    return 'Edge - Good compatibility (Chromium-based)';
  } else if (userAgent.includes('Safari')) {
    return 'Safari - Limited compatibility, may need updates';
  } else {
    return 'Unknown browser - Consider using Chrome or Firefox';
  }
}

// Feature detection utilities
export const FeatureDetection = {
  hasWebAudio: () => !!(window.AudioContext || (window as any).webkitAudioContext),
  hasMediaRecorder: () => !!window.MediaRecorder,
  hasWebGL: () => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  },
  hasLocalStorage: () => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  },
  hasFileAPI: () => !!window.FileReader,
  hasDragDrop: () => 'draggable' in document.createElement('div')
};