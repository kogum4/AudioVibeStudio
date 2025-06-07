import { AudioAnalyzer } from '../audio/AudioAnalyzer';
import { TextOverlay, TextAnimation, Point2D } from '../../types/visual';

export class TextRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private analyzer: AudioAnalyzer;
  private overlays: TextOverlay[] = [];
  private animationTime = 0;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.analyzer = analyzer;
  }

  addTextOverlay(overlay: TextOverlay): void {
    this.overlays.push(overlay);
  }

  removeTextOverlay(id: string): void {
    this.overlays = this.overlays.filter(overlay => overlay.id !== id);
  }

  updateTextOverlay(id: string, updates: Partial<TextOverlay>): void {
    const overlay = this.overlays.find(o => o.id === id);
    if (overlay) {
      Object.assign(overlay, updates);
    }
  }

  getTextOverlays(): TextOverlay[] {
    return [...this.overlays];
  }

  clearAllOverlays(): void {
    this.overlays = [];
  }

  render(currentTime: number): void {
    this.animationTime += 0.016; // ~60fps

    const bands = this.analyzer.getFrequencyBands();
    const beat = this.analyzer.detectBeat();

    for (const overlay of this.overlays) {
      if (this.shouldRenderOverlay(overlay, currentTime)) {
        this.renderTextOverlay(overlay, currentTime, bands, beat);
      }
    }
  }

  private shouldRenderOverlay(overlay: TextOverlay, currentTime: number): boolean {
    const { startTime, endTime } = overlay.timing;
    
    if (currentTime < startTime) return false;
    if (endTime > 0 && currentTime > endTime && !overlay.timing.loop) return false;
    
    return true;
  }

  private renderTextOverlay(overlay: TextOverlay, currentTime: number, bands: any, beat: any): void {
    this.ctx.save();

    // Calculate animation progress
    const animationProgress = this.calculateAnimationProgress(overlay, currentTime);
    
    // Apply text style
    this.applyTextStyle(overlay, bands, beat);
    
    // Calculate position with animation
    const position = this.calculateAnimatedPosition(overlay, animationProgress, bands, beat);
    
    // Calculate opacity with animation
    const opacity = this.calculateAnimatedOpacity(overlay, animationProgress, bands, beat);
    
    // Apply transformations
    this.ctx.globalAlpha = opacity;
    this.ctx.translate(position.x, position.y);
    this.ctx.rotate((overlay.rotation * Math.PI) / 180);

    // Render text based on animation type
    this.renderAnimatedText(overlay, animationProgress, bands, beat);

    this.ctx.restore();
  }

  private applyTextStyle(overlay: TextOverlay, bands: any, beat: any): void {
    const { style, fontSize, fontFamily, color } = overlay;
    
    // Build font string
    let fontString = '';
    if (style.bold) fontString += 'bold ';
    if (style.italic) fontString += 'italic ';
    fontString += `${fontSize}px ${fontFamily}`;
    
    this.ctx.font = fontString;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Set fill color
    if (style.gradient && style.gradientColors.length > 1) {
      const gradient = this.createTextGradient(overlay, bands);
      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = color;
    }

    // Set stroke style
    if (style.stroke) {
      this.ctx.strokeStyle = style.strokeColor;
      this.ctx.lineWidth = style.strokeWidth + (beat.isBeat ? beat.intensity * 2 : 0);
    }

    // Set shadow - removed audio reactivity to prevent jittering
    if (style.shadow) {
      this.ctx.shadowBlur = style.shadowBlur;
      this.ctx.shadowColor = style.shadowColor;
      this.ctx.shadowOffsetX = style.shadowOffset.x;
      this.ctx.shadowOffsetY = style.shadowOffset.y;
    }
  }

  private createTextGradient(overlay: TextOverlay, bands: any): CanvasGradient {
    const gradient = this.ctx.createLinearGradient(
      -overlay.fontSize * 2, 0,
      overlay.fontSize * 2, 0
    );

    const colors = overlay.style.gradientColors;
    colors.forEach((color, index) => {
      const position = index / (colors.length - 1);
      // Removed audio-reactive color shifting to prevent gradient jittering
      gradient.addColorStop(position, color);
    });

    return gradient;
  }

  private calculateAnimationProgress(overlay: TextOverlay, currentTime: number): number {
    const { animation, timing } = overlay;
    const relativeTime = currentTime - timing.startTime;
    
    if (animation.duration <= 0) return 1;
    
    let progress = Math.min(1, relativeTime / animation.duration);
    
    // Apply easing
    progress = this.applyEasing(progress, animation.easing);
    
    // Handle looping
    if (timing.loop && relativeTime > animation.duration) {
      const loopTime = (relativeTime % animation.duration) / animation.duration;
      progress = this.applyEasing(loopTime, animation.easing);
    }
    
    return Math.max(0, Math.min(1, progress));
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default:
        return t;
    }
  }

  private calculateAnimatedPosition(overlay: TextOverlay, progress: number, bands: any, beat: any): Point2D {
    let { x, y } = overlay.position;
    const { animation } = overlay;

    // Auto-positioning
    if (overlay.timing.autoPosition) {
      x = this.width / 2;
      y = this.height / 2;
    }

    // Apply animation positioning only for specific animation types
    switch (animation.type) {
      case 'slide':
        const slideDistance = this.height * 0.5;
        y += slideDistance * (1 - progress);
        break;
      case 'bounce':
        const bounceOffset = Math.sin(progress * Math.PI) * 50;
        y -= bounceOffset;
        break;
      case 'wave':
        // Only apply wave animation to specific wave text, not position
        if (animation.type === 'wave') {
          const waveOffset = Math.sin(this.animationTime * 2 + progress * Math.PI * 4) * 10;
          x += waveOffset;
        }
        break;
    }

    // Disable audio-reactive positioning to prevent jittering
    // Audio reactivity is now handled only in scaling and effects, not position

    return { x, y };
  }

  private calculateAnimatedOpacity(overlay: TextOverlay, progress: number, bands: any, beat: any): number {
    let opacity = overlay.opacity;
    const { animation } = overlay;

    // Apply animation opacity
    switch (animation.type) {
      case 'fade':
        opacity *= progress;
        break;
      case 'pulse':
        // Reduce pulse frequency for smoother animation
        const pulseOpacity = 0.8 + 0.2 * Math.sin(this.animationTime * 2);
        opacity *= pulseOpacity;
        break;
    }

    // Reduced audio-reactive opacity for stability
    if (animation.audioReactive) {
      // Smooth out audio reactive opacity to prevent flickering
      const smoothAudioOpacity = 0.9 + (bands.mid + bands.treble) * 0.1;
      opacity *= smoothAudioOpacity;
      
      if (beat.isBeat) {
        opacity = Math.min(1, opacity + beat.intensity * 0.1);
      }
    }

    return Math.max(0, Math.min(1, opacity));
  }

  private renderAnimatedText(overlay: TextOverlay, progress: number, bands: any, beat: any): void {
    const { text, animation, style } = overlay;

    switch (animation.type) {
      case 'typewriter':
        this.renderTypewriterText(text, progress, style);
        break;
      case 'wave':
        this.renderWaveText(text, bands, beat, style);
        break;
      default:
        this.renderStaticText(text, style, bands, beat);
    }
  }

  private renderTypewriterText(text: string, progress: number, style: any): void {
    const charactersToShow = Math.floor(text.length * progress);
    const visibleText = text.substring(0, charactersToShow);
    
    if (style.stroke) {
      this.ctx.strokeText(visibleText, 0, 0);
    }
    this.ctx.fillText(visibleText, 0, 0);
    
    // Cursor effect
    if (charactersToShow < text.length) {
      const cursorX = this.ctx.measureText(visibleText).width / 2;
      const cursorOpacity = Math.sin(this.animationTime * 8) > 0 ? 1 : 0;
      this.ctx.save();
      this.ctx.globalAlpha *= cursorOpacity;
      this.ctx.fillText('|', cursorX + 5, 0);
      this.ctx.restore();
    }
  }

  private renderWaveText(text: string, bands: any, beat: any, style: any): void {
    const chars = text.split('');
    let totalWidth = 0;
    
    // Calculate total width
    for (const char of chars) {
      totalWidth += this.ctx.measureText(char).width;
    }
    
    let currentX = -totalWidth / 2;
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charWidth = this.ctx.measureText(char).width;
      
      this.ctx.save();
      
      // Wave offset - reduced for stability
      const waveY = Math.sin(this.animationTime * 2 + i * 0.3) * (15 + bands.treble * 10);
      const beatScale = beat.isBeat ? 1 + beat.intensity * 0.1 : 1;
      
      this.ctx.translate(currentX + charWidth / 2, waveY);
      this.ctx.scale(beatScale, beatScale);
      
      if (style.stroke) {
        this.ctx.strokeText(char, 0, 0);
      }
      this.ctx.fillText(char, 0, 0);
      
      this.ctx.restore();
      
      currentX += charWidth;
    }
  }

  private renderStaticText(text: string, style: any, bands: any, beat: any): void {
    // Reduced audio-reactive scaling for stability
    const audioScale = 1 + (beat.isBeat ? beat.intensity * 0.05 : 0) + (bands.bass * 0.02);
    
    this.ctx.save();
    this.ctx.scale(audioScale, audioScale);
    
    if (style.stroke) {
      this.ctx.strokeText(text, 0, 0);
    }
    this.ctx.fillText(text, 0, 0);
    
    this.ctx.restore();
  }

  // Utility methods for creating common text overlays
  static createDefaultOverlay(id: string, text: string, position?: Point2D): TextOverlay {
    return {
      id,
      text,
      position: position || { x: 540, y: 960 }, // Center of 1080x1920
      fontSize: 48,
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      opacity: 1,
      rotation: 0,
      animation: {
        type: 'fade',
        duration: 1000,
        delay: 0,
        easing: 'ease-in-out',
        audioReactive: false
      },
      timing: {
        startTime: 0,
        endTime: 0,
        loop: false,
        autoPosition: false
      },
      style: {
        bold: false,
        italic: false,
        stroke: true,
        strokeWidth: 2,
        strokeColor: '#000000',
        shadow: true,
        shadowBlur: 5,
        shadowColor: '#000000',
        shadowOffset: { x: 2, y: 2 },
        gradient: false,
        gradientColors: ['#ffffff', '#cccccc']
      }
    };
  }

  static createTitleOverlay(text: string): TextOverlay {
    const overlay = TextRenderer.createDefaultOverlay('title', text, { x: 540, y: 300 });
    overlay.fontSize = 72;
    overlay.style.bold = true;
    overlay.style.gradient = true;
    overlay.style.gradientColors = ['#ff6b6b', '#4ecdc4'];
    overlay.animation.type = 'slide';
    overlay.animation.duration = 2000;
    return overlay;
  }

  static createSubtitleOverlay(text: string): TextOverlay {
    const overlay = TextRenderer.createDefaultOverlay('subtitle', text, { x: 540, y: 1620 });
    overlay.fontSize = 36;
    overlay.animation.type = 'typewriter';
    overlay.animation.duration = 3000;
    overlay.timing.startTime = 1000;
    return overlay;
  }

  static createBeatTextOverlay(text: string): TextOverlay {
    const overlay = TextRenderer.createDefaultOverlay('beat-text', text);
    overlay.fontSize = 64;
    overlay.style.bold = true;
    overlay.animation.type = 'pulse';
    overlay.animation.audioReactive = true;
    overlay.style.gradient = true;
    overlay.style.gradientColors = ['#ff9a9e', '#fecfef', '#fecfef'];
    return overlay;
  }
}