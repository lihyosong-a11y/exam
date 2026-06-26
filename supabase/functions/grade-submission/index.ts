import { z } from "https://esm.sh/zod@3.23.8";
import { requireProfile, writeAudit } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const schema = z.object({
  submission_id: z.string().uuid(),
});

const aiOutputSchema = z.object({
  score: z.number().min(0),
  max_score: z.number().positive(),
  is_correct: z.boolean(),
  feedback: z.string().max(5000),
  strengths: z.array(z.string()).default([]),
  improvement_points: z.array(z.string()).default([]),
  misconception_tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  requires_teacher_review: z.boolean(),
});

function normalize(value: string, settings: Record<string, unknown>) {
  let next = value.trim();
  if (settings.ignoreWhitespace) next = next.replace(/\s+/g, "");
  if (settings.ignoreCase) next = next.toLowerCase();
  return next;
}

function ruleGrade(answer: string, correctAnswer: unknown, questionType: string, settings: Record<string, unknown>, maxScore: number) {
  const keys = Array.isArray(correctAnswer) ? correctAnswer.map(String) : [String(correctAnswer)];
  const isCorrect = keys.some((key) => {
    if (questionType === "numeric") {
      const tolerance = typeof settings.numericTolerance === "number" ? settings.numericTolerance : 0;
      const a = Number(answer.replace(/[^0-9.+-]/g, ""));
      const b = Number(key.replace(/[^0-9.+-]/g, ""));
      return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
    }
    return normalize(answer, settings) === normalize(key, settings);
  });
  return {
    score: isCorrect ? maxScore : 0,
    max_score: maxScore,
    is_correct: isCorrect,
    feedback: isCorrect ? "정답입니다." : "답안을 다시 확인해 보세요.",
    strengths: isCorrect ? ["핵심 개념을 정확히 적용했습니다."] : [],
    improvement_points: isCorrect ? [] : ["문항의 조건과 단위를 다시 확인해 보세요."],
    misconception_tags: [],
    confidence: 1,
    requires_teacher_review: false,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const input = schema.parse(await req.json());
    const { profile, service } = await requireProfile(req);
    const { data: submission } = await service
      .from("submissions")
      .select("id, answer, student_id, assessment_id, question_id")
      .eq("id", input.submission_id)
      .single();
    if (!submission) throw new Error("SUBMISSION_NOT_FOUND");
    if (profile.role === "student" && submission.student_id !== profile.id) throw new Error("FORBIDDEN");

    const { data: question } = await service
      .from("questions")
      .select("id, question_type, question_text, points")
      .eq("id", submission.question_id)
      .single();
    const { data: key } = await service
      .from("question_answer_keys")
      .select("correct_answer, explanation, rubric, grading_settings, model_answer")
      .eq("question_id", submission.question_id)
      .single();
    if (!question || !key) throw new Error("QUESTION_KEY_NOT_FOUND");

    const ruleTypes = ["multiple_choice", "true_false", "short_answer", "numeric"];
    let result;
    let mode: "rule_based" | "ai_rubric" | "teacher_review" = "rule_based";
    if (ruleTypes.includes(question.question_type)) {
      result = ruleGrade(submission.answer, key.correct_answer, question.question_type, key.grading_settings ?? {}, Number(question.points));
    } else {
      mode = "teacher_review";
      const apiKey = Deno.env.get("AI_PROVIDER_API_KEY");
      const model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
      if (apiKey) {
        mode = "ai_rubric";
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "Return only validated Korean rubric grading JSON." },
              {
                role: "user",
                content: JSON.stringify({
                  question: question.question_text,
                  model_answer: key.model_answer,
                  rubric: key.rubric,
                  max_score: Number(question.points),
                  student_answer: submission.answer,
                  feedback_language: "ko",
                }),
              },
            ],
          }),
        });
        if (aiResponse.ok) {
          const payload = await aiResponse.json();
          result = aiOutputSchema.parse(JSON.parse(payload.choices?.[0]?.message?.content));
        }
      }
      result ??= {
        score: 0,
        max_score: Number(question.points),
        is_correct: false,
        feedback: "교사 검토가 필요한 서술형 답안입니다.",
        strengths: [],
        improvement_points: [],
        misconception_tags: [],
        confidence: 0,
        requires_teacher_review: true,
      };
    }

    const status = result.requires_teacher_review || result.confidence < 0.65 ? "needs_teacher_review" : "graded";
    const { data: saved } = await service
      .from("grading_results")
      .upsert({
        submission_id: input.submission_id,
        mode,
        status,
        score: result.score,
        max_score: result.max_score,
        is_correct: result.is_correct,
        feedback: result.feedback,
        strengths: result.strengths,
        improvement_points: result.improvement_points,
        misconception_tags: result.misconception_tags,
        confidence: result.confidence,
        requires_teacher_review: result.requires_teacher_review || result.confidence < 0.65,
      })
      .select("id, status")
      .single();

    await writeAudit(service, profile, "submission_graded", "submission", input.submission_id, { mode, status: saved?.status });
    return jsonResponse({ grading_result_id: saved?.id, status: saved?.status });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "REQUEST_FAILED" }, 400);
  }
});
