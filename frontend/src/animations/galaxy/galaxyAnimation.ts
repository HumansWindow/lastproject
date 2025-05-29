import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  AdditiveBlending,
  Color
} from 'three';
import { createGalaxyColorSystem } from "../colorsystem";
import { GalaxyConfig, GalaxyDimensions, GalaxyState } from "./types";

/**
 * GalaxyAnimation class for creating and managing a 3D galaxy animation
 * Can be applied to multiple sections with the 'Galaxy' class
 */
export class GalaxyAnimation {
  private state: GalaxyState;
  private config: GalaxyConfig;
  private dimensions: GalaxyDimensions;
  private colorSystem = createGalaxyColorSystem();
  private resizeListener: () => void;

  /**
   * Create a new Galaxy Animation
   * @param customConfig - Optional custom configuration for the galaxy
   */
  constructor(customConfig?: Partial<GalaxyConfig>) {
    // Initialize state
    this.state = {
      activeCamera: null!,
      camera: null!,
      starField: null,
      galaxyRenderers: new Map(),
      scene: new Scene(),
      stars: {
        positions: [],
        colors: [],
        sizes: [],
        angles: [],
        rotationSpeeds: []
      }
    };

    // Calculate dimensions
    this.dimensions = this.calculateDimensions();

    // Default config with responsive adjustments
    this.config = {
      numArms: 3,
      numStarsPerArm: 3000,
      armWidth: 0.25,
      spiralFactor: 1.618033988749895, // Golden ratio
      maxRadius: this.dimensions.galaxySize * 0.7,
      centerDepth: 1.2,
      rotationOffset: (2 * Math.PI) / 3,
      spiralTightness: 0.25,
      armLengthFactor: 0.85,
      armWindingFactor: 1.4,
      randRadiusFactor: 0.3,
      verticalScatter: 0.25,
      zScatter: 0.4,
      ...customConfig // Override defaults with any custom values
    };

    // Setup resize handler
    this.resizeListener = this.handleResize.bind(this);
  }

  /**
   * Initialize the galaxy animation
   * This should be called after the DOM is loaded
   */
  public initialize(): void {
    // Create scene and camera
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
    this.state.camera = camera;
    this.state.activeCamera = camera;

    // Find all sections with Galaxy class
    const galaxySections = document.querySelectorAll('section.Galaxy');
    galaxySections.forEach(section => {
      this.initializeRenderer(section as HTMLElement);
    });

    // Generate stars
    this.generateStars();

    // Create star field
    this.createStarField();

    // Add window resize listener
    window.addEventListener('resize', this.resizeListener);

    // Start animation loop
    this.animate();
  }

  /**
   * Clean up resources when animation is no longer needed
   */
  public dispose(): void {
    // Stop animation loop
    if (this.state.animationFrameId) {
      cancelAnimationFrame(this.state.animationFrameId);
    }

    // Remove event listeners
    window.removeEventListener('resize', this.resizeListener);

    // Dispose renderers
    this.state.galaxyRenderers.forEach(renderer => {
      renderer.dispose();
    });

    // Clear renderers map
    this.state.galaxyRenderers.clear();

    // Dispose starfield geometry and materials
    if (this.state.starField) {
      this.state.starField.geometry.dispose();
      (this.state.starField.material as PointsMaterial).dispose();
    }
  }

  /**
   * Get the number of active stars in the galaxy
   * @returns The number of active stars
   */
  public getActiveStarCount(): number {
    return this.state.stars.angles.length;
  }

  /**
   * Initialize a renderer for a specific galaxy section
   * @param section - The DOM element for the section
   */
  private initializeRenderer(section: HTMLElement): void {
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });

    // Store the renderer in our map
    this.state.galaxyRenderers.set(section.id, renderer);

    // Configure renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Style renderer element
    const rendererElement = renderer.domElement;
    rendererElement.style.width = '100%';
    rendererElement.style.height = '100%';
    rendererElement.style.position = 'fixed';
    rendererElement.style.top = '0';
    rendererElement.style.left = '0';
    rendererElement.style.zIndex = '0';
    rendererElement.style.overflow = 'hidden';

    // Add to section
    section.insertBefore(rendererElement, section.firstChild);
  }

  /**
   * Calculate responsive dimensions based on viewport
   */
  private calculateDimensions(): GalaxyDimensions {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const smallestDimension = Math.min(viewportWidth, viewportHeight);
    const galaxySize = smallestDimension * 0.8;
    const scale = galaxySize / 100;
    const baseSize = (viewportWidth < 768 ? 0.01 : 0.02) * scale;
    
    return { 
      galaxySize, 
      scale, 
      viewportWidth, 
      viewportHeight, 
      baseSize 
    };
  }

  /**
   * Handle window resize events
   */
  private handleResize(): void {
    // Update dimensions
    this.dimensions = this.calculateDimensions();
    this.config.maxRadius = this.dimensions.galaxySize * 0.7;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update all renderers
    this.state.galaxyRenderers.forEach(renderer => {
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
    });
    
    // Update camera
    this.state.camera.aspect = width / height;
    this.state.camera.updateProjectionMatrix();
    
    // Update starfield scale if it exists
    if (this.state.starField) {
      this.state.starField.scale.set(
        this.dimensions.scale, 
        this.dimensions.scale, 
        this.dimensions.scale
      );
      this.state.starField.position.y = 0; // Reset position
    }
  }

  /**
   * Generate star data for the galaxy
   */
  private generateStars(): void {
    const { config } = this;
    
    for (let arm = 0; arm < config.numArms; arm++) {
      const armRotation = arm * config.rotationOffset;
      
      for (let i = 0; i < config.numStarsPerArm; i++) {
        const t = i / config.numStarsPerArm;
        const angle = t * config.armWindingFactor * Math.PI * 2 + armRotation;
        
        // Calculate base radius with height variation
        const radius = Math.max(0.1, config.maxRadius * 
          Math.exp(config.spiralTightness * angle) * 
          t * config.armLengthFactor);
        
        // Enhanced 3D positioning
        const heightFactor = Math.exp(-t * 2) * config.verticalScatter;
        const zOffset = (Math.random() - 0.5) * radius * config.zScatter;
        const heightOffset = (Math.random() - 0.5) * radius * heightFactor;
        
        const spread = config.armWidth * radius * 
          (config.randRadiusFactor + t * 0.3);
        const randomAngle = (Math.random() - 0.5) * 0.5;
        const randomR = Math.random() * spread;
        
        // Calculate positions with enhanced z-depth
        const x = radius * Math.cos(angle + randomAngle) + randomR * Math.cos(angle);
        const z = radius * Math.sin(angle + randomAngle) + randomR * Math.sin(angle) + zOffset;
        const y = heightOffset * (1 - t * 0.5);

        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(x * x + y * y + z * z);

        // Skip invalid values
        if (isNaN(x) || isNaN(y) || isNaN(z)) {
          console.warn('Invalid star position calculated, skipping...');
          continue;
        }

        // Calculate initial angle and rotation speed
        const initialAngle = Math.atan2(z, x);
        const rotationSpeed = (Math.random() - 0.5) * 0.02 * (1 - t * 0.5);

        // Get color based on distance from center
        const color = this.colorSystem.getColor(distanceFromCenter / config.maxRadius);
        
        // Calculate star size based on distance
        const size = this.dimensions.baseSize * 
          (1.5 - distanceFromCenter / config.maxRadius) * 
          Math.sqrt(1 - t) * 
          (1 + Math.random() * 0.5);

        // Add data to arrays
        this.state.stars.positions.push(x, y, z);
        this.state.stars.colors.push(color.r, color.g, color.b);
        this.state.stars.sizes.push(size);
        this.state.stars.angles.push(initialAngle);
        this.state.stars.rotationSpeeds.push(rotationSpeed);
      }
    }
  }

  /**
   * Create the 3D star field
   */
  private createStarField(): void {
    const { stars } = this.state;
    
    // Create geometry and attributes
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(stars.positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(stars.colors, 3));
    geometry.setAttribute('size', new Float32BufferAttribute(stars.sizes, 1));

    // Create material with additive blending for bright stars
    const material = new PointsMaterial({
      size: 3.0,
      transparent: true,
      opacity: 1.0,
      vertexColors: true,
      blending: AdditiveBlending,
      sizeAttenuation: false
    });

    // Create points object and add to scene
    const starField = new Points(geometry, material);
    this.state.starField = starField;
    this.state.scene.add(starField);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    // Store animation frame for potential cancellation
    this.state.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    // Update star positions for rotation
    if (this.state.starField) {
      const positions = this.state.starField.geometry.attributes.position.array;
      for (let i = 0; i < this.state.stars.angles.length; i++) {
        this.state.stars.angles[i] += this.state.stars.rotationSpeeds[i];
        
        // Calculate radius and update x, z position for rotation
        const idx = i * 3;
        const radius = Math.sqrt(
          positions[idx] ** 2 + 
          positions[idx + 2] ** 2
        );
        
        positions[idx] = radius * Math.cos(this.state.stars.angles[i]);
        positions[idx + 2] = radius * Math.sin(this.state.stars.angles[i]);
      }
      
      this.state.starField.geometry.attributes.position.needsUpdate = true;
    }

    // Render galaxy for all visible galaxy sections
    this.state.galaxyRenderers.forEach((renderer, sectionId) => {
      const section = document.getElementById(sectionId);
      if (section && section.classList.contains('active-section')) {
        renderer.render(this.state.scene, this.state.activeCamera);
      }
    });
  }

  /**
   * Get the camera for external control
   * @returns The current active camera
   */
  public getCamera(): PerspectiveCamera {
    return this.state.activeCamera;
  }

  /**
   * Set a custom camera as the active camera
   * @param camera - New camera to use for rendering
   */
  public setCamera(camera: PerspectiveCamera): void {
    this.state.activeCamera = camera;
  }
}