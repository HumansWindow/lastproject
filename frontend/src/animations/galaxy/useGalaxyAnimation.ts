import { useEffect, useRef, useState } from 'react';
import { GalaxyAnimation } from './GalaxyAnimation';
import { GalaxyTransitionManager } from './GalaxyTransitionManager';
import { GalaxyConfig } from './types';

/**
 * Options for the useGalaxyAnimation hook
 */
export interface UseGalaxyAnimationOptions {
  /** Initial config for the galaxy animation */
  config?: Partial<GalaxyConfig>;
  
  /** Whether to automatically set up navigation between galaxy sections */
  autoSetupNavigation?: boolean;
  
  /** Whether to initialize immediately or wait for a manual init call */
  initializeOnMount?: boolean;
  
  /** Callback function when animation is initialized */
  onInitialized?: (animation: GalaxyAnimation, transitionManager: GalaxyTransitionManager) => void;
}

/**
 * Return value for the useGalaxyAnimation hook
 */
export interface UseGalaxyAnimationResult {
  /** The animation instance */
  animation: GalaxyAnimation | null;
  
  /** The transition manager instance */
  transitionManager: GalaxyTransitionManager | null;
  
  /** Whether the animation is initialized */
  isInitialized: boolean;
  
  /** Function to manually initialize the animation */
  initialize: () => void;
  
  /** Function to navigate between sections with a camera flyover effect */
  flyOver: (fromSectionId: string, toSectionId: string) => Promise<void>;
  
  /** Function to navigate between sections with a regular transition */
  transition: (fromSectionId: string, toSectionId: string) => void;
}

/**
 * React hook for using the Galaxy animation in components
 * 
 * @param options Configuration options for the galaxy animation
 * @returns Animation control object
 * 
 * @example
 * ```tsx
 * const { animation, isInitialized, flyOver } = useGalaxyAnimation({
 *   config: { numArms: 5, numStarsPerArm: 4000 },
 *   autoSetupNavigation: true
 * });
 * 
 * // Later, navigate between sections
 * const handleNextSection = () => {
 *   flyOver('section1', 'section2');
 * };
 * ```
 */
export function useGalaxyAnimation(options: UseGalaxyAnimationOptions = {}): UseGalaxyAnimationResult {
  const { 
    config = {}, 
    autoSetupNavigation = true, 
    initializeOnMount = true,
    onInitialized
  } = options;
  
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const animationRef = useRef<GalaxyAnimation | null>(null);
  const transitionManagerRef = useRef<GalaxyTransitionManager | null>(null);
  
  /**
   * Initialize the galaxy animation
   */
  const initialize = () => {
    if (isInitialized || typeof window === 'undefined') return;
    
    // Create the animation
    const animation = new GalaxyAnimation(config);
    animationRef.current = animation;
    
    // Initialize the animation (creates scene, camera, etc.)
    animation.initialize();
    
    // Create and set up the transition manager
    const transitionManager = new GalaxyTransitionManager(animation);
    transitionManagerRef.current = transitionManager;
    
    // Set up navigation if requested
    if (autoSetupNavigation) {
      transitionManager.setupNavigationHandlers();
    }
    
    // Mark as initialized
    setIsInitialized(true);
    
    // Call the onInitialized callback if provided
    if (onInitialized) {
      onInitialized(animation, transitionManager);
    }
  };
  
  /**
   * Navigate between sections with camera flyover
   */
  const flyOver = async (fromSectionId: string, toSectionId: string): Promise<void> => {
    if (!transitionManagerRef.current) return Promise.resolve();
    return transitionManagerRef.current.flyOver(fromSectionId, toSectionId);
  };
  
  /**
   * Navigate between sections with regular transition
   */
  const transition = (fromSectionId: string, toSectionId: string): void => {
    if (!transitionManagerRef.current) return;
    transitionManagerRef.current.fallbackTransition(fromSectionId, toSectionId);
  };
  
  // Initialize on mount if requested
  useEffect(() => {
    if (initializeOnMount) {
      initialize();
    }
    
    // Clean up on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.dispose();
        animationRef.current = null;
      }
    };
  }, [initializeOnMount]);
  
  return {
    animation: animationRef.current,
    transitionManager: transitionManagerRef.current,
    isInitialized,
    initialize,
    flyOver,
    transition
  };
}