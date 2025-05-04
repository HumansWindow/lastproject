import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

// Import our CSS
import '../../../../styles/game/section-base.css';

export interface NavigationConfig {
  prevSection: string | null;
  nextSection: string | null;
  prevText: string;
  nextText: string;
}

export interface BaseSectionProps {
  id: string;
  className?: string;
  heading?: string;
  backgroundType?: 'default' | 'galaxy' | 'gradient';
  isActive?: boolean;
  navigationConfig?: NavigationConfig;
  children?: React.ReactNode;
}

const BaseSection: React.FC<BaseSectionProps> = ({
  id,
  className = '',
  heading,
  backgroundType = 'default',
  isActive = false,
  navigationConfig,
  children,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(isActive);

  // Apply appropriate class names based on props
  const sectionClasses = [
    'ah-section',
    isActive ? 'active-section' : '',
    backgroundType === 'galaxy' ? 'Galaxy' : '',
    className,
  ].filter(Boolean).join(' ');

  // Handle section activation
  useEffect(() => {
    setIsVisible(isActive);
  }, [isActive]);

  // Navigate to previous section
  const handlePrevClick = () => {
    if (navigationConfig?.prevSection) {
      if (navigationConfig.prevSection.startsWith('/')) {
        // Navigate to a different page
        router.push(navigationConfig.prevSection);
      } else {
        // Navigate to another section on the same page
        const prevSection = document.getElementById(navigationConfig.prevSection);
        if (prevSection) {
          // Trigger section transition animations
          if (sectionRef.current) {
            sectionRef.current.classList.add('section-exit');
          }
          
          setTimeout(() => {
            setIsVisible(false);
            const event = new CustomEvent('sectionChange', {
              detail: { from: id, to: navigationConfig.prevSection }
            });
            document.dispatchEvent(event);
          }, 500);
        }
      }
    }
  };

  // Navigate to next section
  const handleNextClick = () => {
    if (navigationConfig?.nextSection) {
      if (navigationConfig.nextSection.startsWith('/')) {
        // Navigate to a different page
        router.push(navigationConfig.nextSection);
      } else {
        // Navigate to another section on the same page
        const nextSection = document.getElementById(navigationConfig.nextSection);
        if (nextSection) {
          // Trigger section transition animations
          if (sectionRef.current) {
            sectionRef.current.classList.add('section-exit');
          }
          
          setTimeout(() => {
            setIsVisible(false);
            const event = new CustomEvent('sectionChange', {
              detail: { from: id, to: navigationConfig.nextSection }
            });
            document.dispatchEvent(event);
          }, 500);
        }
      }
    }
  };

  return (
    <section 
      id={id} 
      className={sectionClasses}
      ref={sectionRef}
      style={{ display: isVisible ? 'flex' : 'none' }}
      data-background-type={backgroundType}
    >
      {/* Top Navigation Button */}
      {navigationConfig?.prevSection && (
        <div className="ah-nav-button top-nav-button">
          <button 
            onClick={handlePrevClick}
            className="ah-button"
            aria-label={navigationConfig.prevText || 'Previous'}
          >
            {navigationConfig.prevText || 'Previous'}
          </button>
        </div>
      )}

      {/* Section Content */}
      <div className="ah-section-content">
        <div className="content-wrapper">
          {heading && (
            <h2 className="TypeStyle">{heading}</h2>
          )}
          {children}
        </div>
      </div>

      {/* Bottom Navigation Button */}
      {navigationConfig?.nextSection && (
        <div className="ah-nav-button bottom-nav-button">
          <button 
            onClick={handleNextClick}
            className="ah-button"
            aria-label={navigationConfig.nextText || 'Next'}
          >
            {navigationConfig.nextText || 'Next'}
          </button>
        </div>
      )}
    </section>
  );
};

export default BaseSection;