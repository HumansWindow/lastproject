import { useState, useEffect, useCallback } from 'react';

// In a real implementation, we'd import from the actual galaxy animation directory
// import { useGalaxyAnimation } from "../../../animations/galaxy";

// Mock implementation for the Galaxy animation hook
interface GalaxyAnimation {
  flyOver: (fromSection: string, toSection: string) => void;
}

const mockGalaxyAnimation = (): GalaxyAnimation => {
  return {
    flyOver: (fromSection: string, toSection: string) => {
      console.log(`Flying from ${fromSection} to ${toSection}`);
      
      // In a real implementation, this would handle the smooth transition
      // For now, we'll manually handle section visibility
      const fromEl = document.getElementById(fromSection);
      const toEl = document.getElementById(toSection);
      
      if (fromEl) fromEl.classList.remove('active-section');
      if (toEl) {
        toEl.classList.add('active-section');
        toEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
};

interface UseGameSectionsOptions {
  initialSectionId: string;
  useGalaxyBackground?: boolean;
}

interface UseGameSectionsReturn {
  activeSection: string;
  setActiveSection: (sectionId: string) => void;
  navigateToSection: (fromSectionId: string, toSectionId: string) => void;
  isGalaxySection: (sectionId: string) => boolean;
}

/**
 * A hook to manage game section navigation and integration with the Galaxy animation
 * 
 * @param options Configuration options for the hook
 * @returns Methods and state for section navigation
 */
const useGameSections = (options: UseGameSectionsOptions): UseGameSectionsReturn => {
  const { initialSectionId, useGalaxyBackground = true } = options;
  const [activeSection, setActiveSection] = useState(initialSectionId);
  const [galaxySections, setGalaxySections] = useState<Set<string>>(new Set());
  
  // In a real implementation, we'd use the actual Galaxy animation hook
  // const { flyOver } = useGalaxyAnimation();
  const { flyOver } = mockGalaxyAnimation();
  
  // Check if a section is a Galaxy section
  const isGalaxySection = useCallback((sectionId: string): boolean => {
    return galaxySections.has(sectionId);
  }, [galaxySections]);
  
  // Navigate between sections, using Galaxy transitions when appropriate
  const navigateToSection = useCallback((fromSectionId: string, toSectionId: string) => {
    // Update active section state
    setActiveSection(toSectionId);
    
    // If both sections are Galaxy sections, use flyOver transition
    if (isGalaxySection(fromSectionId) && isGalaxySection(toSectionId)) {
      flyOver(fromSectionId, toSectionId);
    } else {
      // Otherwise, do a standard section transition
      const fromSection = document.getElementById(fromSectionId);
      const toSection = document.getElementById(toSectionId);
      
      if (fromSection) {
        fromSection.classList.remove('active-section');
        fromSection.classList.add('section-exit');
        
        setTimeout(() => {
          fromSection.classList.remove('section-exit');
          fromSection.style.display = 'none';
        }, 500);
      }
      
      if (toSection) {
        toSection.style.display = 'flex';
        toSection.classList.add('section-enter');
        
        setTimeout(() => {
          toSection.classList.remove('section-enter');
          toSection.classList.add('active-section');
        }, 50);
      }
    }
  }, [flyOver, isGalaxySection, setActiveSection]);
  
  // Find all sections with Galaxy backgrounds when the component mounts
  useEffect(() => {
    if (!useGalaxyBackground) return;
    
    // Find all sections with the 'Galaxy' class or data attribute
    const galaxyEls = document.querySelectorAll('.Galaxy, [data-background-type="galaxy"]');
    const galaxyIds = new Set<string>();
    
    galaxyEls.forEach(el => {
      const id = el.id;
      if (id) {
        galaxyIds.add(id);
      }
    });
    
    setGalaxySections(galaxyIds);
  }, [useGalaxyBackground]);
  
  // Listen for section change events
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent) => {
      const { from, to } = event.detail;
      navigateToSection(from, to);
    };
    
    // Add event listener for section changes
    document.addEventListener('sectionChange', handleSectionChange as EventListener);
    
    // Cleanup
    return () => {
      document.removeEventListener('sectionChange', handleSectionChange as EventListener);
    };
  }, [navigateToSection]); // Only depend on navigateToSection
  
  return {
    activeSection,
    setActiveSection,
    navigateToSection,
    isGalaxySection
  };
};

export default useGameSections;