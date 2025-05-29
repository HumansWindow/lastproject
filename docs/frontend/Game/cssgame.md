# Learn to Earn Game - CSS and Component Structure

This document provides an overview of the CSS structure and React component implementation for the Learn to Earn game system. The system is designed with a modular approach, separating concerns between layouts, animations, and functionality.

## CSS File Structure

The game section CSS is organized into the following files:

```
frontend/src/styles/game/
├── section-base.css       # Base styles for all section types
├── section-text-image.css # Styles for text and image section layout
├── section-card-carousel.css # Styles for card carousel sections
├── section-timeline.css   # Styles for timeline sections
├── section-galaxy-background.css # Styles for galaxy background sections
├── animations.css         # Reusable animation classes
└── index.css              # Main import file that bundles all styles
```

### CSS Import Instructions

**Important**: In Next.js applications, global CSS files can only be imported in the `_app.tsx` or `_app.js` file. All game CSS files should be imported there, not directly in the component files.

```tsx
// In _app.tsx
import '../styles/globals.css';
// Import game section styles
import '../styles/game/section-base.css';
import '../styles/game/section-text-image.css';
import '../styles/game/section-card-carousel.css';
import '../styles/game/section-timeline.css';
import '../styles/game/section-galaxy-background.css';
import '../styles/game/animations.css';
```

Do not import these CSS files directly in the component files as it will cause build errors.

### CSS File Descriptions

#### section-base.css
Contains the foundational styles that apply to all section types including:
- Base section layout and dimensions
- Flexbox container structure
- Navigation button positioning and appearance
- Section transition animations
- Common typography defaults

#### section-text-image.css
Specific styles for the Text + Image section type:
- Two-column layout structure
- Responsive behavior for different screen sizes
- Left/right image positioning
- Text formatting and spacing
- Image container sizing and alignment

#### section-card-carousel.css
Styles for the Card Carousel section type:
- Card container layout and dimensions
- Card appearance and borders
- Navigation arrows and controls
- Card transition animations
- Active/inactive card states

#### section-timeline.css
Styles for the Timeline section type:
- Vertical timeline layout
- Connected timeline points and lines
- Alternating left/right content positioning
- Timeline item reveal animations
- Media placement within timeline items

#### section-galaxy-background.css
Styles specific to sections with Galaxy backgrounds:
- Canvas positioning and dimensions
- z-index layering
- Background colors and text contrast
- Transition effects between galaxy sections

#### animations.css
Library of reusable animation classes:
- Text typing animations
- Image reveal effects
- Rotation and movement animations
- Pulsing and fading effects
- Transition utilities and timing classes

#### index.css
A barrel file that imports all the above CSS files, making it easier to include all game styles at once.

## React Component Structure

The game components are organized in the following structure:

```
frontend/src/components/game/
├── sections/
│   ├── BaseSection.tsx        # Base section component
│   ├── TextImageSection.tsx   # Text + Image section
│   ├── CardCarouselSection.tsx # Card carousel section
│   ├── TimelineSection.tsx    # Timeline section
│   └── index.ts               # Export barrel file
├── elements/
│   ├── NavigationButton.tsx   # Navigation buttons
│   ├── TypedText.tsx          # Text with typing animation
│   ├── AnimatedImage.tsx      # Images with animations
│   └── index.ts               # Export barrel file
├── hooks/
│   ├── useGameSections.ts     # Hook for section management
│   └── index.ts               # Export barrel file
└── index.ts                   # Main export barrel file
```

### Component Descriptions

#### sections/BaseSection.tsx
The foundation component for all section types that includes:
- Common layout structure
- Navigation button handling
- Section transitions
- Background type support
- Active/inactive state management

#### sections/TextImageSection.tsx
A two-column section with text on one side and an image on the other:
- Configurable image position (left/right)
- Support for image animations
- Text typing animation option
- HTML content rendering with formatting
- Extends BaseSection functionality

#### sections/CardCarouselSection.tsx
A section with horizontally scrollable cards:
- Card navigation with previous/next controls
- Card progress tracking with checkboxes
- Multiple cards with individual content
- Auto-scroll option with configurable timing
- Extends BaseSection functionality

#### sections/TimelineSection.tsx
A vertical timeline section displaying progressive content:
- Left/right alternating content placement
- Animated reveal as users scroll
- Support for images and links in each timeline item
- Extends BaseSection functionality

#### elements/NavigationButton.tsx
A reusable button component for section navigation:
- Consistent styling with the design system
- Supports top and bottom positioning
- Disabled state handling
- Accessibility attributes

#### elements/TypedText.tsx
A component for text typing animation effects:
- Uses GSAP for smooth animations
- Configurable typing speed and delay
- Supports various heading levels and text types
- Cursor blinking effect

#### elements/AnimatedImage.tsx
A component for various image animation effects:
- Support for regular images and SVGs
- Multiple animation types (reveal, spin, pulse)
- Option to invert colors for dark backgrounds
- Integration with Next.js Image component for optimization

#### hooks/useGameSections.ts
A React hook that manages section navigation and Galaxy animation integration:
- Automatic detection of Galaxy background sections
- Special transitions between Galaxy sections
- Standard transitions between regular sections
- Maintains active section state

## Demo Implementation

A demo implementation showing all components in action is available at:

```
frontend/src/pages/game-demo/index.tsx
```

This demonstrates how to use all the section types together in a complete game experience, with proper navigation and transitions.

## Integration with Galaxy Animation

The system integrates with the Three.js-based Galaxy animation through the following interface:

- Galaxy background sections are automatically detected
- The `useGameSections` hook provides seamless integration
- Special "fly-over" transitions occur between Galaxy sections
- Non-Galaxy sections use standard CSS transitions

## Usage Guidelines

For a new game module, import the components from the game package:

```tsx
import { 
  TextImageSection, 
  CardCarouselSection,
  TimelineSection,
  useGameSections 
} from '../components/game';
```

Use the `useGameSections` hook to manage section navigation:

```tsx
const { activeSection } = useGameSections({
  initialSectionId: 'section1',
  useGalaxyBackground: true
});
```

Then create your sections using the appropriate components:

```tsx
<TextImageSection
  id="section1"
  heading="Welcome to the Learn to Earn Game"
  content="<p>Example content with <strong>formatting</strong>...</p>"
  image="/assets/images/example.svg"
  imagePosition="right"
  backgroundType="galaxy"
  isActive={activeSection === 'section1'}
  navigationConfig={{
    prevSection: null,
    nextSection: "section2",
    prevText: "",
    nextText: "Continue"
  }}
/>
```

All section types follow a similar structure, extending the BaseSection props with their specific requirements.