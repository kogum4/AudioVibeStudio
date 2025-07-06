# AudioVibe Studio

A professional browser-based audio-reactive video generation tool that creates stunning 9:16 vertical videos with visual effects synchronized to your audio files.

## Features

### 🎵 Audio Processing
- Advanced Web Audio API integration with FFT analysis
- Real-time beat detection and frequency band analysis
- Support for multiple audio formats (MP3, WAV, OGG, M4A)
- Audio playback controls with precise seek functionality

### 🎨 Visual Effects
- **5 Professional Visual Effects**:
  - Waveform visualization with customizable colors
  - Particle systems with physics-based animation
  - Geometric patterns with audio-reactive transformations
  - Gradient flows with dynamic color transitions
  - 3D object rendering with perspective projection
- Real-time parameter controls for all effects
- Customizable background colors with color picker
- Advanced effect blending with 16 blend modes

### 📝 Text Overlay System
- Canvas-based text rendering with rich typography
- **7 Animation Types**: fade, slide, bounce, pulse, typewriter, wave, static
- Audio-reactive text responding to beats and frequency bands
- Custom fonts, colors, strokes, shadows, and gradients
- Precise timing controls with start/end times and looping
- Text style presets (title, subtitle, beat-reactive)

### 📅 Professional Timeline Editor
- Multi-track timeline with visual representation
- Drag-and-drop editing with snap-to-grid functionality
- Real-time playhead with click-to-seek
- Zoom controls and track visibility management
- Timeline item management with resize handles

### 🎛️ Preset Management
- Built-in preset templates for common use cases
- Custom preset creation with naming and categorization
- Import/export functionality for sharing presets
- Advanced search and filter capabilities
- LocalStorage integration with automatic backup

### 🔄 Transition Effects
- **8 Transition Types**: fade, slide, zoom, rotation, blur, pixelate, wipe, dissolve
- Audio-reactive transitions with beat detection
- Auto-transition system for continuous effect switching
- Transition controls with direction, duration, and easing options

### 🎬 Video Export
- High-quality video export in WebM and MP4 formats
- 9:16 vertical format optimized for social media
- Quality settings and compression options
- Real-time export progress tracking
- Enhanced MP4 compatibility with multiple codec support

### ⌨️ Professional UX
- **50+ Keyboard Shortcuts** for efficient workflow
- Interactive help system with tutorials and troubleshooting
- Advanced undo/redo with visual history panel
- Modern tabbed interface with organized panels
- Responsive design for different screen sizes

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with WebGL support
- Recommended: Chrome, Firefox, Safari, or Edge (latest versions)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AudioVibeStudio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Usage

1. **Upload Audio**: Drag and drop an audio file or click to select
2. **Choose Effect**: Select from 5 professional visual effects
3. **Customize**: Adjust parameters, colors, and add text overlays
4. **Timeline**: Use the timeline editor for precise timing control
5. **Export**: Generate your video in WebM or MP4 format

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test            # Run test suite
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run format      # Format with Prettier
npm run typecheck   # Run TypeScript checks
```

## Keyboard Shortcuts

### Playback Controls
- `Space` - Play/Pause
- `←/→` - Seek backward/forward (5s)
- `Shift + ←/→` - Seek backward/forward (10s)
- `Home/End` - Go to start/end
- `M` - Toggle mute

### Effects & Editing
- `1-5` - Switch between visual effects
- `R` - Reset all parameters
- `Ctrl+Z/Y` - Undo/Redo
- `Ctrl+S` - Save current settings
- `Ctrl+O` - Open preset manager

### View Controls
- `F` - Toggle fullscreen
- `H` - Toggle help system
- `T` - Toggle timeline
- `P` - Toggle parameter panel

## Technical Architecture

### Core Technologies
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Audio**: Web Audio API
- **Graphics**: Canvas API / WebGL
- **Video**: MediaRecorder API
- **Styling**: CSS with CSS Variables

### Project Structure
```
src/
├── components/          # UI components
│   ├── layout/         # Layout components
│   ├── ParameterControls.tsx
│   ├── TextOverlayControls.tsx
│   ├── Timeline.tsx
│   └── PresetManager.tsx
├── modules/            # Core functionality
│   ├── audio/         # Audio processing
│   ├── visual/        # Visual effects
│   └── video/         # Video export
├── screens/           # Main screens
│   ├── UploadScreen.tsx
│   ├── EditorScreen.tsx
│   └── ExportScreen.tsx
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
└── types/             # TypeScript definitions
```

## Browser Compatibility

| Browser | WebM VP9 | WebM VP8 | MP4 H.264 | Recommendation |
|---------|----------|----------|-----------|----------------|
| Chrome  | ✅       | ✅       | ⚠️        | Best overall   |
| Firefox | ✅       | ✅       | ❌        | WebM preferred |
| Safari  | ❌       | ❌       | ✅        | MP4 only       |
| Edge    | ✅       | ✅       | ⚠️        | Good support   |

### Format Recommendations
- **WebM**: Recommended for reliability and quality
- **MP4**: Better compatibility with media players
- **Browser**: Chrome or Edge for best MP4 support

## Performance Optimization

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **CPU**: Multi-core processor recommended
- **GPU**: WebGL-compatible graphics card
- **Storage**: 1GB free space for video exports

### Performance Tips
- Use smaller audio files for better performance
- Close other browser tabs during export
- Enable hardware acceleration in browser settings
- Use WebM format for faster export times

## Troubleshooting

### Common Issues

**Video Export Not Working**
- Ensure browser supports MediaRecorder API
- Try WebM format if MP4 fails
- Check available disk space
- Disable browser extensions

**Audio Not Playing**
- Check browser audio permissions
- Verify audio file format support
- Try refreshing the page
- Check system audio settings

**Performance Issues**
- Reduce visual effect complexity
- Lower export quality settings
- Close other applications
- Use a more powerful device

### MP4 Export Issues
If MP4 files don't play properly:
1. Try VLC Media Player
2. Convert to standard MP4 using FFmpeg
3. Use WebM format instead
4. Check codec support in browser

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Web Audio API for audio processing capabilities
- Canvas API for graphics rendering
- MediaRecorder API for video export functionality
- React ecosystem for UI development

---

**AudioVibe Studio** - Transform your audio into stunning visual experiences!