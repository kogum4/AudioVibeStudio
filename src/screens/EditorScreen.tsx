import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioContextManager } from '../modules/audio/AudioContext';
import { VisualEngine } from '../modules/visual/VisualEngine';
import { ParameterControls } from '../components/ParameterControls';

export function EditorScreen() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualEngineRef = useRef<VisualEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEffect, setCurrentEffect] = useState('waveform');
  const audioManager = AudioContextManager.getInstance();

  useEffect(() => {
    // Check if audio is loaded
    if (audioManager.getDuration() === 0) {
      navigate('/');
      return;
    }

    // Initialize visual engine
    if (canvasRef.current && !visualEngineRef.current) {
      visualEngineRef.current = new VisualEngine(canvasRef.current);
      visualEngineRef.current.start();
    }

    return () => {
      visualEngineRef.current?.dispose();
    };
  }, [navigate]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioManager.pause();
    } else {
      audioManager.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    audioManager.stop();
    setIsPlaying(false);
  };

  const handleEffectChange = (effect: string) => {
    setCurrentEffect(effect);
    visualEngineRef.current?.setEffect(effect);
  };

  const handleExport = () => {
    navigate('/export');
  };
  return (
    <div className="editor-screen">
      <div className="editor-container">
        <div className="preview-section">
          <canvas ref={canvasRef} className="preview-canvas" width="1080" height="1920" />
          <div className="playback-controls">
            <button className="control-btn" onClick={handleStop}>⏹</button>
            <button className="control-btn play-btn" onClick={handlePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>
        </div>
        
        <div className="controls-section">
          <h2>Visual Effects</h2>
          <div className="effect-selector">
            <button 
              className={`effect-btn ${currentEffect === 'waveform' ? 'active' : ''}`}
              onClick={() => handleEffectChange('waveform')}
            >
              Waveform
            </button>
            <button 
              className={`effect-btn ${currentEffect === 'particles' ? 'active' : ''}`}
              onClick={() => handleEffectChange('particles')}
            >
              Particles
            </button>
            <button 
              className={`effect-btn ${currentEffect === 'geometric' ? 'active' : ''}`}
              onClick={() => handleEffectChange('geometric')}
            >
              Geometric
            </button>
            <button 
              className={`effect-btn ${currentEffect === 'gradient' ? 'active' : ''}`}
              onClick={() => handleEffectChange('gradient')}
            >
              Gradient
            </button>
            <button 
              className={`effect-btn ${currentEffect === '3d' ? 'active' : ''}`}
              onClick={() => handleEffectChange('3d')}
            >
              3D
            </button>
          </div>
          
          <ParameterControls 
            effectName={currentEffect} 
            onParameterChange={(paramName, value) => {
              console.log(`Parameter ${paramName} changed to:`, value);
            }}
          />
          
          <button className="export-btn" onClick={handleExport}>Export Video</button>
        </div>
      </div>
    </div>
  );
}