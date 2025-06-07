import React, { useState } from 'react';

export function ExportScreen() {
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    // TODO: Implement actual export logic
    
    // Simulate export progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setExportProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsExporting(false);
      }
    }, 500);
  };

  return (
    <div className="export-screen">
      <div className="export-container">
        <h1>Export Your Video</h1>
        
        <div className="export-settings">
          <div className="setting-group">
            <label>Format</label>
            <select defaultValue="webm">
              <option value="webm">WebM</option>
              <option value="mp4">MP4 (Coming Soon)</option>
            </select>
          </div>
          
          <div className="setting-group">
            <label>Quality</label>
            <select defaultValue="high">
              <option value="low">Low (720p)</option>
              <option value="medium">Medium (1080p)</option>
              <option value="high">High (1080p, 60fps)</option>
            </select>
          </div>
          
          <div className="setting-group">
            <label>Resolution</label>
            <select defaultValue="1080x1920">
              <option value="1080x1920">1080×1920 (9:16)</option>
            </select>
          </div>
        </div>
        
        {!isExporting && (
          <button className="start-export-btn" onClick={handleExport}>
            Start Export
          </button>
        )}
        
        {isExporting && (
          <div className="export-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="progress-text">{exportProgress}% Complete</p>
          </div>
        )}
        
        {exportProgress === 100 && !isExporting && (
          <div className="export-complete">
            <p>✅ Export Complete!</p>
            <button className="download-btn">Download Video</button>
          </div>
        )}
      </div>
    </div>
  );
}