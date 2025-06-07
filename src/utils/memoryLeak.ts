export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface MemoryLeakReport {
  isLeakDetected: boolean;
  memoryGrowthRate: number;
  recommendations: string[];
  snapshots: MemorySnapshot[];
}

export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private maxSnapshots = 100;
  private samplingInterval = 5000; // 5 seconds
  private monitoringTimer: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private leakThreshold = 1024 * 1024; // 1MB growth per minute

  constructor(maxSnapshots = 100, samplingInterval = 5000) {
    this.maxSnapshots = maxSnapshots;
    this.samplingInterval = samplingInterval;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.snapshots = [];
    
    this.monitoringTimer = setInterval(() => {
      this.takeSnapshot();
    }, this.samplingInterval);
    
    // Take initial snapshot
    this.takeSnapshot();
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  takeSnapshot(): MemorySnapshot | null {
    if (!this.isMemoryAPIAvailable()) {
      return null;
    }

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    };

    this.snapshots.push(snapshot);

    // Keep only the most recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  analyzeMemoryUsage(): MemoryLeakReport {
    if (this.snapshots.length < 2) {
      return {
        isLeakDetected: false,
        memoryGrowthRate: 0,
        recommendations: ['Not enough data collected yet. Monitor for at least 10 seconds.'],
        snapshots: [...this.snapshots]
      };
    }

    const firstSnapshot = this.snapshots[0]!;
    const lastSnapshot = this.snapshots[this.snapshots.length - 1]!;
    
    const timeDiff = (lastSnapshot.timestamp - firstSnapshot.timestamp) / 1000; // seconds
    const memoryDiff = lastSnapshot.usedJSHeapSize - firstSnapshot.usedJSHeapSize;
    const growthRate = memoryDiff / timeDiff; // bytes per second

    const isLeakDetected = this.detectMemoryLeak(growthRate, timeDiff);
    const recommendations = this.generateRecommendations(growthRate, isLeakDetected);

    return {
      isLeakDetected,
      memoryGrowthRate: growthRate,
      recommendations,
      snapshots: [...this.snapshots]
    };
  }

  private detectMemoryLeak(growthRate: number, timeDiff: number): boolean {
    // Convert to growth per minute
    const growthPerMinute = growthRate * 60;
    
    // Consider it a leak if memory is growing consistently over time
    // and exceeds our threshold
    if (timeDiff < 30) return false; // Not enough time to determine
    
    return growthPerMinute > this.leakThreshold;
  }

  private generateRecommendations(growthRate: number, isLeakDetected: boolean): string[] {
    const recommendations: string[] = [];

    if (isLeakDetected) {
      recommendations.push('Memory leak detected! Consider the following actions:');
      recommendations.push('- Check for unreferenced DOM elements');
      recommendations.push('- Ensure event listeners are properly removed');
      recommendations.push('- Clear setInterval and setTimeout timers');
      recommendations.push('- Dispose of audio/canvas contexts properly');
      recommendations.push('- Check for closure variables that prevent garbage collection');
    }

    const growthPerMinute = growthRate * 60;
    const growthMB = growthPerMinute / (1024 * 1024);

    if (growthMB > 1) {
      recommendations.push(`High memory growth rate: ${growthMB.toFixed(2)} MB/minute`);
    } else if (growthMB > 0.5) {
      recommendations.push(`Moderate memory growth rate: ${growthMB.toFixed(2)} MB/minute`);
    } else if (growthMB > 0) {
      recommendations.push(`Low memory growth rate: ${growthMB.toFixed(2)} MB/minute`);
    } else {
      recommendations.push('Memory usage is stable or decreasing');
    }

    if (this.snapshots.length > 0) {
      const lastSnapshot = this.snapshots[this.snapshots.length - 1]!;
      const usedMB = lastSnapshot.usedJSHeapSize / (1024 * 1024);
      const totalMB = lastSnapshot.totalJSHeapSize / (1024 * 1024);
      
      recommendations.push(`Current memory usage: ${usedMB.toFixed(2)} MB of ${totalMB.toFixed(2)} MB allocated`);
      
      if (usedMB > 100) {
        recommendations.push('High memory usage detected. Consider optimizing data structures.');
      }
    }

    return recommendations;
  }

  private isMemoryAPIAvailable(): boolean {
    return 'memory' in performance && typeof (performance as any).memory === 'object';
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  clearSnapshots(): void {
    this.snapshots = [];
  }

  setLeakThreshold(threshold: number): void {
    this.leakThreshold = threshold;
  }
}

// Utility functions for memory management
export function forceGarbageCollection(): void {
  // Note: gc() is only available in Node.js with --expose-gc flag
  // or in development builds of some browsers
  if (typeof (window as any).gc === 'function') {
    (window as any).gc();
  }
}

export function getMemoryInfo(): MemorySnapshot | null {
  if (!('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    timestamp: Date.now()
  };
}

export function formatMemorySize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Memory management utilities for audio/visual components
export function cleanupAudioResources(audioContext: AudioContext | null): void {
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
}

export function cleanupCanvasResources(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // Reset canvas size to free memory
  canvas.width = 1;
  canvas.height = 1;
}

export function cleanupMediaRecorder(recorder: MediaRecorder | null): void {
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop();
  }
}