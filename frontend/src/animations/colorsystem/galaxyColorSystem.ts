import { Color } from 'three';
import { ColorSystem } from "./colorSystem";

/**
 * GalaxyColorSystem creates a realistic galaxy color gradient with enhanced brightness
 * This system is optimized for space/galaxy visualizations with bright cores and subtle edges
 */
export class GalaxyColorSystem implements ColorSystem {
  private gradient: Color[];

  /**
   * Create a new galaxy color system with a predefined gradient
   * @param gradientSize - The number of color samples in the gradient (higher = smoother)
   */
  constructor(gradientSize: number = 1000) {
    this.gradient = this.generateGradient(gradientSize);
  }

  /**
   * Generate a galaxy-like color gradient
   * @param size - Number of gradient steps
   * @returns Array of Three.js Color objects
   */
  private generateGradient(size: number): Color[] {
    return Array.from({ length: size }, (_, i) => {
      const t = i / size;
      const color = new Color();

      // Create realistic galaxy color gradient with enhanced brightness
      if (t < 0.3) {
        // Core region: Ultra bright center
        color.setHex(0x1A0536).lerp(new Color(0x2E0B57), t * 3.33);
        color.multiplyScalar(1.4); // Brightest core
      } else if (t < 0.5) {
        // Inner arms: High luminosity
        color.setHex(0x2E0B57).lerp(new Color(0x4B0082), (t - 0.3) * 5);
        color.multiplyScalar(1.2); // Very bright inner region
      } else if (t < 0.7) {
        // Mid arms: Medium-high brightness
        color.setHex(0x4B0082).lerp(new Color(0x800080), (t - 0.5) * 5);
        color.multiplyScalar(1.1); // Bright mid region
      } else if (t < 0.9) {
        // Outer arms: Moderate brightness
        color.setHex(0x800080).lerp(new Color(0x9B3B85), (t - 0.7) * 5);
        // Base brightness for outer region
      } else {
        // Edge regions: Dynamic fade
        color.setHex(0x9B3B85).lerp(new Color(0x2E0B57), (t - 0.9) * 5);
      }

      // Enhanced cosmic glow effect with dynamic brightness
      const baseBrightness = 0.8; // Increased base brightness
      const pulseEffect = Math.pow(Math.sin(t * Math.PI), 2) * 0.6;
      const distanceBoost = Math.pow(1 - t, 0.5) * 0.4; // Boost closer stars
      const finalBrightness = baseBrightness + pulseEffect + distanceBoost;
      
      color.multiplyScalar(finalBrightness);

      // Add 1% white to the color
      color.lerp(new Color(0xFFFFFF), 0.01);

      return color;
    });
  }

  /**
   * Get a color based on distance ratio
   * @param distanceRatio - Value from 0-1 representing distance from center (0=center, 1=edge)
   * @param index - Optional index value (not used in this implementation)
   * @returns A Three.js Color object
   */
  getColor(distanceRatio: number, index?: number): Color {
    const safeRatio = Math.max(0, Math.min(1, distanceRatio));
    const idx = Math.min(Math.floor(safeRatio * this.gradient.length), this.gradient.length - 1);
    const color = this.gradient[idx].clone();
    
    // Additional brightness boost for closer stars
    if (distanceRatio < 0.3) {
      color.multiplyScalar(1.2 - distanceRatio); // Extra boost for core
    }
    
    return color;
  }
}

/**
 * Factory function to create a GalaxyColorSystem
 * @param gradientSize - Optional size of the gradient
 * @returns A new GalaxyColorSystem instance
 */
export const createGalaxyColorSystem = (gradientSize?: number): GalaxyColorSystem => {
  return new GalaxyColorSystem(gradientSize);
};