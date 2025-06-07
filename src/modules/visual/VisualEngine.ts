import { AudioAnalyzer } from '../audio/AudioAnalyzer';
import { effectParameterManager, EffectParameter } from './EffectParameters';

export abstract class VisualEffect {
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;
  protected analyzer: AudioAnalyzer;
  protected parameters: EffectParameter = {};
  protected effectName: string;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, effectName: string) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.analyzer = analyzer;
    this.effectName = effectName;
    this.parameters = effectParameterManager.getParameters(effectName);
    
    // Listen for parameter changes
    effectParameterManager.addParameterListener(effectName, (params) => {
      this.parameters = params;
    });
  }

  abstract render(): void;
  
  protected clear(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.analyzer = new AudioAnalyzer();
    
    // Set canvas size
    this.resize();
    window.addEventListener('resize', () => this.resize());
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
  }

  setEffect(effectType: string): void {
    switch (effectType) {
      case 'waveform':
        this.currentEffect = new WaveformEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'waveform');
        break;
      case 'particles':
        this.currentEffect = new ParticleEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'particles');
        break;
      case 'geometric':
        this.currentEffect = new GeometricEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'geometric');
        break;
      case 'gradient':
        this.currentEffect = new GradientEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'gradient');
        break;
      case '3d':
        // TODO: Implement 3D effect
        break;
      default:
        this.currentEffect = new WaveformEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer, 'waveform');
    }
  }

  getParameterManager() {
    return effectParameterManager;
  }

  start(): void {
    if (this.isRunning) return;
    
    if (!this.currentEffect) {
      this.setEffect('waveform');
    }
    
    this.isRunning = true;
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(): void {
    if (!this.isRunning) return;

    this.currentEffect?.render();
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', () => this.resize());
  }
}

class WaveformEffect extends VisualEffect {
  render(): void {
    this.clear();
    
    const waveformData = this.analyzer.getWaveformData();
    const bands = this.analyzer.getFrequencyBands();
    const beat = this.analyzer.detectBeat();
    
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

  render(): void {
    // Get parameters
    const particleCount = this.parameters.particleCount || 100;
    const color = this.parameters.color || '#ff6b6b';
    const size = this.parameters.size || 3;
    const speed = this.parameters.speed || 1;
    const trail = this.parameters.trail !== false;

    const bands = this.analyzer.getFrequencyBands();
    const beat = this.analyzer.detectBeat();

    // Clear with trail effect
    if (trail) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
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

    // Clear canvas
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

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

    // Clear canvas
    this.ctx.fillStyle = 'black';
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