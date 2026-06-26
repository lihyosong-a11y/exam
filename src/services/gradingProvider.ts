import type { QuestionType } from "../types/domain";

export type GradingMode = "rule_based" | "ai_rubric" | "teacher_review";

export interface GradingInput {
  questionId: string;
  questionType: QuestionType;
  studentAnswer: string;
  maxScore: number;
  answerKey?: string | string[];
  settings?: {
    ignoreWhitespace?: boolean;
    ignoreCase?: boolean;
    numericTolerance?: number;
    allowUnits?: boolean;
  };
}

export interface GradingOutput {
  mode: GradingMode;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  feedback: string;
  requiresTeacherReview: boolean;
  misconceptionTags: string[];
}

export interface GradingProvider {
  grade(input: GradingInput): Promise<GradingOutput>;
}
