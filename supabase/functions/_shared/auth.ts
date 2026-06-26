import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createAuthedClient(req: Request) {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
}

export function createServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireProfile(req: Request) {
  const authed = createAuthedClient(req);
  const { data: userData, error: userError } = await authed.auth.getUser();
  if (userError || !userData.user) throw new Error("UNAUTHENTICATED");

  const service = createServiceClient();
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", userData.user.id)
    .single();
  if (profileError || !profile) throw new Error("PROFILE_NOT_FOUND");

  return { user: userData.user, profile, service };
}

export async function assertTeacherOwnsClass(service: ReturnType<typeof createServiceClient>, profile: { id: string; role: string }, classId: string) {
  if (profile.role === "admin") return;
  if (profile.role !== "teacher") throw new Error("FORBIDDEN");
  const { data, error } = await service.from("classes").select("id").eq("id", classId).eq("teacher_id", profile.id).single();
  if (error || !data) throw new Error("FORBIDDEN");
}

export async function writeAudit(
  service: ReturnType<typeof createServiceClient>,
  actor: { id: string; role: string },
  action: string,
  targetType: string,
  targetId: string | null,
  summary: Record<string, unknown> = {},
) {
  await service.from("audit_logs").insert({
    actor_id: actor.id,
    actor_role: actor.role,
    action,
    target_type: targetType,
    target_id: targetId,
    summary,
  });
}

export function makeTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#%+=";
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
