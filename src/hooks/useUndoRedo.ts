import { useState, useCallback, useRef } from 'react';

export interface UndoRedoAction<T> {
  id: string;
  timestamp: number;
  description: string;
  state: T;
  category: 'effect' | 'parameter' | 'text' | 'timeline' | 'general';
}

interface UseUndoRedoOptions {
  maxHistorySize?: number;
  debounceMs?: number;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
) {
  const { maxHistorySize = 50, debounceMs = 300 } = options;
  
  const [history, setHistory] = useState<UndoRedoAction<T>[]>([
    {
      id: 'initial',
      timestamp: Date.now(),
      description: 'Initial state',
      state: initialState,
      category: 'general'
    }
  ]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentState, setCurrentState] = useState<T>(initialState);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionIdRef = useRef<string | null>(null);

  const pushState = useCallback((
    newState: T, 
    description: string, 
    category: UndoRedoAction<T>['category'] = 'general',
    actionId?: string
  ) => {
    // Clear any pending debounced action
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const executeUpdate = () => {
      setHistory(prevHistory => {
        // Remove any actions after current index (when undoing then making new changes)
        const truncatedHistory = prevHistory.slice(0, currentIndex + 1);
        
        const newAction: UndoRedoAction<T> = {
          id: actionId || `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          description,
          state: newState,
          category
        };

        // If this is an update to the same action (like dragging), replace the last action
        if (actionId && lastActionIdRef.current === actionId && truncatedHistory.length > 1) {
          const updatedHistory = [...truncatedHistory];
          updatedHistory[updatedHistory.length - 1] = newAction;
          return updatedHistory.slice(-maxHistorySize);
        }

        // Add new action
        const newHistory = [...truncatedHistory, newAction];
        
        // Limit history size
        return newHistory.slice(-maxHistorySize);
      });

      setCurrentIndex(prev => {
        const newIndex = Math.min(prev + 1, maxHistorySize - 1);
        return newIndex;
      });

      setCurrentState(newState);
      lastActionIdRef.current = actionId || null;
    };

    // Debounce rapid updates (like parameter changes)
    if (debounceMs > 0 && (category === 'parameter' || actionId)) {
      debounceTimeoutRef.current = setTimeout(executeUpdate, debounceMs);
    } else {
      executeUpdate();
    }
  }, [currentIndex, maxHistorySize, debounceMs]);

  const undo = useCallback(() => {
    if (currentIndex <= 0) return false;

    const newIndex = currentIndex - 1;
    const previousState = history[newIndex];
    
    setCurrentIndex(newIndex);
    setCurrentState(previousState.state);
    
    return true;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1) return false;

    const newIndex = currentIndex + 1;
    const nextState = history[newIndex];
    
    setCurrentIndex(newIndex);
    setCurrentState(nextState.state);
    
    return true;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const getUndoDescription = () => {
    if (!canUndo) return null;
    return history[currentIndex].description;
  };

  const getRedoDescription = () => {
    if (!canRedo) return null;
    return history[currentIndex + 1].description;
  };

  const clearHistory = useCallback(() => {
    const currentAction: UndoRedoAction<T> = {
      id: 'cleared',
      timestamp: Date.now(),
      description: 'History cleared',
      state: currentState,
      category: 'general'
    };
    
    setHistory([currentAction]);
    setCurrentIndex(0);
  }, [currentState]);

  const getHistoryActions = useCallback(() => {
    return history.map((action, index) => ({
      ...action,
      isCurrent: index === currentIndex,
      isAccessible: index <= currentIndex
    }));
  }, [history, currentIndex]);

  const jumpToAction = useCallback((targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= history.length) return false;
    
    const targetState = history[targetIndex];
    setCurrentIndex(targetIndex);
    setCurrentState(targetState.state);
    
    return true;
  }, [history]);

  const createSnapshot = useCallback((description: string) => {
    pushState(currentState, description, 'general');
  }, [currentState, pushState]);

  // Batch operations
  const startBatch = useCallback(() => {
    // For complex operations that should be undone as a single unit
    // This could be enhanced to group multiple actions
  }, []);

  const endBatch = useCallback((description: string) => {
    // End batching and create a single undo point
    pushState(currentState, description, 'general');
  }, [currentState, pushState]);

  return {
    // Current state
    state: currentState,
    
    // Actions
    pushState,
    undo,
    redo,
    clearHistory,
    jumpToAction,
    createSnapshot,
    
    // Batch operations
    startBatch,
    endBatch,
    
    // Status
    canUndo,
    canRedo,
    getUndoDescription,
    getRedoDescription,
    
    // History inspection
    history: getHistoryActions(),
    currentIndex,
    
    // Utility
    historySize: history.length
  };
}

// Specialized hook for application state
export interface AppState {
  currentEffect: string;
  effectParameters: { [effectName: string]: any };
  textOverlays: any[];
  selectedItems: string[];
  viewState: {
    zoom: number;
    pan: { x: number; y: number };
    timelineVisible: boolean;
    sidebarVisible: boolean;
  };
}

export function useAppUndoRedo(initialState: AppState) {
  return useUndoRedo<AppState>(initialState, {
    maxHistorySize: 100,
    debounceMs: 500
  });
}

// Action creators for common operations
export const createEffectChangeAction = (
  pushState: (state: AppState, description: string, category: UndoRedoAction<AppState>['category']) => void
) => (newState: AppState, effectName: string) => {
  pushState(newState, `Switch to ${effectName} effect`, 'effect');
};

export const createParameterChangeAction = (
  pushState: (state: AppState, description: string, category: UndoRedoAction<AppState>['category'], actionId?: string) => void
) => (newState: AppState, parameterName: string, effectName: string) => {
  pushState(
    newState, 
    `Change ${parameterName} for ${effectName}`, 
    'parameter',
    `param-${effectName}-${parameterName}`
  );
};

export const createTextOverlayAction = (
  pushState: (state: AppState, description: string, category: UndoRedoAction<AppState>['category']) => void
) => ({
  add: (newState: AppState, text: string) => {
    pushState(newState, `Add text overlay: "${text}"`, 'text');
  },
  
  remove: (newState: AppState, text: string) => {
    pushState(newState, `Remove text overlay: "${text}"`, 'text');
  },
  
  update: (newState: AppState, text: string, property: string) => {
    pushState(newState, `Update ${property} for "${text}"`, 'text');
  }
});

export const createTimelineAction = (
  pushState: (state: AppState, description: string, category: UndoRedoAction<AppState>['category']) => void
) => ({
  moveItem: (newState: AppState, itemName: string) => {
    pushState(newState, `Move timeline item: ${itemName}`, 'timeline');
  },
  
  resizeItem: (newState: AppState, itemName: string) => {
    pushState(newState, `Resize timeline item: ${itemName}`, 'timeline');
  },
  
  deleteItem: (newState: AppState, itemName: string) => {
    pushState(newState, `Delete timeline item: ${itemName}`, 'timeline');
  }
});

// Helper to create action descriptions
export const actionDescriptions = {
  effect: {
    switch: (effectName: string) => `Switch to ${effectName} effect`,
    toggle: () => 'Toggle effect on/off',
    reset: () => 'Reset effect parameters'
  },
  
  parameter: {
    change: (paramName: string, effectName: string) => `Change ${paramName} for ${effectName}`,
    reset: (effectName: string) => `Reset parameters for ${effectName}`
  },
  
  text: {
    add: (text: string) => `Add text: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`,
    remove: (text: string) => `Remove text: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`,
    update: (text: string, property: string) => `Update ${property} for "${text.substring(0, 15)}${text.length > 15 ? '...' : ''}"`,
    move: (text: string) => `Move text: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`
  },
  
  timeline: {
    move: (itemName: string) => `Move ${itemName}`,
    resize: (itemName: string) => `Resize ${itemName}`,
    delete: (itemName: string) => `Delete ${itemName}`,
    add: (itemName: string) => `Add ${itemName}`
  },
  
  general: {
    import: () => 'Import project',
    reset: () => 'Reset project',
    loadPreset: (presetName: string) => `Load preset: ${presetName}`
  }
};