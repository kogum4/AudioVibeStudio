import { 
  EffectBlendingEngine, 
  BlendingUtils, 
  BlendLayer 
} from '../EffectBlending';

// Mock HTMLCanvasElement and its context
const mockContext = {
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  fillRect: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  fillStyle: '#000000'
};

const mockCanvas = {
  width: 800,
  height: 600,
  getContext: jest.fn(() => mockContext)
} as any;

// Mock document.createElement for temporary canvases
const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    return {
      width: 800,
      height: 600,
      getContext: jest.fn(() => mockContext)
    } as any;
  }
  return originalCreateElement.call(document, tagName);
});

describe('EffectBlendingEngine', () => {
  let blendingEngine: EffectBlendingEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    blendingEngine = new EffectBlendingEngine(mockCanvas);
  });

  afterEach(() => {
    blendingEngine.dispose();
  });

  describe('initialization', () => {
    it('should create blending engine with canvas', () => {
      expect(blendingEngine).toBeInstanceOf(EffectBlendingEngine);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should throw error if canvas context is not available', () => {
      const invalidCanvas = {
        getContext: jest.fn(() => null)
      } as any;

      expect(() => new EffectBlendingEngine(invalidCanvas)).toThrow('Failed to get 2D context for blending engine');
    });
  });

  describe('layer management', () => {
    const testLayer: BlendLayer = {
      id: 'test-layer',
      effectName: 'waveform',
      opacity: 0.8,
      blendMode: 'multiply',
      enabled: true,
      order: 1
    };

    it('should add layer', () => {
      blendingEngine.addLayer(testLayer);
      
      const layers = blendingEngine.getLayers();
      expect(layers).toHaveLength(1);
      expect(layers[0]).toEqual(testLayer);
    });

    it('should replace existing layer with same id', () => {
      blendingEngine.addLayer(testLayer);
      
      const updatedLayer = { ...testLayer, opacity: 0.5 };
      blendingEngine.addLayer(updatedLayer);
      
      const layers = blendingEngine.getLayers();
      expect(layers).toHaveLength(1);
      expect(layers[0].opacity).toBe(0.5);
    });

    it('should remove layer', () => {
      blendingEngine.addLayer(testLayer);
      expect(blendingEngine.getLayers()).toHaveLength(1);
      
      blendingEngine.removeLayer('test-layer');
      expect(blendingEngine.getLayers()).toHaveLength(0);
    });

    it('should update layer properties', () => {
      blendingEngine.addLayer(testLayer);
      
      blendingEngine.updateLayer('test-layer', { opacity: 0.3, blendMode: 'screen' });
      
      const layer = blendingEngine.getLayer('test-layer');
      expect(layer).toBeTruthy();
      if (layer) {
        expect(layer.opacity).toBe(0.3);
        expect(layer.blendMode).toBe('screen');
      }
    });

    it('should get specific layer', () => {
      blendingEngine.addLayer(testLayer);
      
      const layer = blendingEngine.getLayer('test-layer');
      expect(layer).toEqual(testLayer);
      
      const nonExistentLayer = blendingEngine.getLayer('non-existent');
      expect(nonExistentLayer).toBeUndefined();
    });

    it('should sort layers by order', () => {
      const layer1: BlendLayer = { ...testLayer, id: 'layer1', order: 2 };
      const layer2: BlendLayer = { ...testLayer, id: 'layer2', order: 1 };
      const layer3: BlendLayer = { ...testLayer, id: 'layer3', order: 3 };

      blendingEngine.addLayer(layer1);
      blendingEngine.addLayer(layer2);
      blendingEngine.addLayer(layer3);

      const layers = blendingEngine.getLayers();
      expect(layers[0].id).toBe('layer2'); // order: 1
      expect(layers[1].id).toBe('layer1'); // order: 2
      expect(layers[2].id).toBe('layer3'); // order: 3
    });
  });

  describe('configuration', () => {
    it('should set configuration', () => {
      const config = {
        globalOpacity: 0.9,
        backgroundMode: 'solid' as const,
        backgroundColor: '#ff0000'
      };

      blendingEngine.setConfiguration(config);
      
      const currentConfig = blendingEngine.getConfiguration();
      expect(currentConfig.globalOpacity).toBe(0.9);
      expect(currentConfig.backgroundMode).toBe('solid');
      expect(currentConfig.backgroundColor).toBe('#ff0000');
    });

    it('should merge configuration partially', () => {
      blendingEngine.setConfiguration({ globalOpacity: 0.5 });
      blendingEngine.setConfiguration({ backgroundMode: 'gradient' });
      
      const config = blendingEngine.getConfiguration();
      expect(config.globalOpacity).toBe(0.5);
      expect(config.backgroundMode).toBe('gradient');
    });
  });

  describe('compositing', () => {
    it('should composite with transparent background', () => {
      blendingEngine.setConfiguration({ backgroundMode: 'transparent' });
      blendingEngine.composite();
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should composite with solid background', () => {
      blendingEngine.setConfiguration({ 
        backgroundMode: 'solid',
        backgroundColor: '#ffffff'
      });
      
      blendingEngine.composite();
      
      expect(mockContext.fillStyle).toBe('#ffffff');
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should composite with gradient background', () => {
      blendingEngine.setConfiguration({ 
        backgroundMode: 'gradient',
        gradientColors: ['#ff0000', '#0000ff']
      });
      
      blendingEngine.composite();
      
      expect(mockContext.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 600);
    });

    it('should composite enabled layers only', () => {
      const enabledLayer: BlendLayer = {
        id: 'enabled',
        effectName: 'waveform',
        opacity: 1,
        blendMode: 'normal',
        enabled: true,
        order: 1
      };

      const disabledLayer: BlendLayer = {
        id: 'disabled',
        effectName: 'particles',
        opacity: 1,
        blendMode: 'normal',
        enabled: false,
        order: 2
      };

      blendingEngine.addLayer(enabledLayer);
      blendingEngine.addLayer(disabledLayer);
      
      blendingEngine.composite();
      
      // Should draw only the enabled layer
      expect(mockContext.drawImage).toHaveBeenCalledTimes(1);
    });

    it('should apply global opacity', () => {
      blendingEngine.setConfiguration({ globalOpacity: 0.5 });
      
      const layer: BlendLayer = {
        id: 'test',
        effectName: 'waveform',
        opacity: 0.8,
        blendMode: 'normal',
        enabled: true,
        order: 1
      };

      blendingEngine.addLayer(layer);
      blendingEngine.composite();
      
      // Should multiply layer opacity with global opacity
      expect(mockContext.globalAlpha).toBe(0.4); // 0.8 * 0.5
    });
  });

  describe('canvas management', () => {
    it('should create temporary canvas for layer', () => {
      const layer: BlendLayer = {
        id: 'test-layer',
        effectName: 'waveform',
        opacity: 1,
        blendMode: 'normal',
        enabled: true,
        order: 1
      };

      blendingEngine.addLayer(layer);
      
      const tempCanvas = blendingEngine.getLayerCanvas('test-layer');
      expect(tempCanvas).toBeTruthy();
      if (tempCanvas) {
        expect(tempCanvas.width).toBe(800);
        expect(tempCanvas.height).toBe(600);
      }
    });

    it('should resize temporary canvases', () => {
      const layer: BlendLayer = {
        id: 'test-layer',
        effectName: 'waveform',
        opacity: 1,
        blendMode: 'normal',
        enabled: true,
        order: 1
      };

      blendingEngine.addLayer(layer);
      blendingEngine.resize(1200, 800);
      
      const tempCanvas = blendingEngine.getLayerCanvas('test-layer');
      if (tempCanvas) { 
        expect(tempCanvas.width).toBe(1200);
        expect(tempCanvas.height).toBe(800);
      }
    });

    it('should clear specific layer', () => {
      const layer: BlendLayer = {
        id: 'test-layer',
        effectName: 'waveform',
        opacity: 1,
        blendMode: 'normal',
        enabled: true,
        order: 1
      };

      blendingEngine.addLayer(layer);
      blendingEngine.clearLayer('test-layer');
      
      expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should clear all layers', () => {
      const layer1: BlendLayer = {
        id: 'layer1',
        effectName: 'waveform',
        opacity: 1,
        blendMode: 'normal',
        enabled: true,
        order: 1
      };

      const layer2: BlendLayer = {
        id: 'layer2',
        effectName: 'particles',
        opacity: 1,
        blendMode: 'multiply',
        enabled: true,
        order: 2
      };

      blendingEngine.addLayer(layer1);
      blendingEngine.addLayer(layer2);
      
      blendingEngine.clearAllLayers();
      
      // Should clear both layers
      expect(mockContext.clearRect).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanup', () => {
    it('should dispose resources', () => {
      const layer: BlendLayer = {
        id: 'test-layer',
        effectName: 'waveform',
        opacity: 1,
        blendMode: 'normal',
        enabled: true,
        order: 1
      };

      blendingEngine.addLayer(layer);
      expect(blendingEngine.getLayers()).toHaveLength(1);
      
      blendingEngine.dispose();
      expect(blendingEngine.getLayers()).toHaveLength(0);
    });
  });
});

describe('BlendingUtils', () => {
  describe('fade transition', () => {
    it('should create fade transition layers', () => {
      const layers = BlendingUtils.createFadeTransition('effect1', 'effect2', 0.3);
      
      expect(layers).toHaveLength(2);
      expect(layers[0].opacity).toBe(0.7); // 1 - 0.3
      expect(layers[1].opacity).toBe(0.3);
      expect(layers[0].order).toBe(0);
      expect(layers[1].order).toBe(1);
    });

    it('should handle full transition states', () => {
      const startLayers = BlendingUtils.createFadeTransition('effect1', 'effect2', 0);
      expect(startLayers[0].opacity).toBe(1);
      expect(startLayers[1].opacity).toBe(0);

      const endLayers = BlendingUtils.createFadeTransition('effect1', 'effect2', 1);
      expect(endLayers[0].opacity).toBe(0);
      expect(endLayers[1].opacity).toBe(1);
    });
  });

  describe('darken overlay', () => {
    it('should create darken overlay layers', () => {
      const layers = BlendingUtils.createDarkenOverlay('base', 'overlay', 0.6);
      
      expect(layers).toHaveLength(2);
      expect(layers[0].blendMode).toBe('normal');
      expect(layers[1].blendMode).toBe('multiply');
      expect(layers[1].opacity).toBe(0.6);
    });

    it('should use default intensity', () => {
      const layers = BlendingUtils.createDarkenOverlay('base', 'overlay');
      expect(layers[1].opacity).toBe(0.5);
    });
  });

  describe('lighten overlay', () => {
    it('should create lighten overlay layers', () => {
      const layers = BlendingUtils.createLightenOverlay('base', 'overlay', 0.7);
      
      expect(layers).toHaveLength(2);
      expect(layers[0].blendMode).toBe('normal');
      expect(layers[1].blendMode).toBe('screen');
      expect(layers[1].opacity).toBe(0.7);
    });
  });

  describe('color overlay', () => {
    it('should create color overlay layers', () => {
      const layers = BlendingUtils.createColorOverlay('base', 'color', 0.4);
      
      expect(layers).toHaveLength(2);
      expect(layers[0].blendMode).toBe('normal');
      expect(layers[1].blendMode).toBe('color');
      expect(layers[1].opacity).toBe(0.4);
    });
  });

  describe('blend mode utilities', () => {
    it('should provide blend mode descriptions', () => {
      const descriptions = BlendingUtils.getBlendModeDescriptions();
      
      expect(descriptions.normal).toContain('Standard');
      expect(descriptions.multiply).toContain('Darkens');
      expect(descriptions.screen).toContain('Lightens');
      expect(Object.keys(descriptions)).toHaveLength(16);
    });

    it('should validate blend modes', () => {
      expect(BlendingUtils.isValidBlendMode('multiply')).toBe(true);
      expect(BlendingUtils.isValidBlendMode('screen')).toBe(true);
      expect(BlendingUtils.isValidBlendMode('invalid')).toBe(false);
      expect(BlendingUtils.isValidBlendMode('')).toBe(false);
    });
  });
});

describe('Integration scenarios', () => {
  let blendingEngine: EffectBlendingEngine;

  beforeEach(() => {
    blendingEngine = new EffectBlendingEngine(mockCanvas);
  });

  afterEach(() => {
    blendingEngine.dispose();
  });

  it('should handle complex multi-layer composition', () => {
    // Create multiple layers with different blend modes
    const backgroundLayer: BlendLayer = {
      id: 'background',
      effectName: 'gradient',
      opacity: 1,
      blendMode: 'normal',
      enabled: true,
      order: 0
    };

    const waveformLayer: BlendLayer = {
      id: 'waveform',
      effectName: 'waveform',
      opacity: 0.8,
      blendMode: 'screen',
      enabled: true,
      order: 1
    };

    const particleLayer: BlendLayer = {
      id: 'particles',
      effectName: 'particles',
      opacity: 0.6,
      blendMode: 'multiply',
      enabled: true,
      order: 2
    };

    blendingEngine.addLayer(particleLayer); // Add out of order
    blendingEngine.addLayer(backgroundLayer);
    blendingEngine.addLayer(waveformLayer);

    blendingEngine.setConfiguration({
      globalOpacity: 0.9,
      backgroundMode: 'solid',
      backgroundColor: '#000000'
    });

    blendingEngine.composite();

    // Should composite all layers in correct order
    expect(mockContext.drawImage).toHaveBeenCalledTimes(3);
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.fillRect).toHaveBeenCalled(); // Background
  });

  it('should handle layer enable/disable correctly', () => {
    const layer1: BlendLayer = {
      id: 'layer1',
      effectName: 'effect1',
      opacity: 1,
      blendMode: 'normal',
      enabled: true,
      order: 1
    };

    const layer2: BlendLayer = {
      id: 'layer2',
      effectName: 'effect2',
      opacity: 1,
      blendMode: 'multiply',
      enabled: false,
      order: 2
    };

    blendingEngine.addLayer(layer1);
    blendingEngine.addLayer(layer2);
    
    blendingEngine.composite();
    expect(mockContext.drawImage).toHaveBeenCalledTimes(1);

    // Enable second layer
    blendingEngine.updateLayer('layer2', { enabled: true });
    jest.clearAllMocks();
    
    blendingEngine.composite();
    expect(mockContext.drawImage).toHaveBeenCalledTimes(2);
  });

  it('should handle dynamic layer reordering', () => {
    const layer1: BlendLayer = {
      id: 'layer1',
      effectName: 'effect1',
      opacity: 1,
      blendMode: 'normal',
      enabled: true,
      order: 1
    };

    const layer2: BlendLayer = {
      id: 'layer2',
      effectName: 'effect2',
      opacity: 1,
      blendMode: 'multiply',
      enabled: true,
      order: 2
    };

    blendingEngine.addLayer(layer1);
    blendingEngine.addLayer(layer2);

    let layers = blendingEngine.getLayers();
    expect(layers[0].id).toBe('layer1');
    expect(layers[1].id).toBe('layer2');

    // Swap order
    blendingEngine.updateLayer('layer1', { order: 3 });
    
    layers = blendingEngine.getLayers();
    expect(layers[0].id).toBe('layer2'); // Now first
    expect(layers[1].id).toBe('layer1'); // Now second
  });
});