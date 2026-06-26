import { FormEvent, useState } from "react";
import { LockKeyhole, LogIn } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SetupNotice } from "../components/SetupNotice";

export function LoginPage() {
  const { signIn, signInWithGoogle, profile, configured } = useAuth();
  const [mode, setMode] = useState<"staff" | "student">("staff");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (profile) {
    return <Navigate to={profile.role === "student" ? "/student" : "/teacher"} replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn({ mode, identifier, password });
      const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(redirectTo ?? (mode === "student" ? "/student" : "/teacher"), { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "로그인할 수 없습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogleSignIn() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Google 로그인으로 이동할 수 없습니다.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded bg-forest text-white">
            <LockKeyhole aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold">수업 진단·형성평가 및 피드백 관리</h1>
          <p className="mt-2 text-sm text-slate-600">교사와 학생 모두 같은 보안 로그인 흐름을 사용합니다.</p>
        </div>
        {!configured ? <SetupNotice /> : null}
        <div className={configured ? "" : "mt-4"}>
          <form className="rounded border border-line bg-white p-6 shadow-soft" onSubmit={onSubmit}>
            <div className="mb-4 grid grid-cols-2 rounded border border-line p-1" role="tablist" aria-label="로그인 유형">
              <button
                className={`focus-ring rounded px-3 py-2 text-sm font-medium ${mode === "staff" ? "bg-forest text-white" : "text-slate-600"}`}
                type="button"
                onClick={() => setMode("staff")}
              >
                교사·관리자
              </button>
              <button
                className={`focus-ring rounded px-3 py-2 text-sm font-medium ${mode === "student" ? "bg-forest text-white" : "text-slate-600"}`}
                type="button"
                onClick={() => setMode("student")}
              >
                학생
              </button>
            </div>
            {mode === "staff" ? (
              <div className="mb-5">
                <button
                  className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded border border-line bg-white px-4 py-2 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={() => {
                    void onGoogleSignIn();
                  }}
                  disabled={busy || !configured}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-line text-sm font-semibold">G</span>
                  Google로 로그인
                </button>
                {!configured ? <p className="mt-2 text-xs leading-5 text-slate-500">Supabase와 Google Provider를 연결하면 활성화됩니다.</p> : null}
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                  <span className="h-px flex-1 bg-line" />
                  <span>또는 이메일 로그인</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              </div>
            ) : null}
            <label className="block text-sm font-medium" htmlFor="identifier">
              {mode === "student" ? "학생 로그인 ID" : "이메일"}
            </label>
            <input
              className="focus-ring mt-2 w-full rounded border border-line px-3 py-2"
              id="identifier"
              autoComplete={mode === "student" ? "username" : "email"}
              placeholder={!configured ? (mode === "student" ? "demo01" : "teacher@example.com") : undefined}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
            <label className="mt-4 block text-sm font-medium" htmlFor="password">
              비밀번호
            </label>
            <input
              className="focus-ring mt-2 w-full rounded border border-line px-3 py-2"
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={!configured ? "아무 값이나 입력" : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {!configured ? (
              <p className="mt-4 rounded bg-gold/10 p-3 text-sm leading-6 text-slate-700">
                Supabase 환경 변수가 없으므로 입력값은 서버로 전송되지 않고 선택한 역할의 데모 계정으로 로그인됩니다.
              </p>
            ) : null}
            {error ? <p className="mt-4 rounded bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
            <button
              className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-forest px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={busy}
            >
              <LogIn aria-hidden="true" size={18} />
              {busy ? "확인 중" : configured ? "로그인" : "데모 로그인"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
