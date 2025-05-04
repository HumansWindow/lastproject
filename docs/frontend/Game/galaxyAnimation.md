# Galaxy Animation System

This document describes the TypeScript implementation of the Galaxy animation system used in the Learn-to-Earn game. The system creates an immersive 3D star field with smooth transitions between sections.

## File Structure

The Galaxy animation system is organized as follows:

```
frontend/
└── src/
    ├── animations/
    │   ├── colorsystem/
    │   │   ├── ColorSystem.ts            # Base interface for color systems
    │   │   ├── GalaxyColorSystem.ts      # Galaxy-specific color implementation
    │   │   └── index.ts                  # Export barrel file
    │   └── galaxy/
    │       ├── GalaxyAnimation.ts        # Main galaxy animation class
    │       ├── GalaxyTransitionManager.ts # Section transition handling
    │       ├── types.ts                  # TypeScript types for galaxy config
    │       ├── useGalaxyAnimation.ts     # React hook for Galaxy animation
    │       └── index.ts                  # Export barrel file
    └── styles/
        └── game/
            └── section-galaxy-background.css  # Galaxy-specific CSS styles
```

## File Descriptions

### Color System Module

#### `ColorSystem.ts`
Defines the interface for color systems used in animations. Provides a standard API for creating and retrieving colors based on parameters like position or distance.

#### `GalaxyColorSystem.ts`
Implements the `ColorSystem` interface specifically for galaxy animations. Creates a realistic gradient of colors that transitions from bright core to subtle edges, with enhanced brightness effects.

#### `index.ts` (colorsystem)
Export barrel file that makes it convenient to import from the colorsystem module.

### Galaxy Animation Module

#### `types.ts`
Contains TypeScript interfaces and types used throughout the galaxy animation system:
- `GalaxyConfig`: Configuration options for the galaxy animation
- `GalaxyDimensions`: Calculated dimensions for responsive sizing
- `GalaxyState`: Internal state tracking for the animation
- Other utility types

#### `GalaxyAnimation.ts`
The core class that handles the creation and rendering of the 3D galaxy animation:
- Initializes Three.js scene, camera, and renderers
- Creates and positions stars in a spiral galaxy formation
- Handles animation loop and star movement
- Manages responsive behavior and cleanup

#### `GalaxyTransitionManager.ts`
Manages transitions between sections with galaxy backgrounds:
- Implements camera "fly-over" effect between galaxy sections
- Animates content entering and exiting during transitions
- Provides fallback transitions for non-galaxy sections
- Sets up navigation event handlers

#### `useGalaxyAnimation.ts`
React hook that makes it easy to use the Galaxy animation in React components:
- Manages animation lifecycle (initialization and cleanup)
- Provides methods for navigating between sections
- Controls configuration and initialization options
- Handles React-specific concerns like cleanup and state

#### `index.ts` (galaxy)
Export barrel file that exposes the public API of the galaxy animation system.

## CSS Implementation

The Galaxy animation has associated CSS styles in `section-galaxy-background.css` that handle:

- Positioning and size of the Three.js canvas element
- Z-index layering to ensure content appears above the animation
- Responsive behavior for different screen sizes
- Opacity transitions between galaxy sections
- Default dark background and text colors for galaxy sections

```css
/* Example from section-galaxy-background.css */
.Galaxy {
    min-height: 100vh;
    height: 100vh;
    position: relative;
    overflow: hidden;
    padding: 0;
    margin: 0;
    background: black;
    color: white;
}

.Galaxy canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 0;
    object-fit: cover;
}
```

These CSS styles are designed to work in tandem with the TypeScript implementation to create a seamless visual experience.

## Usage

### Basic Usage with React Hook

```tsx
import { useGalaxyAnimation } from '@/animations/galaxy';

const GameComponent = () => {
  // Initialize with custom configuration
  const { flyOver } = useGalaxyAnimation({
    config: {
      numArms: 4,
      numStarsPerArm: 4000,
      verticalScatter: 0.3
    }
  });

  // Use flyOver to navigate between galaxy sections
  const handleNext = () => {
    flyOver('section1', 'section2');
  };

  return (
    <>
      {/* Section with Galaxy background */}
      <section id="section1" className="ah-section Galaxy active-section">
        {/* Content */}
        <button onClick={handleNext}>Next</button>
      </section>
      
      {/* Another section with Galaxy background */}
      <section id="section2" className="ah-section Galaxy" style={{ display: 'none' }}>
        {/* Content */}
      </section>
    </>
  );
};
```

### Direct Usage (Non-React)

```typescript
import { initGalaxyAnimation } from '@/animations/galaxy';

// Initialize the galaxy animation
const { animation, transitionManager } = initGalaxyAnimation({
  numArms: 5,
  numStarsPerArm: 3500
});

// Clean up when done
function cleanup() {
  animation.dispose();
}
```

## Performance Considerations

The Galaxy animation system is optimized for performance:
- Renders only for visible sections
- Uses hardware acceleration when available
- Adjusts star count based on device capabilities
- Implements proper cleanup to prevent memory leaks

## Customization Options

The Galaxy animation offers numerous customization options:

| Option | Description | Default |
|--------|-------------|---------|
| `numArms` | Number of spiral arms | 3 |
| `numStarsPerArm` | Stars per arm | 3000 |
| `armWidth` | Width of each arm | 0.25 |
| `verticalScatter` | Vertical distribution of stars | 0.25 |
| `armLengthFactor` | Controls arm length | 0.85 |
| `spiralTightness` | How tight the spiral is | 0.25 |
| `zScatter` | Z-axis scatter for depth effect | 0.4 |
| `coreRadius` | Size of the bright galaxy core | 0.15 |
| `coreIntensity` | Brightness of the core | 1.0 |
| `baseSpeed` | Base rotation speed | 0.05 |

## Color Customization

The Galaxy animation uses the `GalaxyColorSystem` to create realistic star colors:

```typescript
import { GalaxyColorSystem } from '@/animations/colorsystem';

// Create a custom color system
const colorSystem = new GalaxyColorSystem({
  coreColor: '#ffaa77', // Warmer core color
  outerColor: '#3366ff', // Bluer outer regions
  brightnessFactor: 1.2, // Increase overall brightness
  contrastFactor: 1.1   // Increase color contrast
});

// Use in animation config
const { animation } = initGalaxyAnimation({
  colorSystem
});
```

## Integration with Section Components

The Galaxy animation integrates seamlessly with the section component system:

### For React Components

```tsx
import { TextImageSection } from '@/components/game/sections';
import { useGalaxyAnimation } from '@/animations/galaxy';

const GamePage = () => {
  // Initialize animation
  useGalaxyAnimation();
  
  return (
    <div className="game-container">
      <TextImageSection
        id="intro"
        backgroundType="galaxy"
        heading="Welcome to the Galaxy"
        content="Begin your journey through space..."
        image="/assets/planet.svg"
        imagePosition="right"
      />
      
      {/* Other sections */}
    </div>
  );
};
```

### For HTML/CSS Usage

```html
<!-- Add the Galaxy class to sections that should have the animation -->
<section id="section1" class="ah-section Galaxy active-section">
  <div class="content">
    <h1>Galaxy Section</h1>
    <p>This section has a galaxy background</p>
  </div>
</section>

<script>
  // Initialize the galaxy animation
  document.addEventListener('DOMContentLoaded', () => {
    const { animation } = initGalaxyAnimation();
    
    // Set up navigation between sections
    document.querySelectorAll('.nav-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-target');
        animation.flyToSection(target);
      });
    });
  });
</script>
```

## Responsive Behavior

The Galaxy animation is fully responsive:

- Automatically adapts to viewport size changes
- Maintains performance on mobile devices by reducing particle count
- Preserves visual quality across different screen sizes
- Can be disabled on low-performance devices

```typescript
// Example of responsive configuration
const { animation } = initGalaxyAnimation({
  responsive: {
    mobile: {
      numStarsPerArm: 1000, // Fewer stars on mobile
      enableEffects: false  // Disable advanced effects
    },
    tablet: {
      numStarsPerArm: 2000, // Medium stars on tablet
      enableEffects: true   // Enable basic effects
    },
    desktop: {
      numStarsPerArm: 4000, // Full stars on desktop
      enableEffects: true   // Enable all effects
    }
  }
});
```

## Troubleshooting

Common issues and their solutions:

### Performance Problems

If the animation is causing performance issues:
- Reduce the number of stars using `numStarsPerArm`
- Disable effects for mobile devices
- Use `animation.pauseWhenNotVisible = true` to stop rendering when not visible

### WebGL Not Available

The system includes a fallback mechanism for browsers that don't support WebGL:
```typescript
const { animation } = initGalaxyAnimation({
  fallbackType: 'css-animation', // Use CSS animations instead of WebGL
});
```

### Z-Index Issues

If the galaxy appears over or under content incorrectly:
- Ensure the canvas element has the correct z-index in CSS
- Use the `zIndex` configuration option: `initGalaxyAnimation({ zIndex: -1 })`

## Browser Compatibility

The Galaxy animation system is compatible with:
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- iOS Safari 11+
- Chrome for Android 60+

Older browsers will receive a simplified version or fallback animation.

## Further Development

Future enhancements planned for the Galaxy animation system:
- Additional animation types (nebulae, planets, comets)
- Dynamic event triggers based on scroll position
- Audio reactivity options
- More advanced color systems and visual effects