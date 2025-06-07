import { useState, useEffect, useRef, useCallback } from 'react';
import { VisualEngine } from '../modules/visual/VisualEngine';
import { EffectParameter } from '../modules/visual/EffectParameters';

export interface VisualEngineState {
  isInitialized: boolean;
  isRunning: boolean;
  currentEffect: string;
  availableEffects: string[];
  error: string | null;
}

export interface VisualEngineControls {
  initialize: (canvas: HTMLCanvasElement) => void;
  start: () => void;
  stop: () => void;
  setEffect: (effectType: string) => void;
  updateParameter: (paramName: string, value: any) => void;
  getParameters: () => EffectParameter;
  resetParameters: () => void;
  dispose: () => void;
}

export function useVisualEngine(): [VisualEngineState, VisualEngineControls] {
  const [state, setState] = useState<VisualEngineState>({
    isInitialized: false,
    isRunning: false,
    currentEffect: 'waveform',
    availableEffects: ['waveform', 'particles', 'geometric', 'gradient', '3d'],
    error: null
  });

  const engineRef = useRef<VisualEngine | null>(null);

  const initialize = useCallback((canvas: HTMLCanvasElement) => {
    try {
      if (engineRef.current) {
        engineRef.current.dispose();
      }

      engineRef.current = new VisualEngine(canvas);
      engineRef.current.setEffect(state.currentEffect);

      setState(prev => ({
        ...prev,
        isInitialized: true,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isInitialized: false,
        error: error instanceof Error ? error.message : 'Failed to initialize visual engine'
      }));
    }
  }, [state.currentEffect]);

  const start = useCallback(() => {
    const engine = engineRef.current;
    if (engine && state.isInitialized) {
      try {
        engine.start();
        setState(prev => ({ ...prev, isRunning: true, error: null }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to start visual engine'
        }));
      }
    }
  }, [state.isInitialized]);

  const stop = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.stop();
      setState(prev => ({ ...prev, isRunning: false }));
    }
  }, []);

  const setEffect = useCallback((effectType: string) => {
    const engine = engineRef.current;
    if (engine && state.availableEffects.includes(effectType)) {
      try {
        engine.setEffect(effectType);
        setState(prev => ({ ...prev, currentEffect: effectType, error: null }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to set effect'
        }));
      }
    }
  }, [state.availableEffects]);

  const updateParameter = useCallback((paramName: string, value: any) => {
    const engine = engineRef.current;
    if (engine) {
      try {
        const paramManager = engine.getParameterManager();
        paramManager.updateParameter(state.currentEffect, paramName, value);
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to update parameter'
        }));
      }
    }
  }, [state.currentEffect]);

  const getParameters = useCallback((): EffectParameter => {
    const engine = engineRef.current;
    if (engine) {
      const paramManager = engine.getParameterManager();
      return paramManager.getParameters(state.currentEffect);
    }
    return {};
  }, [state.currentEffect]);

  const resetParameters = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      try {
        const paramManager = engine.getParameterManager();
        paramManager.resetParameters(state.currentEffect);
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to reset parameters'
        }));
      }
    }
  }, [state.currentEffect]);

  const dispose = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.dispose();
      engineRef.current = null;
      setState(prev => ({
        ...prev,
        isInitialized: false,
        isRunning: false
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  const controls: VisualEngineControls = {
    initialize,
    start,
    stop,
    setEffect,
    updateParameter,
    getParameters,
    resetParameters,
    dispose
  };

  return [state, controls];
}

export function useEffectParameters(effectType: string) {
  const [parameters, setParameters] = useState<EffectParameter>({});
  const engineRef = useRef<VisualEngine | null>(null);

  useEffect(() => {
    // This would typically be passed from a parent component
    // or accessed through a context
    if (engineRef.current) {
      const paramManager = engineRef.current.getParameterManager();
      setParameters(paramManager.getParameters(effectType));

      // Listen for parameter changes
      const unsubscribe = paramManager.addParameterListener(effectType, (newParams) => {
        setParameters(newParams);
      });

      return unsubscribe;
    }
  }, [effectType]);

  const updateParameter = useCallback((paramName: string, value: any) => {
    if (engineRef.current) {
      const paramManager = engineRef.current.getParameterManager();
      paramManager.updateParameter(effectType, paramName, value);
    }
  }, [effectType]);

  return {
    parameters,
    updateParameter
  };
}