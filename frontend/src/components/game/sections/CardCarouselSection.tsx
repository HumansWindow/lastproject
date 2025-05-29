import React, { useState, useRef, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import Image from 'next/image';
import BaseSection, { BaseSectionProps } from "./BaseSection";
import { TypedText } from "../elements";

// CSS is now imported in _app.tsx

export interface CardItem {
  id: string;
  title: string;
  content: string;
  image?: string;
  hasCheckbox?: boolean;
  checkboxLabel?: string;
}

export interface CardCarouselSectionProps extends BaseSectionProps {
  cards: CardItem[];
  useTypeAnimation?: boolean;
  autoScroll?: boolean;
  autoScrollInterval?: number;
}

const CardCarouselSection: React.FC<CardCarouselSectionProps> = ({
  id,
  className = '',
  heading,
  cards,
  useTypeAnimation = false,
  autoScroll = false,
  autoScrollInterval = 5000,
  backgroundType = 'default',
  isActive = false,
  navigationConfig,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Handle previous card navigation
  const handlePrevCard = () => {
    if (activeCardIndex > 0) {
      setActiveCardIndex(activeCardIndex - 1);
    }
  };

  // Handle next card navigation
  const handleNextCard = () => {
    if (activeCardIndex < cards.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (cardId: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [cardId]: checked
    }));
  };

  // Setup auto-scroll
  useEffect(() => {
    if (autoScroll && isActive) {
      // Clear any existing timers
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
      
      // Set up auto-scroll timer
      autoScrollTimerRef.current = setInterval(() => {
        setActiveCardIndex(prev => {
          if (prev < cards.length - 1) {
            return prev + 1;
          }
          return 0; // Loop back to the first card
        });
      }, autoScrollInterval);
    }
    
    // Cleanup function
    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    };
  }, [autoScroll, isActive, cards.length, autoScrollInterval]);

  // Update navigation button visibility
  useEffect(() => {
    if (!cardsContainerRef.current) return;
    
    const container = cardsContainerRef.current;
    const navButtons = container.querySelector('.carousel-nav-buttons');
    
    if (navButtons) {
      navButtons.classList.add('visible');
    }
    
    // Disable prev/next buttons when at limits
    const prevButton = container.querySelector('.carousel-btn-prev') as HTMLButtonElement;
    const nextButton = container.querySelector('.carousel-btn-next') as HTMLButtonElement;
    
    if (prevButton) {
      prevButton.classList.toggle('disabled', activeCardIndex === 0);
    }
    
    if (nextButton) {
      nextButton.classList.toggle('disabled', activeCardIndex === cards.length - 1);
    }
  }, [activeCardIndex, cards.length]);

  return (
    <BaseSection
      id={id}
      className={`card-carousel-section ${className}`}
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

      {/* Card Carousel */}
      <div className="cards-container" ref={cardsContainerRef}>
        {cards.map((card, index) => (
          <div 
            key={card.id || index}
            className={`card-item ${index === activeCardIndex ? 'active' : index < activeCardIndex ? 'prev' : ''}`}
          >
            <Card>
              <Card.Body>
                <Card.Title as="h3">{card.title}</Card.Title>
                
                {card.image && (
                  <div className="card-img-container mb-3">
                    <Image 
                      src={card.image} 
                      alt={card.title} 
                      className="img-fluid" 
                      width={500}
                      height={300}
                    />
                  </div>
                )}
                
                <div dangerouslySetInnerHTML={{ __html: card.content }} />
                
                {card.hasCheckbox && (
                  <div className="role-acceptance mt-3">
                    <input
                      type="checkbox"
                      id={`checkbox-${card.id || index}`}
                      className="role-checkbox"
                      checked={!!checkedItems[card.id || index.toString()]}
                      onChange={(e) => handleCheckboxChange(card.id || index.toString(), e.target.checked)}
                    />
                    <label 
                      htmlFor={`checkbox-${card.id || index}`}
                      className="role-label"
                    >
                      {card.checkboxLabel || 'I understand'}
                    </label>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        ))}
        
        {/* Carousel Navigation Buttons */}
        {cards.length > 1 && (
          <div className="carousel-nav-buttons">
            <button 
              className="carousel-btn carousel-btn-prev" 
              onClick={handlePrevCard}
              aria-label="Previous card"
            >
              &lt;
            </button>
            <button 
              className="carousel-btn carousel-btn-next" 
              onClick={handleNextCard}
              aria-label="Next card"
            >
              &gt;
            </button>
          </div>
        )}
      </div>
    </BaseSection>
  );
};

export default CardCarouselSection;