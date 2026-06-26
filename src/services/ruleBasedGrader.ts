import type { GradingInput, GradingOutput, GradingProvider } from "./gradingProvider";

function normalize(value: string, settings: GradingInput["settings"]) {
  let next = value.trim();
  if (settings?.ignoreWhitespace) next = next.replace(/\s+/g, "");
  if (settings?.ignoreCase) next = next.toLowerCase();
  return next;
}

function numericMatch(studentAnswer: string, answerKey: string, tolerance = 0) {
  const studentNumber = Number(studentAnswer.replace(/[^0-9.+-]/g, ""));
  const answerNumber = Number(answerKey.replace(/[^0-9.+-]/g, ""));
  if (!Number.isFinite(studentNumber) || !Number.isFinite(answerNumber)) return false;
  return Math.abs(studentNumber - answerNumber) <= tolerance;
}

export class RuleBasedGrader implements GradingProvider {
  async grade(input: GradingInput): Promise<GradingOutput> {
    const keys = Array.isArray(input.answerKey) ? input.answerKey : input.answerKey ? [input.answerKey] : [];
    const normalizedAnswer = normalize(input.studentAnswer, input.settings);
    const isCorrect = keys.some((key) => {
      if (input.questionType === "numeric") return numericMatch(input.studentAnswer, key, input.settings?.numericTolerance ?? 0);
      return normalize(key, input.settings) === normalizedAnswer;
    });

    return {
      mode: "rule_based",
      score: isCorrect ? input.maxScore : 0,
      maxScore: input.maxScore,
      isCorrect,
      feedback: isCorrect ? "정답입니다." : "답안을 다시 확인해 보세요.",
      requiresTeacherReview: false,
      misconceptionTags: [],
    };
  }
}

export const ruleBasedGrader = new RuleBasedGrader();
