/**
 * Quiz Entity Compatibility Layer
 * 
 * This file re-exports quiz entities to maintain backward compatibility
 * with code that imports from the old structure.
 */

import { Quiz } from './quiz/quiz.entity';
import { QuizQuestion } from './quiz/quiz-question.entity';
import { QuizSession } from './quiz/quiz-session.entity';
import { UserQuizResponse } from './quiz/user-quiz-response.entity';

export {
  Quiz,
  QuizQuestion,
  QuizSession,
  UserQuizResponse
};