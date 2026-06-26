/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, studentLoginEmail, supabase } from "../lib/supabase";
import type { Profile, UserRole } from "../types/domain";

const demoProfiles: Record<"staff" | "student", Profile> = {
  staff: {
    id: "demo-teacher",
    role: "teacher",
    display_name: "데모 교사",
    student_login_id: null,
    must_change_password: false,
  },
  student: {
    id: "demo-student",
    role: "student",
    display_name: "데모 학생",
    student_login_id: "demo01",
    must_change_password: false,
  },
};

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  signIn: (input: { mode: "staff" | "student"; identifier: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, display_name, student_login_id, must_change_password")
      .eq("id", userId)
      .single();

    if (error) throw new Error("사용자 정보를 불러오지 못했습니다.");
    setProfile({
      id: data.id,
      role: data.role as UserRole,
      display_name: data.display_name,
      student_login_id: data.student_login_id,
      must_change_password: data.must_change_password,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) return;
    await loadProfile(session.user.id);
  }, [loadProfile, session?.user.id]);

  useEffect(() => {
    if (!supabase) {
      const demoRole = window.localStorage.getItem("demo_role");
      if (demoRole === "staff" || demoRole === "student") {
        setProfile(demoProfiles[demoRole]);
      }
      setLoading(false);
      return;
    }

    let ignore = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (ignore) return;
      setSession(data.session);
      if (data.session?.user.id) {
        try {
          await loadProfile(data.session.user.id);
        } catch {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession?.user.id) {
        setProfile(null);
        return;
      }
      loadProfile(nextSession.user.id).catch(() => setProfile(null));
    });

    return () => {
      ignore = true;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async ({ mode, identifier, password }: { mode: "staff" | "student"; identifier: string; password: string }) => {
    if (!supabase) {
      if (!identifier.trim() || !password.trim()) throw new Error("데모 로그인에도 아이디와 비밀번호를 입력해 주세요.");
      window.localStorage.setItem("demo_role", mode);
      setProfile(demoProfiles[mode]);
      return;
    }
    const email = mode === "student" ? studentLoginEmail(identifier) : identifier.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      window.localStorage.removeItem("demo_role");
      setSession(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const changePassword = useCallback(
    async (newPassword: string) => {
      if (!supabase || !session?.user.id) throw new Error("로그인이 필요합니다.");
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw new Error("비밀번호를 변경하지 못했습니다.");
      const { error: profileError } = await supabase.from("profiles").update({ must_change_password: false }).eq("id", session.user.id);
      if (profileError) throw new Error("비밀번호 변경 상태를 저장하지 못했습니다.");
      await refreshProfile();
    },
    [refreshProfile, session?.user.id],
  );

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signOut,
      changePassword,
      refreshProfile,
    }),
    [changePassword, loading, profile, refreshProfile, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth는 AuthProvider 안에서 사용해야 합니다.");
  return context;
}
