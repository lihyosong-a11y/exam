import { z } from "https://esm.sh/zod@3.23.8";
import { makeTemporaryPassword, requireProfile, writeAudit } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const schema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const input = schema.parse(await req.json());
    const { profile, service } = await requireProfile(req);
    if (profile.role !== "admin") {
      const { data: cls } = await service.from("classes").select("id").eq("id", input.class_id).eq("teacher_id", profile.id).single();
      if (!cls) throw new Error("FORBIDDEN");
    }
    const { data: enrollment } = await service
      .from("enrollments")
      .select("student_id")
      .eq("class_id", input.class_id)
      .eq("student_id", input.student_id)
      .single();
    if (!enrollment) throw new Error("FORBIDDEN");

    const temporaryPassword = makeTemporaryPassword();
    const { error: authError } = await service.auth.admin.updateUserById(input.student_id, { password: temporaryPassword });
    if (authError) throw new Error("RESET_FAILED");
    await service.from("profiles").update({ must_change_password: true }).eq("id", input.student_id);
    await writeAudit(service, profile, "student_password_reset", "student", input.student_id, { class_id: input.class_id });

    return jsonResponse({
      warning: "학생 로그인 정보가 포함되어 있습니다. 임시 비밀번호는 지금만 표시됩니다.",
      student_id: input.student_id,
      temporary_password: temporaryPassword,
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "REQUEST_FAILED" }, 400);
  }
});
