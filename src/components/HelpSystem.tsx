import React, { useState } from 'react';
import { KeyboardShortcut, formatKeyCombo, getShortcutsByCategory } from '../hooks/useKeyboardShortcuts';

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
}

export const HelpSystem: React.FC<HelpSystemProps> = ({
  isOpen,
  onClose,
  shortcuts = []
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'shortcuts' | 'features' | 'troubleshooting'>('overview');

  if (!isOpen) return null;

  const shortcutsByCategory = getShortcutsByCategory(shortcuts);

  const categoryNames: { [key: string]: string } = {
    playback: 'Playback Controls',
    effects: 'Visual Effects',
    editing: 'Editing',
    view: 'View',
    general: 'General'
  };

  return (
    <div className="help-overlay">
      <div className="help-system">
        {/* Header */}
        <div className="help-header">
          <h2>AudioVibe Studio Help</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {/* Navigation Tabs */}
        <div className="help-nav">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'features' ? 'active' : ''}
            onClick={() => setActiveTab('features')}
          >
            Features
          </button>
          <button 
            className={activeTab === 'shortcuts' ? 'active' : ''}
            onClick={() => setActiveTab('shortcuts')}
          >
            Keyboard Shortcuts
          </button>
          <button 
            className={activeTab === 'troubleshooting' ? 'active' : ''}
            onClick={() => setActiveTab('troubleshooting')}
          >
            Troubleshooting
          </button>
        </div>

        {/* Content */}
        <div className="help-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="help-section">
              <h3>Welcome to AudioVibe Studio</h3>
              <p>
                AudioVibe Studio is a browser-based audio-reactive video generation tool that creates 
                stunning 9:16 vertical videos with visual effects synchronized to your uploaded audio files.
              </p>

              <div className="workflow-steps">
                <h4>Getting Started</h4>
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h5>Upload Audio</h5>
                    <p>Start by uploading your audio file (MP3, WAV, M4A supported). The app will analyze the audio for beat detection and frequency analysis.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h5>Choose Visual Effects</h5>
                    <p>Select from 5 different visual effect types: Waveform, Particles, Geometric, Gradient, and 3D. Each effect responds dynamically to your audio.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h5>Customize Parameters</h5>
                    <p>Fine-tune colors, sizes, speeds, and other parameters. Enable audio-reactive settings for dynamic responses to beats and frequencies.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h5>Add Text Overlays</h5>
                    <p>Add animated text with various fonts, animations, and audio-reactive behaviors. Perfect for titles, lyrics, or branding.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h5>Export Video</h5>
                    <p>Export your creation as MP4 or WebM video with customizable quality settings. Videos are optimized for social media platforms.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="help-section">
              <h3>Features Overview</h3>

              <div className="feature-category">
                <h4>🎵 Audio Processing</h4>
                <ul>
                  <li><strong>Real-time Analysis:</strong> FFT analysis for frequency band detection</li>
                  <li><strong>Beat Detection:</strong> Automatic beat detection with intensity tracking</li>
                  <li><strong>Multi-format Support:</strong> MP3, WAV, M4A, and more</li>
                  <li><strong>Audio-reactive Effects:</strong> Visual elements that respond to music</li>
                </ul>
              </div>

              <div className="feature-category">
                <h4>🎨 Visual Effects</h4>
                <ul>
                  <li><strong>Waveform:</strong> Classic waveform with customizable styles (line, bars, filled)</li>
                  <li><strong>Particles:</strong> Dynamic particle systems with physics and audio reactivity</li>
                  <li><strong>Geometric:</strong> Animated shapes (circles, squares, triangles, hexagons)</li>
                  <li><strong>Gradient:</strong> Flowing gradients with wave distortions</li>
                  <li><strong>3D Objects:</strong> Rotating 3D shapes with perspective projection</li>
                </ul>
              </div>

              <div className="feature-category">
                <h4>📝 Text System</h4>
                <ul>
                  <li><strong>Multiple Animations:</strong> Fade, slide, bounce, pulse, typewriter, wave</li>
                  <li><strong>Rich Typography:</strong> Custom fonts, colors, strokes, shadows</li>
                  <li><strong>Audio Reactivity:</strong> Text that responds to beats and frequencies</li>
                  <li><strong>Timeline Control:</strong> Precise timing and duration control</li>
                </ul>
              </div>

              <div className="feature-category">
                <h4>⚡ Advanced Features</h4>
                <ul>
                  <li><strong>Preset System:</strong> Save and load custom configurations</li>
                  <li><strong>Timeline Editor:</strong> Advanced editing with drag-and-drop</li>
                  <li><strong>Real-time Preview:</strong> See changes instantly as you edit</li>
                  <li><strong>Export Options:</strong> Multiple formats and quality settings</li>
                  <li><strong>Keyboard Shortcuts:</strong> Efficient workflow with hotkeys</li>
                </ul>
              </div>

              <div className="feature-category">
                <h4>🔧 Technical Specs</h4>
                <ul>
                  <li><strong>Output Format:</strong> 9:16 vertical (1080×1920px)</li>
                  <li><strong>Frame Rate:</strong> Up to 60fps</li>
                  <li><strong>Rendering:</strong> Browser-based Canvas/WebGL</li>
                  <li><strong>Export:</strong> WebM and MP4 formats</li>
                  <li><strong>Performance:</strong> Optimized for modern browsers</li>
                </ul>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div className="help-section">
              <h3>Keyboard Shortcuts</h3>
              <p>Use these keyboard shortcuts to speed up your workflow:</p>

              {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
                <div key={category} className="shortcut-category">
                  <h4>{categoryNames[category] || category}</h4>
                  <div className="shortcuts-grid">
                    {categoryShortcuts.map(shortcut => (
                      <div key={shortcut.id} className="shortcut-item">
                        <div className="shortcut-keys">
                          {shortcut.keys.map((keys, index) => (
                            <span key={index} className="key-combo">
                              {formatKeyCombo(keys)}
                            </span>
                          ))}
                        </div>
                        <div className="shortcut-description">
                          {shortcut.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {shortcuts.length === 0 && (
                <div className="no-shortcuts">
                  <p>No keyboard shortcuts are currently available.</p>
                  <p>Shortcuts will appear here when you're in the editor.</p>
                </div>
              )}
            </div>
          )}

          {/* Troubleshooting Tab */}
          {activeTab === 'troubleshooting' && (
            <div className="help-section">
              <h3>Troubleshooting</h3>

              <div className="faq-item">
                <h4>🎵 Audio Issues</h4>
                <div className="faq-content">
                  <p><strong>Q: My audio won't upload</strong></p>
                  <p>A: Ensure your audio file is in a supported format (MP3, WAV, M4A). Check that the file isn't corrupted and is under 100MB.</p>
                  
                  <p><strong>Q: Visual effects aren't responding to audio</strong></p>
                  <p>A: Make sure the audio is playing and that audio-reactive parameters are enabled. Check your browser's audio permissions.</p>
                </div>
              </div>

              <div className="faq-item">
                <h4>🎨 Visual Performance</h4>
                <div className="faq-content">
                  <p><strong>Q: The preview is laggy or slow</strong></p>
                  <p>A: Try reducing the effect complexity, lowering particle counts, or using a less intensive visual effect. Close other browser tabs to free up resources.</p>
                  
                  <p><strong>Q: Effects look different in export vs preview</strong></p>
                  <p>A: This is normal due to different rendering contexts. The export uses the exact canvas resolution for higher quality.</p>
                </div>
              </div>

              <div className="faq-item">
                <h4>📤 Export Problems</h4>
                <div className="faq-content">
                  <p><strong>Q: Export is taking too long</strong></p>
                  <p>A: Large exports can take time. Try reducing quality settings, shortening the audio, or using WebM format for faster processing.</p>
                  
                  <p><strong>Q: Export fails or produces empty video</strong></p>
                  <p>A: Ensure your browser supports MediaRecorder API. Try a different browser (Chrome/Firefox recommended) or restart the application.</p>
                </div>
              </div>

              <div className="faq-item">
                <h4>💾 Browser Compatibility</h4>
                <div className="faq-content">
                  <p><strong>Recommended Browsers:</strong></p>
                  <ul>
                    <li>Chrome 90+ (best performance)</li>
                    <li>Firefox 88+</li>
                    <li>Safari 14.1+</li>
                    <li>Edge 90+</li>
                  </ul>
                  
                  <p><strong>Required Features:</strong></p>
                  <ul>
                    <li>Web Audio API</li>
                    <li>Canvas 2D / WebGL</li>
                    <li>MediaRecorder API</li>
                    <li>File API</li>
                  </ul>
                </div>
              </div>

              <div className="performance-tips">
                <h4>🚀 Performance Tips</h4>
                <ul>
                  <li>Close unnecessary browser tabs and applications</li>
                  <li>Use lower particle counts for smoother performance</li>
                  <li>Choose simpler effects for longer videos</li>
                  <li>Export in lower quality for preview, higher for final</li>
                  <li>Use headphones to prevent audio feedback</li>
                  <li>Keep your browser updated for best performance</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <style>{`
          .help-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .help-system {
            background: #1a1a1a;
            border-radius: 12px;
            width: 90%;
            max-width: 1000px;
            height: 80%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .help-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #333;
            background: #2a2a2a;
          }

          .help-header h2 {
            color: white;
            margin: 0;
            font-size: 24px;
          }

          .close-button {
            width: 32px;
            height: 32px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .help-nav {
            display: flex;
            background: #2a2a2a;
            border-bottom: 1px solid #333;
          }

          .help-nav button {
            flex: 1;
            padding: 15px 20px;
            background: transparent;
            color: #ccc;
            border: none;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
          }

          .help-nav button:hover {
            background: rgba(255, 255, 255, 0.05);
            color: white;
          }

          .help-nav button.active {
            color: #4ecdc4;
            border-bottom-color: #4ecdc4;
            background: rgba(78, 205, 196, 0.1);
          }

          .help-content {
            flex: 1;
            overflow-y: auto;
            padding: 0;
          }

          .help-section {
            padding: 30px;
            color: white;
            line-height: 1.6;
          }

          .help-section h3 {
            color: #4ecdc4;
            margin: 0 0 20px 0;
            font-size: 28px;
            font-weight: 600;
          }

          .help-section h4 {
            color: white;
            margin: 25px 0 15px 0;
            font-size: 20px;
            font-weight: 500;
          }

          .help-section h5 {
            color: #4ecdc4;
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 500;
          }

          .help-section p {
            color: #ccc;
            margin: 0 0 15px 0;
            font-size: 14px;
          }

          .workflow-steps {
            margin-top: 30px;
          }

          .step {
            display: flex;
            margin: 25px 0;
            align-items: flex-start;
            gap: 20px;
          }

          .step-number {
            width: 40px;
            height: 40px;
            background: #4ecdc4;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            flex-shrink: 0;
          }

          .step-content {
            flex: 1;
          }

          .feature-category {
            margin: 30px 0;
            padding: 20px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            border-left: 4px solid #4ecdc4;
          }

          .feature-category h4 {
            margin: 0 0 15px 0;
            font-size: 18px;
          }

          .feature-category ul {
            margin: 0;
            padding-left: 20px;
          }

          .feature-category li {
            margin: 8px 0;
            color: #ccc;
          }

          .feature-category li strong {
            color: white;
          }

          .shortcut-category {
            margin: 30px 0;
          }

          .shortcuts-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 15px;
          }

          .shortcut-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 6px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .shortcut-keys {
            display: flex;
            gap: 8px;
          }

          .key-combo {
            background: #333;
            color: #4ecdc4;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
          }

          .shortcut-description {
            color: #ccc;
            font-size: 14px;
          }

          .no-shortcuts {
            text-align: center;
            padding: 40px;
            color: #666;
          }

          .faq-item {
            margin: 25px 0;
            border: 1px solid #333;
            border-radius: 8px;
            overflow: hidden;
          }

          .faq-item h4 {
            background: #2a2a2a;
            margin: 0;
            padding: 15px 20px;
            border-bottom: 1px solid #333;
            font-size: 16px;
          }

          .faq-content {
            padding: 20px;
          }

          .faq-content p {
            margin: 12px 0;
          }

          .faq-content p strong {
            color: #4ecdc4;
          }

          .faq-content ul {
            margin: 10px 0;
            padding-left: 20px;
          }

          .faq-content li {
            margin: 6px 0;
            color: #ccc;
          }

          .performance-tips {
            background: rgba(78, 205, 196, 0.1);
            border: 1px solid rgba(78, 205, 196, 0.3);
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
          }

          .performance-tips h4 {
            color: #4ecdc4;
            margin: 0 0 15px 0;
          }

          .performance-tips ul {
            margin: 0;
            padding-left: 20px;
          }

          .performance-tips li {
            margin: 8px 0;
            color: #ccc;
          }

          @media (max-width: 768px) {
            .help-system {
              width: 95%;
              height: 90%;
            }

            .help-section {
              padding: 20px;
            }

            .step {
              flex-direction: column;
              gap: 10px;
            }

            .step-number {
              align-self: flex-start;
            }

            .shortcut-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};