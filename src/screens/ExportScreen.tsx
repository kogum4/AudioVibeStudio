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
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [formatSupport, setFormatSupport] = useState<{ [key: string]: boolean }>({});
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
      
      // Load export state from localStorage
      const exportState = localStorage.getItem('exportState');
      if (exportState) {
        try {
          const state = JSON.parse(exportState);
          
          // Set effect
          if (state.currentEffect) {
            visualEngineRef.current.setEffect(state.currentEffect);
          }
          
          // Load text overlays
          if (state.textOverlays && Array.isArray(state.textOverlays)) {
            state.textOverlays.forEach((overlay: any) => {
              visualEngineRef.current?.addTextOverlay(overlay);
            });
          }
          
          // Load effect parameters (if available)
          if (state.effectParameters) {
            // This would need parameter loading methods in VisualEngine
            console.log('Effect parameters loaded:', state.effectParameters);
          }
        } catch (error) {
          console.error('Failed to parse export state:', error);
        }
      } else {
        // Fallback to individual localStorage items
        const savedEffect = localStorage.getItem('currentEffect');
        const savedTextOverlays = localStorage.getItem('textOverlays');
        
        if (savedEffect) {
          visualEngineRef.current.setEffect(savedEffect);
        }
        
        if (savedTextOverlays) {
          try {
            const textOverlays = JSON.parse(savedTextOverlays);
            textOverlays.forEach((overlay: any) => {
              visualEngineRef.current?.addTextOverlay(overlay);
            });
          } catch (error) {
            console.error('Failed to parse text overlays:', error);
          }
        }
      }
      
      videoExporterRef.current = new VideoExporter(canvasRef.current, visualEngineRef.current);
      
      videoExporterRef.current.setProgressCallback((progress) => {
        setExportProgress(progress);
      });
      
      // Get format support information
      setFormatSupport(videoExporterRef.current.getDetailedFormatSupport());
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

        {/* Format Support Diagnostics */}
        <div className="diagnostics-section">
          <button 
            className="diagnostics-toggle"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
          >
            {showDiagnostics ? '🔽' : '▶️'} Format Support & Troubleshooting
          </button>
          
          {showDiagnostics && (
            <div className="diagnostics-content">
              {/* MP4 Compatibility Warning */}
              {settings.format === 'mp4' && (
                <div className="compatibility-warning">
                  <h4>⚠️ MP4エクスポートについて</h4>
                  <p>
                    ブラウザのMP4サポートは制限されており、エクスポートされたファイルが一部のプレイヤーで再生できない場合があります。
                  </p>
                  <ul>
                    <li><strong>推奨:</strong> より安定したWebM形式を使用</li>
                    <li><strong>変換:</strong> エクスポート後にFFmpegやHandBrakeで変換</li>
                    <li><strong>ブラウザ:</strong> Chrome/Edgeで最適なMP4サポート</li>
                  </ul>
                </div>
              )}

              {/* Format Support Table */}
              <div className="support-table">
                <h4>📊 対応フォーマット詳細</h4>
                <div className="support-grid">
                  {Object.entries(formatSupport).map(([format, supported]) => (
                    <div key={format} className={`support-item ${supported ? 'supported' : 'unsupported'}`}>
                      <span className="format-name">{format}</span>
                      <span className="support-status">
                        {supported ? '✅ サポート' : '❌ 非サポート'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Troubleshooting Tips */}
              <div className="troubleshooting">
                <h4>🔧 トラブルシューティング</h4>
                <div className="tips">
                  <div className="tip">
                    <strong>問題:</strong> MP4が再生できない
                    <br />
                    <strong>解決法:</strong> WebM形式でエクスポートするか、VLC Media Playerを使用
                  </div>
                  <div className="tip">
                    <strong>問題:</strong> ファイルサイズが大きすぎる
                    <br />
                    <strong>解決法:</strong> 品質を「Low」または「Medium」に変更
                  </div>
                  <div className="tip">
                    <strong>問題:</strong> エクスポートが失敗する
                    <br />
                    <strong>解決法:</strong> ブラウザを再起動し、他のタブを閉じてから再試行
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .export-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: white;
          padding: 20px;
        }

        .export-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .export-container h1 {
          text-align: center;
          color: #4ecdc4;
          margin-bottom: 30px;
        }

        .preview-section {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
        }

        .export-canvas {
          border: 2px solid #333;
          border-radius: 8px;
          max-width: 400px;
          max-height: 712px;
          width: 100%;
          height: auto;
        }

        .export-settings {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
          background: rgba(0, 0, 0, 0.3);
          padding: 20px;
          border-radius: 8px;
        }

        .setting-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-group label {
          font-weight: 500;
          color: #ccc;
        }

        .setting-group select {
          padding: 10px;
          background: #333;
          border: 1px solid #555;
          border-radius: 4px;
          color: white;
          font-size: 14px;
        }

        .start-export-btn, .download-btn {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          padding: 15px 30px;
          background: #4ecdc4;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .start-export-btn:hover, .download-btn:hover {
          background: #45b7b8;
        }

        .export-progress {
          max-width: 400px;
          margin: 0 auto;
          text-align: center;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 15px;
        }

        .progress-fill {
          height: 100%;
          background: #4ecdc4;
          transition: width 0.3s ease;
        }

        .progress-info {
          color: #ccc;
        }

        .export-complete {
          text-align: center;
          margin: 30px 0;
        }

        .export-complete p {
          font-size: 18px;
          margin-bottom: 15px;
          color: #4ecdc4;
        }

        .diagnostics-section {
          margin-top: 40px;
          border-top: 1px solid #333;
          padding-top: 20px;
        }

        .diagnostics-toggle {
          background: transparent;
          border: 1px solid #555;
          color: #ccc;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
          text-align: left;
          transition: all 0.2s;
        }

        .diagnostics-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #4ecdc4;
        }

        .diagnostics-content {
          margin-top: 20px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .compatibility-warning {
          background: rgba(231, 76, 60, 0.1);
          border: 1px solid rgba(231, 76, 60, 0.3);
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .compatibility-warning h4 {
          color: #e74c3c;
          margin: 0 0 10px 0;
        }

        .compatibility-warning ul {
          margin: 10px 0 0 20px;
        }

        .compatibility-warning li {
          margin: 5px 0;
          color: #ccc;
        }

        .support-table {
          margin-bottom: 20px;
        }

        .support-table h4 {
          color: #4ecdc4;
          margin: 0 0 15px 0;
        }

        .support-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .support-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
        }

        .support-item.supported {
          background: rgba(39, 174, 96, 0.1);
          border: 1px solid rgba(39, 174, 96, 0.3);
        }

        .support-item.unsupported {
          background: rgba(231, 76, 60, 0.1);
          border: 1px solid rgba(231, 76, 60, 0.3);
        }

        .format-name {
          font-family: monospace;
          color: #ccc;
        }

        .troubleshooting h4 {
          color: #4ecdc4;
          margin: 0 0 15px 0;
        }

        .tips {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tip {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.4;
        }

        .tip strong {
          color: #4ecdc4;
        }

        @media (max-width: 768px) {
          .export-settings {
            grid-template-columns: 1fr;
          }
          
          .export-canvas {
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  );
}