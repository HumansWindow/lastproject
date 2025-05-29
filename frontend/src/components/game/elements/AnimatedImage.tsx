import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

export type AnimationType = 'reveal' | 'spin' | 'pulse' | 'none';

export interface AnimatedImageProps {
  src: string;
  alt: string;
  animation?: AnimationType;
  className?: string;
  width?: number;
  height?: number;
  invertColors?: boolean;
}

const AnimatedImage: React.FC<AnimatedImageProps> = ({
  src,
  alt,
  animation = 'none',
  className = '',
  width,
  height,
  invertColors = false,
}) => {
  const imgRef = useRef<HTMLDivElement>(null);

  // Apply animation classes based on the animation type
  useEffect(() => {
    if (!imgRef.current) return;
    
    const element = imgRef.current;
    
    // Reset any existing animation classes
    element.classList.remove('Darwish', 'Flower', 'pulse', 'spin-reverse', 'circle-reveal');
    
    // Apply appropriate animation class
    switch (animation) {
      case 'spin':
        element.classList.add('spin-reverse');
        break;
      case 'reveal':
        element.classList.add('circle-reveal');
        break;
      case 'pulse':
        element.classList.add('pulse');
        break;
      default:
        // No animation class needed
        break;
    }
    
  }, [animation]);

  // Calculate the appropriate wrapper class based on animation type and other props
  const getWrapperClass = () => {
    const classes = ['img-container'];
    
    if (className) classes.push(className);
    
    if (invertColors) classes.push('toWhite');
    
    return classes.join(' ');
  };

  // Determine if we should use a div (for local SVGs with animations) 
  // or Next.js Image component (for regular images)
  const isSvg = src.toLowerCase().endsWith('.svg');
  
  return (
    <div ref={imgRef} className={getWrapperClass()}>
      {isSvg ? (
        // For SVGs, use an img tag to allow animations to work properly
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="img-fluid"
          width={width}
          height={height}
        />
      ) : (
        // For other images, use Next.js Image component for optimization
        <Image
          src={src}
          alt={alt}
          className="img-fluid"
          width={width || 800}
          height={height || 600}
        />
      )}
    </div>
  );
};

export default AnimatedImage;