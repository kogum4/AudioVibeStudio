import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioContextManager } from '../modules/audio/AudioContext';
import { VisualEngine } from '../modules/visual/VisualEngine';
import { effectParameterManager } from '../modules/visual/EffectParameters';
import { ParameterControls } from '../components/ParameterControls';
import { TextOverlayControls } from '../components/TextOverlayControls';
import { Timeline } from '../components/Timeline';
import { PresetManager } from '../components/PresetManager';
import { TransitionControls } from '../components/TransitionControls';
import { HelpSystem } from '../components/HelpSystem';
import { HistoryPanel } from '../components/HistoryPanel';
import { TransitionEngine } from '../modules/visual/TransitionEngine';
import { useKeyboardShortcuts, createPlaybackShortcuts, createEffectShortcuts, createEditingShortcuts, createViewShortcuts, createGeneralShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAppUndoRedo, actionDescriptions } from '../hooks/useUndoRedo';
import { TextOverlay } from '../types/visual';

export function EditorScreen() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualEngineRef = useRef<VisualEngine | null>(null);
  const transitionEngineRef = useRef<TransitionEngine | null>(null);
  
  // Core state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEffect, setCurrentEffect] = useState('waveform');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioManager = AudioContextManager.getInstance();
  
  // UI state
  const [activePanel, setActivePanel] = useState<'effects' | 'text' | 'timeline' | 'transitions'>('effects');
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [timelineVisible, setTimelineVisible] = useState(true);
  
  // Text overlays
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  
  // Available effects
  const availableEffects = ['waveform', 'particles', 'geometric', 'gradient', '3d'];
  
  // App state for undo/redo
  const initialAppState = {
    currentEffect,
    effectParameters: {},
    textOverlays: [],
    selectedItems: [],
    viewState: {
      zoom: 1,
      pan: { x: 0, y: 0 },
      timelineVisible,
      sidebarVisible
    }
  };
  
  const {
    state: appState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoDescription,
    getRedoDescription,
    history,
    currentIndex,
    jumpToAction,
    clearHistory
  } = useAppUndoRedo(initialAppState);

  // Playback handlers (defined first to avoid hoisting issues)
  const handlePlay = () => {
    audioManager.play();
    setIsPlaying(true);
    if (visualEngineRef.current) {
      if (!visualEngineRef.current.getIsRunning()) {
        visualEngineRef.current.start();
      }
      visualEngineRef.current.setAudioPlaying(true);
    }
  };

  const handlePause = () => {
    audioManager.pause();
    setIsPlaying(false);
    visualEngineRef.current?.setAudioPlaying(false);
  };

  const handleStop = () => {
    audioManager.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    visualEngineRef.current?.setAudioPlaying(false);
  };

  const handleSeek = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration));
    // audioManager.setCurrentTime(clampedTime); // This method may not exist
    setCurrentTime(clampedTime);
  };

  // Keyboard shortcuts
  const shortcuts = [
    ...createPlaybackShortcuts(
      () => isPlaying ? handlePause() : handlePlay(),
      handlePause,
      handleStop,
      () => handleSeek(currentTime + 5000),
      () => handleSeek(currentTime - 5000),
      () => {}, // toggle mute - to implement
      () => {}, // volume up - to implement
      () => {}  // volume down - to implement
    ),
    ...createEffectShortcuts(
      (effect) => handleEffectChange(effect),
      () => {}, // toggle effect - to implement
      () => {}  // reset parameters - to implement
    ),
    ...createEditingShortcuts(
      () => {}, // add text - to implement
      () => {}, // delete selected - to implement
      () => {}, // select all - to implement
      () => {}, // copy - to implement
      () => {}, // paste - to implement
      undo,
      redo
    ),
    ...createViewShortcuts(
      () => {}, // toggle fullscreen - to implement
      () => {}, // zoom in - to implement
      () => {}, // zoom out - to implement
      () => {}, // reset zoom - to implement
      () => setSidebarVisible(!sidebarVisible),
      () => setTimelineVisible(!timelineVisible)
    ),
    ...createGeneralShortcuts(
      () => {}, // save - to implement
      () => navigate('/export'),
      () => setIsPresetManagerOpen(true),
      () => setIsHelpOpen(true),
      () => {} // new project - to implement
    )
  ];

  useKeyboardShortcuts({ shortcuts, enabled: !isPresetManagerOpen && !isHelpOpen && !isHistoryOpen });

  useEffect(() => {
    // Check if audio is loaded
    if (audioManager.getDuration() === 0) {
      navigate('/');
      return;
    }

    // Set duration
    setDuration(audioManager.getDuration());

    // Initialize visual engine
    if (canvasRef.current && !visualEngineRef.current) {
      console.log('Initializing VisualEngine...');
      visualEngineRef.current = new VisualEngine(canvasRef.current);
      visualEngineRef.current.start();
      
      // Initialize transition engine (we'll implement this in VisualEngine later)
      // For now, comment out until we add the required properties
      // transitionEngineRef.current = new TransitionEngine(
      //   visualEngineRef.current.ctx,
      //   canvasRef.current.width,
      //   canvasRef.current.height,
      //   visualEngineRef.current.analyzer
      // );
    }

    // Load saved state
    const savedEffect = localStorage.getItem('currentEffect');
    if (savedEffect && availableEffects.includes(savedEffect)) {
      setCurrentEffect(savedEffect);
      visualEngineRef.current?.setEffect(savedEffect);
    }

    // Update time periodically
    const timeInterval = setInterval(() => {
      const currentTime = audioManager.getCurrentTime();
      setCurrentTime(currentTime);
      // Always update progress in visual engine
      if (visualEngineRef.current) {
        visualEngineRef.current.setAudioProgress(currentTime, duration);
      }
    }, 100);

    // No cleanup in development to avoid React Strict Mode issues
    return () => {
      clearInterval(timeInterval);
      if (process.env.NODE_ENV !== 'development') {
        visualEngineRef.current?.dispose();
      }
    };
  }, [navigate, isPlaying]);

  const handlePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  // Effect handlers
  const handleEffectChange = (effect: string) => {
    setCurrentEffect(effect);
    visualEngineRef.current?.setEffect(effect);
    
    // Save current effect to localStorage for export
    localStorage.setItem('currentEffect', effect);
    
    // Save to undo/redo
    const newState = {
      ...appState,
      currentEffect: effect
    };
    pushState(newState, actionDescriptions.effect.switch(effect), 'effect');
  };

  // Text overlay handlers
  const handleTextOverlayUpdate = (overlays: TextOverlay[]) => {
    setTextOverlays(overlays);
    
    // Update visual engine
    if (visualEngineRef.current) {
      visualEngineRef.current.clearAllTextOverlays();
      overlays.forEach(overlay => {
        visualEngineRef.current?.addTextOverlay(overlay);
      });
    }
    
    // Save to localStorage for export
    localStorage.setItem('textOverlays', JSON.stringify(overlays));
    
    // Save to undo/redo
    const newState = {
      ...appState,
      textOverlays: overlays
    };
    pushState(newState, 'Update text overlays', 'text');
  };

  // Preset handlers
  const handleLoadPreset = (preset: any) => {
    // Load effect
    if (preset.settings.currentEffect) {
      handleEffectChange(preset.settings.currentEffect);
    }
    
    // Load background color
    if (preset.settings.backgroundColor) {
      localStorage.setItem('audioVibe_backgroundColor', preset.settings.backgroundColor);
      if (visualEngineRef.current) {
        visualEngineRef.current.setBackgroundColor(preset.settings.backgroundColor);
      }
    }
    
    // Load effect parameters
    if (preset.settings.effectParameters && visualEngineRef.current) {
      // Apply parameters for each effect
      Object.entries(preset.settings.effectParameters).forEach(([effectName, params]) => {
        if (params && typeof params === 'object') {
          // Set all parameters for this effect
          effectParameterManager.setParameters(effectName, params as any);
          
          // If this is the current effect, save to localStorage for export
          if (effectName === preset.settings.currentEffect) {
            localStorage.setItem(`effectParams_${effectName}`, JSON.stringify(params));
          }
        }
      });
      
      // Force a render after loading parameters
      if (!visualEngineRef.current.getIsRunning()) {
        visualEngineRef.current.start();
      }
    }
    
    // Load text overlays
    if (preset.settings.textOverlays) {
      handleTextOverlayUpdate(preset.settings.textOverlays);
    }
    
    // Save to undo/redo
    pushState(appState, actionDescriptions.general.loadPreset(preset.name), 'general');
  };

  const handleExport = () => {
    // Save current state before export
    const currentState = {
      currentEffect,
      effectParameters: {}, // Will implement parameter loading later
      textOverlays
    };
    localStorage.setItem('exportState', JSON.stringify(currentState));
    
    navigate('/export');
  };
  return (
    <div className="editor-screen">
      {/* Header */}
      <div className="editor-header">
        <div className="header-left">
          <h1>AudioVibe Studio</h1>
        </div>
        
        <div className="header-center">
          <div className="playback-controls">
            <button className="control-btn" onClick={handleStop} title="Stop">⏹</button>
            <button className="control-btn play-btn" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="time-display">
              {Math.floor(currentTime / 60000)}:{Math.floor((currentTime % 60000) / 1000).toString().padStart(2, '0')} / 
              {Math.floor(duration / 60000)}:{Math.floor((duration % 60000) / 1000).toString().padStart(2, '0')}
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button onClick={() => setIsHistoryOpen(true)} className="header-btn" title="History (Ctrl+H)">
            📝 History
          </button>
          <button onClick={() => setIsPresetManagerOpen(true)} className="header-btn" title="Presets (Ctrl+P)">
            💾 Presets
          </button>
          <button onClick={() => setIsHelpOpen(true)} className="header-btn" title="Help (F1)">
            ❓ Help
          </button>
          <button onClick={handleExport} className="export-btn" title="Export Video (Ctrl+E)">
            🎬 Export
          </button>
        </div>
      </div>

      <div className="editor-main">
        {/* Sidebar */}
        {sidebarVisible && (
          <div className="editor-sidebar">
            <div className="panel-tabs">
              <button 
                className={`tab-btn ${activePanel === 'effects' ? 'active' : ''}`}
                onClick={() => setActivePanel('effects')}
              >
                🎨 Effects
              </button>
              <button 
                className={`tab-btn ${activePanel === 'text' ? 'active' : ''}`}
                onClick={() => setActivePanel('text')}
              >
                📝 Text
              </button>
              <button 
                className={`tab-btn ${activePanel === 'transitions' ? 'active' : ''}`}
                onClick={() => setActivePanel('transitions')}
              >
                🔄 Transitions
              </button>
            </div>

            <div className="panel-content">
              {activePanel === 'effects' && (
                <div className="effects-panel">
                  <h3>Visual Effects</h3>
                  <div className="effect-selector">
                    {availableEffects.map(effect => (
                      <button 
                        key={effect}
                        className={`effect-btn ${currentEffect === effect ? 'active' : ''}`}
                        onClick={() => handleEffectChange(effect)}
                      >
                        {effect.charAt(0).toUpperCase() + effect.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  <ParameterControls 
                    effectName={currentEffect} 
                    visualEngine={visualEngineRef.current}
                    onParameterChange={(paramName, value) => {
                      console.log(`Parameter ${paramName} changed to:`, value);
                    }}
                  />
                </div>
              )}

              {activePanel === 'text' && (
                <TextOverlayControls
                  textRenderer={visualEngineRef.current?.getTextRenderer() || null}
                  onOverlayChange={handleTextOverlayUpdate}
                />
              )}

              {activePanel === 'transitions' && (
                <TransitionControls
                  transitionEngine={transitionEngineRef.current}
                  currentEffect={currentEffect}
                  onEffectChange={handleEffectChange}
                  availableEffects={availableEffects}
                />
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="editor-content">
          {/* Preview */}
          <div className="preview-section">
            <canvas ref={canvasRef} className="preview-canvas" width="1080" height="1920" />
          </div>

          {/* Timeline */}
          {timelineVisible && (
            <div className="timeline-section">
              <Timeline
                duration={duration}
                currentTime={currentTime}
                onTimeChange={handleSeek}
                textOverlays={textOverlays}
                onTextOverlayUpdate={handleTextOverlayUpdate}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PresetManager
        isOpen={isPresetManagerOpen}
        onClose={() => setIsPresetManagerOpen(false)}
        currentEffect={currentEffect}
        effectParameters={{
          waveform: effectParameterManager.getParameters('waveform'),
          particles: effectParameterManager.getParameters('particles'),
          geometric: effectParameterManager.getParameters('geometric'),
          gradient: effectParameterManager.getParameters('gradient'),
          '3d': effectParameterManager.getParameters('3d')
        }}
        textOverlays={textOverlays}
        onLoadPreset={handleLoadPreset}
      />

      <HelpSystem
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        shortcuts={shortcuts}
      />

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        currentIndex={currentIndex}
        onJumpToAction={jumpToAction}
        onUndo={undo}
        onRedo={redo}
        onClearHistory={clearHistory}
        canUndo={canUndo}
        canRedo={canRedo}
        undoDescription={getUndoDescription()}
        redoDescription={getRedoDescription()}
      />

      <style>{`
        .editor-screen {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #0f0f0f;
          color: white;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 20px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
        }

        .header-left h1 {
          margin: 0;
          font-size: 20px;
          color: #4ecdc4;
        }

        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .playback-controls {
          display: flex;
          align-items: center;
          gap: 15px;
          background: #2a2a2a;
          border-radius: 8px;
          padding: 8px 16px;
        }

        .control-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: #4ecdc4;
          color: white;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .control-btn:hover {
          background: #45b7b8;
          transform: scale(1.05);
        }

        .play-btn {
          background: #27ae60;
        }

        .play-btn:hover {
          background: #219a52;
        }

        .time-display {
          font-family: monospace;
          font-size: 14px;
          color: #ccc;
          min-width: 120px;
        }

        .header-right {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .header-btn {
          padding: 8px 16px;
          background: #333;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .header-btn:hover {
          background: #444;
        }

        .export-btn {
          padding: 10px 20px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .export-btn:hover {
          background: #c0392b;
        }

        .editor-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .editor-sidebar {
          width: 350px;
          background: #1a1a1a;
          border-right: 1px solid #333;
          display: flex;
          flex-direction: column;
        }

        .panel-tabs {
          display: flex;
          background: #2a2a2a;
          border-bottom: 1px solid #333;
        }

        .tab-btn {
          flex: 1;
          padding: 12px 8px;
          background: transparent;
          color: #ccc;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .tab-btn.active {
          color: #4ecdc4;
          border-bottom-color: #4ecdc4;
          background: rgba(78, 205, 196, 0.1);
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 0;
        }

        .effects-panel {
          padding: 20px;
        }

        .effects-panel h3 {
          margin: 0 0 15px 0;
          color: #4ecdc4;
        }

        .effect-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        }

        .effect-btn {
          padding: 12px 8px;
          background: #333;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .effect-btn:hover {
          background: #444;
        }

        .effect-btn.active {
          background: #4ecdc4;
          color: white;
        }

        .editor-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .preview-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          padding: 20px;
        }

        .preview-canvas {
          max-width: 100%;
          max-height: 100%;
          border: 1px solid #333;
          border-radius: 8px;
        }

        .timeline-section {
          background: #1a1a1a;
          border-top: 1px solid #333;
        }

        @media (max-width: 1200px) {
          .editor-sidebar {
            width: 300px;
          }
        }

        @media (max-width: 900px) {
          .header-center {
            display: none;
          }
          
          .editor-sidebar {
            width: 250px;
          }
        }
      `}</style>
    </div>
  );
}