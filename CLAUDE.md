# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AudioVibe Studio** - A browser-based audio-reactive video generation tool that creates 9:16 vertical videos with visual effects synchronized to uploaded audio files.

### Current State
The project has been initialized with the following setup completed:
- ✅ React + TypeScript + Vite development environment
- ✅ ESLint + Prettier configuration for code quality
- ✅ Jest + React Testing Library for testing
- ✅ Basic project structure and entry points
- ✅ Dark mode UI theme configuration
- ✅ React Router navigation setup
- ✅ Audio upload and processing system
- ✅ Basic visual engine with waveform effect
- ✅ Editor interface with playback controls

### Recently Implemented Features
- **Audio Module**: Complete AudioContext manager with FFT analysis, beat detection, frequency band analysis, and audio stream support for recording
- **Visual Engine**: Canvas-based rendering system with multiple visual effects (waveform, particles, geometric, gradient)
- **Parameter System**: Real-time effect parameter controls with type-safe parameter definitions and live updates
- **Video Export**: Full MediaRecorder API integration with progress tracking, format selection, and download functionality
- **UI Screens**: Upload screen with drag-and-drop, Editor screen with effect controls and parameter panels, Export screen with comprehensive settings
- **Navigation**: Full routing system with navigation header
- **Styling**: Complete CSS styling system with dark theme, responsive design, and accessibility features

## Installed Dependencies

### Core Dependencies
- React 19.1.0 - UI library
- React DOM 19.1.0 - React rendering for web
- Vite 6.3.5 - Build tool and dev server

### Development Dependencies
- TypeScript 5.8.3 - Type safety
- @vitejs/plugin-react - React support for Vite
- ESLint + plugins - Code linting
- Prettier - Code formatting
- Jest + React Testing Library - Testing framework
- Various @types packages for TypeScript support

## Architecture Guidelines

Based on the specification, the project should be structured as a client-side web application with these key components:

1. **Audio Processing Module** - Uses Web Audio API for FFT analysis, beat detection, and frequency band analysis
2. **Visual Engine** - Canvas/WebGL-based rendering system for generating reactive visuals
3. **Video Export Module** - MediaRecorder API for creating WebM/MP4 outputs
4. **UI Layer** - Single-page application with upload, editor, and export screens

### Technology Stack
- **Runtime**: Browser-only (no server-side processing)
- **Audio**: Web Audio API
- **Graphics**: Canvas API / WebGL
- **Video**: MediaRecorder API
- **UI Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS with CSS Variables for theming

### Key Constraints
- Must support 9:16 vertical video format (1080×1920px)
- Performance target: 30fps preview, <50ms audio latency
- Memory limit: 2GB
- Browser compatibility: Chrome, Firefox, Safari, Edge (latest versions)
- WebGL support required

## Development Phases

**Phase 1 (MVP)**
- Basic audio upload functionality
- Single visual effect type
- WebM output only

**Phase 2**
- 5 effect themes (particles, waveform, geometric, gradient, 3D)
- Color customization
- MP4 output support

**Phase 3**
- Text overlays
- Advanced effect parameters
- Preset saving (LocalStorage)

## Implementation Task List

### 1. Project Setup & Configuration
- [x] Initialize npm project with package.json
- [x] Configure TypeScript (tsconfig.json)
- [x] Set up build system (Vite)
- [x] Configure ESLint and Prettier
- [x] Set up Jest for testing
- [x] Create project directory structure
- [x] Set up Git with .gitignore

### 2. Development Environment
- [x] Install core dependencies (React with TypeScript)
- [x] Set up hot module replacement (Vite HMR)
- [x] Configure development server (Vite dev server on port 3000)
- [x] Set up CSS with CSS Variables for theming
- [x] Configure path aliases (@/, @components/, @modules/, @utils/, @types/)

### 3. Core Infrastructure
- [x] Create main application entry point (src/main.tsx, src/App.tsx)
- [x] Set up routing (React Router)
- [x] Implement base layout components
- [x] Create global styles and theme (dark mode with CSS variables)
- [ ] Set up responsive design utilities

### 4. Audio Module Implementation
- [x] Create AudioContext manager
- [x] Implement audio file upload handler
- [x] Build FFT analyzer component
- [x] Implement beat detection algorithm
- [x] Create frequency band analyzer
- [x] Add audio playback controls
- [x] Implement audio buffer management
- [x] Add audio stream support for recording

### 5. Visual Engine Development
- [x] Set up Canvas/WebGL context
- [x] Create base renderer class
- [x] Implement animation loop (requestAnimationFrame)
- [x] Build visual effect base class
- [x] Implement first visual effect (waveform)
- [x] Create effect parameter system
- [x] Implement particle system effect
- [x] Create geometric pattern effect
- [x] Implement gradient flow effect
- [ ] Add performance monitoring

### 6. UI Components (Phase 1)
- [x] Create upload screen with drag-and-drop
- [x] Build file validation component
- [x] Implement progress indicators
- [x] Create preview player component
- [x] Build basic control panel
- [x] Add play/pause/seek controls
- [x] Create parameter control components

### 7. Video Export Module
- [x] Implement MediaRecorder setup
- [x] Create frame capture system
- [x] Build WebM encoder integration
- [x] Implement export progress tracking
- [x] Add download functionality
- [x] Handle memory management during export
- [x] Add MP4 format support
- [x] Implement quality settings

### 8. Integration & Testing (Phase 1)
- [x] Connect audio analyzer to visual engine
- [x] Test end-to-end workflow
- [ ] Performance optimization
- [ ] Browser compatibility testing
- [ ] Memory leak detection
- [ ] Create basic test suite

### 9. Visual Effects Library (Phase 2)
- [x] Implement particle system effect
- [x] Create geometric pattern effect
- [x] Build gradient flow effect
- [ ] Develop 3D object animation effect
- [x] Create effect switching system
- [ ] Implement effect blending

### 10. Advanced Features (Phase 2)
- [x] Add color palette selector
- [x] Implement effect intensity controls
- [ ] Create background customization
- [x] Add MP4 export support
- [x] Implement quality settings
- [x] Build effect parameter presets

### 11. UI Enhancement (Phase 2)
- [x] Redesign editor interface
- [x] Create effect library panel
- [ ] Implement timeline component
- [ ] Add keyboard shortcuts
- [x] Improve mobile responsiveness
- [ ] Create help/tutorial system

### 12. Text & Overlay System (Phase 3)
- [ ] Build text rendering engine
- [ ] Create font selection interface
- [ ] Implement text animation system
- [ ] Add positioning controls
- [ ] Create text timing system

### 13. Advanced Features (Phase 3)
- [ ] Implement transition effects
- [ ] Create intro/outro animations
- [ ] Build preset save/load system
- [ ] Add LocalStorage integration
- [ ] Implement undo/redo functionality

### 14. Optimization & Polish
- [ ] Optimize rendering performance
- [ ] Implement lazy loading
- [ ] Add error boundaries
- [ ] Create loading states
- [ ] Implement analytics
- [ ] Add PWA capabilities

### 15. Documentation & Deployment
- [ ] Write user documentation
- [ ] Create API documentation
- [ ] Set up CI/CD pipeline
- [ ] Configure production build
- [ ] Set up hosting (Vercel/Netlify)
- [ ] Create demo videos

## Development Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)
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
npm run typecheck   # Run TypeScript compiler checks

# Build & Deploy (to be implemented)
npm run build:analyze # Analyze bundle size
npm run deploy      # Deploy to hosting service
```

## Project Structure

```
audiovibe-studio/
├── src/
│   ├── components/     # Reusable UI components
│   ├── modules/        # Core functionality modules
│   │   ├── audio/     # Audio processing components
│   │   ├── visual/    # Visual effects and rendering
│   │   └── video/     # Video export functionality
│   ├── screens/       # Main application screens
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── styles/        # Global styles and themes
│   ├── App.tsx        # Main application component
│   ├── App.test.tsx   # App component tests
│   ├── main.tsx       # Application entry point
│   ├── setupTests.ts  # Test setup configuration
│   └── vite-env.d.ts  # Vite environment types
├── index.html         # HTML entry point
├── package.json       # Project dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite build configuration
├── jest.config.js     # Jest test configuration
├── .eslintrc.json     # ESLint configuration
├── .prettierrc        # Prettier configuration
└── .gitignore         # Git ignore patterns
```