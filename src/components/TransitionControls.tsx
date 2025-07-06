import React, { useState } from 'react';
import { Transition, TransitionEngine } from '../modules/visual/TransitionEngine';

interface TransitionControlsProps {
  transitionEngine: TransitionEngine | null;
  currentEffect: string;
  onEffectChange: (effect: string) => void;
  availableEffects: string[];
}

export const TransitionControls: React.FC<TransitionControlsProps> = ({
  transitionEngine,
  currentEffect,
  onEffectChange,
  availableEffects
}) => {
  const [selectedTransition, setSelectedTransition] = useState<string>('fade');
  const [transitionDuration, setTransitionDuration] = useState(1000);
  const [audioReactive, setAudioReactive] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | 'down' | 'center'>('left');
  const [easing, setEasing] = useState<'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce'>('ease-in-out');
  const [autoTransition, setAutoTransition] = useState(false);
  const [autoInterval, setAutoInterval] = useState(10000);

  const transitionTypes = [
    { id: 'fade', name: 'Fade', description: 'Smooth crossfade between effects' },
    { id: 'slide', name: 'Slide', description: 'Slide effects in/out from edges' },
    { id: 'zoom', name: 'Zoom', description: 'Zoom out from old, zoom in to new' },
    { id: 'rotation', name: 'Rotation', description: 'Rotate effects in 3D space' },
    { id: 'blur', name: 'Blur', description: 'Blur transition with crossfade' },
    { id: 'pixelate', name: 'Pixelate', description: 'Pixelation effect during transition' },
    { id: 'wipe', name: 'Wipe', description: 'Wipe from one effect to another' },
    { id: 'dissolve', name: 'Dissolve', description: 'Random pixel dissolve transition' }
  ];

  const easingTypes = [
    { id: 'linear', name: 'Linear' },
    { id: 'ease-in', name: 'Ease In' },
    { id: 'ease-out', name: 'Ease Out' },
    { id: 'ease-in-out', name: 'Ease In Out' },
    { id: 'bounce', name: 'Bounce' }
  ];

  const directionOptions = [
    { id: 'left', name: 'Left' },
    { id: 'right', name: 'Right' },
    { id: 'up', name: 'Up' },
    { id: 'down', name: 'Down' },
    { id: 'center', name: 'Center' }
  ];

  const handleEffectTransition = (newEffect: string) => {
    if (!transitionEngine || newEffect === currentEffect) return;

    const transition = createTransition();
    transitionEngine.startTransition(transition, currentEffect, newEffect);
    onEffectChange(newEffect);
  };

  const createTransition = (): Transition => {
    const baseProps = {
      duration: transitionDuration,
      easing,
      audioReactive
    };

    switch (selectedTransition) {
      case 'fade':
        return TransitionEngine.createFadeTransition(baseProps.duration, baseProps.audioReactive);
      case 'slide':
        const slideDirection = direction === 'center' ? 'left' : direction as 'left' | 'right' | 'up' | 'down';
        return TransitionEngine.createSlideTransition(slideDirection, baseProps.duration, baseProps.audioReactive);
      case 'zoom':
        return TransitionEngine.createZoomTransition(baseProps.duration, baseProps.audioReactive);
      case 'rotation':
        return TransitionEngine.createRotationTransition(baseProps.duration, baseProps.audioReactive);
      case 'wipe':
        return TransitionEngine.createWipeTransition(direction, baseProps.duration, baseProps.audioReactive);
      case 'dissolve':
        return TransitionEngine.createDissolveTransition(baseProps.duration, baseProps.audioReactive);
      default:
        return TransitionEngine.createFadeTransition(baseProps.duration, baseProps.audioReactive);
    }
  };

  const previewTransition = () => {
    if (!transitionEngine) return;
    
    // Create a preview transition between current effect and itself
    const transition = createTransition();
    transitionEngine.startTransition(transition, currentEffect, currentEffect);
  };

  // Auto transition functionality
  React.useEffect(() => {
    if (!autoTransition || !transitionEngine) return;

    const interval = setInterval(() => {
      const currentIndex = availableEffects.indexOf(currentEffect);
      const nextIndex = (currentIndex + 1) % availableEffects.length;
      const nextEffect = availableEffects[nextIndex];
      
      if (nextEffect) {
        handleEffectTransition(nextEffect);
      }
    }, autoInterval);

    return () => clearInterval(interval);
  }, [autoTransition, autoInterval, currentEffect, availableEffects, transitionEngine]);

  const requiresDirection = ['slide', 'wipe'].includes(selectedTransition);
  const supportsAudioReactive = ['fade', 'zoom', 'rotation'].includes(selectedTransition);

  return (
    <div className="transition-controls">
      <h3>Transition Effects</h3>
      
      {/* Quick Effect Buttons */}
      <div className="effect-buttons">
        <h4>Switch Effects:</h4>
        <div className="button-grid">
          {availableEffects.map(effect => (
            <button
              key={effect}
              onClick={() => handleEffectTransition(effect)}
              className={`effect-button ${currentEffect === effect ? 'active' : ''}`}
              disabled={transitionEngine?.isTransitioning()}
            >
              {effect.charAt(0).toUpperCase() + effect.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transition Type */}
      <div className="control-group">
        <label>Transition Type:</label>
        <div className="transition-grid">
          {transitionTypes.map(type => (
            <div
              key={type.id}
              className={`transition-option ${selectedTransition === type.id ? 'selected' : ''}`}
              onClick={() => setSelectedTransition(type.id)}
            >
              <div className="transition-name">{type.name}</div>
              <div className="transition-description">{type.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transition Settings */}
      <div className="settings-row">
        <div className="control-group">
          <label>Duration (ms):</label>
          <input
            type="range"
            min="200"
            max="3000"
            step="100"
            value={transitionDuration}
            onChange={(e) => setTransitionDuration(Number(e.target.value))}
          />
          <span>{transitionDuration}ms</span>
        </div>

        <div className="control-group">
          <label>Easing:</label>
          <select
            value={easing}
            onChange={(e) => setEasing(e.target.value as any)}
            className="select-input"
          >
            {easingTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Direction (for slide and wipe) */}
      {requiresDirection && (
        <div className="control-group">
          <label>Direction:</label>
          <div className="direction-grid">
            {directionOptions.map(dir => (
              <button
                key={dir.id}
                onClick={() => setDirection(dir.id as any)}
                className={`direction-button ${direction === dir.id ? 'active' : ''}`}
              >
                {dir.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Audio Reactive */}
      {supportsAudioReactive && (
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={audioReactive}
              onChange={(e) => setAudioReactive(e.target.checked)}
            />
            Audio Reactive Transitions
          </label>
          <div className="help-text">
            When enabled, transitions respond to beats and frequency changes
          </div>
        </div>
      )}

      {/* Auto Transition */}
      <div className="control-group">
        <label>
          <input
            type="checkbox"
            checked={autoTransition}
            onChange={(e) => setAutoTransition(e.target.checked)}
          />
          Auto Transition Between Effects
        </label>
        
        {autoTransition && (
          <div className="auto-settings">
            <label>Interval (seconds):</label>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={autoInterval / 1000}
              onChange={(e) => setAutoInterval(Number(e.target.value) * 1000)}
            />
            <span>{autoInterval / 1000}s</span>
          </div>
        )}
      </div>

      {/* Preview and Status */}
      <div className="transition-actions">
        <button
          onClick={previewTransition}
          className="preview-button"
          disabled={transitionEngine?.isTransitioning()}
        >
          Preview Transition
        </button>
        
        {transitionEngine?.isTransitioning() && (
          <div className="transition-status">
            <div className="status-text">Transitioning...</div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(transitionEngine.getProgress() || 0) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .transition-controls {
          background: rgba(30, 30, 30, 0.95);
          border-radius: 8px;
          padding: 20px;
          margin: 10px 0;
          color: white;
        }

        .transition-controls h3 {
          margin: 0 0 20px 0;
          color: #4ecdc4;
        }

        .transition-controls h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #ccc;
        }

        .effect-buttons {
          margin-bottom: 20px;
        }

        .button-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 8px;
        }

        .effect-button {
          padding: 8px 12px;
          background: #444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .effect-button:hover {
          background: #555;
        }

        .effect-button.active {
          background: #4ecdc4;
        }

        .effect-button:disabled {
          background: #666;
          cursor: not-allowed;
          opacity: 0.5;
        }

        .control-group {
          margin-bottom: 15px;
        }

        .control-group label {
          display: block;
          font-size: 12px;
          color: #ccc;
          margin-bottom: 8px;
        }

        .transition-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .transition-option {
          padding: 12px;
          background: #333;
          border: 2px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .transition-option:hover {
          border-color: rgba(78, 205, 196, 0.5);
        }

        .transition-option.selected {
          border-color: #4ecdc4;
          background: rgba(78, 205, 196, 0.1);
        }

        .transition-name {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .transition-description {
          font-size: 11px;
          color: #999;
          line-height: 1.3;
        }

        .settings-row {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .settings-row .control-group {
          flex: 1;
          margin-bottom: 0;
        }

        input[type="range"] {
          width: 100%;
          margin: 5px 0;
        }

        .select-input {
          width: 100%;
          padding: 6px;
          background: #444;
          border: 1px solid #555;
          border-radius: 4px;
          color: white;
          font-size: 12px;
        }

        .direction-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }

        .direction-button {
          padding: 6px 8px;
          background: #444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          transition: background 0.2s;
        }

        .direction-button:hover {
          background: #555;
        }

        .direction-button.active {
          background: #4ecdc4;
        }

        .help-text {
          font-size: 11px;
          color: #888;
          margin-top: 4px;
          line-height: 1.3;
        }

        .auto-settings {
          margin-top: 10px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .auto-settings label {
          margin-bottom: 5px;
        }

        .transition-actions {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 20px;
        }

        .preview-button {
          padding: 10px 16px;
          background: #4ecdc4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .preview-button:hover:not(:disabled) {
          background: #45b7b8;
        }

        .preview-button:disabled {
          background: #666;
          cursor: not-allowed;
        }

        .transition-status {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-text {
          font-size: 12px;
          color: #4ecdc4;
          white-space: nowrap;
        }

        .progress-bar {
          flex: 1;
          height: 4px;
          background: #333;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #4ecdc4;
          transition: width 0.1s ease;
        }

        span {
          font-size: 11px;
          color: #ccc;
          margin-left: 8px;
        }

        input[type="checkbox"] {
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
};