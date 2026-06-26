import { z } from "https://esm.sh/zod@3.23.8";
import { assertTeacherOwnsClass, requireProfile, writeAudit } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

const schema = z.object({
  class_id: z.string().uuid(),
  assessment_id: z.string().uuid().optional(),
});

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const input = schema.parse(await req.json());
    const { profile, service } = await requireProfile(req);
    await assertTeacherOwnsClass(service, profile, input.class_id);

    let query = service
      .from("submissions")
      .select("assessment_id, student_id, submitted_at, profiles(display_name, student_login_id), questions(display_order, question_type, points), grading_results(score, max_score, status)")
      .eq("assessment_id", input.assessment_id ?? "");

    if (!input.assessment_id) {
      const { data: assessments } = await service.from("assessments").select("id").eq("class_id", input.class_id);
      const ids = (assessments ?? []).map((item) => item.id);
      query = service
        .from("submissions")
        .select("assessment_id, student_id, submitted_at, profiles(display_name, student_login_id), questions(display_order, question_type, points), grading_results(score, max_score, status)")
        .in("assessment_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    }

    const { data, error } = await query;
    if (error) throw new Error("EXPORT_FAILED");

    const header = ["assessment_id", "student_login_id", "student_name", "question_order", "question_type", "score", "max_score", "grading_status", "submitted_at"];
    const rows = (data ?? []).map((row: Record<string, unknown>) => {
      const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles as Record<string, unknown> | null;
      const question = Array.isArray(row.questions) ? row.questions[0] : row.questions as Record<string, unknown> | null;
      const grading = Array.isArray(row.grading_results) ? row.grading_results[0] : row.grading_results as Record<string, unknown> | null;
      return [
        row.assessment_id,
        profileRow?.student_login_id,
        profileRow?.display_name,
        question?.display_order,
        question?.question_type,
        grading?.score,
        grading?.max_score,
        grading?.status,
        row.submitted_at,
      ];
    });
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    await writeAudit(service, profile, "class_results_exported", "class", input.class_id, { assessment_id: input.assessment_id ?? null, row_count: rows.length });

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="class-results.csv"',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "REQUEST_FAILED" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
