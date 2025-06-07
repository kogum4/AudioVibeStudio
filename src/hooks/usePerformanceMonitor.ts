import { useState, useEffect, useRef, useCallback } from 'react';
import { PerformanceMonitor, PerformanceMetrics } from '../utils/performance';

export interface PerformanceState {
  isMonitoring: boolean;
  currentMetrics: PerformanceMetrics | null;
  averageMetrics: {
    frameRate: number;
    renderTime: number;
    memoryUsage: number;
  };
  performanceScore: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[];
}

export function usePerformanceMonitor() {
  const [state, setState] = useState<PerformanceState>({
    isMonitoring: false,
    currentMetrics: null,
    averageMetrics: {
      frameRate: 0,
      renderTime: 0,
      memoryUsage: 0
    },
    performanceScore: 'good',
    warnings: []
  });

  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const metricsHistoryRef = useRef<PerformanceMetrics[]>([]);

  useEffect(() => {
    monitorRef.current = new PerformanceMonitor((metrics) => {
      setState(prevState => {
        const newMetrics = { ...metrics };
        metricsHistoryRef.current.push(newMetrics);
        
        // Keep only last 100 metrics for rolling average
        if (metricsHistoryRef.current.length > 100) {
          metricsHistoryRef.current.shift();
        }

        const history = metricsHistoryRef.current;
        const averageMetrics = {
          frameRate: Math.round(history.reduce((sum, m) => sum + m.frameRate, 0) / history.length),
          renderTime: Math.round(history.reduce((sum, m) => sum + m.renderTime, 0) / history.length * 100) / 100,
          memoryUsage: Math.round(history.reduce((sum, m) => sum + m.memoryUsage, 0) / history.length * 100) / 100
        };

        const performanceScore = calculatePerformanceScore(averageMetrics);
        const warnings = generateWarnings(newMetrics, averageMetrics);

        return {
          ...prevState,
          currentMetrics: newMetrics,
          averageMetrics,
          performanceScore,
          warnings
        };
      });
    });

    return () => {
      if (monitorRef.current) {
        monitorRef.current.stop();
      }
    };
  }, []);

  const startMonitoring = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.start();
      setState(prev => ({ ...prev, isMonitoring: true }));
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.stop();
      setState(prev => ({ ...prev, isMonitoring: false }));
    }
  }, []);

  const recordFrame = useCallback(() => {
    if (monitorRef.current && state.isMonitoring) {
      monitorRef.current.recordFrame();
    }
  }, [state.isMonitoring]);

  const recordRenderTime = useCallback((renderTime: number) => {
    if (monitorRef.current && state.isMonitoring) {
      monitorRef.current.recordRenderTime(renderTime);
    }
  }, [state.isMonitoring]);

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    recordFrame,
    recordRenderTime
  };
}

function calculatePerformanceScore(metrics: {
  frameRate: number;
  renderTime: number;
  memoryUsage: number;
}): 'excellent' | 'good' | 'fair' | 'poor' {
  let score = 0;

  // Frame rate scoring (0-40 points)
  if (metrics.frameRate >= 55) score += 40;
  else if (metrics.frameRate >= 45) score += 32;
  else if (metrics.frameRate >= 30) score += 24;
  else if (metrics.frameRate >= 20) score += 16;
  else score += 8;

  // Render time scoring (0-30 points)
  if (metrics.renderTime <= 8) score += 30;
  else if (metrics.renderTime <= 12) score += 24;
  else if (metrics.renderTime <= 16) score += 18;
  else if (metrics.renderTime <= 25) score += 12;
  else score += 6;

  // Memory usage scoring (0-30 points)
  if (metrics.memoryUsage <= 50) score += 30;
  else if (metrics.memoryUsage <= 100) score += 24;
  else if (metrics.memoryUsage <= 200) score += 18;
  else if (metrics.memoryUsage <= 400) score += 12;
  else score += 6;

  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

function generateWarnings(
  current: PerformanceMetrics,
  average: { frameRate: number; renderTime: number; memoryUsage: number }
): string[] {
  const warnings: string[] = [];

  if (current.frameRate < 20) {
    warnings.push('Low frame rate detected. Consider reducing visual complexity.');
  }

  if (current.renderTime > 25) {
    warnings.push('High render time detected. Visual effects may be too complex.');
  }

  if (current.memoryUsage > 500) {
    warnings.push('High memory usage detected. Consider restarting the application.');
  }

  if (average.frameRate < 25) {
    warnings.push('Consistently low frame rate. Device may not meet minimum requirements.');
  }

  if (average.renderTime > 20) {
    warnings.push('Consistently high render times. Consider optimizing visual settings.');
  }

  // Check for sudden performance drops
  if (current.frameRate < average.frameRate * 0.7) {
    warnings.push('Sudden performance drop detected. Check for background processes.');
  }

  return warnings;
}

export function useFrameRate() {
  const [frameRate, setFrameRate] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>();

  const measureFrameRate = useCallback(() => {
    frameCountRef.current++;
    const currentTime = performance.now();
    
    if (currentTime - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
      setFrameRate(fps);
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }

    animationFrameRef.current = requestAnimationFrame(measureFrameRate);
  }, []);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(measureFrameRate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [measureFrameRate]);

  return frameRate;
}