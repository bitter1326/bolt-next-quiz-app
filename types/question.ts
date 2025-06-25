export interface Question {
  id: string;
  type: 'multiple_choice' | 'descriptive';
  question: string;
  options: string[];
  correctAnswer: number | null;
  correctAnswerText: string | null;
  explanation: string;
  keywords: string[];
}

export interface QuestionSet {
  id: string;
  title: string;
  genre: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  createdAt: Date;
  userId: string;
  totalQuestions: number;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer?: number;
  textAnswer?: string;
  isCorrect: boolean;
  score: number;
  keywordMatches?: string[];
}

export interface QuizResult {
  id: string;
  questionSetId: string;
  userId: string;
  answers: UserAnswer[];
  totalScore: number;
  maxScore: number;
  completedAt: Date;
  timeSpent: number;
}

export interface User {
  uid: string;
  email: string;
  monthlyPromptCount: number;
  lastResetDate: Date;
}