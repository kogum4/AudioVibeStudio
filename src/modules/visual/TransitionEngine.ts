import { AudioAnalyzer } from '../audio/AudioAnalyzer';

export interface Transition {
  id: string;
  name: string;
  type: 'fade' | 'slide' | 'zoom' | 'rotation' | 'blur' | 'pixelate' | 'wipe' | 'dissolve';
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
  direction?: 'left' | 'right' | 'up' | 'down' | 'center';
  audioReactive: boolean;
  parameters: { [key: string]: any };
}

export interface TransitionState {
  isActive: boolean;
  currentTransition: Transition | null;
  progress: number;
  startTime: number;
  fromEffect: string;
  toEffect: string;
}

export class TransitionEngine {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private analyzer: AudioAnalyzer;
  private state: TransitionState;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.analyzer = analyzer;
    
    // Create offscreen canvas for transition effects
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    const offscreenCtx = this.offscreenCanvas.getContext('2d');
    if (!offscreenCtx) {
      throw new Error('Failed to create offscreen context');
    }
    this.offscreenCtx = offscreenCtx;

    this.state = {
      isActive: false,
      currentTransition: null,
      progress: 0,
      startTime: 0,
      fromEffect: '',
      toEffect: ''
    };
  }

  startTransition(transition: Transition, fromEffect: string, toEffect: string): void {
    this.state = {
      isActive: true,
      currentTransition: transition,
      progress: 0,
      startTime: Date.now(),
      fromEffect,
      toEffect
    };
  }

  update(): void {
    if (!this.state.isActive || !this.state.currentTransition) return;

    const elapsed = Date.now() - this.state.startTime;
    let progress = elapsed / this.state.currentTransition.duration;

    // Apply easing
    progress = this.applyEasing(progress, this.state.currentTransition.easing);

    // Audio-reactive modifications
    if (this.state.currentTransition.audioReactive) {
      const bands = this.analyzer.getFrequencyBands();
      const beat = this.analyzer.detectBeat();
      
      // Modify progress based on audio
      if (beat.isBeat) {
        progress += beat.intensity * 0.1;
      }
      
      // Add subtle audio-reactive fluctuations
      progress += (bands.treble - 0.5) * 0.05;
    }

    progress = Math.max(0, Math.min(1, progress));
    this.state.progress = progress;

    // Complete transition
    if (progress >= 1) {
      this.state.isActive = false;
      this.state.currentTransition = null;
    }
  }

  render(fromFrame: ImageData, toFrame: ImageData): void {
    if (!this.state.isActive || !this.state.currentTransition) {
      // No transition, just render the to frame
      this.ctx.putImageData(toFrame, 0, 0);
      return;
    }

    // Apply the specific transition effect
    switch (this.state.currentTransition.type) {
      case 'fade':
        this.renderFadeTransition(fromFrame, toFrame);
        break;
      case 'slide':
        this.renderSlideTransition(fromFrame, toFrame);
        break;
      case 'zoom':
        this.renderZoomTransition(fromFrame, toFrame);
        break;
      case 'rotation':
        this.renderRotationTransition(fromFrame, toFrame);
        break;
      case 'blur':
        this.renderBlurTransition(fromFrame, toFrame);
        break;
      case 'pixelate':
        this.renderPixelateTransition(fromFrame, toFrame);
        break;
      case 'wipe':
        this.renderWipeTransition(fromFrame, toFrame);
        break;
      case 'dissolve':
        this.renderDissolveTransition(fromFrame, toFrame);
        break;
      default:
        this.renderFadeTransition(fromFrame, toFrame);
    }
  }

  isTransitioning(): boolean {
    return this.state.isActive;
  }

  getProgress(): number {
    return this.state.progress;
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'bounce':
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
          return n1 * t * t;
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      default:
        return t;
    }
  }

  private renderFadeTransition(fromFrame: ImageData, toFrame: ImageData): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw from frame with decreasing opacity
    this.ctx.globalAlpha = 1 - this.state.progress;
    this.ctx.putImageData(fromFrame, 0, 0);
    
    // Draw to frame with increasing opacity
    this.ctx.globalAlpha = this.state.progress;
    this.ctx.putImageData(toFrame, 0, 0);
    
    // Reset alpha
    this.ctx.globalAlpha = 1;
  }

  private renderSlideTransition(fromFrame: ImageData, toFrame: ImageData): void {
    const direction = this.state.currentTransition?.direction || 'left';
    let fromX = 0, fromY = 0, toX = 0, toY = 0;

    switch (direction) {
      case 'left':
        fromX = -this.width * this.state.progress;
        toX = this.width * (1 - this.state.progress);
        break;
      case 'right':
        fromX = this.width * this.state.progress;
        toX = -this.width * (1 - this.state.progress);
        break;
      case 'up':
        fromY = -this.height * this.state.progress;
        toY = this.height * (1 - this.state.progress);
        break;
      case 'down':
        fromY = this.height * this.state.progress;
        toY = -this.height * (1 - this.state.progress);
        break;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw frames at calculated positions
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    this.offscreenCtx.putImageData(fromFrame, 0, 0);
    this.ctx.drawImage(this.offscreenCanvas, fromX, fromY);
    
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    this.offscreenCtx.putImageData(toFrame, 0, 0);
    this.ctx.drawImage(this.offscreenCanvas, toX, toY);
  }

  private renderZoomTransition(fromFrame: ImageData, toFrame: ImageData): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Zoom out from frame, zoom in to frame
    const fromScale = 1 + this.state.progress * 0.5;
    const toScale = 0.5 + this.state.progress * 0.5;
    
    this.ctx.save();
    
    // Draw from frame (zooming out)
    this.ctx.globalAlpha = 1 - this.state.progress;
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(fromScale, fromScale);
    this.ctx.translate(-this.width / 2, -this.height / 2);
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    this.offscreenCtx.putImageData(fromFrame, 0, 0);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    
    this.ctx.restore();
    this.ctx.save();
    
    // Draw to frame (zooming in)
    this.ctx.globalAlpha = this.state.progress;
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(toScale, toScale);
    this.ctx.translate(-this.width / 2, -this.height / 2);
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    this.offscreenCtx.putImageData(toFrame, 0, 0);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    
    this.ctx.restore();
    this.ctx.globalAlpha = 1;
  }

  private renderRotationTransition(fromFrame: ImageData, toFrame: ImageData): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    const rotation = this.state.progress * Math.PI;
    
    this.ctx.save();
    
    // Draw from frame (rotating out)
    this.ctx.globalAlpha = 1 - this.state.progress;
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.rotate(-rotation);
    this.ctx.translate(-this.width / 2, -this.height / 2);
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    this.offscreenCtx.putImageData(fromFrame, 0, 0);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    
    this.ctx.restore();
    this.ctx.save();
    
    // Draw to frame (rotating in)
    this.ctx.globalAlpha = this.state.progress;
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.rotate(Math.PI - rotation);
    this.ctx.translate(-this.width / 2, -this.height / 2);
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    this.offscreenCtx.putImageData(toFrame, 0, 0);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    
    this.ctx.restore();
    this.ctx.globalAlpha = 1;
  }

  private renderBlurTransition(fromFrame: ImageData, toFrame: ImageData): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Apply blur effect using CSS filter
    const blurAmount = Math.sin(this.state.progress * Math.PI) * 10;
    
    this.ctx.save();
    this.ctx.filter = `blur(${blurAmount}px)`;
    
    // Crossfade with blur
    this.ctx.globalAlpha = 1 - this.state.progress;
    this.ctx.putImageData(fromFrame, 0, 0);
    
    this.ctx.globalAlpha = this.state.progress;
    this.ctx.putImageData(toFrame, 0, 0);
    
    this.ctx.restore();
    this.ctx.globalAlpha = 1;
  }

  private renderPixelateTransition(fromFrame: ImageData, toFrame: ImageData): void {
    const maxPixelSize = 20;
    const pixelSize = Math.sin(this.state.progress * Math.PI) * maxPixelSize + 1;
    
    // Create pixelated version
    this.offscreenCtx.clearRect(0, 0, this.width, this.height);
    
    // Crossfade
    this.offscreenCtx.globalAlpha = 1 - this.state.progress;
    this.offscreenCtx.putImageData(fromFrame, 0, 0);
    this.offscreenCtx.globalAlpha = this.state.progress;
    this.offscreenCtx.putImageData(toFrame, 0, 0);
    this.offscreenCtx.globalAlpha = 1;
    
    // Apply pixelation effect
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.imageSmoothingEnabled = false;
    
    const scaledWidth = this.width / pixelSize;
    const scaledHeight = this.height / pixelSize;
    
    // Draw small, then scale up
    this.ctx.drawImage(this.offscreenCanvas, 0, 0, scaledWidth, scaledHeight);
    this.ctx.drawImage(this.ctx.canvas, 0, 0, scaledWidth, scaledHeight, 0, 0, this.width, this.height);
    
    this.ctx.imageSmoothingEnabled = true;
  }

  private renderWipeTransition(fromFrame: ImageData, toFrame: ImageData): void {
    const direction = this.state.currentTransition?.direction || 'left';
    
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.putImageData(fromFrame, 0, 0);
    
    // Create clipping path for wipe effect
    this.ctx.save();
    this.ctx.beginPath();
    
    switch (direction) {
      case 'left':
        this.ctx.rect(0, 0, this.width * this.state.progress, this.height);
        break;
      case 'right':
        this.ctx.rect(this.width * (1 - this.state.progress), 0, this.width * this.state.progress, this.height);
        break;
      case 'up':
        this.ctx.rect(0, 0, this.width, this.height * this.state.progress);
        break;
      case 'down':
        this.ctx.rect(0, this.height * (1 - this.state.progress), this.width, this.height * this.state.progress);
        break;
      case 'center':
        const radius = Math.min(this.width, this.height) * this.state.progress * 0.7;
        this.ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        break;
    }
    
    this.ctx.clip();
    this.ctx.putImageData(toFrame, 0, 0);
    this.ctx.restore();
  }

  private renderDissolveTransition(fromFrame: ImageData, toFrame: ImageData): void {
    // Create noise-based dissolve pattern
    const fromImageData = new ImageData(fromFrame.data.slice(), fromFrame.width, fromFrame.height);
    const toImageData = new ImageData(toFrame.data.slice(), toFrame.width, toFrame.height);
    
    const threshold = this.state.progress;
    
    for (let i = 0; i < fromImageData.data.length; i += 4) {
      const noise = Math.random();
      
      if (noise < threshold) {
        // Use to frame pixel
        fromImageData.data[i] = toImageData.data[i];
        fromImageData.data[i + 1] = toImageData.data[i + 1];
        fromImageData.data[i + 2] = toImageData.data[i + 2];
        fromImageData.data[i + 3] = toImageData.data[i + 3];
      }
    }
    
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.putImageData(fromImageData, 0, 0);
  }

  // Predefined transitions
  static createFadeTransition(duration = 1000, audioReactive = false): Transition {
    return {
      id: `fade-${Date.now()}`,
      name: 'Fade',
      type: 'fade',
      duration,
      easing: 'ease-in-out',
      audioReactive,
      parameters: {}
    };
  }

  static createSlideTransition(direction: 'left' | 'right' | 'up' | 'down' = 'left', duration = 1000, audioReactive = false): Transition {
    return {
      id: `slide-${Date.now()}`,
      name: `Slide ${direction}`,
      type: 'slide',
      duration,
      easing: 'ease-out',
      direction,
      audioReactive,
      parameters: { direction }
    };
  }

  static createZoomTransition(duration = 1000, audioReactive = true): Transition {
    return {
      id: `zoom-${Date.now()}`,
      name: 'Zoom',
      type: 'zoom',
      duration,
      easing: 'ease-in-out',
      audioReactive,
      parameters: {}
    };
  }

  static createRotationTransition(duration = 1500, audioReactive = true): Transition {
    return {
      id: `rotation-${Date.now()}`,
      name: 'Rotation',
      type: 'rotation',
      duration,
      easing: 'ease-in-out',
      audioReactive,
      parameters: {}
    };
  }

  static createWipeTransition(direction: 'left' | 'right' | 'up' | 'down' | 'center' = 'center', duration = 800, audioReactive = false): Transition {
    return {
      id: `wipe-${Date.now()}`,
      name: `Wipe ${direction}`,
      type: 'wipe',
      duration,
      easing: 'ease-in-out',
      direction,
      audioReactive,
      parameters: { direction }
    };
  }

  static createDissolveTransition(duration = 1200, audioReactive = false): Transition {
    return {
      id: `dissolve-${Date.now()}`,
      name: 'Dissolve',
      type: 'dissolve',
      duration,
      easing: 'linear',
      audioReactive,
      parameters: {}
    };
  }
}