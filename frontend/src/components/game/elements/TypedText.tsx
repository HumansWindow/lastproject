import React, { useEffect, useRef, createElement } from 'react';
import gsap from 'gsap';

export interface TypedTextProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  speed?: number;
  delay?: number;
}

const TypedText: React.FC<TypedTextProps> = ({
  text,
  className = '',
  tag = 'h2',
  speed = 30,
  delay = 0,
}) => {
  const elementRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    // Clear any existing content and timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Add typing class to enable styling during animation
    element.classList.add('typing');
    element.innerHTML = '';
    
    // Create a text node to manipulate
    const textNode = document.createTextNode('');
    element.appendChild(textNode);
    
    // Create cursor element
    const cursor = document.createElement('span');
    cursor.classList.add('typing-cursor');
    cursor.innerHTML = '|';
    element.appendChild(cursor);
    
    // Start animation after delay
    timeoutRef.current = setTimeout(() => {
      let i = 0;
      
      // Using GSAP for smooth animation
      gsap.to({}, {
        duration: text.length * (speed / 1000),
        onUpdate: function() {
          const progress = Math.floor(this.progress() * text.length);
          if (progress > i) {
            i = progress;
            textNode.nodeValue = text.substring(0, i);
          }
        },
        onComplete: function() {
          textNode.nodeValue = text;
          element.classList.remove('typing');
          
          // Make cursor blink after completion
          gsap.to(cursor, {
            opacity: 0,
            duration: 0.5,
            repeat: -1,
            yoyo: true
          });
        }
      });
    }, delay);
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      gsap.killTweensOf(cursor);
    };
  }, [text, speed, delay]);
  
  // Instead of using JSX with a dynamic tag, create the element with React.createElement
  return createElement(
    tag,
    { 
      ref: elementRef,
      className: `TypeStyle ${className}`
    },
    // Children will be inserted by the animation
    null
  );
};

export default TypedText;