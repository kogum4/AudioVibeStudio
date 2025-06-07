import { AudioAnalyzer } from '../audio/AudioAnalyzer';
import { effectParameterManager, EffectParameter } from './EffectParameters';
import { TextRenderer } from './TextRenderer';
import { TextOverlay } from '../../types/visual';

export abstract class VisualEffect {
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;
  protected analyzer: AudioAnalyzer;
  protected parameters: EffectParameter = {};
  protected effectName: string;
  protected engine: VisualEngine;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, effectName: string, engine: VisualEngine) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.analyzer = analyzer;
    this.effectName = effectName;
    this.engine = engine;
    this.parameters = effectParameterManager.getParameters(effectName);
    
    // Listen for parameter changes
    effectParameterManager.addParameterListener(effectName, (params) => {
      this.parameters = params;
    });
  }

  abstract render(): void;
  
  protected clear(): void {
    const bgColor = this.engine.getBackgroundColor();
    // Convert hex to rgba with low opacity for trail effect
    if (bgColor.startsWith('#')) {
      const r = parseInt(bgColor.slice(1, 3), 16);
      const g = parseInt(bgColor.slice(3, 5), 16);
      const b = parseInt(bgColor.slice(5, 7), 16);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
    } else {
      this.ctx.fillStyle = bgColor;
    }
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}

export class VisualEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyzer: AudioAnalyzer;
  private currentEffect: VisualEffect | null = null;
  private animationId: number | null = null;
  private isRunning = false;
  private isAudioPlaying = false;
  private textRenderer: TextRenderer;
  private startTime = Date.now();
  private backgroundColor = '#000000';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.analyzer = new AudioAnalyzer();
    this.textRenderer = new TextRenderer(ctx, this.canvas.width, this.canvas.height, this.analyzer);
    
    // Load background color from localStorage
    const savedBackgroundColor = localStorage.getItem('audioVibe_backgroundColor');
    if (savedBackgroundColor) {
      this.backgroundColor = savedBackgroundColor;
    }
    
    // Set canvas size
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Debug: Log analyzer initialization
    console.log('VisualEngine initialized with analyzer:', this.analyzer);
  }

  private resize(): void {
    const aspectRatio = 9 / 16;
    const maxWidth = this.canvas.parentElement?.clientWidth || 360;
    const width = Math.min(maxWidth, 360);
    const height = width / aspectRatio;
    
    this.canvas.width = 1080;
    this.canvas.height = 1920;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    // Update text renderer size
    if (this.textRenderer) {
      this.textRenderer = new TextRenderer(this.ctx, this.canvas.width, this.canvas.height, this.analyzer);
    }
  }

  setEffect(effectType: string): void {
    switch (effectType) {
      case 'waveform':
        this.currentEffect = new WaveformEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'waveform', this);
        break;
      case 'particles':
        this.currentEffect = new ParticleEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'particles', this);
        break;
      case 'geometric':
        this.currentEffect = new GeometricEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'geometric', this);
        break;
      case 'gradient':
        this.currentEffect = new GradientEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'gradient', this);
        break;
      case '3d':
        this.currentEffect = new ThreeDEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, '3d', this);
        break;
      default:
        this.currentEffect = new WaveformEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'waveform', this);
    }
  }

  getParameterManager() {
    return effectParameterManager;
  }

  // Text overlay methods
  addTextOverlay(overlay: TextOverlay): void {
    this.textRenderer.addTextOverlay(overlay);
  }

  removeTextOverlay(id: string): void {
    this.textRenderer.removeTextOverlay(id);
  }

  updateTextOverlay(id: string, updates: Partial<TextOverlay>): void {
    this.textRenderer.updateTextOverlay(id, updates);
  }

  getTextOverlays(): TextOverlay[] {
    return this.textRenderer.getTextOverlays();
  }

  clearAllTextOverlays(): void {
    this.textRenderer.clearAllOverlays();
  }

  getTextRenderer(): TextRenderer {
    return this.textRenderer;
  }

  setBackgroundColor(color: string): void {
    this.backgroundColor = color;
    // Save to localStorage for persistence
    localStorage.setItem('audioVibe_backgroundColor', color);
  }

  getBackgroundColor(): string {
    return this.backgroundColor;
  }

  setAudioPlaying(playing: boolean): void {
    console.log('VisualEngine.setAudioPlaying called with:', playing);
    this.isAudioPlaying = playing;
    console.log('VisualEngine.isAudioPlaying is now:', this.isAudioPlaying);
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  start(): void {
    console.log('VisualEngine.start() called, isRunning:', this.isRunning);
    if (this.isRunning) {
      console.log('Already running, returning early');
      return;
    }
    
    if (!this.currentEffect) {
      console.log('No current effect, setting waveform');
      this.setEffect('waveform');
    }
    
    this.isRunning = true;
    console.log('Starting animation, isRunning set to:', this.isRunning);
    this.animate();
  }

  stop(): void {
    console.log('VisualEngine.stop() called! Stack trace:');
    console.trace();
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(): void {
    console.log('animate() called, isRunning:', this.isRunning, 'isAudioPlaying:', this.isAudioPlaying);
    if (!this.isRunning) return;

    // Only render with audio data when audio is playing
    if (this.currentEffect) {
      if (this.isAudioPlaying) {
        console.log('Rendering effect because audio is playing');
        this.currentEffect.render();
      } else {
        console.log('Rendering static frame because audio is paused');
        // Render static frame when paused
        this.renderStaticFrame();
      }
    } else {
      console.log('No current effect set');
    }

    // Always render text overlays
    const currentTime = Date.now() - this.startTime;
    this.textRenderer.render(currentTime);
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private renderStaticFrame(): void {
    // Show a static visualization when paused with background color
    const bgColor = this.backgroundColor;
    if (bgColor.startsWith('#')) {
      const r = parseInt(bgColor.slice(1, 3), 16);
      const g = parseInt(bgColor.slice(3, 5), 16);
      const b = parseInt(bgColor.slice(5, 7), 16);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
    } else {
      this.ctx.fillStyle = bgColor;
    }
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw a static waveform line
    this.ctx.strokeStyle = '#4ecdc4';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height / 2);
    this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.ctx.stroke();
  }

  dispose(): void {
    console.log('VisualEngine.dispose() called! Stack trace:');
    console.trace();
    this.stop();
    window.removeEventListener('resize', () => this.resize());
  }
}

class WaveformEffect extends VisualEffect {
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, effectName: string, engine: VisualEngine) {
    super(ctx, width, height, analyzer, effectName, engine);
  }

  render(): void {
    console.log('WaveformEffect.render() called');
    this.clear();
    
    const waveformData = this.analyzer.getWaveformData();
    const bands = this.analyzer.getFrequencyBands();
    const beat = this.analyzer.detectBeat();
    
    // Debug: Always log for now to see what's happening
    console.log('Waveform data length:', waveformData.length);
    console.log('Frequency bands:', bands);
    console.log('Sample waveform values:', waveformData.slice(0, 5));
    
    // Get parameters
    const intensity = this.parameters.intensity / 100;
    const color = this.parameters.color;
    const lineWidth = this.parameters.lineWidth;
    const glow = this.parameters.glow;
    const style = this.parameters.style;
    
    // Set color - use parameter color with dynamic adjustments
    if (color) {
      this.ctx.strokeStyle = color;
      this.ctx.fillStyle = color;
    } else {
      // Fallback to dynamic color
      const hue = 180 + bands.bass * 60 - bands.treble * 30;
      const saturation = 50 + bands.mid * 50;
      const lightness = 40 + bands.highMid * 30;
      this.ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      this.ctx.fillStyle = this.ctx.strokeStyle;
    }
    
    // Dynamic line width based on beat and parameters
    const beatMultiplier = (beat.isBeat ? 10 : 0) * beat.intensity;
    this.ctx.lineWidth = lineWidth + beatMultiplier * intensity;
    
    // Draw based on style
    if (style === 'bars') {
      this.renderBars(waveformData, intensity);
    } else if (style === 'filled') {
      this.renderFilled(waveformData, intensity);
    } else {
      this.renderLine(waveformData, intensity);
    }
    
    // Add glow effect
    if (glow && beat.isBeat) {
      this.ctx.shadowBlur = 20 * beat.intensity * intensity;
      this.ctx.shadowColor = this.ctx.strokeStyle as string;
      if (style === 'bars') {
        this.renderBars(waveformData, intensity);
      } else if (style === 'filled') {
        this.renderFilled(waveformData, intensity);
      } else {
        this.renderLine(waveformData, intensity);
      }
      this.ctx.shadowBlur = 0;
    }
  }

  private renderLine(waveformData: number[], intensity: number): void {
    this.ctx.beginPath();
    const sliceWidth = this.width / waveformData.length;
    let x = 0;
    
    for (let i = 0; i < waveformData.length; i++) {
      const y = (this.height / 2) + ((waveformData[i] || 0) * this.height / 4 * intensity);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    this.ctx.stroke();
  }

  private renderBars(waveformData: number[], intensity: number): void {
    const barWidth = this.width / waveformData.length;
    
    for (let i = 0; i < waveformData.length; i++) {
      const barHeight = Math.abs(waveformData[i] || 0) * this.height / 2 * intensity;
      const x = i * barWidth;
      const y = this.height / 2 - barHeight / 2;
      
      this.ctx.fillRect(x, y, barWidth - 1, barHeight);
    }
  }

  private renderFilled(waveformData: number[], intensity: number): void {
    this.ctx.beginPath();
    const sliceWidth = this.width / waveformData.length;
    let x = 0;
    
    // Start from bottom
    this.ctx.moveTo(0, this.height / 2);
    
    for (let i = 0; i < waveformData.length; i++) {
      const y = (this.height / 2) + ((waveformData[i] || 0) * this.height / 4 * intensity);
      this.ctx.lineTo(x, y);
      x += sliceWidth;
    }
    
    // Close the path
    this.ctx.lineTo(this.width, this.height / 2);
    this.ctx.closePath();
    this.ctx.fill();
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

class ParticleEffect extends VisualEffect {
  private particles: Particle[] = [];

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, effectName: string, engine: VisualEngine) {
    super(ctx, width, height, analyzer, effectName, engine);
  }

  render(): void {
    // Get parameters
    const particleCount = this.parameters.particleCount || 100;
    const color = this.parameters.color || '#ff6b6b';
    const size = this.parameters.size || 3;
    const speed = this.parameters.speed || 1;
    const trail = this.parameters.trail !== false;

    const bands = this.analyzer.getFrequencyBands();
    const beat = this.analyzer.detectBeat();

    // Clear with trail effect using background color
    const bgColor = this.engine.getBackgroundColor();
    if (trail) {
      if (bgColor.startsWith('#')) {
        const r = parseInt(bgColor.slice(1, 3), 16);
        const g = parseInt(bgColor.slice(3, 5), 16);
        const b = parseInt(bgColor.slice(5, 7), 16);
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.05)`;
      } else {
        this.ctx.fillStyle = bgColor;
      }
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = bgColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Spawn new particles based on audio
    const spawnRate = Math.floor(bands.bass * particleCount * 0.1);
    for (let i = 0; i < spawnRate && this.particles.length < particleCount; i++) {
      this.spawnParticle(beat, bands, speed);
    }

    // Update and draw particles
    this.updateParticles(bands, speed, size, color);

    // Remove dead particles
    this.particles = this.particles.filter(p => p.life > 0);
  }

  private spawnParticle(beat: any, bands: any, speed: number): void {
    const particle: Particle = {
      x: Math.random() * this.width,
      y: this.height + 50,
      vx: (Math.random() - 0.5) * 4 * speed,
      vy: -Math.random() * 8 * speed - 2,
      life: 1,
      maxLife: 60 + Math.random() * 120,
      size: 2 + Math.random() * 8,
      hue: 180 + bands.mid * 180
    };

    // Beat response
    if (beat.isBeat) {
      particle.vy *= 1.5 + beat.intensity;
      particle.size *= 1.2 + beat.intensity * 0.5;
    }

    this.particles.push(particle);
  }

  private updateParticles(bands: any, _speed: number, baseSize: number, color: string): void {
    for (const particle of this.particles) {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Add gravity and air resistance
      particle.vy += 0.1;
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Update life
      particle.life -= 1 / particle.maxLife;

      // Audio reactivity
      const audioInfluence = (bands.treble + bands.highMid) * 0.5;
      const currentSize = particle.size * (baseSize / 3) * (1 + audioInfluence);

      // Draw particle
      const alpha = particle.life;
      
      // Use parameter color or dynamic color
      let particleColor: string;
      if (color.startsWith('#')) {
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        particleColor = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else {
        // Dynamic color
        particleColor = `hsla(${particle.hue}, 70%, 60%, ${alpha})`;
      }

      this.ctx.fillStyle = particleColor;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
      this.ctx.fill();

      // Add glow effect
      if (bands.bass > 0.3) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = particleColor;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    }
  }
}

class GeometricEffect extends VisualEffect {
  private time = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, effectName: string, engine: VisualEngine) {
    super(ctx, width, height, analyzer, effectName, engine);
  }

  render(): void {
    this.time += 0.016; // ~60fps

    // Get parameters
    const shape = this.parameters.shape || 'circles';
    const color = this.parameters.color || '#4ecdc4';
    const baseSize = this.parameters.size || 50;
    const rotation = this.parameters.rotation || 0;
    const complexity = this.parameters.complexity || 5;

    const bands = this.analyzer.getFrequencyBands();
    const beat = this.analyzer.detectBeat();

    // Clear canvas with background color
    this.clear();

    // Set base color
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;

    // Audio-reactive size and rotation
    const audioSize = baseSize * (1 + bands.bass * 2);
    const audioRotation = rotation + this.time * 50 + bands.mid * 360;
    const beatScale = beat.isBeat ? 1.3 + beat.intensity * 0.5 : 1;

    // Draw multiple layers based on complexity
    for (let layer = 0; layer < complexity; layer++) {
      const layerScale = (layer + 1) / complexity;
      const layerAlpha = 1 - (layer * 0.15);
      
      // Set transparency
      this.ctx.globalAlpha = layerAlpha;
      
      // Position in center
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      
      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate((audioRotation + layer * 30) * Math.PI / 180);
      this.ctx.scale(beatScale * layerScale, beatScale * layerScale);

      switch (shape) {
        case 'circles':
          this.drawConcentricCircles(audioSize, bands, layer);
          break;
        case 'squares':
          this.drawRotatingSquares(audioSize, bands, layer);
          break;
        case 'triangles':
          this.drawTrianglePattern(audioSize, bands, layer);
          break;
        case 'hexagons':
          this.drawHexagonPattern(audioSize, bands, layer);
          break;
        default:
          this.drawConcentricCircles(audioSize, bands, layer);
      }

      this.ctx.restore();
    }

    this.ctx.globalAlpha = 1;
  }

  private drawConcentricCircles(size: number, bands: any, layer: number): void {
    const ringCount = 5 + layer;
    for (let i = 0; i < ringCount; i++) {
      const radius = (size / ringCount) * (i + 1) * (1 + bands.treble);
      const lineWidth = 2 + bands.highMid * 8;
      
      this.ctx.lineWidth = lineWidth;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private drawRotatingSquares(size: number, bands: any, layer: number): void {
    const squareCount = 4 + layer;
    for (let i = 0; i < squareCount; i++) {
      const squareSize = (size / squareCount) * (i + 1) * (1 + bands.bass);
      const rotationOffset = (this.time * 30 + i * 45) * Math.PI / 180;
      
      this.ctx.save();
      this.ctx.rotate(rotationOffset);
      this.ctx.lineWidth = 2 + bands.mid * 6;
      this.ctx.strokeRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);
      this.ctx.restore();
    }
  }

  private drawTrianglePattern(size: number, bands: any, _layer: number): void {
    const triangleCount = 6;
    const radius = size * (1 + bands.lowMid);
    
    for (let i = 0; i < triangleCount; i++) {
      const angle = (i / triangleCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(angle + this.time);
      
      const triangleSize = 20 + bands.treble * 30;
      this.ctx.lineWidth = 2 + bands.highMid * 4;
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, -triangleSize / 2);
      this.ctx.lineTo(-triangleSize / 2, triangleSize / 2);
      this.ctx.lineTo(triangleSize / 2, triangleSize / 2);
      this.ctx.closePath();
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  private drawHexagonPattern(size: number, bands: any, _layer: number): void {
    const hexRadius = size * (1 + bands.bass * 0.5);
    const sides = 6;
    
    // Main hexagon
    this.ctx.lineWidth = 3 + bands.mid * 8;
    this.ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x = Math.cos(angle) * hexRadius;
      const y = Math.sin(angle) * hexRadius;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    // Inner pattern
    const innerRadius = hexRadius * 0.6;
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const x1 = 0;
      const y1 = 0;
      const x2 = Math.cos(angle) * innerRadius * (1 + bands.treble);
      const y2 = Math.sin(angle) * innerRadius * (1 + bands.treble);
      
      this.ctx.lineWidth = 1 + bands.highMid * 3;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }
}

class GradientEffect extends VisualEffect {
  private time = 0;
  private waveOffset = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, effectName: string, engine: VisualEngine) {
    super(ctx, width, height, analyzer, effectName, engine);
  }

  render(): void {
    this.time += 0.016;

    // Get parameters
    const color1 = this.parameters.color1 || '#667eea';
    const color2 = this.parameters.color2 || '#764ba2';
    const direction = this.parameters.direction || 'vertical';
    const speed = this.parameters.speed || 1;
    const waves = this.parameters.waves !== false;

    const bands = this.analyzer.getFrequencyBands();
    const beat = this.analyzer.detectBeat();

    // Update wave offset
    this.waveOffset += speed * 2;

    // Clear canvas with background color
    this.ctx.fillStyle = this.engine.getBackgroundColor();
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Create base gradient
    const gradient = this.createGradient(color1, color2, direction, bands);
    
    if (waves) {
      this.renderWaveGradient(gradient, bands, beat, []);
    } else {
      this.renderStaticGradient(gradient, bands, beat);
    }
  }

  private createGradient(color1: string, color2: string, direction: string, bands: any): CanvasGradient {
    let gradient: CanvasGradient;

    // Audio-reactive gradient positioning
    const bassShift = bands.bass * 0.3;
    const trebleShift = bands.treble * 0.3;

    switch (direction) {
      case 'horizontal':
        gradient = this.ctx.createLinearGradient(0, 0, this.width, 0);
        break;
      case 'vertical':
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        break;
      case 'diagonal':
        gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        break;
      case 'radial':
        const centerX = this.width / 2 + bassShift * this.width;
        const centerY = this.height / 2 + trebleShift * this.height;
        const radius = Math.min(this.width, this.height) / 2 * (1 + bands.mid);
        gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        break;
      default:
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    }

    // Add audio-reactive color stops
    const midPoint = 0.5 + bands.mid * 0.3 - bands.bass * 0.2;
    gradient.addColorStop(0, color1);
    gradient.addColorStop(Math.max(0.1, Math.min(0.9, midPoint)), this.blendColors(color1, color2, 0.5));
    gradient.addColorStop(1, color2);

    return gradient;
  }

  private renderStaticGradient(gradient: CanvasGradient, _bands: any, beat: any): void {
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Add beat pulse effect
    if (beat.isBeat) {
      this.ctx.globalAlpha = 0.3 * beat.intensity;
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.globalAlpha = 1;
    }
  }

  private renderWaveGradient(gradient: CanvasGradient, bands: any, beat: any, _waveformData: number[]): void {
    // Create wave distortion
    const amplitude = 50 + bands.bass * 200;
    const frequency = 0.01 + bands.treble * 0.02;
    
    // Draw gradient in strips with wave distortion
    const stripHeight = 4;
    for (let y = 0; y < this.height; y += stripHeight) {
      const waveX = Math.sin((y * frequency) + (this.waveOffset * 0.01)) * amplitude;
      const beatWaveX = beat.isBeat ? waveX * (1 + beat.intensity) : waveX;
      
      // Audio-reactive width
      const audioWidth = this.width + bands.mid * 100;
      
      this.ctx.save();
      this.ctx.translate(beatWaveX, 0);
      
      // Create clipping path for this strip
      this.ctx.beginPath();
      this.ctx.rect(-amplitude - 50, y, audioWidth + amplitude + 100, stripHeight);
      this.ctx.clip();
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(-amplitude - 50, 0, audioWidth + amplitude + 100, this.height);
      
      this.ctx.restore();
    }

    // Add frequency bars overlay
    this.renderFrequencyBars(bands, beat);
  }

  private renderFrequencyBars(bands: any, _beat: any): void {
    const barCount = 20;
    const barWidth = this.width / barCount;
    
    this.ctx.globalAlpha = 0.4;
    
    for (let i = 0; i < barCount; i++) {
      const frequency = Object.values(bands)[i % 5] as number;
      const height = frequency * this.height * 0.5;
      const x = i * barWidth;
      const y = this.height - height;
      
      // Gradient for bars
      const barGradient = this.ctx.createLinearGradient(x, y, x, this.height);
      barGradient.addColorStop(0, `rgba(255, 255, 255, ${frequency})`);
      barGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
      
      this.ctx.fillStyle = barGradient;
      this.ctx.fillRect(x, y, barWidth - 1, height);
    }
    
    this.ctx.globalAlpha = 1;
  }

  private blendColors(color1: string, color2: string, ratio: number): string {
    // Simple color blending - convert hex to rgb and blend
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
}

interface Object3D {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
  type: 'cube' | 'sphere' | 'pyramid' | 'torus';
  color: string;
  velocity: {
    x: number;
    y: number;
    z: number;
    rotX: number;
    rotY: number;
    rotZ: number;
  };
}

class ThreeDEffect extends VisualEffect {
  private objects: Object3D[] = [];
  private time = 0;
  private perspective = 800;
  private centerX: number;
  private centerY: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, effectName: string, engine: VisualEngine) {
    super(ctx, width, height, analyzer, effectName, engine);
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.initializeObjects();
  }

  private initializeObjects(): void {
    const objectTypes: ('cube' | 'sphere' | 'pyramid' | 'torus')[] = ['cube', 'sphere', 'pyramid', 'torus'];
    
    for (let i = 0; i < 12; i++) {
      const randomType = objectTypes[Math.floor(Math.random() * objectTypes.length)] as 'cube' | 'sphere' | 'pyramid' | 'torus';
      const object: Object3D = {
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        z: Math.random() * 500 + 200,
        rotationX: Math.random() * Math.PI * 2,
        rotationY: Math.random() * Math.PI * 2,
        rotationZ: Math.random() * Math.PI * 2,
        scale: 20 + Math.random() * 40,
        type: randomType,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          z: (Math.random() - 0.5) * 2,
          rotX: (Math.random() - 0.5) * 0.1,
          rotY: (Math.random() - 0.5) * 0.1,
          rotZ: (Math.random() - 0.5) * 0.1,
        }
      };
      this.objects.push(object);
    }
  }

  render(): void {
    this.time += 0.016;

    // Get parameters
    const objectType = this.parameters.object || 'cube';
    const color = this.parameters.color || null;
    const rotationSpeed = this.parameters.rotationSpeed || 1;
    const objectCount = 8;
    const movement = true;

    const bands = this.analyzer.getFrequencyBands();
    const beat = this.analyzer.detectBeat();

    // Clear canvas with fade effect using background color
    this.clear();

    // Audio-reactive perspective
    this.perspective = 800 + bands.bass * 400;

    // Limit object count
    while (this.objects.length > objectCount) {
      this.objects.pop();
    }
    while (this.objects.length < objectCount) {
      this.addRandomObject();
    }

    // Update and render objects
    this.objects.forEach((obj) => {
      this.updateObject(obj, bands, beat, rotationSpeed, movement);
      this.renderObject(obj, bands, beat, color, objectType);
    });

    // Add audio-reactive lighting effects
    this.renderLightingEffects(bands, beat);
  }

  private addRandomObject(): void {
    const objectTypes: ('cube' | 'sphere' | 'pyramid' | 'torus')[] = ['cube', 'sphere', 'pyramid', 'torus'];
    const randomType = objectTypes[Math.floor(Math.random() * objectTypes.length)] as 'cube' | 'sphere' | 'pyramid' | 'torus';
    
    const object: Object3D = {
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
      z: Math.random() * 500 + 200,
      rotationX: Math.random() * Math.PI * 2,
      rotationY: Math.random() * Math.PI * 2,
      rotationZ: Math.random() * Math.PI * 2,
      scale: 20 + Math.random() * 40,
      type: randomType,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
        z: (Math.random() - 0.5) * 2,
        rotX: (Math.random() - 0.5) * 0.1,
        rotY: (Math.random() - 0.5) * 0.1,
        rotZ: (Math.random() - 0.5) * 0.1,
      }
    };
    this.objects.push(object);
  }

  private updateObject(obj: Object3D, bands: any, beat: any, rotationSpeed: number, movement: boolean): void {
    // Audio-reactive rotation
    const audioRotationMultiplier = 1 + (bands.treble + bands.highMid) * 2;
    obj.rotationX += obj.velocity.rotX * rotationSpeed * audioRotationMultiplier;
    obj.rotationY += obj.velocity.rotY * rotationSpeed * audioRotationMultiplier;
    obj.rotationZ += obj.velocity.rotZ * rotationSpeed * audioRotationMultiplier;

    // Movement
    if (movement) {
      obj.x += obj.velocity.x * (1 + bands.lowMid);
      obj.y += obj.velocity.y * (1 + bands.mid);
      obj.z += obj.velocity.z * (1 + bands.bass * 0.5);

      // Boundary checks
      if (Math.abs(obj.x) > 300) obj.velocity.x *= -1;
      if (Math.abs(obj.y) > 300) obj.velocity.y *= -1;
      if (obj.z < 100 || obj.z > 800) obj.velocity.z *= -1;
    }

    // Beat response
    if (beat.isBeat) {
      obj.scale *= 1.2 + beat.intensity * 0.3;
      setTimeout(() => {
        obj.scale /= 1.2 + beat.intensity * 0.3;
      }, 100);
    }

    // Audio-reactive positioning
    const audioOffset = Math.sin(this.time + bands.bass * Math.PI) * 50;
    obj.x += Math.cos(this.time * 0.5) * audioOffset * 0.1;
    obj.y += Math.sin(this.time * 0.3) * audioOffset * 0.1;
  }

  private renderObject(obj: Object3D, bands: any, beat: any, paramColor: string | null, objectType: string): void {
    // 3D to 2D projection
    const projected = this.project3D(obj);
    if (!projected) return;

    const { x, y, scale } = projected;

    // Audio-reactive size
    const audioScale = scale * (1 + bands.bass * 0.5 + (beat.isBeat ? beat.intensity * 0.5 : 0));

    // Color selection
    const renderColor = paramColor || obj.color;
    
    // Audio-reactive color intensity
    const colorIntensity = 0.6 + (bands.treble + bands.highMid) * 0.4;
    let finalColor: string;
    
    if (renderColor.startsWith('#')) {
      // Convert hex to rgba with audio-reactive alpha
      const r = parseInt(renderColor.slice(1, 3), 16);
      const g = parseInt(renderColor.slice(3, 5), 16);
      const b = parseInt(renderColor.slice(5, 7), 16);
      finalColor = `rgba(${r}, ${g}, ${b}, ${colorIntensity})`;
    } else {
      finalColor = renderColor;
    }

    this.ctx.fillStyle = finalColor;
    this.ctx.strokeStyle = finalColor;
    this.ctx.lineWidth = 2 + bands.mid * 4;

    // Render based on type
    const typeToRender = objectType === 'mixed' ? obj.type : objectType;
    
    switch (typeToRender) {
      case 'cube':
        this.renderCube(x, y, audioScale, obj);
        break;
      case 'sphere':
        this.renderSphere(x, y, audioScale);
        break;
      case 'pyramid':
        this.renderPyramid(x, y, audioScale, obj);
        break;
      case 'torus':
        this.renderTorus(x, y, audioScale, obj);
        break;
      default:
        this.renderCube(x, y, audioScale, obj);
    }

    // Add glow effect for beats
    if (beat.isBeat) {
      this.ctx.shadowBlur = 20 * beat.intensity;
      this.ctx.shadowColor = finalColor;
      this.ctx.beginPath();
      this.ctx.arc(x, y, audioScale * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  private project3D(obj: Object3D): { x: number; y: number; scale: number } | null {
    if (obj.z <= 0) return null;

    const scale = this.perspective / (this.perspective + obj.z);
    const x = this.centerX + obj.x * scale;
    const y = this.centerY + obj.y * scale;

    return { x, y, scale: obj.scale * scale };
  }

  private renderCube(x: number, y: number, size: number, obj: Object3D): void {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(obj.rotationZ);

    // Simple 2D representation of a 3D cube
    const halfSize = size / 2;
    
    // Back face (darker)
    this.ctx.globalAlpha = 0.6;
    this.ctx.fillRect(-halfSize + 5, -halfSize + 5, size, size);
    
    // Front face
    this.ctx.globalAlpha = 1;
    this.ctx.fillRect(-halfSize, -halfSize, size, size);
    this.ctx.strokeRect(-halfSize, -halfSize, size, size);

    // Side face
    this.ctx.globalAlpha = 0.8;
    this.ctx.beginPath();
    this.ctx.moveTo(halfSize, -halfSize);
    this.ctx.lineTo(halfSize + 5, -halfSize + 5);
    this.ctx.lineTo(halfSize + 5, halfSize + 5);
    this.ctx.lineTo(halfSize, halfSize);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Top face
    this.ctx.beginPath();
    this.ctx.moveTo(-halfSize, -halfSize);
    this.ctx.lineTo(-halfSize + 5, -halfSize + 5);
    this.ctx.lineTo(halfSize + 5, -halfSize + 5);
    this.ctx.lineTo(halfSize, -halfSize);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderSphere(x: number, y: number, size: number): void {
    this.ctx.save();
    this.ctx.translate(x, y);

    // Create radial gradient for 3D effect
    const gradient = this.ctx.createRadialGradient(-size * 0.3, -size * 0.3, 0, 0, 0, size);
    gradient.addColorStop(0, this.ctx.fillStyle as string);
    gradient.addColorStop(0.7, this.adjustColorBrightness(this.ctx.fillStyle as string, -0.3));
    gradient.addColorStop(1, this.adjustColorBrightness(this.ctx.fillStyle as string, -0.6));

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderPyramid(x: number, y: number, size: number, obj: Object3D): void {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(obj.rotationZ);

    const halfSize = size / 2;
    
    // Base (darker)
    this.ctx.globalAlpha = 0.7;
    this.ctx.beginPath();
    this.ctx.moveTo(-halfSize, halfSize);
    this.ctx.lineTo(halfSize, halfSize);
    this.ctx.lineTo(halfSize + 3, halfSize + 3);
    this.ctx.lineTo(-halfSize + 3, halfSize + 3);
    this.ctx.closePath();
    this.ctx.fill();

    // Front face
    this.ctx.globalAlpha = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(-halfSize, halfSize);
    this.ctx.lineTo(0, -halfSize);
    this.ctx.lineTo(halfSize, halfSize);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Side face
    this.ctx.globalAlpha = 0.8;
    this.ctx.beginPath();
    this.ctx.moveTo(halfSize, halfSize);
    this.ctx.lineTo(0, -halfSize);
    this.ctx.lineTo(halfSize + 3, halfSize + 3);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderTorus(x: number, y: number, size: number, obj: Object3D): void {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(obj.rotationZ);

    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    
    // Outer circle
    this.ctx.lineWidth = (outerRadius - innerRadius);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, (outerRadius + innerRadius) / 2, 0, Math.PI * 2);
    this.ctx.stroke();

    // Add 3D effect with ellipses
    this.ctx.globalAlpha = 0.7;
    this.ctx.scale(1, 0.3);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private renderLightingEffects(bands: any, beat: any): void {
    // Ambient lighting effect based on audio
    const ambientIntensity = (bands.bass + bands.mid + bands.treble) / 3;
    this.ctx.globalAlpha = ambientIntensity * 0.1;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = 1;

    // Beat flash effect
    if (beat.isBeat) {
      this.ctx.globalAlpha = beat.intensity * 0.2;
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.globalAlpha = 1;
    }
  }

  private adjustColorBrightness(color: string, amount: number): string {
    // Simple brightness adjustment for rgba colors
    if (color.startsWith('rgba')) {
      const matches = color.match(/rgba?\(([^)]+)\)/);
      if (matches && matches[1]) {
        const values = matches[1].split(',').map(v => parseFloat(v.trim()));
        if (values.length >= 3 && values[0] !== undefined && values[1] !== undefined && values[2] !== undefined) {
          const r = Math.max(0, Math.min(255, values[0] + (amount * 255)));
          const g = Math.max(0, Math.min(255, values[1] + (amount * 255)));
          const b = Math.max(0, Math.min(255, values[2] + (amount * 255)));
          const a = values[3] || 1;
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
      }
    }
    return color;
  }
}