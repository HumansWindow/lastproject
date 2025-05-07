/**
 * Quiz Entities Compatibility Layer
 * 
 * This file re-exports the modern quiz entities to maintain compatibility
 * with code that still imports the legacy quiz entities directly.
 * 
 * This allows for a smoother transition from legacy to modern quiz entity structure.
 */

// Re-export the new quiz entities
export { Quiz } from './quiz/quiz.entity';
export { QuizQuestion } from './quiz/quiz-question.entity';
export { QuizSession } from './quiz/quiz-session.entity';
export { UserQuizResponse } from './quiz/user-quiz-response.entity';

// For backward compatibility with the old quiz response entity
export { UserQuizResponse as QuizResponse } from './quiz/user-quiz-response.entity';