import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import BaseSection, { BaseSectionProps } from "./BaseSection";
import { TypedText } from "../elements";

// CSS is now imported in _app.tsx

export interface TimelineItem {
  id: string;
  title: string;
  content: string;
  image?: string;
  position: 'left' | 'right';
  link?: {
    text: string;
    url: string;
  };
}

export interface TimelineSectionProps extends BaseSectionProps {
  items: TimelineItem[];
  useTypeAnimation?: boolean;
}

const TimelineSection: React.FC<TimelineSectionProps> = ({
  id,
  className = '',
  heading,
  items,
  useTypeAnimation = false,
  backgroundType = 'default',
  isActive = false,
  navigationConfig,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Set up scroll animation for timeline items
  useEffect(() => {
    if (!timelineRef.current || !isActive) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add animation class when the item becomes visible
          entry.target.classList.add('animated');
          // Unobserve after animation is triggered
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.2, // Trigger when 20% of the item is visible
      rootMargin: '0px'
    });
    
    // Observe all timeline items
    const timelineItems = timelineRef.current.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
      // Add delay based on item index for staggered animation
      (item as HTMLElement).style.animationDelay = `${index * 0.2}s`;
      observer.observe(item);
    });
    
    // Cleanup function
    return () => {
      timelineItems.forEach(item => {
        observer.unobserve(item);
      });
    };
  }, [isActive, items]);

  return (
    <BaseSection
      id={id}
      className={`timeline-section ${className}`}
      backgroundType={backgroundType}
      isActive={isActive}
      navigationConfig={navigationConfig}
    >
      {/* Section Heading */}
      {useTypeAnimation && heading ? (
        <TypedText text={heading} tag="h2" className="text-center mb-4" />
      ) : (
        heading && <h2 className="TypeStyle text-center mb-4">{heading}</h2>
      )}

      {/* Timeline Container */}
      <div className="timeline" ref={timelineRef}>
        {items.map((item, index) => (
          <div 
            key={item.id || index}
            className={`timeline-item ${item.position}`}
            data-aos="fade-up"
          >
            <div className="timeline-content">
              {item.image && (
                <Image 
                  src={item.image} 
                  alt={item.title}
                  className="timeline-img"
                  layout="responsive"
                  width={500}
                  height={300}
                />
              )}
              
              <h3>{item.title}</h3>
              
              <div dangerouslySetInnerHTML={{ __html: item.content }} />
              
              {item.link && (
                <a 
                  href={item.link.url}
                  className="ah-button mt-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.link.text}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </BaseSection>
  );
};

export default TimelineSection;