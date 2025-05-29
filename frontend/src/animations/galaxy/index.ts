import { GalaxyAnimation } from "./galaxyAnimation";
import { GalaxyTransitionManager } from "./galaxyTransitionManager";
import { GalaxyConfig } from "./types";
import { useGalaxyAnimation } from "./useGalaxyAnimation";

/**
 * Initialize the galaxy animation with default settings
 * @returns An object containing the animation and transition manager
 */
export function initGalaxyAnimation(config?: Partial<GalaxyConfig>) {
  const animation = new GalaxyAnimation(config);
  const transitionManager = new GalaxyTransitionManager(animation);
  
  // Initialize animation after DOM load
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        animation.initialize();
        transitionManager.setupNavigationHandlers();
      });
    } else {
      animation.initialize();
      transitionManager.setupNavigationHandlers();
    }
  }

  return {
    animation,
    transitionManager,
  };
}

// Export all types and classes for direct import if needed
export * from "./types";
export { GalaxyAnimation } from "./galaxyAnimation";
export { GalaxyTransitionManager } from "./galaxyTransitionManager";
export { useGalaxyAnimation } from "./useGalaxyAnimation";