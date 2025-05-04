import { Color } from 'three';

/**
 * Interface for animation color systems
 * This provides a standard structure for creating color gradients and palettes
 * that can be used across different animation types
 */
export interface ColorSystem {
  /**
   * Get a color based on a ratio value (typically 0-1)
   * @param ratio - A value from 0 to 1 representing position in the color spectrum
   * @param index - Optional index for systems that need additional context
   * @returns A Three.js Color object
   */
  getColor(ratio: number, index?: number): Color;
}

/**
 * Factory function type for creating color systems
 */
export type ColorSystemFactory = () => ColorSystem;