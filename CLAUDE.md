# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AudioVibe Studio** - A browser-based audio-reactive video generation tool that creates 9:16 vertical videos with visual effects synchronized to uploaded audio files.

### Current State
This is a newly initialized TypeScript/Node.js project with only the specification document. The project needs to be set up from scratch.

## Initial Setup Commands

Since this project lacks basic configuration files, you'll need to initialize it:

```bash
# Initialize npm project
npm init -y

# Install TypeScript and basic dependencies
npm install --save-dev typescript @types/node

# Initialize TypeScript configuration
npx tsc --init

# Install development tools
npm install --save-dev eslint prettier jest @types/jest ts-jest
```

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
- **UI Framework**: To be decided (React/Vue.js/Vanilla JS)

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
- [ ] Initialize npm project with package.json
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up build system (Vite/Webpack)
- [ ] Configure ESLint and Prettier
- [ ] Set up Jest for testing
- [ ] Create project directory structure
- [ ] Set up Git with .gitignore

### 2. Development Environment
- [ ] Install core dependencies (React/Vue or vanilla setup)
- [ ] Set up hot module replacement
- [ ] Configure development server
- [ ] Set up CSS preprocessing (if needed)
- [ ] Configure path aliases

### 3. Core Infrastructure
- [ ] Create main application entry point
- [ ] Set up routing (if using SPA framework)
- [ ] Implement base layout components
- [ ] Create global styles and theme (dark mode)
- [ ] Set up responsive design utilities

### 4. Audio Module Implementation
- [ ] Create AudioContext manager
- [ ] Implement audio file upload handler
- [ ] Build FFT analyzer component
- [ ] Implement beat detection algorithm
- [ ] Create frequency band analyzer
- [ ] Add audio playback controls
- [ ] Implement audio buffer management

### 5. Visual Engine Development
- [ ] Set up Canvas/WebGL context
- [ ] Create base renderer class
- [ ] Implement animation loop (requestAnimationFrame)
- [ ] Build visual effect base class
- [ ] Implement first visual effect (waveform)
- [ ] Create effect parameter system
- [ ] Add performance monitoring

### 6. UI Components (Phase 1)
- [ ] Create upload screen with drag-and-drop
- [ ] Build file validation component
- [ ] Implement progress indicators
- [ ] Create preview player component
- [ ] Build basic control panel
- [ ] Add play/pause/seek controls

### 7. Video Export Module
- [ ] Implement MediaRecorder setup
- [ ] Create frame capture system
- [ ] Build WebM encoder integration
- [ ] Implement export progress tracking
- [ ] Add download functionality
- [ ] Handle memory management during export

### 8. Integration & Testing (Phase 1)
- [ ] Connect audio analyzer to visual engine
- [ ] Test end-to-end workflow
- [ ] Performance optimization
- [ ] Browser compatibility testing
- [ ] Memory leak detection
- [ ] Create basic test suite

### 9. Visual Effects Library (Phase 2)
- [ ] Implement particle system effect
- [ ] Create geometric pattern effect
- [ ] Build gradient flow effect
- [ ] Develop 3D object animation effect
- [ ] Create effect switching system
- [ ] Implement effect blending

### 10. Advanced Features (Phase 2)
- [ ] Add color palette selector
- [ ] Implement effect intensity controls
- [ ] Create background customization
- [ ] Add MP4 export support
- [ ] Implement quality settings
- [ ] Build effect parameter presets

### 11. UI Enhancement (Phase 2)
- [ ] Redesign editor interface
- [ ] Create effect library panel
- [ ] Implement timeline component
- [ ] Add keyboard shortcuts
- [ ] Improve mobile responsiveness
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
npm run typecheck   # Run TypeScript compiler checks

# Build & Deploy
npm run build:analyze # Analyze bundle size
npm run deploy      # Deploy to hosting service
```