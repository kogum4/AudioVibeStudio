import React, { useState, useEffect } from 'react';
import { TextOverlay, TextAnimation } from '../types/visual';
import { TextRenderer } from '../modules/visual/TextRenderer';

interface TextOverlayControlsProps {
  textRenderer: TextRenderer | null;
  onOverlayChange?: (overlays: TextOverlay[]) => void;
}

export const TextOverlayControls: React.FC<TextOverlayControlsProps> = ({
  textRenderer,
  onOverlayChange
}) => {
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [newText, setNewText] = useState('');

  useEffect(() => {
    if (textRenderer) {
      const currentOverlays = textRenderer.getTextOverlays();
      setOverlays(currentOverlays);
    }
  }, [textRenderer]);

  const addTextOverlay = () => {
    if (!textRenderer || !newText.trim()) return;

    const overlay = TextRenderer.createDefaultOverlay(
      `overlay-${Date.now()}`,
      newText.trim()
    );
    
    textRenderer.addTextOverlay(overlay);
    const updatedOverlays = textRenderer.getTextOverlays();
    setOverlays(updatedOverlays);
    setNewText('');
    onOverlayChange?.(updatedOverlays);
  };

  const addPresetOverlay = (type: 'title' | 'subtitle' | 'beat') => {
    if (!textRenderer) return;

    let overlay: TextOverlay;
    switch (type) {
      case 'title':
        overlay = TextRenderer.createTitleOverlay('Title Text');
        break;
      case 'subtitle':
        overlay = TextRenderer.createSubtitleOverlay('Subtitle Text');
        break;
      case 'beat':
        overlay = TextRenderer.createBeatTextOverlay('Beat Text');
        break;
    }

    textRenderer.addTextOverlay(overlay);
    const updatedOverlays = textRenderer.getTextOverlays();
    setOverlays(updatedOverlays);
    onOverlayChange?.(updatedOverlays);
  };

  const removeOverlay = (id: string) => {
    if (!textRenderer) return;

    textRenderer.removeTextOverlay(id);
    const updatedOverlays = textRenderer.getTextOverlays();
    setOverlays(updatedOverlays);
    setSelectedOverlay(null);
    onOverlayChange?.(updatedOverlays);
  };

  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    if (!textRenderer) return;

    textRenderer.updateTextOverlay(id, updates);
    const updatedOverlays = textRenderer.getTextOverlays();
    setOverlays(updatedOverlays);
    onOverlayChange?.(updatedOverlays);
  };

  const clearAllOverlays = () => {
    if (!textRenderer) return;

    textRenderer.clearAllOverlays();
    setOverlays([]);
    setSelectedOverlay(null);
    onOverlayChange?.([]);
  };

  const selectedOverlayData = overlays.find(o => o.id === selectedOverlay);

  return (
    <div className="text-overlay-controls">
      <h3>Text Overlays</h3>
      
      {/* Add New Text */}
      <div className="text-input-section">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Enter text..."
          className="text-input"
          onKeyPress={(e) => e.key === 'Enter' && addTextOverlay()}
        />
        <button onClick={addTextOverlay} className="add-button">
          Add Text
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="preset-buttons">
        <button onClick={() => addPresetOverlay('title')} className="preset-button">
          Add Title
        </button>
        <button onClick={() => addPresetOverlay('subtitle')} className="preset-button">
          Add Subtitle
        </button>
        <button onClick={() => addPresetOverlay('beat')} className="preset-button">
          Add Beat Text
        </button>
      </div>

      {/* Overlay List */}
      <div className="overlay-list">
        {overlays.map((overlay) => (
          <div
            key={overlay.id}
            className={`overlay-item ${selectedOverlay === overlay.id ? 'selected' : ''}`}
            onClick={() => setSelectedOverlay(overlay.id)}
          >
            <span className="overlay-text">{overlay.text}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeOverlay(overlay.id);
              }}
              className="remove-button"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Controls for Selected Overlay */}
      {selectedOverlayData && (
        <div className="overlay-editor">
          <h4>Edit Text Overlay</h4>
          
          {/* Basic Properties */}
          <div className="control-group">
            <label>Text:</label>
            <input
              type="text"
              value={selectedOverlayData.text}
              onChange={(e) => updateOverlay(selectedOverlay!, { text: e.target.value })}
              className="text-input"
            />
          </div>

          <div className="control-row">
            <div className="control-group">
              <label>Font Size:</label>
              <input
                type="range"
                min="12"
                max="120"
                value={selectedOverlayData.fontSize}
                onChange={(e) => updateOverlay(selectedOverlay!, { fontSize: Number(e.target.value) })}
              />
              <span>{selectedOverlayData.fontSize}px</span>
            </div>

            <div className="control-group">
              <label>Opacity:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedOverlayData.opacity}
                onChange={(e) => updateOverlay(selectedOverlay!, { opacity: Number(e.target.value) })}
              />
              <span>{Math.round(selectedOverlayData.opacity * 100)}%</span>
            </div>
          </div>

          <div className="control-row">
            <div className="control-group">
              <label>Color:</label>
              <input
                type="color"
                value={selectedOverlayData.color}
                onChange={(e) => updateOverlay(selectedOverlay!, { color: e.target.value })}
                className="color-input"
              />
            </div>

            <div className="control-group">
              <label>Rotation:</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={selectedOverlayData.rotation}
                onChange={(e) => updateOverlay(selectedOverlay!, { rotation: Number(e.target.value) })}
              />
              <span>{selectedOverlayData.rotation}°</span>
            </div>
          </div>

          {/* Position */}
          <div className="control-row">
            <div className="control-group">
              <label>X Position:</label>
              <input
                type="range"
                min="0"
                max="1080"
                value={selectedOverlayData.position.x}
                onChange={(e) => updateOverlay(selectedOverlay!, { 
                  position: { ...selectedOverlayData.position, x: Number(e.target.value) }
                })}
              />
              <span>{selectedOverlayData.position.x}</span>
            </div>

            <div className="control-group">
              <label>Y Position:</label>
              <input
                type="range"
                min="0"
                max="1920"
                value={selectedOverlayData.position.y}
                onChange={(e) => updateOverlay(selectedOverlay!, { 
                  position: { ...selectedOverlayData.position, y: Number(e.target.value) }
                })}
              />
              <span>{selectedOverlayData.position.y}</span>
            </div>
          </div>

          {/* Animation */}
          <div className="control-group">
            <label>Animation:</label>
            <select
              value={selectedOverlayData.animation.type}
              onChange={(e) => updateOverlay(selectedOverlay!, {
                animation: { ...selectedOverlayData.animation, type: e.target.value as TextAnimation['type'] }
              })}
              className="select-input"
            >
              <option value="none">None</option>
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="bounce">Bounce</option>
              <option value="pulse">Pulse</option>
              <option value="typewriter">Typewriter</option>
              <option value="wave">Wave</option>
            </select>
          </div>

          <div className="control-row">
            <div className="control-group">
              <label>Duration (ms):</label>
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={selectedOverlayData.animation.duration}
                onChange={(e) => updateOverlay(selectedOverlay!, {
                  animation: { ...selectedOverlayData.animation, duration: Number(e.target.value) }
                })}
                className="number-input"
              />
            </div>

            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={selectedOverlayData.animation.audioReactive}
                  onChange={(e) => updateOverlay(selectedOverlay!, {
                    animation: { ...selectedOverlayData.animation, audioReactive: e.target.checked }
                  })}
                />
                Audio Reactive
              </label>
            </div>
          </div>

          {/* Style Options */}
          <div className="control-row">
            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={selectedOverlayData.style.bold}
                  onChange={(e) => updateOverlay(selectedOverlay!, {
                    style: { ...selectedOverlayData.style, bold: e.target.checked }
                  })}
                />
                Bold
              </label>
            </div>

            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={selectedOverlayData.style.italic}
                  onChange={(e) => updateOverlay(selectedOverlay!, {
                    style: { ...selectedOverlayData.style, italic: e.target.checked }
                  })}
                />
                Italic
              </label>
            </div>

            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={selectedOverlayData.style.stroke}
                  onChange={(e) => updateOverlay(selectedOverlay!, {
                    style: { ...selectedOverlayData.style, stroke: e.target.checked }
                  })}
                />
                Stroke
              </label>
            </div>

            <div className="control-group">
              <label>
                <input
                  type="checkbox"
                  checked={selectedOverlayData.style.shadow}
                  onChange={(e) => updateOverlay(selectedOverlay!, {
                    style: { ...selectedOverlayData.style, shadow: e.target.checked }
                  })}
                />
                Shadow
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Button */}
      {overlays.length > 0 && (
        <button onClick={clearAllOverlays} className="clear-all-button">
          Clear All Text
        </button>
      )}

      <style>{`
        .text-overlay-controls {
          background: rgba(30, 30, 30, 0.95);
          border-radius: 8px;
          padding: 20px;
          margin: 10px 0;
          color: white;
        }

        .text-input-section {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .text-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #444;
          border-radius: 4px;
          background: #2a2a2a;
          color: white;
          font-size: 14px;
        }

        .add-button, .preset-button {
          padding: 8px 16px;
          background: #4ecdc4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .add-button:hover, .preset-button:hover {
          background: #45b7b8;
        }

        .preset-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .overlay-list {
          max-height: 150px;
          overflow-y: auto;
          margin-bottom: 15px;
          border: 1px solid #444;
          border-radius: 4px;
        }

        .overlay-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #444;
          transition: background 0.2s;
        }

        .overlay-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .overlay-item.selected {
          background: rgba(78, 205, 196, 0.2);
        }

        .overlay-text {
          flex: 1;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .remove-button {
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          transition: background 0.2s;
        }

        .remove-button:hover {
          background: #c0392b;
        }

        .overlay-editor {
          border-top: 1px solid #444;
          padding-top: 15px;
        }

        .control-group {
          margin-bottom: 10px;
        }

        .control-row {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }

        .control-row .control-group {
          flex: 1;
          margin-bottom: 0;
        }

        label {
          display: block;
          font-size: 12px;
          color: #ccc;
          margin-bottom: 5px;
        }

        input[type="range"] {
          width: 100%;
          margin: 5px 0;
        }

        input[type="number"], .select-input {
          width: 100%;
          padding: 4px 8px;
          border: 1px solid #444;
          border-radius: 4px;
          background: #2a2a2a;
          color: white;
          font-size: 12px;
        }

        .color-input {
          width: 50px;
          height: 30px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .number-input {
          width: 80px;
        }

        .clear-all-button {
          width: 100%;
          padding: 10px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 15px;
          transition: background 0.2s;
        }

        .clear-all-button:hover {
          background: #c0392b;
        }

        span {
          font-size: 12px;
          color: #ccc;
          margin-left: 8px;
        }
      `}</style>
    </div>
  );
};