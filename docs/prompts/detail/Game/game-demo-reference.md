# Game System Migration and Integration Reference

This document serves as a reference for migrating and integrating the Learn-to-Earn game system from the current project to a new project.

## Migration Process Overview

The migration script `migrate-game-system.sh` will copy all the following components:

1. **Backend Game Module (97 files)**
   - Located at `/backend/src/game/`
   - Complete module with all controllers, services, entities, etc.

2. **Frontend Game Components**
   - Located at `/frontend/src/components/game/`
   - Includes sections, elements, hooks, notification components

3. **Galaxy Animation System**
   - Located at `/frontend/src/animations/galaxy/`
   - 3D star field animation used in game backgrounds

4. **Game CSS Files**
   - Located at `/frontend/src/styles/game/`
   - Styles for all game sections and animations

5. **Game Documentation**
   - Located at `/docs/frontend/Game/`
   - Detailed docs about the CSS and galaxy animation

## Sample Component Usage (from game-demo/index.tsx)

The `game-demo` page serves as an excellent reference implementation showing how to use the game components:

```tsx
// Import game components
import {
  TextImageSection,
  CardCarouselSection,
  TimelineSection,
  CardItem,
  TimelineItem,
  useGameSections
} from "../../components/game";

const GamePage = () => {
  // Hook manages section state and navigation
  const { activeSection } = useGameSections({
    initialSectionId: 'section1',
    useGalaxyBackground: true
  });
  
  // Define content for different section types
  const cardItems = [...];
  const timelineItems = [...];

  return (
    <div className="game-container">
      {/* Different section types with navigation between them */}
      <TextImageSection
        id="section1"
        heading="Welcome to the Learn to Earn Game"
        content="..."
        isActive={activeSection === 'section1'}
        navigationConfig={{...}}
      />
      
      <CardCarouselSection {...} />
      
      <TimelineSection {...} />
    </div>
  );
};
```

## Key Components Overview

### Frontend Components

1. **Section Components**
   - `TextImageSection`: Two-column layout with text and image
   - `CardCarouselSection`: Horizontal scrollable cards
   - `TimelineSection`: Vertical timeline with alternating items

2. **UI Elements**
   - `NavigationButton`: Section navigation
   - `TypedText`: Text with typing animation
   - `AnimatedImage`: Images with various animations

3. **Hooks**
   - `useGameSections`: Manages active section and navigation

### Backend Structure

1. **Core Modules**
   - `GameModulesController/Service`: Manages game modules
   - `GameSectionsController/Service`: Manages sections within modules
   - `UserProgressController/Service`: Tracks user progress

2. **Educational Elements**
   - `QuizController/Service`: Quiz functionality
   - `ContentTemplateController/Service`: Templates for section content
   - `ContentApprovalController/Service`: Content approval workflow

3. **Social Features**
   - `CollaborationCommentController/Service`: User collaboration
   - `GameNotificationController/Service`: In-game notifications

4. **Rewards System**
   - `RewardsController/Service`: Manages cryptocurrency rewards
   - Integration with blockchain module

## Integration Steps Summary

1. Run the migration script to copy all files:
   ```bash
   ./migrate-game-system.sh /path/to/new/project
   ```

2. Set up database tables for game module

3. Add GameModule to your app.module.ts:
   ```typescript
   @Module({
     imports: [
       // ...other imports
       GameModule,
     ],
   })
   export class AppModule {}
   ```

4. Import game styles in your frontend:
   ```typescript
   // In _app.tsx or similar
   import '../styles/game/section-base.css';
   import '../styles/game/section-text-image.css';
   // ...other styles
   ```

5. Create game pages using the components as shown in game-demo

The complete integration process is detailed in the `game-integration-guide.md` document.

## Specific Notes for Your Implementation

- The game-demo page provides a working example of all major section types
- Galaxy animation can be enabled with `useGalaxyBackground: true` option
- All components have extensive prop options for customization
- Backend controllers handle progress tracking and rewards
- WebSocket gateways provide real-time updates

## Conclusion

The Learn-to-Earn game system is a complete, modular system that can be migrated to your new project with minimal changes. Use the provided migration script and follow the integration guide for a smooth transition.

For detailed implementation questions, refer to the game-demo page as a practical example.