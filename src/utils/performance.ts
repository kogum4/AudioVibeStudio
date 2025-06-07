export interface PerformanceMetrics {
  frameRate: number;
  renderTime: number;
  memoryUsage: number;
  audioLatency: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = 0;
  private frameRateHistory: number[] = [];
  private renderTimeHistory: number[] = [];
  private isMonitoring = false;
  private onMetricsUpdate?: (metrics: PerformanceMetrics) => void;

  constructor(onMetricsUpdate?: (metrics: PerformanceMetrics) => void) {
    this.onMetricsUpdate = onMetricsUpdate;
  }

  start(): void {
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.frameRateHistory = [];
    this.renderTimeHistory = [];
  }

  stop(): void {
    this.isMonitoring = false;
  }

  recordFrame(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    
    this.frameCount++;
    this.frameRateHistory.push(1000 / frameTime);
    this.lastFrameTime = currentTime;

    // Keep only last 60 frames for rolling average
    if (this.frameRateHistory.length > 60) {
      this.frameRateHistory.shift();
    }

    // Calculate metrics every 30 frames
    if (this.frameCount % 30 === 0) {
      this.calculateAndReportMetrics();
    }
  }

  recordRenderTime(renderTime: number): void {
    if (!this.isMonitoring) return;

    this.renderTimeHistory.push(renderTime);
    
    // Keep only last 60 render times
    if (this.renderTimeHistory.length > 60) {
      this.renderTimeHistory.shift();
    }
  }

  private calculateAndReportMetrics(): void {
    if (!this.onMetricsUpdate) return;

    const frameRate = this.calculateAverageFrameRate();
    const renderTime = this.calculateAverageRenderTime();
    const memoryUsage = this.getMemoryUsage();
    const audioLatency = this.getAudioLatency();

    const metrics: PerformanceMetrics = {
      frameRate,
      renderTime,
      memoryUsage,
      audioLatency,
      timestamp: Date.now()
    };

    this.onMetricsUpdate(metrics);
  }

  private calculateAverageFrameRate(): number {
    if (this.frameRateHistory.length === 0) return 0;
    
    const sum = this.frameRateHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frameRateHistory.length);
  }

  private calculateAverageRenderTime(): number {
    if (this.renderTimeHistory.length === 0) return 0;
    
    const sum = this.renderTimeHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.renderTimeHistory.length * 100) / 100;
  }

  private getMemoryUsage(): number {
    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100; // MB
    }
    return 0;
  }

  private getAudioLatency(): number {
    // Estimate audio latency - this is a simplified calculation
    // In a real implementation, you might measure actual audio processing delays
    return 0; // Placeholder - would need AudioContext baseLatency
  }

  getAverageFrameRate(): number {
    return this.calculateAverageFrameRate();
  }

  getAverageRenderTime(): number {
    return this.calculateAverageRenderTime();
  }

  isPerformanceGood(): boolean {
    const frameRate = this.calculateAverageFrameRate();
    const renderTime = this.calculateAverageRenderTime();
    
    return frameRate >= 25 && renderTime <= 16; // ~60fps with max 16ms render time
  }
}

export function measureFunctionPerformance<T>(
  fn: () => T,
  name?: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  if (name && duration > 10) {
    console.warn(`Performance: ${name} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function getDeviceCapabilities() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  const capabilities = {
    webgl: !!gl,
    audioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
    mediaRecorder: !!window.MediaRecorder,
    requestAnimationFrame: !!window.requestAnimationFrame,
    devicePixelRatio: window.devicePixelRatio || 1,
    maxTextureSize: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 0,
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency || 1
  };

  // Clean up
  if (gl) {
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }

  return capabilities;
}

export function formatMetricsForDisplay(metrics: PerformanceMetrics): string {
  return [
    `FPS: ${metrics.frameRate}`,
    `Render: ${metrics.renderTime}ms`,
    `Memory: ${metrics.memoryUsage}MB`,
    `Audio: ${metrics.audioLatency}ms`
  ].join(' | ');
}

export function isLowEndDevice(): boolean {
  const capabilities = getDeviceCapabilities();
  
  return (
    capabilities.hardwareConcurrency <= 2 ||
    capabilities.devicePixelRatio < 1.5 ||
    !capabilities.webgl ||
    capabilities.maxTextureSize < 2048
  );
}

export function getOptimalSettings() {
  const isLowEnd = isLowEndDevice();
  
  return {
    targetFrameRate: isLowEnd ? 24 : 30,
    particleCount: isLowEnd ? 50 : 100,
    effectComplexity: isLowEnd ? 3 : 5,
    audioBufferSize: isLowEnd ? 1024 : 512,
    renderQuality: isLowEnd ? 'low' : 'medium'
  };
}