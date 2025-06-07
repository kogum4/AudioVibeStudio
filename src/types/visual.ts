export interface ParameterDefinition {
  name: string;
  type: 'number' | 'color' | 'boolean' | 'select';
  min?: number;
  max?: number;
  step?: number;
  defaultValue: any;
  options?: string[];
  description?: string;
}

export interface EffectParameter {
  [key: string]: any;
}

export type EffectType = 'waveform' | 'particles' | 'geometric' | 'gradient' | '3d';

export interface VisualEffectState {
  isActive: boolean;
  currentEffect: EffectType;
  parameters: EffectParameter;
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
}

export interface RenderingOptions {
  width: number;
  height: number;
  fps: number;
  quality: 'low' | 'medium' | 'high';
  antialiasing: boolean;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector3D extends Point3D {
  normalize(): Vector3D;
  magnitude(): number;
  dot(other: Vector3D): number;
  cross(other: Vector3D): Vector3D;
}

export interface Particle {
  position: Point2D;
  velocity: Point2D;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

export interface GeometricShape {
  type: 'circle' | 'square' | 'triangle' | 'hexagon';
  position: Point2D;
  size: number;
  rotation: number;
  color: string;
  opacity: number;
}

export interface ThreeDObject {
  type: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'pyramid';
  position: Point3D;
  rotation: Point3D;
  scale: Point3D;
  color: string;
  vertices: Point3D[];
  faces: number[][];
}

export interface ColorStop {
  position: number;
  color: string;
}

export interface GradientDefinition {
  type: 'linear' | 'radial';
  direction: 'horizontal' | 'vertical' | 'diagonal';
  stops: ColorStop[];
  angle?: number;
}

export interface WaveformStyle {
  type: 'line' | 'bars' | 'filled';
  lineWidth: number;
  glow: boolean;
  mirror: boolean;
  smoothing: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  memoryUsage: number;
  droppedFrames: number;
}