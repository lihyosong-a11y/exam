import { z } from "https://esm.sh/zod@3.23.8";
import { requireProfile, writeAudit } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const inputSchema = z.object({
  assessment_id: z.string().uuid(),
  subject: z.string().max(80),
  grade_level: z.string().max(40),
  unit: z.string().max(120),
  achievement_standard_code: z.string().max(80),
  achievement_standard_content: z.string().max(1000),
  assessment_type: z.enum(["diagnostic", "formative"]),
  question_type: z.enum(["multiple_choice", "true_false", "short_answer", "numeric", "short_essay", "extended_essay"]),
  question_count: z.number().int().min(1).max(10),
  difficulty: z.enum(["하", "중", "상"]),
  lesson_context: z.string().max(1500).optional(),
  extra_requirements: z.string().max(1000).optional(),
});

const outputSchema = z.object({
  questions: z.array(
    z.object({
      question_text: z.string().min(1).max(5000),
      question_type: z.string(),
      options: z.array(z.string()).default([]),
      correct_answer: z.unknown(),
      explanation: z.string().max(5000),
      points: z.number().positive().max(100),
      rubric: z.unknown(),
      common_misconceptions: z.array(z.string()).default([]),
      achievement_standard_code: z.string(),
      difficulty: z.enum(["하", "중", "상"]),
      teacher_review_notes: z.string().max(1000).optional(),
    }),
  ),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const input = inputSchema.parse(await req.json());
    const { profile, service } = await requireProfile(req);
    if (profile.role !== "teacher" && profile.role !== "admin") throw new Error("FORBIDDEN");

    const { data: assessment } = await service.from("assessments").select("id, class_id").eq("id", input.assessment_id).single();
    if (!assessment) throw new Error("ASSESSMENT_NOT_FOUND");
    if (profile.role !== "admin") {
      const { data: cls } = await service.from("classes").select("id").eq("id", assessment.class_id).eq("teacher_id", profile.id).single();
      if (!cls) throw new Error("FORBIDDEN");
    }

    const provider = Deno.env.get("AI_PROVIDER");
    const apiKey = Deno.env.get("AI_PROVIDER_API_KEY");
    const model = Deno.env.get("AI_MODEL") ?? "gpt-4o-mini";
    if (!provider || !apiKey) throw new Error("AI_NOT_CONFIGURED");

    const prompt = {
      instruction: "한국어 수업 평가 문항을 JSON으로만 생성한다. 학생 개인정보는 포함하지 않는다.",
      input,
    };
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return only valid JSON with a questions array." },
          { role: "user", content: JSON.stringify(prompt) },
        ],
      }),
    });
    if (!aiResponse.ok) throw new Error("AI_REQUEST_FAILED");
    const payload = await aiResponse.json();
    const content = payload.choices?.[0]?.message?.content;
    const parsed = outputSchema.parse(JSON.parse(content));

    for (const item of parsed.questions) {
      const { data: question } = await service
        .from("questions")
        .insert({
          assessment_id: input.assessment_id,
          question_text: item.question_text,
          question_type: input.question_type,
          options: item.options,
          points: item.points,
          difficulty: item.difficulty,
          status: "draft",
          is_ai_generated: true,
          teacher_review_notes: item.teacher_review_notes ?? "AI 초안",
        })
        .select("id")
        .single();
      if (question) {
        await service.from("question_answer_keys").insert({
          question_id: question.id,
          correct_answer: item.correct_answer,
          explanation: item.explanation,
          rubric: item.rubric,
          common_misconceptions: item.common_misconceptions,
        });
      }
    }
    await service.from("ai_generation_logs").insert({
      teacher_id: profile.id,
      assessment_id: input.assessment_id,
      provider,
      model,
      request_summary: { question_count: input.question_count, question_type: input.question_type, subject: input.subject },
      generated_count: parsed.questions.length,
      status: "success",
    });
    await writeAudit(service, profile, "ai_questions_generated", "assessment", input.assessment_id, { count: parsed.questions.length });
    return jsonResponse({ questions: parsed.questions.map((question) => ({ ...question, correct_answer: undefined })) });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "REQUEST_FAILED" }, 400);
  }
});
