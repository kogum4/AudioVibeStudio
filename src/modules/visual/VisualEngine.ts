import { AudioAnalyzer } from '../audio/AudioAnalyzer';

export abstract class VisualEffect {
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;
  protected analyzer: AudioAnalyzer;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.analyzer = analyzer;
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
        this.currentEffect = new WaveformEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer);
        break;
      case 'particles':
        // TODO: Implement particle effect
        break;
      case 'geometric':
        // TODO: Implement geometric effect
        break;
      case 'gradient':
        // TODO: Implement gradient effect
        break;
      case '3d':
        // TODO: Implement 3D effect
        break;
      default:
        this.currentEffect = new WaveformEffect(this.ctx, this.canvas.width, this.canvas.height, this.analyzer);
    }
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
  private lineWidth: number = 3;

  render(): void {
    this.clear();
    
    const waveformData = this.analyzer.getWaveformData();
    const bands = this.analyzer.getFrequencyBands();
    const beat = this.analyzer.detectBeat();
    
    // Dynamic color based on frequency bands
    const hue = 180 + bands.bass * 60 - bands.treble * 30;
    const saturation = 50 + bands.mid * 50;
    const lightness = 40 + bands.highMid * 30;
    this.ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    // Dynamic line width based on beat
    this.ctx.lineWidth = this.lineWidth + (beat.isBeat ? 10 : 0) * beat.intensity;
    
    // Draw waveform
    this.ctx.beginPath();
    const sliceWidth = this.width / waveformData.length;
    let x = 0;
    
    for (let i = 0; i < waveformData.length; i++) {
      const y = (this.height / 2) + ((waveformData[i] || 0) * this.height / 4);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    this.ctx.stroke();
    
    // Add glow effect on beat
    if (beat.isBeat) {
      this.ctx.shadowBlur = 20 * beat.intensity;
      this.ctx.shadowColor = this.ctx.strokeStyle as string;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
  }
}