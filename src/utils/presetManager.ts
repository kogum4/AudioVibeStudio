import { TextOverlay, EffectParameter } from '../types/visual';

export interface ProjectPreset {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  settings: {
    currentEffect: string;
    effectParameters: { [effectName: string]: EffectParameter };
    textOverlays: TextOverlay[];
    backgroundColor?: string;
    audioSettings?: {
      volume: number;
      playbackRate: number;
    };
    exportSettings?: {
      quality: 'low' | 'medium' | 'high';
      format: 'webm' | 'mp4';
      fps: number;
    };
  };
  tags: string[];
  version: string;
}

export interface PresetCategory {
  id: string;
  name: string;
  description: string;
  presets: string[]; // preset IDs
}

class PresetManager {
  private readonly storageKey = 'audiovibe-presets';
  private readonly categoriesKey = 'audiovibe-preset-categories';
  private readonly version = '1.0.0';

  // Built-in preset templates
  private readonly builtInPresets: Omit<ProjectPreset, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Energetic Beat Visualization',
      description: 'High-energy particles with beat-reactive text for electronic music',
      thumbnail: '',
      settings: {
        currentEffect: 'particles',
        effectParameters: {
          particles: {
            particleCount: 150,
            color: '#ff6b6b',
            size: 4,
            speed: 1.5,
            trail: true
          }
        },
        textOverlays: [
          {
            id: 'beat-title',
            text: 'ENERGY',
            position: { x: 540, y: 300 },
            fontSize: 84,
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff',
            opacity: 1,
            rotation: 0,
            animation: {
              type: 'pulse',
              duration: 1000,
              delay: 0,
              easing: 'ease-in-out',
              audioReactive: true
            },
            timing: {
              startTime: 0,
              endTime: 0,
              loop: true,
              autoPosition: false
            },
            style: {
              bold: true,
              italic: false,
              stroke: true,
              strokeWidth: 3,
              strokeColor: '#000000',
              shadow: true,
              shadowBlur: 15,
              shadowColor: '#ff6b6b',
              shadowOffset: { x: 0, y: 0 },
              gradient: true,
              gradientColors: ['#ff6b6b', '#4ecdc4']
            }
          }
        ],
        exportSettings: {
          quality: 'high',
          format: 'mp4',
          fps: 60
        }
      },
      tags: ['electronic', 'high-energy', 'particles'],
      version: '1.0.0'
    },
    {
      name: 'Chill Waveform',
      description: 'Smooth waveform visualization perfect for ambient and chill music',
      thumbnail: '',
      settings: {
        currentEffect: 'waveform',
        effectParameters: {
          waveform: {
            intensity: 60,
            color: '#4ecdc4',
            lineWidth: 3,
            glow: true,
            style: 'line'
          }
        },
        textOverlays: [
          {
            id: 'chill-subtitle',
            text: 'Relax & Unwind',
            position: { x: 540, y: 1620 },
            fontSize: 42,
            fontFamily: 'Georgia, serif',
            color: '#ffffff',
            opacity: 0.8,
            rotation: 0,
            animation: {
              type: 'fade',
              duration: 3000,
              delay: 2000,
              easing: 'ease-in-out',
              audioReactive: false
            },
            timing: {
              startTime: 2000,
              endTime: 0,
              loop: false,
              autoPosition: false
            },
            style: {
              bold: false,
              italic: true,
              stroke: false,
              strokeWidth: 0,
              strokeColor: '#000000',
              shadow: true,
              shadowBlur: 8,
              shadowColor: '#000000',
              shadowOffset: { x: 2, y: 2 },
              gradient: false,
              gradientColors: ['#ffffff']
            }
          }
        ],
        exportSettings: {
          quality: 'medium',
          format: 'mp4',
          fps: 30
        }
      },
      tags: ['ambient', 'chill', 'waveform'],
      version: '1.0.0'
    },
    {
      name: 'Geometric Patterns',
      description: 'Clean geometric shapes that respond to music frequencies',
      thumbnail: '',
      settings: {
        currentEffect: 'geometric',
        effectParameters: {
          geometric: {
            shape: 'hexagons',
            color: '#667eea',
            size: 80,
            rotation: 45,
            complexity: 4
          }
        },
        textOverlays: [],
        exportSettings: {
          quality: 'high',
          format: 'mp4',
          fps: 60
        }
      },
      tags: ['geometric', 'minimal', 'clean'],
      version: '1.0.0'
    },
    {
      name: '3D Cosmic Journey',
      description: 'Immersive 3D objects floating in space with cosmic colors',
      thumbnail: '',
      settings: {
        currentEffect: '3d',
        effectParameters: {
          '3d': {
            object: 'mixed',
            color: '#9b59b6',
            rotationSpeed: 1.2,
            objectCount: 6
          }
        },
        textOverlays: [
          {
            id: 'cosmic-title',
            text: 'COSMIC VOYAGE',
            position: { x: 540, y: 200 },
            fontSize: 64,
            fontFamily: 'Impact, sans-serif',
            color: '#ffffff',
            opacity: 1,
            rotation: 0,
            animation: {
              type: 'wave',
              duration: 4000,
              delay: 0,
              easing: 'ease-in-out',
              audioReactive: true
            },
            timing: {
              startTime: 0,
              endTime: 0,
              loop: true,
              autoPosition: false
            },
            style: {
              bold: true,
              italic: false,
              stroke: true,
              strokeWidth: 2,
              strokeColor: '#000000',
              shadow: true,
              shadowBlur: 20,
              shadowColor: '#9b59b6',
              shadowOffset: { x: 0, y: 0 },
              gradient: true,
              gradientColors: ['#9b59b6', '#3498db', '#e74c3c']
            }
          }
        ],
        exportSettings: {
          quality: 'high',
          format: 'mp4',
          fps: 60
        }
      },
      tags: ['3d', 'cosmic', 'space', 'immersive'],
      version: '1.0.0'
    },
    {
      name: 'Gradient Flow',
      description: 'Flowing gradients with wave distortions for melodic content',
      thumbnail: '',
      settings: {
        currentEffect: 'gradient',
        effectParameters: {
          gradient: {
            color1: '#667eea',
            color2: '#764ba2',
            direction: 'diagonal',
            speed: 1,
            waves: true
          }
        },
        textOverlays: [
          {
            id: 'flow-text',
            text: 'FLOW STATE',
            position: { x: 540, y: 960 },
            fontSize: 72,
            fontFamily: 'Helvetica, sans-serif',
            color: '#ffffff',
            opacity: 0.9,
            rotation: 0,
            animation: {
              type: 'typewriter',
              duration: 2500,
              delay: 1000,
              easing: 'ease-out',
              audioReactive: false
            },
            timing: {
              startTime: 1000,
              endTime: 0,
              loop: false,
              autoPosition: false
            },
            style: {
              bold: true,
              italic: false,
              stroke: true,
              strokeWidth: 2,
              strokeColor: '#000000',
              shadow: false,
              shadowBlur: 0,
              shadowColor: '#000000',
              shadowOffset: { x: 0, y: 0 },
              gradient: false,
              gradientColors: ['#ffffff']
            }
          }
        ],
        exportSettings: {
          quality: 'medium',
          format: 'mp4',
          fps: 30
        }
      },
      tags: ['gradient', 'flow', 'melodic'],
      version: '1.0.0'
    }
  ];

  private readonly defaultCategories: PresetCategory[] = [
    {
      id: 'built-in',
      name: 'Built-in Presets',
      description: 'Pre-designed templates for common use cases',
      presets: []
    },
    {
      id: 'user',
      name: 'My Presets',
      description: 'Your custom saved presets',
      presets: []
    },
    {
      id: 'recent',
      name: 'Recently Used',
      description: 'Recently opened presets',
      presets: []
    }
  ];

  constructor() {
    this.initializeBuiltInPresets();
  }

  private initializeBuiltInPresets(): void {
    const existingPresets = this.getAllPresets();
    const builtInIds = new Set(existingPresets.filter(p => p.tags.includes('built-in')).map(p => p.id));

    this.builtInPresets.forEach(template => {
      const presetId = `built-in-${template.name.toLowerCase().replace(/\s+/g, '-')}`;
      
      if (!builtInIds.has(presetId)) {
        const preset: ProjectPreset = {
          ...template,
          id: presetId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: [...template.tags, 'built-in']
        };
        
        this.savePresetToStorage(preset);
        this.addPresetToCategory('built-in', presetId);
      }
    });
  }

  savePreset(preset: Omit<ProjectPreset, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullPreset: ProjectPreset = {
      ...preset,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: this.version
    };

    this.savePresetToStorage(fullPreset);
    this.addPresetToCategory('user', id);
    
    return id;
  }

  updatePreset(id: string, updates: Partial<Omit<ProjectPreset, 'id' | 'createdAt'>>): boolean {
    const preset = this.getPreset(id);
    if (!preset) return false;

    const updatedPreset: ProjectPreset = {
      ...preset,
      ...updates,
      updatedAt: Date.now()
    };

    this.savePresetToStorage(updatedPreset);
    return true;
  }

  getPreset(id: string): ProjectPreset | null {
    const presets = this.getAllPresets();
    return presets.find(p => p.id === id) || null;
  }

  getAllPresets(): ProjectPreset[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading presets:', error);
      return [];
    }
  }

  deletePreset(id: string): boolean {
    const presets = this.getAllPresets();
    const filtered = presets.filter(p => p.id !== id);
    
    if (filtered.length === presets.length) return false;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      this.removePresetFromAllCategories(id);
      return true;
    } catch (error) {
      console.error('Error deleting preset:', error);
      return false;
    }
  }

  searchPresets(query: string, tags?: string[]): ProjectPreset[] {
    const presets = this.getAllPresets();
    const lowerQuery = query.toLowerCase();

    return presets.filter(preset => {
      const matchesQuery = !query || 
        preset.name.toLowerCase().includes(lowerQuery) ||
        preset.description.toLowerCase().includes(lowerQuery);
      
      const matchesTags = !tags || tags.length === 0 ||
        tags.some(tag => preset.tags.includes(tag));

      return matchesQuery && matchesTags;
    });
  }

  getPresetsByCategory(categoryId: string): ProjectPreset[] {
    const categories = this.getCategories();
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) return [];

    const allPresets = this.getAllPresets();
    return category.presets
      .map(id => allPresets.find(p => p.id === id))
      .filter((p): p is ProjectPreset => p !== undefined);
  }

  addPresetToRecentlyUsed(id: string): void {
    this.addPresetToCategory('recent', id);
    
    // Keep only last 10 in recent
    const categories = this.getCategories();
    const recentCategory = categories.find(c => c.id === 'recent');
    if (recentCategory && recentCategory.presets.length > 10) {
      recentCategory.presets = recentCategory.presets.slice(-10);
      this.saveCategoriesToStorage(categories);
    }
  }

  exportPreset(id: string): string | null {
    const preset = this.getPreset(id);
    if (!preset) return null;

    try {
      return JSON.stringify(preset, null, 2);
    } catch (error) {
      console.error('Error exporting preset:', error);
      return null;
    }
  }

  importPreset(jsonData: string): string | null {
    try {
      const preset = JSON.parse(jsonData) as ProjectPreset;
      
      // Validate preset structure
      if (!this.validatePresetStructure(preset)) {
        throw new Error('Invalid preset structure');
      }

      // Generate new ID to avoid conflicts
      const newId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const importedPreset: ProjectPreset = {
        ...preset,
        id: newId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: `${preset.name} (Imported)`
      };

      this.savePresetToStorage(importedPreset);
      this.addPresetToCategory('user', newId);
      
      return newId;
    } catch (error) {
      console.error('Error importing preset:', error);
      return null;
    }
  }

  duplicatePreset(id: string): string | null {
    const preset = this.getPreset(id);
    if (!preset) return null;

    const duplicatedPreset = {
      ...preset,
      name: `${preset.name} (Copy)`,
      tags: preset.tags.filter(tag => tag !== 'built-in')
    };

    delete (duplicatedPreset as any).id;
    delete (duplicatedPreset as any).createdAt;
    delete (duplicatedPreset as any).updatedAt;

    return this.savePreset(duplicatedPreset);
  }

  getCategories(): PresetCategory[] {
    try {
      const stored = localStorage.getItem(this.categoriesKey);
      return stored ? JSON.parse(stored) : this.defaultCategories;
    } catch (error) {
      console.error('Error loading categories:', error);
      return this.defaultCategories;
    }
  }

  createCategory(name: string, description: string): string {
    const id = `category-${Date.now()}`;
    const categories = this.getCategories();
    
    categories.push({
      id,
      name,
      description,
      presets: []
    });

    this.saveCategoriesToStorage(categories);
    return id;
  }

  getAllTags(): string[] {
    const presets = this.getAllPresets();
    const tagSet = new Set<string>();
    
    presets.forEach(preset => {
      preset.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  }

  // Utility methods for current session state
  saveCurrentState(currentEffect: string, effectParameters: { [key: string]: EffectParameter }, textOverlays: TextOverlay[]): void {
    const state = {
      currentEffect,
      effectParameters,
      textOverlays,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('audiovibe-current-state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving current state:', error);
    }
  }

  loadCurrentState(): { currentEffect: string; effectParameters: { [key: string]: EffectParameter }; textOverlays: TextOverlay[] } | null {
    try {
      const stored = localStorage.getItem('audiovibe-current-state');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading current state:', error);
      return null;
    }
  }

  clearCurrentState(): void {
    localStorage.removeItem('audiovibe-current-state');
  }

  private savePresetToStorage(preset: ProjectPreset): void {
    const presets = this.getAllPresets();
    const existingIndex = presets.findIndex(p => p.id === preset.id);
    
    if (existingIndex >= 0) {
      presets[existingIndex] = preset;
    } else {
      presets.push(preset);
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(presets));
    } catch (error) {
      console.error('Error saving preset:', error);
    }
  }

  private addPresetToCategory(categoryId: string, presetId: string): void {
    const categories = this.getCategories();
    const category = categories.find(c => c.id === categoryId);
    
    if (category && !category.presets.includes(presetId)) {
      category.presets.push(presetId);
      this.saveCategoriesToStorage(categories);
    }
  }

  private removePresetFromAllCategories(presetId: string): void {
    const categories = this.getCategories();
    let modified = false;

    categories.forEach(category => {
      const index = category.presets.indexOf(presetId);
      if (index >= 0) {
        category.presets.splice(index, 1);
        modified = true;
      }
    });

    if (modified) {
      this.saveCategoriesToStorage(categories);
    }
  }

  private saveCategoriesToStorage(categories: PresetCategory[]): void {
    try {
      localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  }

  private validatePresetStructure(preset: any): preset is ProjectPreset {
    return (
      typeof preset === 'object' &&
      typeof preset.name === 'string' &&
      typeof preset.description === 'string' &&
      typeof preset.settings === 'object' &&
      typeof preset.settings.currentEffect === 'string' &&
      typeof preset.settings.effectParameters === 'object' &&
      Array.isArray(preset.settings.textOverlays) &&
      Array.isArray(preset.tags)
    );
  }
}

export const presetManager = new PresetManager();