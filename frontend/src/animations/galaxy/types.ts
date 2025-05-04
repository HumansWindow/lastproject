import { WebGLRenderer, PerspectiveCamera, Scene, Points } from 'three';

/**
 * Configuration options for the galaxy animation
 */
export interface GalaxyConfig {
  /** Number of spiral arms in the galaxy */
  numArms: number;
  
  /** Number of stars per spiral arm */
  numStarsPerArm: number;
  
  /** Width of each spiral arm */
  armWidth: number;
  
  /** Golden ratio used for spiral factor */
  spiralFactor: number;
  
  /** Maximum radius of the galaxy */
  maxRadius: number;
  
  /** Depth factor for the center of the galaxy */
  centerDepth: number;
  
  /** Rotation offset between arms (in radians) */
  rotationOffset: number;
  
  /** How tight the spiral is */
  spiralTightness: number;
  
  /** Factor for arm length */
  armLengthFactor: number;
  
  /** Factor for arm winding */
  armWindingFactor: number;
  
  /** Factor for random distribution of stars within the arm */
  randRadiusFactor: number;
  
  /** Vertical scatter factor for star positions */
  verticalScatter: number;
  
  /** Z-axis scatter factor for star positions */
  zScatter: number;
}

/**
 * Calculated dimensions for responsive sizing
 */
export interface GalaxyDimensions {
  /** Size of the galaxy in pixels */
  galaxySize: number;
  
  /** Scale factor based on viewport */
  scale: number;
  
  /** Viewport width */
  viewportWidth: number;
  
  /** Viewport height */
  viewportHeight: number;
  
  /** Base star size */
  baseSize: number;
}

/**
 * Galaxy renderer container
 */
export interface GalaxyRenderer {
  /** Three.js WebGL renderer */
  renderer: WebGLRenderer;
  
  /** DOM element ID of the section */
  sectionId: string;
}

/**
 * Galaxy animation state
 */
export interface GalaxyState {
  /** Current active camera */
  activeCamera: PerspectiveCamera;
  
  /** Main camera */
  camera: PerspectiveCamera;
  
  /** Star field */
  starField: Points | null;
  
  /** Map of renderers by section ID */
  galaxyRenderers: Map<string, WebGLRenderer>;
  
  /** Three.js scene */
  scene: Scene;
  
  /** Animation frame ID */
  animationFrameId?: number;
  
  /** Star positions, colors, and other attributes */
  stars: {
    /** Positions of stars (x, y, z for each star) */
    positions: number[];
    
    /** Colors of stars (r, g, b for each star) */
    colors: number[];
    
    /** Sizes of stars */
    sizes: number[];
    
    /** Current angle of each star for rotation */
    angles: number[];
    
    /** Rotation speed of each star */
    rotationSpeeds: number[];
  }
}