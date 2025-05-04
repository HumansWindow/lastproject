# Learn to Earn Game: API Endpoints

This document outlines all API endpoints for the Learn to Earn game system, organized by functional area.

## Module Management

```
GET /api/game/modules - List all game modules
GET /api/game/modules/:id - Get a specific module
POST /api/game/modules - Create a new module (admin)
PUT /api/game/modules/:id - Update a module (admin)
DELETE /api/game/modules/:id - Delete a module (admin)
GET /api/game/modules/:id/sections - Get all sections for a module
```

## Section Management

```
GET /api/game/sections/:id - Get a specific section
POST /api/game/sections - Create a new section (admin)
PUT /api/game/sections/:id - Update a section (admin)
DELETE /api/game/sections/:id - Delete a section (admin)
GET /api/game/sections/:id/content - Get content for a section
```

## User Progress

```
GET /api/game/progress - Get user's overall progress
GET /api/game/progress/:moduleId - Get user's progress for a specific module
POST /api/game/progress/:sectionId/checkpoint - Record a section checkpoint
PUT /api/game/progress/:moduleId/complete - Mark a module as complete
GET /api/game/progress/rewards - Get user's reward information
```

## Quiz System

```
GET /api/game/quiz/:sectionId - Get quiz questions for a section
POST /api/game/quiz/:questionId/answer - Submit an answer
GET /api/game/quiz/:sectionId/results - Get quiz results for a section
```

## Media Management

```
POST /api/game/media - Upload a new media asset
GET /api/game/media - List media assets
DELETE /api/game/media/:id - Delete a media asset
```

## Rewards System

```
POST /api/game/rewards/:moduleId/claim - Claim rewards for completed module
GET /api/game/rewards/transactions - Get reward transaction history
```

## Module Unlock Management

```
GET /api/game/unlocks - Get user's upcoming module unlocks
GET /api/game/unlocks/:moduleId - Get unlock status for a specific module
POST /api/game/unlocks/:moduleId/expedite - Pay to skip waiting period (optional feature)
```

## Section Unlock Management

```
GET /api/game/section-unlocks - Get user's upcoming section unlocks
GET /api/game/section-unlocks/:sectionId - Get unlock status for a specific section
POST /api/game/section-unlocks/:sectionId/expedite - Pay to skip section waiting period
```

## Example Request/Response Formats

### Module List Response

```json
{
  "modules": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Introduction to Blockchain",
      "description": "Learn the basics of blockchain technology",
      "orderIndex": 1,
      "isActive": true,
      "timeToComplete": 30,
      "waitTimeHours": 24,
      "rewardAmount": "10.00000000",
      "prerequisiteModuleId": null,
      "progress": {
        "isStarted": true,
        "isCompleted": false,
        "percentComplete": 40,
        "sectionsCompleted": 2,
        "totalSections": 5
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Smart Contracts",
      "description": "Understanding smart contracts and their applications",
      "orderIndex": 2,
      "isActive": true,
      "timeToComplete": 45,
      "waitTimeHours": 48,
      "rewardAmount": "15.00000000",
      "prerequisiteModuleId": "550e8400-e29b-41d4-a716-446655440000",
      "progress": {
        "isStarted": false,
        "isCompleted": false,
        "percentComplete": 0,
        "sectionsCompleted": 0,
        "totalSections": 6
      },
      "unlockStatus": {
        "isUnlocked": false,
        "unlockDate": "2025-05-15T14:30:00Z",
        "timeRemaining": {
          "days": 2,
          "hours": 8,
          "minutes": 15
        }
      }
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

### Section Detail Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "moduleId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "What is a Blockchain?",
  "sectionType": "text-image",
  "orderIndex": 1,
  "backgroundType": "galaxy",
  "configuration": {
    "textPosition": "left",
    "imageSize": "medium",
    "showProgressBar": true
  },
  "content": [
    {
      "id": "content-1",
      "contentType": "heading",
      "content": {
        "text": "Understanding Blockchain Technology",
        "level": 1
      },
      "orderIndex": 1
    },
    {
      "id": "content-2",
      "contentType": "text",
      "content": {
        "text": "A blockchain is a distributed ledger technology that records transactions across many computers..."
      },
      "orderIndex": 2
    },
    {
      "id": "content-3",
      "contentType": "image",
      "content": {
        "src": "/media/blockchain-diagram.png",
        "alt": "Blockchain diagram",
        "caption": "Figure 1: How blockchain works"
      },
      "orderIndex": 3
    }
  ],
  "checkpoint": {
    "isCompleted": false,
    "timeSpent": 0
  },
  "quiz": {
    "hasQuiz": true,
    "questionCount": 3,
    "userCompleted": false,
    "userScore": null
  }
}
```

### Checkpoint Request

```json
{
  "timeSpent": 320,
  "responses": {
    "interactive-1": true,
    "interactive-2": ["option-2", "option-4"],
    "interactive-3": "user text response"
  },
  "progress": 100
}
```

### Quiz Answer Request

```json
{
  "answer": "option-2",
  "timeSpent": 45
}
```

### Quiz Results Response

```json
{
  "quizId": "550e8400-e29b-41d4-a716-446655440050",
  "sectionId": "550e8400-e29b-41d4-a716-446655440010",
  "totalQuestions": 5,
  "correctAnswers": 4,
  "score": 80,
  "timeTaken": 180,
  "isPassed": true,
  "passingScore": 60,
  "questions": [
    {
      "id": "q1",
      "questionText": "What is the main advantage of blockchain?",
      "userAnswer": "option-2",
      "correctAnswer": "option-2",
      "isCorrect": true,
      "explanation": "Blockchain's main advantage is its decentralized nature, removing the need for a central authority."
    }
  ]
}
```

### Module Unlock Status Response

```json
{
  "moduleId": "550e8400-e29b-41d4-a716-446655440001",
  "moduleTitle": "Smart Contracts",
  "canAccess": false,
  "reason": "WAITING_PERIOD",
  "unlockDate": "2025-05-15T14:30:00Z",
  "timeRemaining": {
    "days": 2,
    "hours": 8,
    "minutes": 15,
    "seconds": 30
  },
  "prerequisiteModuleId": "550e8400-e29b-41d4-a716-446655440000",
  "prerequisiteModuleComplete": true,
  "expediteOptions": {
    "canExpedite": true,
    "expediteCost": "5.00000000",
    "expediteCurrency": "SHAHI"
  }
}
```

### Reward Claim Response

```json
{
  "success": true,
  "moduleId": "550e8400-e29b-41d4-a716-446655440000",
  "moduleTitle": "Introduction to Blockchain",
  "rewardAmount": "10.00000000",
  "transaction": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "status": "pending",
    "estimatedCompletionTime": "2025-05-03T15:30:00Z"
  },
  "nextModule": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Smart Contracts",
    "unlockDate": "2025-05-05T14:30:00Z",
    "waitTimeHours": 48
  }
}
```

## Authentication Requirements

All API endpoints require JWT authentication except where noted. Administrators require special permissions for admin-only endpoints.

## Error Handling

All API endpoints return standard error responses with appropriate HTTP status codes:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "answer",
      "message": "Answer must be one of the provided options"
    }
  ]
}
```

Common HTTP status codes:
- 200: Success
- 201: Resource created
- 400: Bad request / Validation error
- 401: Unauthorized
- 403: Forbidden (insufficient permissions)
- 404: Resource not found
- 409: Conflict
- 500: Server error

## Rate Limiting

API endpoints are subject to rate limiting:
- Standard endpoints: 60 requests per minute
- Media upload endpoints: 10 uploads per minute

## API Versioning

The API uses versioning through the URL path: `/api/v1/game/...`

The current document describes v1 of the API.