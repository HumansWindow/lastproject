import React from 'react';
import { Row, Col } from 'react-bootstrap';
import BaseSection, { BaseSectionProps } from './BaseSection';
import { TypedText, AnimatedImage } from '../elements';
import type { AnimationType } from '../elements';

// Import specific CSS for Text+Image section
import '../../../../styles/game/section-text-image.css';

export interface TextImageSectionProps extends BaseSectionProps {
  content: string;
  image: string;
  imageAlt?: string;
  imagePosition?: 'left' | 'right';
  imageAnimation?: AnimationType;
  useTypeAnimation?: boolean;
  invertImageColors?: boolean;
}

const TextImageSection: React.FC<TextImageSectionProps> = ({
  id,
  className = '',
  heading,
  content,
  image,
  imageAlt = 'Section image',
  imagePosition = 'right',
  imageAnimation = 'none',
  useTypeAnimation = false,
  invertImageColors = false,
  backgroundType = 'default',
  isActive = false,
  navigationConfig,
}) => {
  // Create the content column
  const ContentColumn = () => (
    <Col md={6} className="left-content">
      <div className="text-container">
        {useTypeAnimation && heading ? (
          <TypedText text={heading} tag="h2" className="mb-4" />
        ) : (
          heading && <h2 className="TypeStyle mb-4">{heading}</h2>
        )}
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </Col>
  );

  // Create the image column
  const ImageColumn = () => (
    <Col md={6} className="right-content">
      <AnimatedImage 
        src={image}
        alt={imageAlt}
        animation={imageAnimation}
        invertColors={invertImageColors}
        className="mx-auto"
      />
    </Col>
  );

  return (
    <BaseSection
      id={id}
      className={`text-image-section ${className} ${imagePosition === 'left' ? 'image-left' : 'image-right'}`}
      backgroundType={backgroundType}
      isActive={isActive}
      navigationConfig={navigationConfig}
    >
      <Row className="h-100 align-items-center">
        {imagePosition === 'left' ? (
          <>
            <ImageColumn />
            <ContentColumn />
          </>
        ) : (
          <>
            <ContentColumn />
            <ImageColumn />
          </>
        )}
      </Row>
    </BaseSection>
  );
};

export default TextImageSection;