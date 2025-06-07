export type BlendMode = 
  | 'normal' 
  | 'multiply' 
  | 'screen' 
  | 'overlay' 
  | 'softLight' 
  | 'hardLight' 
  | 'colorDodge' 
  | 'colorBurn' 
  | 'darken' 
  | 'lighten' 
  | 'difference' 
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface BlendLayer {
  id: string;
  effectName: string;
  opacity: number; // 0-1
  blendMode: BlendMode;
  enabled: boolean;
  order: number; // Higher numbers render on top
}

export interface BlendingConfiguration {
  layers: BlendLayer[];
  globalOpacity: number;
  backgroundMode: 'transparent' | 'solid' | 'gradient';
  backgroundColor?: string;
  gradientColors?: [string, string];
}

export class EffectBlendingEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tempCanvases: Map<string, HTMLCanvasElement> = new Map();
  private configuration: BlendingConfiguration;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context for blending engine');
    }
    this.ctx = ctx;
    
    this.configuration = {
      layers: [],
      globalOpacity: 1.0,
      backgroundMode: 'transparent'
    };
  }

  setConfiguration(config: Partial<BlendingConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
    this.sortLayers();
  }

  addLayer(layer: BlendLayer): void {
    // Remove existing layer with same id
    this.configuration.layers = this.configuration.layers.filter(l => l.id !== layer.id);
    this.configuration.layers.push(layer);
    this.sortLayers();
    this.createTempCanvas(layer.id);
  }

  removeLayer(layerId: string): void {
    this.configuration.layers = this.configuration.layers.filter(l => l.id !== layerId);
    this.destroyTempCanvas(layerId);
  }

  updateLayer(layerId: string, updates: Partial<Omit<BlendLayer, 'id'>>): void {
    const layerIndex = this.configuration.layers.findIndex(l => l.id === layerId);
    if (layerIndex !== -1) {
      this.configuration.layers[layerIndex] = {
        ...this.configuration.layers[layerIndex],
        ...updates
      };
      this.sortLayers();
    }
  }

  getLayer(layerId: string): BlendLayer | undefined {
    return this.configuration.layers.find(l => l.id === layerId);
  }

  getLayers(): BlendLayer[] {
    return [...this.configuration.layers];
  }

  // Get temporary canvas for specific layer rendering
  getLayerCanvas(layerId: string): HTMLCanvasElement | null {
    return this.tempCanvases.get(layerId) || null;
  }

  // Composite all layers onto the main canvas
  composite(): void {
    const { width, height } = this.canvas;
    
    // Clear main canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Set global alpha
    this.ctx.globalAlpha = this.configuration.globalOpacity;
    
    // Render background
    this.renderBackground();
    
    // Composite layers in order
    const enabledLayers = this.configuration.layers
      .filter(layer => layer.enabled)
      .sort((a, b) => a.order - b.order);

    for (const layer of enabledLayers) {
      this.compositeLayer(layer);
    }
    
    // Restore global alpha
    this.ctx.globalAlpha = 1.0;
  }

  private renderBackground(): void {
    const { width, height } = this.canvas;
    
    switch (this.configuration.backgroundMode) {
      case 'solid':
        if (this.configuration.backgroundColor) {
          this.ctx.fillStyle = this.configuration.backgroundColor;
          this.ctx.fillRect(0, 0, width, height);
        }
        break;
        
      case 'gradient':
        if (this.configuration.gradientColors) {
          const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
          gradient.addColorStop(0, this.configuration.gradientColors[0]);
          gradient.addColorStop(1, this.configuration.gradientColors[1]);
          this.ctx.fillStyle = gradient;
          this.ctx.fillRect(0, 0, width, height);
        }
        break;
        
      case 'transparent':
      default:
        // Do nothing - transparent background
        break;
    }
  }

  private compositeLayer(layer: BlendLayer): void {
    const tempCanvas = this.tempCanvases.get(layer.id);
    if (!tempCanvas) return;

    // Set blend mode and opacity
    this.ctx.globalCompositeOperation = this.mapBlendMode(layer.blendMode);
    this.ctx.globalAlpha = layer.opacity * this.configuration.globalOpacity;

    // Draw the layer
    this.ctx.drawImage(tempCanvas, 0, 0);
    
    // Restore default blend mode
    this.ctx.globalCompositeOperation = 'source-over';
  }

  private mapBlendMode(mode: BlendMode): GlobalCompositeOperation {
    const blendModeMap: Record<BlendMode, GlobalCompositeOperation> = {
      'normal': 'source-over',
      'multiply': 'multiply',
      'screen': 'screen',
      'overlay': 'overlay',
      'softLight': 'soft-light',
      'hardLight': 'hard-light',
      'colorDodge': 'color-dodge',
      'colorBurn': 'color-burn',
      'darken': 'darken',
      'lighten': 'lighten',
      'difference': 'difference',
      'exclusion': 'exclusion',
      'hue': 'hue',
      'saturation': 'saturation',
      'color': 'color',
      'luminosity': 'luminosity'
    };

    return blendModeMap[mode] || 'source-over';
  }

  private sortLayers(): void {
    this.configuration.layers.sort((a, b) => a.order - b.order);
  }

  private createTempCanvas(layerId: string): void {
    if (this.tempCanvases.has(layerId)) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    this.tempCanvases.set(layerId, tempCanvas);
  }

  private destroyTempCanvas(layerId: string): void {
    this.tempCanvases.delete(layerId);
  }

  // Resize all temporary canvases when main canvas size changes
  resize(width: number, height: number): void {
    for (const [, tempCanvas] of this.tempCanvases) {
      tempCanvas.width = width;
      tempCanvas.height = height;
    }
  }

  // Clear specific layer
  clearLayer(layerId: string): void {
    const tempCanvas = this.tempCanvases.get(layerId);
    if (tempCanvas) {
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      }
    }
  }

  // Clear all layers
  clearAllLayers(): void {
    for (const [layerId] of this.tempCanvases) {
      this.clearLayer(layerId);
    }
  }

  // Get configuration for saving/loading
  getConfiguration(): BlendingConfiguration {
    return { ...this.configuration };
  }

  // Cleanup resources
  dispose(): void {
    this.tempCanvases.clear();
    this.configuration.layers = [];
  }
}

// Utility functions for common blending operations
export class BlendingUtils {
  // Create a fade transition between two effects
  static createFadeTransition(
    effect1Id: string, 
    effect2Id: string, 
    progress: number // 0-1
  ): BlendLayer[] {
    return [
      {
        id: effect1Id,
        effectName: effect1Id,
        opacity: 1 - progress,
        blendMode: 'normal',
        enabled: true,
        order: 0
      },
      {
        id: effect2Id,
        effectName: effect2Id,
        opacity: progress,
        blendMode: 'normal',
        enabled: true,
        order: 1
      }
    ];
  }

  // Create a multiply blend for darkening effects
  static createDarkenOverlay(
    baseEffectId: string, 
    overlayEffectId: string, 
    intensity: number = 0.5
  ): BlendLayer[] {
    return [
      {
        id: baseEffectId,
        effectName: baseEffectId,
        opacity: 1,
        blendMode: 'normal',
        enabled: true,
        order: 0
      },
      {
        id: overlayEffectId,
        effectName: overlayEffectId,
        opacity: intensity,
        blendMode: 'multiply',
        enabled: true,
        order: 1
      }
    ];
  }

  // Create a screen blend for lightening effects
  static createLightenOverlay(
    baseEffectId: string, 
    overlayEffectId: string, 
    intensity: number = 0.5
  ): BlendLayer[] {
    return [
      {
        id: baseEffectId,
        effectName: baseEffectId,
        opacity: 1,
        blendMode: 'normal',
        enabled: true,
        order: 0
      },
      {
        id: overlayEffectId,
        effectName: overlayEffectId,
        opacity: intensity,
        blendMode: 'screen',
        enabled: true,
        order: 1
      }
    ];
  }

  // Create color overlay effect
  static createColorOverlay(
    baseEffectId: string, 
    colorEffectId: string, 
    intensity: number = 0.3
  ): BlendLayer[] {
    return [
      {
        id: baseEffectId,
        effectName: baseEffectId,
        opacity: 1,
        blendMode: 'normal',
        enabled: true,
        order: 0
      },
      {
        id: colorEffectId,
        effectName: colorEffectId,
        opacity: intensity,
        blendMode: 'color',
        enabled: true,
        order: 1
      }
    ];
  }

  // Get available blend modes with descriptions
  static getBlendModeDescriptions(): Record<BlendMode, string> {
    return {
      'normal': 'Standard blending - no effect',
      'multiply': 'Darkens by multiplying colors',
      'screen': 'Lightens by inverting, multiplying, and inverting again',
      'overlay': 'Combines multiply and screen modes',
      'softLight': 'Subtle contrast increase',
      'hardLight': 'Strong contrast increase',
      'colorDodge': 'Brightens underlying colors',
      'colorBurn': 'Darkens underlying colors',
      'darken': 'Keeps the darker of the two colors',
      'lighten': 'Keeps the lighter of the two colors',
      'difference': 'Subtracts colors, creating dramatic effects',
      'exclusion': 'Similar to difference but with lower contrast',
      'hue': 'Preserves hue of blend layer',
      'saturation': 'Preserves saturation of blend layer',
      'color': 'Preserves hue and saturation of blend layer',
      'luminosity': 'Preserves luminosity of blend layer'
    };
  }

  // Validate blend mode
  static isValidBlendMode(mode: string): mode is BlendMode {
    const validModes: BlendMode[] = [
      'normal', 'multiply', 'screen', 'overlay', 'softLight', 'hardLight',
      'colorDodge', 'colorBurn', 'darken', 'lighten', 'difference', 'exclusion',
      'hue', 'saturation', 'color', 'luminosity'
    ];
    return validModes.includes(mode as BlendMode);
  }
}