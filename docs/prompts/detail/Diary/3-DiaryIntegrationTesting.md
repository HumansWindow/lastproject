# Diary System Integration & Testing Guide

This document provides guidance for integrating the backend and frontend components of the diary system and thoroughly testing the implementation.

## Integration Strategy

### API Integration

1. **Base URL Configuration**

   Set up the API base URL in the frontend environment configuration:

   ```typescript
   // frontend/.env.development
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

   ```typescript
   // frontend/.env.production
   NEXT_PUBLIC_API_BASE_URL=/api
   ```

   Configure the API client to use this base URL:

   ```typescript
   // src/services/api.ts
   import axios from 'axios';

   const apiClient = axios.create({
     baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
     headers: {
       'Content-Type': 'application/json',
     },
   });

   // Add request interceptor for authentication
   apiClient.interceptors.request.use((config) => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   // Add response interceptor for error handling
   apiClient.interceptors.response.use(
     (response) => response,
     (error) => {
       // Handle common errors (401, 403, etc.)
       if (error.response?.status === 401) {
         // Redirect to login
         window.location.href = '/login';
       }
       return Promise.reject(error);
     }
   );

   export default apiClient;
   ```

2. **API Service Implementation**

   Use the configured API client for the diary service:

   ```typescript
   // src/services/diaryApi.ts
   import apiClient from './api';
   import { DiaryEntry, DiaryReminder } from '../features/diary/types';

   export const diaryApi = {
     getEntries: (filters = {}) => {
       return apiClient.get('/diary/entries', { params: filters });
     },
     // Other API methods...
   };
   ```

### Backend-Frontend Coordination

1. **Type Sharing**

   Set up shared types between backend and frontend to ensure consistency:

   ```typescript
   // shared/types/diary.ts
   export enum DiaryPrivacyLevel {
     PRIVATE = 'private',
     FRIENDS = 'friends',
     PUBLIC = 'public',
   }

   export interface DiaryEntryBase {
     title: string;
     content: string;
     mediaUrls?: string[];
     tags?: string[];
     privacyLevel: DiaryPrivacyLevel;
     mood?: string;
     location?: {
       latitude: number;
       longitude: number;
       name: string;
     };
   }

   export interface DiaryEntry extends DiaryEntryBase {
     id: string;
     userId: string;
     createdAt: string;
     updatedAt: string;
     isDeleted: boolean;
     deletedAt?: string;
   }
   ```

2. **API Documentation**

   Create an API documentation file that both teams can reference:

   ```markdown
   # Diary API Documentation

   ## Endpoints

   ### GET /api/diary/entries
   Returns a list of diary entries for the currently authenticated user.

   **Query Parameters:**
   - searchTerm (string, optional): Search term to filter by title or content
   - tags (string[], optional): Tags to filter by
   - startDate (ISO date string, optional): Start date for filtering
   - endDate (ISO date string, optional): End date for filtering
   - privacyLevel (string, optional): Privacy level filter
   - mood (string, optional): Mood filter

   **Response:**
   Array of DiaryEntry objects

   ### Other endpoints...
   ```

## End-to-End Testing Setup

### Setting up Cypress for E2E Tests

1. **Install Cypress**:

   ```bash
   cd frontend
   npm install cypress @testing-library/cypress --save-dev
   ```

2. **Configure Cypress**:

   ```javascript
   // cypress.config.js
   const { defineConfig } = require('cypress');

   module.exports = defineConfig({
     e2e: {
       baseUrl: 'http://localhost:3000',
       setupNodeEvents(on, config) {
         // implement node event listeners here
       },
     },
     env: {
       apiUrl: 'http://localhost:3001',
     },
   });
   ```

3. **Create test fixtures**:

   ```json
   // cypress/fixtures/diary-entries.json
   [
     {
       "id": "1",
       "title": "Test Diary Entry",
       "content": "This is a test diary entry content.",
       "mediaUrls": [],
       "tags": ["test", "cypress"],
       "privacyLevel": "private",
       "createdAt": "2025-05-15T10:00:00.000Z",
       "updatedAt": "2025-05-15T10:00:00.000Z",
       "isDeleted": false,
       "mood": "happy"
     }
   ]
   ```

### Sample End-to-End Tests

1. **Diary Entry Creation Test**:

   ```javascript
   // cypress/e2e/diary/create-entry.spec.js
   describe('Diary Entry Creation', () => {
     beforeEach(() => {
       // Login and navigate to diary page
       cy.login('testuser@example.com', 'password');
       cy.visit('/diary/entries');
     });

     it('should create a new diary entry', () => {
       // Click the new entry button
       cy.findByRole('button', { name: /new entry/i }).click();
       
       // Fill out the form
       cy.findByLabelText(/title/i).type('My Test Diary Entry');
       
       // Type in rich text editor
       cy.get('.rich-text-editor').find('div[contenteditable=true]')
         .type('This is the content of my test diary entry.');
       
       // Select a mood
       cy.findByLabelText(/mood/i).click();
       cy.findByText('Happy').click();
       
       // Add tags
       cy.findByLabelText(/tags/i).type('test{enter}');
       
       // Set privacy
       cy.findByLabelText(/privacy/i).click();
       cy.findByText('Private').click();
       
       // Submit the form
       cy.findByRole('button', { name: /create entry/i }).click();
       
       // Verify we're redirected to the entries page
       cy.url().should('include', '/diary/entries');
       
       // Verify the new entry appears in the list
       cy.findByText('My Test Diary Entry').should('exist');
     });
   });
   ```

2. **Diary Entry Filtering Test**:

   ```javascript
   // cypress/e2e/diary/filter-entries.spec.js
   describe('Diary Entry Filtering', () => {
     beforeEach(() => {
       // Login
       cy.login('testuser@example.com', 'password');
       
       // Seed test data through API
       cy.request({
         method: 'POST',
         url: `${Cypress.env('apiUrl')}/testing/seed-diary`,
         headers: {
           Authorization: `Bearer ${localStorage.getItem('token')}`,
         },
       });
       
       // Visit diary page
       cy.visit('/diary/entries');
     });

     it('should filter entries by search term', () => {
       cy.findByPlaceholderText(/search/i).type('holiday');
       cy.findByRole('button', { name: /search/i }).click();
       
       // Verify filtered results
       cy.findByText('My Holiday Adventure').should('exist');
       cy.findByText('Work Meeting Notes').should('not.exist');
     });

     it('should filter entries by date range', () => {
       // Open date picker
       cy.findByLabelText(/start date/i).click();
       // Select date (implementation depends on date picker component)
       // ...
       
       cy.findByLabelText(/end date/i).click();
       // Select date
       // ...
       
       cy.findByRole('button', { name: /apply filters/i }).click();
       
       // Verify filtered results
       // ...
     });

     it('should filter entries by tags', () => {
       cy.findByLabelText(/tags/i).click();
       cy.findByText('family').click();
       
       cy.findByRole('button', { name: /apply filters/i }).click();
       
       // Verify only entries with "family" tag are shown
       // ...
     });

     it('should clear filters', () => {
       // Apply some filters first
       cy.findByPlaceholderText(/search/i).type('test');
       cy.findByRole('button', { name: /search/i }).click();
       
       // Clear filters
       cy.findByRole('button', { name: /clear filters/i }).click();
       
       // Verify all entries are shown
       // ...
     });
   });
   ```

## Unit Testing

### Backend Unit Tests

1. **Diary Service Tests**:

   ```typescript
   // src/modules/diary/tests/diary.service.spec.ts
   import { Test, TestingModule } from '@nestjs/testing';
   import { getRepositoryToken } from '@nestjs/typeorm';
   import { Repository } from 'typeorm';
   import { DiaryService } from '../diary.service';
   import { DiaryEntry, DiaryPrivacyLevel } from '../entities/diary-entry.entity';
   import { DiaryReminder } from '../entities/diary-reminder.entity';
   import { NotificationsService } from '../../notifications/notifications.service';
   import { NotFoundException, ForbiddenException } from '@nestjs/common';

   const mockDiaryRepository = () => ({
     create: jest.fn(),
     save: jest.fn(),
     findOne: jest.fn(),
     find: jest.fn(),
     createQueryBuilder: jest.fn(() => ({
       where: jest.fn().mockReturnThis(),
       andWhere: jest.fn().mockReturnThis(),
       orderBy: jest.fn().mockReturnThis(),
       getMany: jest.fn(),
       select: jest.fn().mockReturnThis(),
       addSelect: jest.fn().mockReturnThis(),
       groupBy: jest.fn().mockReturnThis(),
       getRawMany: jest.fn(),
     })),
     update: jest.fn(),
     count: jest.fn(),
   });

   const mockReminderRepository = () => ({
     create: jest.fn(),
     save: jest.fn(),
     find: jest.fn(),
     findOne: jest.fn(),
     delete: jest.fn(),
   });

   const mockNotificationsService = () => ({
     sendNotification: jest.fn(),
   });

   describe('DiaryService', () => {
     let service: DiaryService;
     let entryRepository: Repository<DiaryEntry>;
     let reminderRepository: Repository<DiaryReminder>;

     beforeEach(async () => {
       const module: TestingModule = await Test.createTestingModule({
         providers: [
           DiaryService,
           {
             provide: getRepositoryToken(DiaryEntry),
             useFactory: mockDiaryRepository,
           },
           {
             provide: getRepositoryToken(DiaryReminder),
             useFactory: mockReminderRepository,
           },
           {
             provide: NotificationsService,
             useFactory: mockNotificationsService,
           },
         ],
       }).compile();

       service = module.get<DiaryService>(DiaryService);
       entryRepository = module.get(getRepositoryToken(DiaryEntry));
       reminderRepository = module.get(getRepositoryToken(DiaryReminder));
     });

     it('should be defined', () => {
       expect(service).toBeDefined();
     });

     describe('createEntry', () => {
       it('should create a diary entry', async () => {
         const userId = 'user-id';
         const createEntryDto = {
           title: 'Test Entry',
           content: 'Test content',
           privacyLevel: DiaryPrivacyLevel.PRIVATE,
         };
         
         const newEntry = {
           id: 'entry-id',
           ...createEntryDto,
           userId,
           createdAt: new Date(),
           updatedAt: new Date(),
         };
         
         (entryRepository.create as jest.Mock).mockReturnValue(newEntry);
         (entryRepository.save as jest.Mock).mockResolvedValue(newEntry);
         
         const result = await service.createEntry(userId, createEntryDto);
         
         expect(entryRepository.create).toHaveBeenCalledWith({
           ...createEntryDto,
           userId,
         });
         expect(entryRepository.save).toHaveBeenCalledWith(newEntry);
         expect(result).toEqual(newEntry);
       });
     });

     // Additional test cases for other methods
     // findAllEntries, findEntryById, updateEntry, deleteEntry, etc.
   });
   ```

2. **Diary Controller Tests**:

   ```typescript
   // src/modules/diary/tests/diary.controller.spec.ts
   import { Test, TestingModule } from '@nestjs/testing';
   import { DiaryController } from '../diary.controller';
   import { DiaryService } from '../diary.service';
   import { DiaryEntry, DiaryPrivacyLevel } from '../entities/diary-entry.entity';
   import { CreateDiaryEntryDto } from '../dto/create-diary-entry.dto';
   import { FilterDiaryEntriesDto } from '../dto/filter-diary-entries.dto';

   // Mock the DiaryService
   const mockDiaryService = () => ({
     createEntry: jest.fn(),
     findAllEntries: jest.fn(),
     findEntryById: jest.fn(),
     updateEntry: jest.fn(),
     deleteEntry: jest.fn(),
     setReminder: jest.fn(),
     getUserReminders: jest.fn(),
     toggleReminder: jest.fn(),
     deleteReminder: jest.fn(),
     getDiaryStats: jest.fn(),
   });

   describe('DiaryController', () => {
     let controller: DiaryController;
     let service: DiaryService;

     beforeEach(async () => {
       const module: TestingModule = await Test.createTestingModule({
         controllers: [DiaryController],
         providers: [
           {
             provide: DiaryService,
             useFactory: mockDiaryService,
           },
         ],
       }).compile();

       controller = module.get<DiaryController>(DiaryController);
       service = module.get<DiaryService>(DiaryService);
     });

     it('should be defined', () => {
       expect(controller).toBeDefined();
     });

     describe('createEntry', () => {
       it('should create a diary entry', async () => {
         const userId = 'user-id';
         const req = { user: { id: userId } };
         
         const createEntryDto: CreateDiaryEntryDto = {
           title: 'Test Entry',
           content: 'Test content',
           privacyLevel: DiaryPrivacyLevel.PRIVATE,
         };
         
         const expected = { 
           id: 'entry-id', 
           ...createEntryDto, 
           userId,
           createdAt: new Date(),
           updatedAt: new Date(),
         };
         
         (service.createEntry as jest.Mock).mockResolvedValue(expected);
         
         const result = await controller.createEntry(req, createEntryDto);
         
         expect(service.createEntry).toHaveBeenCalledWith(userId, createEntryDto);
         expect(result).toEqual(expected);
       });
     });

     // Additional test cases for other controller methods
   });
   ```

### Frontend Unit Tests

1. **Redux Slice Tests**:

   ```typescript
   // src/features/diary/tests/diarySlice.test.ts
   import configureMockStore from 'redux-mock-store';
   import thunk from 'redux-thunk';
   import diaryReducer, {
     fetchEntries,
     fetchEntryById,
     createEntry,
     updateEntry,
     deleteEntry,
     setFilters,
     clearFilters,
   } from '../diarySlice';
   import { diaryApi } from '../../../services/diaryApi';

   // Mock the API service
   jest.mock('../../../services/diaryApi');

   const middlewares = [thunk];
   const mockStore = configureMockStore(middlewares);

   describe('diary reducer', () => {
     const initialState = {
       entries: [],
       currentEntry: null,
       reminders: [],
       stats: null,
       filters: {
         searchTerm: '',
         tags: [],
         startDate: null,
         endDate: null,
         privacyLevel: null,
         mood: null,
       },
       loading: {
         entries: false,
         currentEntry: false,
         create: false,
         update: false,
         delete: false,
         reminders: false,
         stats: false,
       },
       error: {
         entries: null,
         currentEntry: null,
         create: null,
         update: null,
         delete: null,
         reminders: null,
         stats: null,
       },
     };

     it('should handle initial state', () => {
       expect(diaryReducer(undefined, { type: 'unknown' })).toEqual(initialState);
     });

     it('should handle setFilters', () => {
       const filters = { searchTerm: 'test', tags: ['tag1'] };
       const expected = {
         ...initialState,
         filters: {
           ...initialState.filters,
           ...filters,
         },
       };
       
       expect(diaryReducer(initialState, setFilters(filters))).toEqual(expected);
     });

     it('should handle clearFilters', () => {
       const startState = {
         ...initialState,
         filters: {
           searchTerm: 'test',
           tags: ['tag1'],
           startDate: '2025-01-01',
           endDate: null,
           privacyLevel: null,
           mood: 'happy',
         },
       };
       
       expect(diaryReducer(startState, clearFilters())).toEqual(initialState);
     });

     // Add more tests for async thunks
   });

   describe('diary async actions', () => {
     beforeEach(() => {
       jest.clearAllMocks();
     });

     it('should fetch entries successfully', async () => {
       const entries = [{ id: '1', title: 'Test Entry' }];
       (diaryApi.getEntries as jest.Mock).mockResolvedValue({ data: entries });
       
       const expectedActions = [
         { type: fetchEntries.pending.type, meta: expect.any(Object) },
         {
           type: fetchEntries.fulfilled.type,
           payload: entries,
           meta: expect.any(Object),
         },
       ];
       
       const store = mockStore(initialState);
       await store.dispatch(fetchEntries({}));
       
       expect(store.getActions()).toEqual(expectedActions);
     });

     // Add tests for other async actions
   });
   ```

2. **Component Tests**:

   ```typescript
   // src/features/diary/components/tests/DiaryEntryCard.test.tsx
   import React from 'react';
   import { render, screen, fireEvent } from '@testing-library/react';
   import { DiaryEntryCard } from '../DiaryEntryCard';
   import { DiaryPrivacyLevel } from '../../types';
   import { Provider } from 'react-redux';
   import configureMockStore from 'redux-mock-store';
   import thunk from 'redux-thunk';
   import { MemoryRouter } from 'react-router-dom';

   const middlewares = [thunk];
   const mockStore = configureMockStore(middlewares);

   // Mock navigator confirm
   window.confirm = jest.fn();

   describe('DiaryEntryCard', () => {
     const mockEntry = {
       id: '1',
       title: 'Test Entry',
       content: 'This is test content',
       privacyLevel: DiaryPrivacyLevel.PRIVATE,
       userId: 'user-1',
       createdAt: '2025-05-10T12:00:00.000Z',
       updatedAt: '2025-05-10T12:00:00.000Z',
       isDeleted: false,
       tags: ['test', 'diary'],
       mood: 'happy',
     };
     
     let store;
     
     beforeEach(() => {
       store = mockStore({});
       store.dispatch = jest.fn();
     });

     it('renders the diary entry card correctly', () => {
       render(
         <Provider store={store}>
           <MemoryRouter>
             <DiaryEntryCard entry={mockEntry} />
           </MemoryRouter>
         </Provider>
       );
       
       expect(screen.getByText('Test Entry')).toBeInTheDocument();
       expect(screen.getByText(/This is test content/)).toBeInTheDocument();
       expect(screen.getByText('test')).toBeInTheDocument();
       expect(screen.getByText('diary')).toBeInTheDocument();
     });

     it('calls delete entry when delete button is clicked and confirmed', () => {
       (window.confirm as jest.Mock).mockReturnValueOnce(true);
       
       render(
         <Provider store={store}>
           <MemoryRouter>
             <DiaryEntryCard entry={mockEntry} />
           </MemoryRouter>
         </Provider>
       );
       
       const deleteButton = screen.getByLabelText('delete');
       fireEvent.click(deleteButton);
       
       expect(window.confirm).toHaveBeenCalled();
       expect(store.dispatch).toHaveBeenCalledWith(expect.any(Function));
     });

     // Add more tests for component functionality
   });
   ```

## Integration Testing

### API Integration Tests

1. **Setup**:

   ```typescript
   // test/diary.e2e-spec.ts
   import { Test, TestingModule } from '@nestjs/testing';
   import { INestApplication } from '@nestjs/common';
   import * as request from 'supertest';
   import { AppModule } from '../src/app.module';
   import { getConnection } from 'typeorm';
   import { DiaryPrivacyLevel } from '../src/modules/diary/entities/diary-entry.entity';
   import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

   // Mock JWT guard to allow testing protected routes
   class MockJwtAuthGuard {
     canActivate(context) {
       const req = context.switchToHttp().getRequest();
       req.user = { id: 'test-user-id' };
       return true;
     }
   }

   describe('Diary (e2e)', () => {
     let app: INestApplication;
     let createdEntryId: string;

     beforeAll(async () => {
       const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule],
       })
         .overrideGuard(JwtAuthGuard)
         .useClass(MockJwtAuthGuard)
         .compile();

       app = moduleFixture.createNestApplication();
       await app.init();
       
       // Clear test database
       const entities = getConnection().entityMetadatas;
       for (const entity of entities) {
         const repository = getConnection().getRepository(entity.name);
         await repository.clear();
       }
     });

     afterAll(async () => {
       await app.close();
     });

     it('POST /diary/entries - Create diary entry', () => {
       return request(app.getHttpServer())
         .post('/diary/entries')
         .send({
           title: 'Test Diary Entry',
           content: 'This is a test diary entry',
           privacyLevel: DiaryPrivacyLevel.PRIVATE,
           tags: ['test', 'e2e'],
           mood: 'curious',
         })
         .expect(201)
         .then(res => {
           expect(res.body).toHaveProperty('id');
           expect(res.body.title).toBe('Test Diary Entry');
           expect(res.body.userId).toBe('test-user-id');
           createdEntryId = res.body.id;
         });
     });

     it('GET /diary/entries - Get all entries', () => {
       return request(app.getHttpServer())
         .get('/diary/entries')
         .expect(200)
         .then(res => {
           expect(Array.isArray(res.body)).toBe(true);
           expect(res.body.length).toBe(1);
           expect(res.body[0].title).toBe('Test Diary Entry');
         });
     });

     it('GET /diary/entries/:id - Get entry by ID', () => {
       return request(app.getHttpServer())
         .get(`/diary/entries/${createdEntryId}`)
         .expect(200)
         .then(res => {
           expect(res.body.id).toBe(createdEntryId);
           expect(res.body.title).toBe('Test Diary Entry');
         });
     });

     it('PUT /diary/entries/:id - Update entry', () => {
       return request(app.getHttpServer())
         .put(`/diary/entries/${createdEntryId}`)
         .send({
           title: 'Updated Test Entry',
         })
         .expect(200)
         .then(res => {
           expect(res.body.id).toBe(createdEntryId);
           expect(res.body.title).toBe('Updated Test Entry');
           expect(res.body.content).toBe('This is a test diary entry');
         });
     });

     it('DELETE /diary/entries/:id - Delete entry', () => {
       return request(app.getHttpServer())
         .delete(`/diary/entries/${createdEntryId}`)
         .expect(200);
     });

     it('GET /diary/entries - Verify deleted entry is not returned', () => {
       return request(app.getHttpServer())
         .get('/diary/entries')
         .expect(200)
         .then(res => {
           expect(Array.isArray(res.body)).toBe(true);
           expect(res.body.length).toBe(0);
         });
     });

     // Additional tests for reminders, stats, etc.
   });
   ```

## Performance Testing

### Backend Performance Tests

1. **Artillery Load Tests**:

   ```yaml
   # diary-load-test.yml
   config:
     target: "http://localhost:3001"
     phases:
       - duration: 60
         arrivalRate: 5
         rampTo: 20
         name: "Warm up phase"
       - duration: 120
         arrivalRate: 20
         rampTo: 50
         name: "Peak load phase"
     defaults:
       headers:
         Authorization: "Bearer {{ token }}"
     variables:
       token: "test-token"  # Replace with actual JWT for testing

   scenarios:
     - name: "Diary entry workflows"
       flow:
         - post:
             url: "/diary/entries"
             json:
               title: "Performance Test Entry"
               content: "This is a performance test entry."
               privacyLevel: "private"
             capture:
               - json: "$.id"
                 as: "entryId"
             expect:
               - statusCode: 201
         
         - get:
             url: "/diary/entries"
             expect:
               - statusCode: 200
         
         - get:
             url: "/diary/entries/{{ entryId }}"
             expect:
               - statusCode: 200
         
         - put:
             url: "/diary/entries/{{ entryId }}"
             json:
               title: "Updated Performance Test Entry"
             expect:
               - statusCode: 200
         
         - get:
             url: "/diary/stats"
             expect:
               - statusCode: 200
   ```

## Security Testing

### Security Checks

1. **User Authentication & Authorization**:

   ```typescript
   // test/diary-security.e2e-spec.ts
   import { Test, TestingModule } from '@nestjs/testing';
   import { INestApplication } from '@nestjs/common';
   import * as request from 'supertest';
   import { AppModule } from '../src/app.module';
   import { JwtService } from '@nestjs/jwt';

   describe('Diary Security (e2e)', () => {
     let app: INestApplication;
     let jwtService: JwtService;
     let validToken: string;
     let otherUserToken: string;
     let createdEntryId: string;

     beforeAll(async () => {
       const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule],
       }).compile();

       app = moduleFixture.createNestApplication();
       await app.init();
       
       jwtService = app.get<JwtService>(JwtService);
       validToken = jwtService.sign({ sub: 'test-user-id' });
       otherUserToken = jwtService.sign({ sub: 'other-user-id' });
       
       // Create a test entry
       const response = await request(app.getHttpServer())
         .post('/diary/entries')
         .set('Authorization', `Bearer ${validToken}`)
         .send({
           title: 'Security Test Entry',
           content: 'This is a security test entry',
           privacyLevel: 'private',
         });
       
       createdEntryId = response.body.id;
     });

     afterAll(async () => {
       await app.close();
     });

     it('should reject requests without authentication', () => {
       return request(app.getHttpServer())
         .get('/diary/entries')
         .expect(401);
     });

     it('should reject entry access from unauthorized user', () => {
       return request(app.getHttpServer())
         .get(`/diary/entries/${createdEntryId}`)
         .set('Authorization', `Bearer ${otherUserToken}`)
         .expect(403);
     });

     it('should reject entry update from unauthorized user', () => {
       return request(app.getHttpServer())
         .put(`/diary/entries/${createdEntryId}`)
         .set('Authorization', `Bearer ${otherUserToken}`)
         .send({
           title: 'Hacked Entry',
         })
         .expect(403);
     });

     it('should reject entry deletion from unauthorized user', () => {
       return request(app.getHttpServer())
         .delete(`/diary/entries/${createdEntryId}`)
         .set('Authorization', `Bearer ${otherUserToken}`)
         .expect(403);
     });
   });
   ```

2. **XSS Protection Tests**:

   ```typescript
   // test/diary-xss.e2e-spec.ts
   import { Test, TestingModule } from '@nestjs/testing';
   import { INestApplication } from '@nestjs/common';
   import * as request from 'supertest';
   import { AppModule } from '../src/app.module';
   import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

   class MockJwtAuthGuard {
     canActivate(context) {
       const req = context.switchToHttp().getRequest();
       req.user = { id: 'test-user-id' };
       return true;
     }
   }

   describe('Diary XSS Protection (e2e)', () => {
     let app: INestApplication;

     beforeAll(async () => {
       const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule],
       })
         .overrideGuard(JwtAuthGuard)
         .useClass(MockJwtAuthGuard)
         .compile();

       app = moduleFixture.createNestApplication();
       await app.init();
     });

     afterAll(async () => {
       await app.close();
     });

     it('should sanitize script tags in diary entry content', async () => {
       const xssPayload = '<script>alert("XSS");</script>Hello world';
       
       const response = await request(app.getHttpServer())
         .post('/diary/entries')
         .send({
           title: 'XSS Test Entry',
           content: xssPayload,
           privacyLevel: 'private',
         })
         .expect(201);
       
       const entryId = response.body.id;
       
       // Verify content was sanitized
       const getResponse = await request(app.getHttpServer())
         .get(`/diary/entries/${entryId}`)
         .expect(200);
       
       // Ensure script tag was removed or escaped
       expect(getResponse.body.content).not.toContain('<script>');
     });

     // Additional XSS tests for other fields
   });
   ```

## Implementation Checklist

- [ ] Set up backend-frontend integration
- [ ] Configure shared types and interfaces
- [ ] Implement API client with proper error handling
- [ ] Create integration tests for API endpoints
- [ ] Set up end-to-end testing with Cypress
- [ ] Implement unit tests for backend services
- [ ] Create unit tests for frontend components
- [ ] Set up security testing
- [ ] Implement performance tests
- [ ] Document integration points and APIs

## Best Practices

1. **Integration Strategy**:
   - Use shared type definitions between backend and frontend
   - Implement proper error handling in API client
   - Use environment-specific configuration
   - Document API endpoints comprehensively

2. **Testing Strategy**:
   - Maintain high test coverage on both backend and frontend
   - Implement various test types (unit, integration, e2e)
   - Test edge cases and error conditions
   - Include security-focused tests
   - Perform load testing for performance-sensitive endpoints

3. **Security Considerations**:
   - Validate all input on both client and server
   - Implement proper authentication and authorization checks
   - Sanitize content to prevent XSS attacks
   - Use CSRF protection for forms
   - Implement rate limiting for API endpoints