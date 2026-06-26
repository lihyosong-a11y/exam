import type { GradingInput, GradingOutput, GradingProvider } from "./gradingProvider";

export class AiRubricGrader implements GradingProvider {
  async grade(input: GradingInput): Promise<GradingOutput> {
    return {
      mode: "teacher_review",
      score: 0,
      maxScore: input.maxScore,
      isCorrect: false,
      feedback: "AI 채점은 Supabase Edge Function에서만 실행됩니다. API key가 없으면 교사 검토 대기로 처리합니다.",
      requiresTeacherReview: true,
      misconceptionTags: [],
    };
  }
}

export const aiRubricGrader = new AiRubricGrader();
