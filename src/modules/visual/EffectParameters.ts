export interface ParameterDefinition {
  name: string;
  type: 'number' | 'color' | 'boolean' | 'select';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: any;
  options?: string[];
  description?: string;
}

export interface EffectParameter {
  [key: string]: any;
}

export class EffectParameterManager {
  private parameters: Map<string, EffectParameter> = new Map();
  private definitions: Map<string, ParameterDefinition[]> = new Map();
  private listeners: Map<string, ((params: EffectParameter) => void)[]> = new Map();

  registerEffect(effectName: string, paramDefinitions: ParameterDefinition[]): void {
    this.definitions.set(effectName, paramDefinitions);
    
    // Initialize default parameters
    const defaultParams: EffectParameter = {};
    paramDefinitions.forEach(def => {
      defaultParams[def.name] = def.defaultValue;
    });
    
    this.parameters.set(effectName, defaultParams);
  }

  getParameterDefinitions(effectName: string): ParameterDefinition[] {
    return this.definitions.get(effectName) || [];
  }

  getParameters(effectName: string): EffectParameter {
    return this.parameters.get(effectName) || {};
  }

  setParameter(effectName: string, paramName: string, value: any): void {
    const params = this.parameters.get(effectName);
    if (!params) return;

    params[paramName] = value;
    this.notifyListeners(effectName, params);
  }

  setParameters(effectName: string, newParams: Partial<EffectParameter>): void {
    const params = this.parameters.get(effectName);
    if (!params) return;

    Object.assign(params, newParams);
    this.notifyListeners(effectName, params);
  }

  updateParameter(effectName: string, paramName: string, value: any): void {
    this.setParameter(effectName, paramName, value);
  }

  resetParameters(effectName: string): void {
    this.resetToDefaults(effectName);
  }

  addParameterListener(effectName: string, callback: (params: EffectParameter) => void): void {
    if (!this.listeners.has(effectName)) {
      this.listeners.set(effectName, []);
    }
    this.listeners.get(effectName)!.push(callback);
  }

  removeParameterListener(effectName: string, callback: (params: EffectParameter) => void): void {
    const listeners = this.listeners.get(effectName);
    if (!listeners) return;

    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private notifyListeners(effectName: string, params: EffectParameter): void {
    const listeners = this.listeners.get(effectName);
    if (!listeners) return;

    listeners.forEach(callback => callback(params));
  }

  resetToDefaults(effectName: string): void {
    const definitions = this.definitions.get(effectName);
    if (!definitions) return;

    const defaultParams: EffectParameter = {};
    definitions.forEach(def => {
      defaultParams[def.name] = def.defaultValue;
    });

    this.parameters.set(effectName, defaultParams);
    this.notifyListeners(effectName, defaultParams);
  }
}

// Singleton instance
export const effectParameterManager = new EffectParameterManager();

// Define default parameters for each effect
effectParameterManager.registerEffect('waveform', [
  {
    name: 'intensity',
    type: 'number',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 50,
    description: 'Waveform intensity'
  },
  {
    name: 'color',
    type: 'color',
    defaultValue: '#00ffff',
    description: 'Primary color'
  },
  {
    name: 'lineWidth',
    type: 'number',
    min: 1,
    max: 20,
    step: 1,
    defaultValue: 3,
    description: 'Line thickness'
  },
  {
    name: 'glow',
    type: 'boolean',
    defaultValue: true,
    description: 'Enable glow effect'
  },
  {
    name: 'style',
    type: 'select',
    options: ['line', 'bars', 'filled'],
    defaultValue: 'line',
    description: 'Waveform style'
  }
]);

effectParameterManager.registerEffect('particles', [
  {
    name: 'particleCount',
    type: 'number',
    min: 10,
    max: 500,
    step: 10,
    defaultValue: 100,
    description: 'Number of particles'
  },
  {
    name: 'color',
    type: 'color',
    defaultValue: '#ff6b6b',
    description: 'Particle color'
  },
  {
    name: 'size',
    type: 'number',
    min: 1,
    max: 20,
    step: 1,
    defaultValue: 3,
    description: 'Particle size'
  },
  {
    name: 'speed',
    type: 'number',
    min: 0.1,
    max: 5,
    step: 0.1,
    defaultValue: 1,
    description: 'Movement speed'
  },
  {
    name: 'trail',
    type: 'boolean',
    defaultValue: true,
    description: 'Enable particle trails'
  }
]);

effectParameterManager.registerEffect('geometric', [
  {
    name: 'shape',
    type: 'select',
    options: ['circles', 'squares', 'triangles', 'hexagons'],
    defaultValue: 'circles',
    description: 'Shape type'
  },
  {
    name: 'color',
    type: 'color',
    defaultValue: '#4ecdc4',
    description: 'Shape color'
  },
  {
    name: 'size',
    type: 'number',
    min: 10,
    max: 200,
    step: 5,
    defaultValue: 50,
    description: 'Shape size'
  },
  {
    name: 'rotation',
    type: 'number',
    min: 0,
    max: 360,
    step: 1,
    defaultValue: 0,
    description: 'Rotation angle'
  },
  {
    name: 'complexity',
    type: 'number',
    min: 1,
    max: 10,
    step: 1,
    defaultValue: 5,
    description: 'Pattern complexity'
  }
]);

effectParameterManager.registerEffect('gradient', [
  {
    name: 'color1',
    type: 'color',
    defaultValue: '#667eea',
    description: 'Start color'
  },
  {
    name: 'color2',
    type: 'color',
    defaultValue: '#764ba2',
    description: 'End color'
  },
  {
    name: 'direction',
    type: 'select',
    options: ['horizontal', 'vertical', 'diagonal', 'radial'],
    defaultValue: 'vertical',
    description: 'Gradient direction'
  },
  {
    name: 'speed',
    type: 'number',
    min: 0.1,
    max: 5,
    step: 0.1,
    defaultValue: 1,
    description: 'Animation speed'
  },
  {
    name: 'waves',
    type: 'boolean',
    defaultValue: true,
    description: 'Enable wave animation'
  }
]);

effectParameterManager.registerEffect('3d', [
  {
    name: 'object',
    type: 'select',
    options: ['cube', 'sphere', 'cylinder', 'torus'],
    defaultValue: 'cube',
    description: '3D object type'
  },
  {
    name: 'color',
    type: 'color',
    defaultValue: '#ff9f43',
    description: 'Object color'
  },
  {
    name: 'rotationSpeed',
    type: 'number',
    min: 0.1,
    max: 5,
    step: 0.1,
    defaultValue: 1,
    description: 'Rotation speed'
  },
  {
    name: 'scale',
    type: 'number',
    min: 0.1,
    max: 3,
    step: 0.1,
    defaultValue: 1,
    description: 'Object scale'
  },
  {
    name: 'lighting',
    type: 'boolean',
    defaultValue: true,
    description: 'Enable lighting'
  }
]);