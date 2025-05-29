# Game System Integration Guide

This document provides comprehensive instructions for integrating the Learn-to-Earn game system into a new project. The game system includes both backend (NestJS) and frontend (React/Next.js) components.

## System Overview

The Learn-to-Earn game system is a comprehensive educational platform with the following features:

- Interactive learning modules and sections
- Progress tracking and checkpoints
- Quiz system with various question types
- Reward mechanisms tied to blockchain
- Media asset management
- Content versioning and approval workflow
- Real-time notifications via WebSockets
- 3D Galaxy animation system for immersive UI

## Architecture

### Backend (NestJS)

The backend is organized as follows:

```
backend/src/game/
├── controllers/      # API endpoints
├── dto/              # Data Transfer Objects
├── entities/         # Database entities (TypeORM)
├── enums/            # TypeScript enums
├── events/           # Event definitions
├── exceptions/       # Custom exceptions
├── gateways/         # WebSocket gateways
├── guards/           # Authentication guards
├── interceptors/     # Request/response interceptors
├── interfaces/       # TypeScript interfaces
├── pipes/            # Validation pipes
├── repositories/     # TypeORM repositories
├── services/         # Business logic
├── tasks/            # Scheduled tasks
├── types/            # TypeScript type definitions
└── game.module.ts    # Main module definition
```

### Frontend (React/Next.js)

The frontend is organized as follows:

```
frontend/
├── src/
│   ├── components/game/     # React components
│   │   ├── sections/        # Section components
│   │   ├── elements/        # UI elements
│   │   └── hooks/           # React hooks
│   ├── animations/galaxy/   # Galaxy animation system
│   │   └── ...
│   └── styles/game/         # CSS files
│       └── ...
```

## Integration Steps

### 1. Prerequisites

Ensure your new project has:

- NestJS backend with TypeORM
- React/Next.js frontend
- PostgreSQL database
- Node.js v16+
- TypeScript v4.5+

### 2. Database Setup

Run the following database migration script to create the game tables:

```bash
# In your new project
cd backend
npx typeorm migration:create -n CreateGameTables
```

Replace the generated migration file content with:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGameTables implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Game Modules Table
      CREATE TABLE game_modules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        prerequisite_module_id UUID REFERENCES game_modules(id),
        time_to_complete INTEGER,
        wait_time_hours INTEGER DEFAULT 0,
        reward_amount DECIMAL(18, 8) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Game Sections Table
      CREATE TABLE game_sections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module_id UUID NOT NULL REFERENCES game_modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        section_type VARCHAR(50) NOT NULL,
        game_level INTEGER DEFAULT 1,
        has_checkpoint BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Section Content Table
      CREATE TABLE section_contents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        section_id UUID NOT NULL REFERENCES game_sections(id) ON DELETE CASCADE,
        content_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        is_approved BOOLEAN DEFAULT FALSE,
        approved_by UUID,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- User Progress Table
      CREATE TABLE user_progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        module_id UUID NOT NULL REFERENCES game_modules(id) ON DELETE CASCADE,
        section_id UUID REFERENCES game_sections(id) ON DELETE CASCADE,
        completion_status VARCHAR(50) NOT NULL DEFAULT 'not_started',
        progress_percentage INTEGER DEFAULT 0,
        last_checkpoint_id UUID,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, module_id, section_id)
      );

      -- Add other game tables here...
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS user_progress;
      DROP TABLE IF EXISTS section_contents;
      DROP TABLE IF EXISTS game_sections;
      DROP TABLE IF EXISTS game_modules;
      -- Drop other game tables here...
    `);
  }
}
```

Run the migration:

```bash
npx typeorm migration:run
```

### 3. Backend Integration

1. Copy the game module into your backend:

```bash
# You can use the provided migration script
./migrate-game-system.sh /path/to/your/new/project
```

2. Import the GameModule in your app.module.ts:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // your database config
    }),
    GameModule,
    // other modules
  ],
})
export class AppModule {}
```

3. Update Dependencies:

Ensure you have these dependencies in your package.json:

```json
{
  "dependencies": {
    "@nestjs/common": "^8.0.0",
    "@nestjs/core": "^8.0.0",
    "@nestjs/typeorm": "^8.0.0",
    "@nestjs/websockets": "^8.0.0",
    "socket.io": "^4.4.0",
    "typeorm": "^0.2.41",
    "pg": "^8.7.1",
    "class-validator": "^0.13.2",
    "class-transformer": "^0.5.1"
  }
}
```

Then run:

```bash
npm install
```

### 4. Frontend Integration

1. Copy the game frontend components using the script:

```bash
./migrate-game-system.sh /path/to/your/new/project
```

2. Import the CSS files in your _app.tsx:

```tsx
// In _app.tsx
import '../styles/globals.css';
// Import game styles
import '../styles/game/section-base.css';
import '../styles/game/section-text-image.css';
import '../styles/game/section-card-carousel.css';
import '../styles/game/section-timeline.css';
import '../styles/game/section-galaxy-background.css';
import '../styles/game/animations.css';
```

3. Create a basic game page:

```tsx
// pages/game.tsx
import { useEffect, useState } from 'react';
import {
  TextImageSection,
  CardCarouselSection,
  TimelineSection,
  useGameSections
} from '../components/game';

export default function GamePage() {
  const { activeSection, setActiveSection } = useGameSections({
    initialSectionId: 'intro',
    useGalaxyBackground: true
  });
  
  const [modules, setModules] = useState([]);
  
  useEffect(() => {
    // Fetch game modules from the API
    fetch('/api/game/modules')
      .then(res => res.json())
      .then(data => setModules(data));
  }, []);
  
  return (
    <div className="game-container">
      <TextImageSection
        id="intro"
        backgroundType="galaxy"
        heading="Welcome to the Learn to Earn Game"
        content="<p>Begin your learning journey...</p>"
        image="/assets/images/intro.svg"
        imagePosition="right"
        isActive={activeSection === 'intro'}
        navigationConfig={{
          prevSection: null,
          nextSection: "section1",
          prevText: "",
          nextText: "Start Learning"
        }}
      />
      
      {/* Add more sections based on your content */}
    </div>
  );
}
```

4. Update Dependencies:

Ensure you have these dependencies in your frontend package.json:

```json
{
  "dependencies": {
    "next": "^12.0.0",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "three": "^0.137.0",
    "gsap": "^3.9.1",
    "socket.io-client": "^4.4.0"
  }
}
```

Then run:

```bash
npm install
```

### 5. Testing the Integration

1. Start both backend and frontend:

```bash
# In backend directory
npm run start:dev

# In frontend directory
npm run dev
```

2. Access your game at `http://localhost:3000/game`

3. Test API endpoints:
   - `GET /api/game/modules`
   - `GET /api/game/sections`
   - `POST /api/game/progress`

## Customization

### Configuring Game Modules

You can either:

1. Create modules through the API:
```http
POST /api/game/modules
Content-Type: application/json

{
  "title": "Introduction to Blockchain",
  "description": "Learn the fundamentals of blockchain technology",
  "orderIndex": 1,
  "timeToComplete": 30,
  "rewardAmount": 10
}
```

2. Or seed the database with initial content:
```typescript
// Create a seed script in your backend
async function seedGameModules() {
  const moduleRepository = getRepository(GameModule);
  
  // Check if modules already exist
  const count = await moduleRepository.count();
  if (count > 0) return;
  
  // Create modules
  await moduleRepository.save([
    {
      title: 'Introduction to Blockchain',
      description: 'Learn the fundamentals of blockchain technology',
      orderIndex: 1,
      isActive: true,
      timeToComplete: 30,
      rewardAmount: 10
    },
    // Add more modules
  ]);
}
```

### Customizing the Galaxy Animation

The Galaxy animation can be customized through the configuration options:

```tsx
import { useGalaxyAnimation } from '../animations/galaxy';

const { flyOver } = useGalaxyAnimation({
  config: {
    numArms: 4,              // Number of spiral arms
    numStarsPerArm: 4000,    // Number of stars per arm
    armWidth: 0.25,          // Width of each arm
    verticalScatter: 0.3,    // Vertical distribution of stars
    spiralTightness: 0.25,   // How tight the spiral is
    coreRadius: 0.15,        // Size of the galaxy core
    coreIntensity: 1.0,      // Brightness of the core
    baseSpeed: 0.05          // Base rotation speed
  }
});
```

## Security Considerations

1. **Authentication**: The game system uses JWT authentication. Ensure your AuthGuard is applied to game controllers.

2. **Role-Based Access**: Admin endpoints should be secured with role-based guards:

```typescript
@Controller('admin/game')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminContentController {
  // Admin-only endpoints
}
```

3. **Rate Limiting**: Apply rate limiting to prevent abuse:

```typescript
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per minute
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Verify your PostgreSQL connection string
2. Ensure database user has proper permissions
3. Check if tables are properly created with:
```sql
SELECT * FROM information_schema.tables WHERE table_name LIKE 'game_%';
```

### Frontend Integration Issues

1. Missing CSS:
   - Ensure all CSS files are imported in _app.tsx
   - Check for CSS conflicts with existing styles

2. Three.js errors:
   - Add fallback for browsers that don't support WebGL:
   ```tsx
   const { isWebGLSupported } = useGalaxyAnimation();
   
   if (!isWebGLSupported) {
     return <FallbackComponent />;
   }
   ```

3. Component errors:
   - Check React version compatibility
   - Ensure all props are properly passed to components

## Advanced Integration

### Implementing Game Achievements

The game system includes an achievement system that can be extended:

```typescript
// In your service
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AchievementUnlockedEvent } from './events/achievement-unlocked.event';

@Injectable()
export class GameProgressService {
  constructor(private eventEmitter: EventEmitter2) {}
  
  async completeSection(userId: string, sectionId: string) {
    // Mark section as completed
    
    // Check for achievements
    const achievements = await this.checkAchievements(userId);
    
    if (achievements.length > 0) {
      // Emit event for each unlocked achievement
      achievements.forEach(achievement => {
        this.eventEmitter.emit(
          'achievement.unlocked',
          new AchievementUnlockedEvent(userId, achievement)
        );
      });
    }
    
    return { completed: true, achievements };
  }
}
```

### Real-time Progress Updates

The WebSocket gateways provide real-time updates:

```typescript
// In your frontend
import { io } from 'socket.io-client';

function useGameSocket() {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const socketInstance = io('/game', {
      auth: {
        token: localStorage.getItem('accessToken')
      }
    });
    
    socketInstance.on('connect', () => {
      console.log('Connected to game socket');
    });
    
    socketInstance.on('progress.update', (data) => {
      console.log('Progress update:', data);
      // Update UI
    });
    
    socketInstance.on('achievement.unlocked', (data) => {
      console.log('Achievement unlocked:', data);
      // Show achievement notification
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  return socket;
}
```

## API Reference

The game system exposes the following API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/game/modules` | GET | Get all game modules |
| `/api/game/modules/:id` | GET | Get a specific module |
| `/api/game/modules/:id/sections` | GET | Get sections for a module |
| `/api/game/sections/:id` | GET | Get a specific section |
| `/api/game/progress` | GET | Get user progress |
| `/api/game/progress` | POST | Update user progress |
| `/api/game/quiz/:id` | GET | Get a quiz by ID |
| `/api/game/quiz/:id/submit` | POST | Submit quiz answers |

## Conclusion

This integration guide provides the foundation for incorporating the Learn-to-Earn game system into your new project. The modular architecture allows for easy customization and extension to fit your specific requirements.

For more detailed information, refer to:

- `docs/game/cssgame.md` - CSS and component structure
- `docs/game/galaxyAnimation.md` - Galaxy animation system

If you encounter any issues during integration, please check the troubleshooting section or contact the development team for support.