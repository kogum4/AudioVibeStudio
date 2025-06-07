import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MemoryLeakDetector, 
  MemoryLeakReport, 
  MemorySnapshot,
  getMemoryInfo
} from '../utils/memoryLeak';

export interface MemoryLeakState {
  isMonitoring: boolean;
  currentMemoryUsage: number;
  memoryGrowthRate: number;
  isLeakDetected: boolean;
  recommendations: string[];
  snapshots: MemorySnapshot[];
  report: MemoryLeakReport | null;
}

export interface MemoryLeakControls {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  analyzeMemoryUsage: () => MemoryLeakReport;
  takeSnapshot: () => MemorySnapshot | null;
  clearData: () => void;
  forceAnalysis: () => void;
}

export function useMemoryLeak(
  autoStart = false,
  samplingInterval = 5000,
  maxSnapshots = 100
): [MemoryLeakState, MemoryLeakControls] {
  const [state, setState] = useState<MemoryLeakState>({
    isMonitoring: false,
    currentMemoryUsage: 0,
    memoryGrowthRate: 0,
    isLeakDetected: false,
    recommendations: [],
    snapshots: [],
    report: null
  });

  const detectorRef = useRef<MemoryLeakDetector | null>(null);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new MemoryLeakDetector(maxSnapshots, samplingInterval);
    
    if (autoStart) {
      startMonitoring();
    }

    return () => {
      if (detectorRef.current) {
        detectorRef.current.stopMonitoring();
      }
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
      }
    };
  }, []);

  // Update current memory usage periodically
  useEffect(() => {
    if (state.isMonitoring) {
      const updateInterval = setInterval(() => {
        const memoryInfo = getMemoryInfo();
        if (memoryInfo) {
          setState(prev => ({
            ...prev,
            currentMemoryUsage: memoryInfo.usedJSHeapSize
          }));
        }
      }, 1000);

      return () => clearInterval(updateInterval);
    }
  }, [state.isMonitoring]);

  const startMonitoring = useCallback(() => {
    if (detectorRef.current && !state.isMonitoring) {
      detectorRef.current.startMonitoring();
      
      setState(prev => ({
        ...prev,
        isMonitoring: true,
        recommendations: ['Memory monitoring started. Collecting data...']
      }));

      // Start periodic analysis
      analysisTimerRef.current = setInterval(() => {
        if (detectorRef.current) {
          const report = detectorRef.current.analyzeMemoryUsage();
          setState(prev => ({ ...prev, ...report }));
        }
      }, 30000); // Analyze every 30 seconds
    }
  }, [state.isMonitoring]);

  const stopMonitoring = useCallback(() => {
    if (detectorRef.current && state.isMonitoring) {
      detectorRef.current.stopMonitoring();
      
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }

      setState(prev => ({
        ...prev,
        isMonitoring: false
      }));
    }
  }, [state.isMonitoring]);

  const analyzeMemoryUsage = useCallback((): MemoryLeakReport => {
    if (!detectorRef.current) {
      return {
        isLeakDetected: false,
        memoryGrowthRate: 0,
        recommendations: ['Memory detector not initialized'],
        snapshots: []
      };
    }

    const report = detectorRef.current.analyzeMemoryUsage();
    
    setState(prev => ({
      ...prev,
      memoryGrowthRate: report.memoryGrowthRate,
      isLeakDetected: report.isLeakDetected,
      recommendations: report.recommendations,
      snapshots: report.snapshots,
      report
    }));

    return report;
  }, []);

  const takeSnapshot = useCallback((): MemorySnapshot | null => {
    if (!detectorRef.current) return null;

    const snapshot = detectorRef.current.takeSnapshot();
    if (snapshot) {
      setState(prev => ({
        ...prev,
        snapshots: [...prev.snapshots, snapshot]
      }));
    }

    return snapshot;
  }, []);

  const clearData = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.clearSnapshots();
    }

    setState(prev => ({
      ...prev,
      memoryGrowthRate: 0,
      isLeakDetected: false,
      recommendations: [],
      snapshots: [],
      report: null
    }));
  }, []);

  const forceAnalysis = useCallback(() => {
    return analyzeMemoryUsage();
  }, [analyzeMemoryUsage]);

  const controls: MemoryLeakControls = {
    startMonitoring,
    stopMonitoring,
    analyzeMemoryUsage,
    takeSnapshot,
    clearData,
    forceAnalysis
  };

  return [state, controls];
}

// Hook for memory usage warnings
export function useMemoryWarnings(threshold = 100 * 1024 * 1024): boolean {
  const [isHighMemoryUsage, setIsHighMemoryUsage] = useState(false);

  useEffect(() => {
    const checkMemoryUsage = () => {
      const memoryInfo = getMemoryInfo();
      if (memoryInfo) {
        setIsHighMemoryUsage(memoryInfo.usedJSHeapSize > threshold);
      }
    };

    const interval = setInterval(checkMemoryUsage, 5000);
    checkMemoryUsage(); // Initial check

    return () => clearInterval(interval);
  }, [threshold]);

  return isHighMemoryUsage;
}

// Hook for automatic cleanup on unmount
export function useMemoryCleanup() {
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  const addCleanupFunction = useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup);
  }, []);

  const runCleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Cleanup function failed:', error);
      }
    });
    cleanupFunctionsRef.current = [];
  }, []);

  // Run cleanup on unmount
  useEffect(() => {
    return () => {
      runCleanup();
    };
  }, [runCleanup]);

  return { addCleanupFunction, runCleanup };
}