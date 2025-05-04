import { PerspectiveCamera, Vector3 } from 'three';
import { gsap } from 'gsap';
import { GalaxyAnimation } from './GalaxyAnimation';

/**
 * Manages transitions between galaxy sections
 * Handles camera fly-over animations and content transitions
 */
export class GalaxyTransitionManager {
  private galaxyAnimation: GalaxyAnimation;

  /**
   * Create a new Galaxy Transition Manager
   * @param galaxyAnimation - The main galaxy animation instance
   */
  constructor(galaxyAnimation: GalaxyAnimation) {
    this.galaxyAnimation = galaxyAnimation;
  }

  /**
   * Perform a camera fly-over transition between two galaxy sections
   * @param fromSectionId - ID of the current section
   * @param toSectionId - ID of the target section
   * @returns Promise that resolves when the transition completes
   */
  public flyOver(fromSectionId: string, toSectionId: string): Promise<void> {
    return new Promise((resolve) => {
      // Get section elements
      const currentSection = document.getElementById(fromSectionId);
      const targetSection = document.getElementById(toSectionId);
      
      if (!currentSection || !targetSection) {
        console.warn('Missing sections for transition:', fromSectionId, toSectionId);
        this.fallbackTransition(fromSectionId, toSectionId);
        resolve();
        return;
      }

      // Check if both are Galaxy sections
      const isFromGalaxy = currentSection.classList.contains('Galaxy');
      const isToGalaxy = targetSection.classList.contains('Galaxy');
      
      if (!isFromGalaxy || !isToGalaxy) {
        console.log('Not both Galaxy sections, using fallback transition');
        this.fallbackTransition(fromSectionId, toSectionId);
        resolve();
        return;
      }

      // Get content elements
      const currentLeft = currentSection.querySelector('.left-content');
      const currentRight = currentSection.querySelector('.right-content');
      const newLeft = targetSection.querySelector('.left-content');
      const newRight = targetSection.querySelector('.right-content');

      if (!currentLeft || !currentRight || !newLeft || !newRight) {
        console.warn('Missing required elements for Galaxy transition');
        this.fallbackTransition(fromSectionId, toSectionId);
        resolve();
        return;
      }

      // Clone camera for animation
      const mainCamera = this.galaxyAnimation.getCamera();
      const tempCamera = mainCamera.clone();
      tempCamera.position.copy(mainCamera.position);
      tempCamera.rotation.copy(mainCamera.rotation);
      
      // Set temporary camera as active
      this.galaxyAnimation.setCamera(tempCamera);

      // Set initial states for new content
      gsap.set([newLeft, newRight], { 
        opacity: 0,
        display: 'none'
      });

      // Create master timeline
      const masterTL = gsap.timeline({
        onComplete: () => {
          // Reset to main camera when done
          this.galaxyAnimation.setCamera(mainCamera);
          resolve();
        }
      });

      // Phase 1: Exit Animation
      const exitTL = gsap.timeline();
      exitTL
        .to(currentLeft, {
          duration: 1,
          x: '-100%',
          opacity: 0,
          ease: "power2.inOut"
        })
        .to(currentRight, {
          duration: 1,
          x: '100%',
          opacity: 0,
          ease: "power2.inOut"
        }, "<"); // Start at same time

      // Phase 2: Camera Movement
      const cameraTL = gsap.timeline();
      cameraTL
        .to(tempCamera.position, {
          duration: 1.5,
          y: '+=600', // Reduced height to prevent overflow
          x: '+=150',
          z: '+=150',
          ease: "power2.inOut",
          onUpdate: () => tempCamera.lookAt(0, 0, 0),
          onComplete: () => {
            // Switch sections
            currentSection.classList.remove('active-section');
            currentSection.style.display = 'none';
            targetSection.classList.add('active-section');
            targetSection.style.display = 'flex';
            
            // Prepare new content
            gsap.set([newLeft, newRight], {
              display: 'block',
              opacity: 0,
              x: (i: number) => i === 0 ? '-100%' : '100%'
            });
          }
        })
        .to(tempCamera.position, {
          duration: 1.5,
          y: mainCamera.position.y,
          x: mainCamera.position.x,
          z: mainCamera.position.z,
          ease: "power2.inOut",
          onUpdate: () => tempCamera.lookAt(0, 0, 0)
        });

      // Phase 3: Enter Animation
      const enterTL = gsap.timeline();
      enterTL
        .fromTo([newLeft, newRight], 
          {
            opacity: 0,
            x: (i: number) => i === 0 ? '-100%' : '100%'
          },
          {
            duration: 1,
            opacity: 1,
            x: '0%',
            ease: "power2.inOut",
            stagger: 0.2
          }
        );

      // Combine all phases
      masterTL
        .add(exitTL)
        .add(cameraTL, "-=0.5")
        .add(enterTL, "-=0.5");
    });
  }

  /**
   * Fallback transition for non-Galaxy sections or when flyOver can't be used
   * @param fromSectionId - ID of the current section
   * @param toSectionId - ID of the target section
   */
  public fallbackTransition(fromSectionId: string, toSectionId: string): void {
    const currentSection = document.getElementById(fromSectionId);
    const targetSection = document.getElementById(toSectionId);
    
    if (!currentSection || !targetSection) return;

    // Simple fade transition
    const tl = gsap.timeline({
      onComplete: () => {
        currentSection.style.display = 'none';
        currentSection.classList.remove('active-section');
        targetSection.classList.add('active-section');
        targetSection.style.display = 'flex';
      }
    });

    tl.to(currentSection, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut"
    }).fromTo(targetSection,
      {
        opacity: 0,
        display: 'flex'
      },
      {
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut"
      }
    );
  }

  /**
   * Attach navigation event handlers to navigate buttons
   * This sets up the click handlers for the navigation buttons
   */
  public setupNavigationHandlers(): void {
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('navigate-btn')) {
        e.preventDefault();
        const targetId = target.getAttribute('data-target');
        if (!targetId) return;

        const currentSection = document.querySelector('section.active-section') as HTMLElement;
        if (!currentSection) return;

        const targetSection = document.getElementById(targetId);
        if (!targetSection) return;
        
        if (currentSection.classList.contains('Galaxy') && targetSection.classList.contains('Galaxy')) {
          // Use flyOver for Galaxy-to-Galaxy transitions
          this.flyOver(currentSection.id, targetId);
        } else {
          // Use fallback for other transitions
          this.fallbackTransition(currentSection.id, targetId);
        }
      }
    });
  }
}