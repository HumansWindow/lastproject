import React from 'react';
import { NextPage } from 'next';

// Import our game components and hook
import {
  TextImageSection,
  CardCarouselSection,
  TimelineSection,
  CardItem,
  TimelineItem,
  useGameSections
} from "../../components/game";

const GameDemoPage: NextPage = () => {
  // Use our game sections hook instead of managing state manually
  const { activeSection } = useGameSections({
    initialSectionId: 'section1',
    useGalaxyBackground: true
  });
  
  // Sample card items for the card carousel
  const cardItems: CardItem[] = [
    {
      id: 'card1',
      title: 'Card 1',
      content: '<p>This is the first card with some <strong>formatted content</strong>.</p>',
      hasCheckbox: true,
      checkboxLabel: 'I understand this concept'
    },
    {
      id: 'card2',
      title: 'Card 2',
      content: '<p>This is the second card with <em>more content</em> and details.</p>',
      hasCheckbox: true,
      checkboxLabel: 'I acknowledge this information'
    },
    {
      id: 'card3',
      title: 'Card 3',
      content: '<p>This is the third card with a list:</p><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>',
      hasCheckbox: false
    }
  ];

  // Sample timeline items
  const timelineItems: TimelineItem[] = [
    {
      id: 'timeline1',
      title: 'Step 1: Getting Started',
      content: '<p>Begin your journey by learning the basics. This is the first step in the timeline.</p>',
      position: 'left',
      image: '/assets/images/sample1.jpg'
    },
    {
      id: 'timeline2',
      title: 'Step 2: Advanced Concepts',
      content: '<p>Now that you understand the basics, let\'s move on to more advanced concepts.</p>',
      position: 'right',
      image: '/assets/images/sample2.jpg'
    },
    {
      id: 'timeline3',
      title: 'Step 3: Mastery',
      content: '<p>Complete your journey by mastering all the concepts and techniques.</p>',
      position: 'left',
      image: '/assets/images/sample3.jpg',
      link: {
        text: 'Learn More',
        url: '#'
      }
    }
  ];

  return (
    <div className="game-container">
      {/* First Section - Text + Image with Galaxy background */}
      <TextImageSection
        id="section1"
        heading="Welcome to the Learn to Earn Game"
        content="<p>This is an example of a Text + Image section with a Galaxy background. The content area can include rich text with <strong>formatting</strong>, <em>emphasis</em>, and more.</p><p>The image on the right side can be animated using different effects.</p>"
        image="/assets/images/space-image.svg"
        imageAlt="Galaxy visualization"
        imagePosition="right"
        imageAnimation="reveal"
        useTypeAnimation={true}
        backgroundType="galaxy"
        isActive={activeSection === 'section1'}
        navigationConfig={{
          prevSection: null,
          nextSection: "section2",
          prevText: "",
          nextText: "Continue"
        }}
      />

      {/* Second Section - Text + Image (reversed) */}
      <TextImageSection
        id="section2"
        heading="Learning Through Experience"
        content="<p>This is another Text + Image section, but with the image on the left side. Notice how the layout changes to accommodate different content arrangements.</p><p>This section doesn't use the Galaxy background, showing the flexibility of our component system.</p>"
        image="/assets/images/learning.svg"
        imageAlt="Learning illustration"
        imagePosition="left"
        imageAnimation="spin"
        backgroundType="default"
        isActive={activeSection === 'section2'}
        navigationConfig={{
          prevSection: "section1",
          nextSection: "section3",
          prevText: "Back",
          nextText: "Next"
        }}
      />

      {/* Third Section - Card Carousel */}
      <CardCarouselSection
        id="section3"
        heading="Key Concepts"
        cards={cardItems}
        useTypeAnimation={true}
        backgroundType="gradient"
        isActive={activeSection === 'section3'}
        navigationConfig={{
          prevSection: "section2",
          nextSection: "section4",
          prevText: "Previous",
          nextText: "Continue"
        }}
      />

      {/* Fourth Section - Timeline */}
      <TimelineSection
        id="section4"
        heading="Learning Journey"
        items={timelineItems}
        useTypeAnimation={false}
        backgroundType="galaxy"
        isActive={activeSection === 'section4'}
        navigationConfig={{
          prevSection: "section3",
          nextSection: null,
          prevText: "Back",
          nextText: ""
        }}
      />
    </div>
  );
};

export default GameDemoPage;