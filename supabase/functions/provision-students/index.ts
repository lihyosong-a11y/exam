import { z } from "https://esm.sh/zod@3.23.8";
import { assertTeacherOwnsClass, makeTemporaryPassword, requireProfile, writeAudit } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const schema = z.object({
  class_id: z.string().uuid(),
  students: z.array(
    z.object({
      name: z.string().trim().min(1).max(80),
      student_login_id: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9._-]+$/),
      email: z.string().email().optional().or(z.literal("")),
      note: z.string().max(200).optional(),
    }),
  ).min(1).max(200),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const input = schema.parse(await req.json());
    const { profile, service } = await requireProfile(req);
    await assertTeacherOwnsClass(service, profile, input.class_id);

    const duplicates = new Set<string>();
    for (const student of input.students) {
      if (duplicates.has(student.student_login_id)) throw new Error("DUPLICATE_LOGIN_ID");
      duplicates.add(student.student_login_id);
    }

    const results = [];
    for (const student of input.students) {
      const existing = await service.from("profiles").select("id").eq("student_login_id", student.student_login_id).maybeSingle();
      if (existing.data) throw new Error("DUPLICATE_LOGIN_ID");

      const temporaryPassword = makeTemporaryPassword();
      const email = `${student.student_login_id.toLowerCase()}@students.local`;
      const { data: authUser, error: authError } = await service.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { login_kind: "student" },
      });
      if (authError || !authUser.user) throw new Error("CREATE_USER_FAILED");

      await service.from("profiles").insert({
        id: authUser.user.id,
        role: "student",
        display_name: student.name,
        student_login_id: student.student_login_id,
        must_change_password: true,
      });
      await service.from("enrollments").insert({
        class_id: input.class_id,
        student_id: authUser.user.id,
        student_email: student.email || null,
        note: student.note || null,
      });
      results.push({ name: student.name, student_login_id: student.student_login_id, temporary_password: temporaryPassword });
    }

    await writeAudit(service, profile, "student_accounts_provisioned", "class", input.class_id, { count: results.length });
    return jsonResponse({
      warning: "학생 로그인 정보가 포함되어 있습니다. 다운로드한 파일은 안전한 장소에 보관하고, 공유가 끝난 뒤 삭제해 주세요.",
      students: results,
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "REQUEST_FAILED" }, 400);
  }
});
