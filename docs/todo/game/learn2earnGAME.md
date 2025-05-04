# Learn to Earn Game System - Implementation Plan

## Overview
This document outlines the implementation plan for a "Learn to Earn" game system where users progress through educational content in a gamified environment. The system features time-gated progression (e.g., 72-hour waiting periods between levels), admin-created game content, and visual educational experiences.

Based on the existing prototype in `/4-Pages/level1`, this plan extends it into a complete platform integrated with our backend, admin panel, and frontend systems.

## Key Features
- Progressive learning content presented as a "game"
- Time-gated progression between levels (configurable waiting periods)
- Admin interface for creating and managing game content
- User authentication and progress tracking
- Visual learning through text, images, animations, and interactions
- Reward system for completing levels

## Integration with Existing Project Structure

### Backend Integration
- Extend the existing NestJS backend in `/backend/src/` with new modules for game management
- Utilize existing authentication system and user management
- Add game-specific APIs while maintaining current architecture patterns

### Admin Panel Integration
- Integrate game management into the Next.js-based admin panel in `/admin/src/`
- Reuse existing UI components and design patterns
- Add specialized editors for game content creation

### Frontend Integration
- Create new game frontend routes in `/frontend/src/pages/`
- Leverage existing authentication and API services
- Implement game-specific UI components

### Database Integration
- Extend current database schema with new tables for game content and progress
- Follow existing migration patterns in `/migrations/`
- Maintain ID standardization as per `/id-field-standards.md`

## System Architecture

### User Authentication System
- Users register/login using existing authentication system
- Game access is restricted to authenticated users
- User progress is tracked and associated with user profiles

### Admin Panel Requirements
- Game management section in the admin panel
- UI for creating and organizing level content:
  - Button to add new sections/levels
  - Options to choose section types (text+image, cards, timeline, etc.)
  - Background animation selection
  - Rich text editing capabilities
  - File upload for images/SVGs/other media
- Progress monitoring and management tools

### Technical Approach
- Bootstrap for responsive UI (already in use in level1 implementation)
- Existing animations and styles from level1 template as the foundation
- Component-based architecture for reusability
- Consistent API patterns with the rest of the application

## Implementation Plan

### 1. Database Design

#### User-related Tables
- Leverage existing `users` table
- Create new `game_user_progress` table:
  - `user_id`: Foreign key to users table (following ID standardization)
  - `level_id`: Reference to completed level
  - `completed_at`: Timestamp of level completion
  - `unlock_next_at`: Timestamp when next level becomes available
  - `status`: Enum (not_started, in_progress, completed, locked)

#### Content-related Tables
- `game_levels` table:
  - `id`: Primary key (following ID standardization)
  - `title`: Level title
  - `description`: Level description
  - `order_index`: Sequence number for level display
  - `waiting_period_hours`: Hours to wait before next level
  - `is_active`: Boolean for level availability
  - `created_at`, `updated_at`: Timestamps
  
- `game_sections` table:
  - `id`: Primary key
  - `level_id`: Foreign key to game_levels
  - `section_type`: Enum (text_image, cards, timeline, svg_animation, etc.)
  - `order_index`: Display order within level
  - `content`: JSONB field for section content
  - `created_at`, `updated_at`: Timestamps
  
- `game_media` table:
  - `id`: Primary key
  - `file_path`: Path to stored media
  - `media_type`: Type of media (image, svg, video)
  - `metadata`: Additional information about the media
  - `created_at`, `updated_at`: Timestamps

#### Database Migration Path
1. Create migrations following existing patterns in `/migrations/`
2. Implement TypeORM entities in `/backend/src/modules/game/entities/`
3. Follow ID standardization as defined in project documentation

### 2. Backend Implementation

#### Module Structure
Create new module in `/backend/src/modules/game/` with:

```
game/
├── controllers/
│   ├── game-admin.controller.ts    # Admin-facing endpoints
│   └── game-user.controller.ts     # User-facing endpoints
├── dtos/
│   ├── create-level.dto.ts
│   ├── create-section.dto.ts
│   └── update-progress.dto.ts
├── entities/
│   ├── game-level.entity.ts
│   ├── game-section.entity.ts
│   └── game-user-progress.entity.ts
├── services/
│   ├── game-content.service.ts     # Content management
│   ├── game-media.service.ts       # Media handling
│   └── game-progress.service.ts    # Progress tracking
├── game.module.ts
└── game.constants.ts
```

#### API Endpoints

##### Admin APIs
- `POST /api/admin/game/levels` - Create new level
- `GET /api/admin/game/levels` - List all levels
- `GET /api/admin/game/levels/:id` - Get level details
- `PATCH /api/admin/game/levels/:id` - Update level
- `DELETE /api/admin/game/levels/:id` - Delete level
- `POST /api/admin/game/levels/:id/sections` - Add section to level
- `PATCH /api/admin/game/levels/:id/sections/:sectionId` - Update section
- `DELETE /api/admin/game/levels/:id/sections/:sectionId` - Delete section
- `POST /api/admin/game/media` - Upload media
- `GET /api/admin/game/users/:userId/progress` - View user progress

##### User APIs
- `GET /api/game/levels` - Get available levels
- `GET /api/game/levels/:id` - Get level content
- `POST /api/game/levels/:id/complete` - Mark level as complete
- `GET /api/game/progress` - Get user's progress
- `GET /api/game/next-level` - Check when next level unlocks

#### Progress Tracking Logic
- Record level completion with timestamp
- Calculate next level unlock time based on waiting period
- Implement checks for level availability based on time gates

### 3. Admin Interface

#### Module Structure in NextJS Admin
Add new module in `/admin/src/pages/game/`:

```
pages/game/
├── index.tsx               # Game management dashboard
├── levels/
│   ├── index.tsx           # List levels
│   ├── create.tsx          # Create new level
│   └── [id]/
│       ├── index.tsx       # Level details
│       ├── edit.tsx        # Edit level
│       └── sections/
│           ├── create.tsx  # Create section
│           └── [sid].tsx   # Edit section
└── media/
    └── index.tsx           # Media library
```

#### Section Type Editors

Implement specialized editors for each section type:

1. **Text+Image Editor**
   - Rich text editor (use existing editor component)
   - Image upload and positioning options
   - Layout configuration (text left/right/top/bottom)

2. **Card Carousel Editor**
   - Add/remove cards interface
   - Per-card content editor
   - Carousel settings (auto-scroll, indicators, etc.)

3. **Timeline Editor**
   - Add/remove timeline entries
   - Left/right positioning
   - Media attachment for each entry

4. **SVG Animation Editor**
   - SVG upload
   - Animation parameter configuration
   - Preview functionality

#### Media Management
- Extend existing media management system
- Add preview capabilities for SVG animations
- Implement tagging and categorization for game assets

### 4. Frontend Implementation

#### Game Frontend Structure in NextJS
Add new pages in `/frontend/src/pages/game/`:

```
pages/game/
├── index.tsx               # Game dashboard/overview
└── levels/
    └── [id].tsx            # Dynamic level page
```

#### Dynamic Content Rendering
1. Create React components for each section type:
   - `/frontend/src/components/game/sections/TextImageSection.tsx`
   - `/frontend/src/components/game/sections/CardCarouselSection.tsx`
   - `/frontend/src/components/game/sections/TimelineSection.tsx`
   - `/frontend/src/components/game/sections/SvgAnimationSection.tsx`

2. Implement a section renderer factory that selects the appropriate component based on section type

3. Ensure all components maintain animations and visual quality of the level1 prototype

#### Progress Tracking UI
- Create progress dashboard component
- Implement waiting period countdown timer
- Add notifications for newly unlocked levels

### 5. Content Migration

1. **Extract Components from Level1**
   - Analyze `/4-Pages/level1/index.html`
   - Extract CSS from `/4-Pages/level1/src/styles/style.css`
   - Extract JS from `/4-Pages/level1/src/js/`

2. **Convert to Database Format**
   - Transform HTML sections into JSON structures
   - Upload media files to appropriate storage
   - Create initial game_levels and game_sections records

## Implementation Timeline

### Phase 1: Core Infrastructure (Weeks 1-2)
- Database schema design and migrations
- Backend API scaffolding
- Basic admin interface for content management

### Phase 2: Content Components (Weeks 3-4)
- Extract and convert level1 components
- Implement section type editors in admin
- Create frontend rendering components

### Phase 3: Progress Tracking (Weeks 5-6)
- User progress tracking implementation
- Time-gate logic and countdown UI
- Progress visualization

### Phase 4: Integration & Testing (Weeks 7-8)
- Connect all system components
- End-to-end testing
- Performance optimization

## Technical Specifications

### Backend Technologies
- NestJS (existing framework)
- TypeORM with PostgreSQL
- JWT for authentication (using existing system)
- File storage integration for media (S3 or local filesystem)

### Admin Technologies
- Next.js (existing admin framework)
- React component library (reuse existing components)
- Rich text editor (reuse existing implementation)
- Form validation with Yup or similar

### Frontend Technologies
- Next.js (existing frontend framework)
- Dynamic content rendering system
- GSAP for animations (maintain from level1)
- Three.js for 3D effects (maintain from level1)
- Bootstrap for responsive layout (maintain from level1)

## Development Guidelines

### Code Organization
- Follow existing project patterns and conventions
- Reuse core components and services
- Maintain separation of concerns (data, logic, presentation)

### Testing Strategy
- Unit tests for core business logic
- Integration tests for API endpoints
- Component tests for UI elements
- End-to-end tests for critical user flows

### Performance Considerations
- Optimize media loading and animations
- Implement lazy loading for level content
- Consider caching strategies for frequently accessed content

### Security Considerations
- Ensure proper authentication for all game endpoints
- Validate and sanitize user inputs
- Implement rate limiting for progress-related endpoints
- Secure media uploads with proper validation

## Notes for Implementation
- Maintain the visual quality and animations of the current prototype
- Focus on scalability to support many concurrent users
- Ensure content is separated from presentation for maintainability
- Build with localization in mind (current prototype already supports multiple languages)
- Create comprehensive documentation for content creators