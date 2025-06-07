import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoExporter, ExportSettings, ExportProgress } from '../modules/video/VideoExporter';
import { VisualEngine } from '../modules/visual/VisualEngine';
import { AudioContextManager } from '../modules/audio/AudioContext';

export function ExportScreen() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualEngineRef = useRef<VisualEngine | null>(null);
  const videoExporterRef = useRef<VideoExporter | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({ percentage: 0, timeRemaining: 0, currentFrame: 0, totalFrames: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'webm',
    quality: 'high',
    fps: 30
  });
  const audioManager = AudioContextManager.getInstance();

  useEffect(() => {
    // Check if audio is loaded
    if (audioManager.getDuration() === 0) {
      navigate('/');
      return;
    }

    // Initialize visual engine for export
    if (canvasRef.current && !visualEngineRef.current) {
      visualEngineRef.current = new VisualEngine(canvasRef.current);
      videoExporterRef.current = new VideoExporter(canvasRef.current, visualEngineRef.current);
      
      videoExporterRef.current.setProgressCallback((progress) => {
        setExportProgress(progress);
      });
    }

    return () => {
      visualEngineRef.current?.dispose();
    };
  }, [navigate]);

  const handleExport = async () => {
    if (!videoExporterRef.current || isExporting) return;

    setIsExporting(true);
    setExportedBlob(null);
    
    try {
      const blob = await videoExporterRef.current.startExport(settings);
      setExportedBlob(blob);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedBlob) return;

    const url = URL.createObjectURL(exportedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audiovibe-video.${settings.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSettingChange = (key: keyof ExportSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="export-screen">
      <div className="export-container">
        <h1>Export Your Video</h1>
        
        <div className="preview-section">
          <canvas ref={canvasRef} className="export-canvas" width="1080" height="1920" />
        </div>
        
        <div className="export-settings">
          <div className="setting-group">
            <label>Format</label>
            <select 
              value={settings.format} 
              onChange={(e) => handleSettingChange('format', e.target.value as 'webm' | 'mp4')}
            >
              <option value="webm">WebM</option>
              <option value="mp4">MP4</option>
            </select>
          </div>
          
          <div className="setting-group">
            <label>Quality</label>
            <select 
              value={settings.quality}
              onChange={(e) => handleSettingChange('quality', e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">Low (1 Mbps)</option>
              <option value="medium">Medium (2.5 Mbps)</option>
              <option value="high">High (5 Mbps)</option>
            </select>
          </div>
          
          <div className="setting-group">
            <label>Frame Rate</label>
            <select 
              value={settings.fps}
              onChange={(e) => handleSettingChange('fps', parseInt(e.target.value))}
            >
              <option value="24">24 FPS</option>
              <option value="30">30 FPS</option>
              <option value="60">60 FPS</option>
            </select>
          </div>
          
          <div className="setting-group">
            <label>Resolution</label>
            <select disabled>
              <option value="1080x1920">1080×1920 (9:16)</option>
            </select>
          </div>
        </div>
        
        {!isExporting && !exportedBlob && (
          <button className="start-export-btn" onClick={handleExport}>
            Start Export
          </button>
        )}
        
        {isExporting && (
          <div className="export-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${exportProgress.percentage}%` }}
              />
            </div>
            <div className="progress-info">
              <p className="progress-text">{Math.round(exportProgress.percentage)}% Complete</p>
              <p className="progress-detail">
                Frame {exportProgress.currentFrame} of {exportProgress.totalFrames}
              </p>
              <p className="progress-time">
                {Math.round(exportProgress.timeRemaining)}s remaining
              </p>
            </div>
          </div>
        )}
        
        {exportedBlob && !isExporting && (
          <div className="export-complete">
            <p>✅ Export Complete!</p>
            <button className="download-btn" onClick={handleDownload}>
              Download Video ({settings.format.toUpperCase()})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}