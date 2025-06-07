import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  action: () => void;
  category: 'playback' | 'editing' | 'effects' | 'view' | 'general';
  enabled?: boolean;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const pressedKeys = [];
    if (event.ctrlKey || event.metaKey) pressedKeys.push('Ctrl');
    if (event.shiftKey) pressedKeys.push('Shift');
    if (event.altKey) pressedKeys.push('Alt');
    
    // Add the main key
    const key = event.key;
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      pressedKeys.push(key.toLowerCase() === key ? key.toUpperCase() : key);
    }

    const keyString = pressedKeys.join('+');

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => 
      shortcut.enabled !== false &&
      shortcut.keys.some(keys => keys === keyString)
    );

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: shortcuts.filter(s => s.enabled !== false)
  };
};

// Common shortcut builders
export const createPlaybackShortcuts = (
  play: () => void,
  pause: () => void,
  stop: () => void,
  seekForward: () => void,
  seekBackward: () => void,
  toggleMute: () => void,
  volumeUp: () => void,
  volumeDown: () => void
): KeyboardShortcut[] => [
  {
    id: 'play-pause',
    keys: ['Space'],
    description: 'Play/Pause',
    action: () => {
      // This should be handled by the component to check current state
      play();
    },
    category: 'playback'
  },
  {
    id: 'stop',
    keys: ['Escape'],
    description: 'Stop playback',
    action: stop,
    category: 'playback'
  },
  {
    id: 'seek-forward',
    keys: ['ArrowRight'],
    description: 'Seek forward',
    action: seekForward,
    category: 'playback'
  },
  {
    id: 'seek-backward',
    keys: ['ArrowLeft'],
    description: 'Seek backward',
    action: seekBackward,
    category: 'playback'
  },
  {
    id: 'seek-forward-fast',
    keys: ['Shift+ArrowRight'],
    description: 'Seek forward (fast)',
    action: () => {
      for (let i = 0; i < 5; i++) seekForward();
    },
    category: 'playback'
  },
  {
    id: 'seek-backward-fast',
    keys: ['Shift+ArrowLeft'],
    description: 'Seek backward (fast)',
    action: () => {
      for (let i = 0; i < 5; i++) seekBackward();
    },
    category: 'playback'
  },
  {
    id: 'toggle-mute',
    keys: ['m', 'M'],
    description: 'Toggle mute',
    action: toggleMute,
    category: 'playback'
  },
  {
    id: 'volume-up',
    keys: ['ArrowUp'],
    description: 'Volume up',
    action: volumeUp,
    category: 'playback'
  },
  {
    id: 'volume-down',
    keys: ['ArrowDown'],
    description: 'Volume down',
    action: volumeDown,
    category: 'playback'
  }
];

export const createEffectShortcuts = (
  switchToEffect: (effect: string) => void,
  toggleEffect: () => void,
  resetParameters: () => void
): KeyboardShortcut[] => [
  {
    id: 'effect-waveform',
    keys: ['1'],
    description: 'Switch to Waveform effect',
    action: () => switchToEffect('waveform'),
    category: 'effects'
  },
  {
    id: 'effect-particles',
    keys: ['2'],
    description: 'Switch to Particles effect',
    action: () => switchToEffect('particles'),
    category: 'effects'
  },
  {
    id: 'effect-geometric',
    keys: ['3'],
    description: 'Switch to Geometric effect',
    action: () => switchToEffect('geometric'),
    category: 'effects'
  },
  {
    id: 'effect-gradient',
    keys: ['4'],
    description: 'Switch to Gradient effect',
    action: () => switchToEffect('gradient'),
    category: 'effects'
  },
  {
    id: 'effect-3d',
    keys: ['5'],
    description: 'Switch to 3D effect',
    action: () => switchToEffect('3d'),
    category: 'effects'
  },
  {
    id: 'toggle-effect',
    keys: ['e', 'E'],
    description: 'Toggle effect on/off',
    action: toggleEffect,
    category: 'effects'
  },
  {
    id: 'reset-parameters',
    keys: ['Ctrl+r', 'Ctrl+R'],
    description: 'Reset effect parameters',
    action: resetParameters,
    category: 'effects'
  }
];

export const createEditingShortcuts = (
  addText: () => void,
  deleteSelected: () => void,
  selectAll: () => void,
  copy: () => void,
  paste: () => void,
  undo: () => void,
  redo: () => void
): KeyboardShortcut[] => [
  {
    id: 'add-text',
    keys: ['t', 'T'],
    description: 'Add text overlay',
    action: addText,
    category: 'editing'
  },
  {
    id: 'delete-selected',
    keys: ['Delete', 'Backspace'],
    description: 'Delete selected item',
    action: deleteSelected,
    category: 'editing'
  },
  {
    id: 'select-all',
    keys: ['Ctrl+a', 'Ctrl+A'],
    description: 'Select all',
    action: selectAll,
    category: 'editing'
  },
  {
    id: 'copy',
    keys: ['Ctrl+c', 'Ctrl+C'],
    description: 'Copy',
    action: copy,
    category: 'editing'
  },
  {
    id: 'paste',
    keys: ['Ctrl+v', 'Ctrl+V'],
    description: 'Paste',
    action: paste,
    category: 'editing'
  },
  {
    id: 'undo',
    keys: ['Ctrl+z', 'Ctrl+Z'],
    description: 'Undo',
    action: undo,
    category: 'editing'
  },
  {
    id: 'redo',
    keys: ['Ctrl+y', 'Ctrl+Y', 'Ctrl+Shift+z', 'Ctrl+Shift+Z'],
    description: 'Redo',
    action: redo,
    category: 'editing'
  }
];

export const createViewShortcuts = (
  toggleFullscreen: () => void,
  zoomIn: () => void,
  zoomOut: () => void,
  resetZoom: () => void,
  toggleSidebar: () => void,
  toggleTimeline: () => void
): KeyboardShortcut[] => [
  {
    id: 'fullscreen',
    keys: ['f', 'F', 'F11'],
    description: 'Toggle fullscreen',
    action: toggleFullscreen,
    category: 'view'
  },
  {
    id: 'zoom-in',
    keys: ['Ctrl+=', 'Ctrl++'],
    description: 'Zoom in',
    action: zoomIn,
    category: 'view'
  },
  {
    id: 'zoom-out',
    keys: ['Ctrl+-'],
    description: 'Zoom out',
    action: zoomOut,
    category: 'view'
  },
  {
    id: 'reset-zoom',
    keys: ['Ctrl+0'],
    description: 'Reset zoom',
    action: resetZoom,
    category: 'view'
  },
  {
    id: 'toggle-sidebar',
    keys: ['Ctrl+b', 'Ctrl+B'],
    description: 'Toggle sidebar',
    action: toggleSidebar,
    category: 'view'
  },
  {
    id: 'toggle-timeline',
    keys: ['Ctrl+t', 'Ctrl+T'],
    description: 'Toggle timeline',
    action: toggleTimeline,
    category: 'view'
  }
];

export const createGeneralShortcuts = (
  save: () => void,
  export_: () => void,
  openPresets: () => void,
  openHelp: () => void,
  newProject: () => void
): KeyboardShortcut[] => [
  {
    id: 'save',
    keys: ['Ctrl+s', 'Ctrl+S'],
    description: 'Save project',
    action: save,
    category: 'general'
  },
  {
    id: 'export',
    keys: ['Ctrl+e', 'Ctrl+E'],
    description: 'Export video',
    action: export_,
    category: 'general'
  },
  {
    id: 'open-presets',
    keys: ['Ctrl+p', 'Ctrl+P'],
    description: 'Open presets',
    action: openPresets,
    category: 'general'
  },
  {
    id: 'help',
    keys: ['F1', 'h', 'H'],
    description: 'Show help',
    action: openHelp,
    category: 'general'
  },
  {
    id: 'new-project',
    keys: ['Ctrl+n', 'Ctrl+N'],
    description: 'New project',
    action: newProject,
    category: 'general'
  }
];

// Utility function to format key combinations for display
export const formatKeyCombo = (keys: string): string => {
  return keys
    .split('+')
    .map(key => {
      // Replace common keys with symbols
      const keyMap: { [key: string]: string } = {
        'Ctrl': '⌘',
        'Shift': '⇧',
        'Alt': '⌥',
        'ArrowUp': '↑',
        'ArrowDown': '↓',
        'ArrowLeft': '←',
        'ArrowRight': '→',
        'Space': '␣',
        'Enter': '↵',
        'Escape': 'Esc',
        'Delete': 'Del',
        'Backspace': '⌫'
      };
      
      return keyMap[key] || key;
    })
    .join(' + ');
};

// Get shortcuts by category
export const getShortcutsByCategory = (shortcuts: KeyboardShortcut[]) => {
  const categories: { [key: string]: KeyboardShortcut[] } = {};
  
  shortcuts.forEach(shortcut => {
    if (!categories[shortcut.category]) {
      categories[shortcut.category] = [];
    }
    categories[shortcut.category].push(shortcut);
  });
  
  return categories;
};