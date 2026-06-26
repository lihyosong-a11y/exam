import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";

const passwordSchema = z
  .string()
  .min(12, "비밀번호는 12자 이상이어야 합니다.")
  .regex(/[A-Z]/, "영문 대문자를 포함해 주세요.")
  .regex(/[a-z]/, "영문 소문자를 포함해 주세요.")
  .regex(/[0-9]/, "숫자를 포함해 주세요.");

export function PasswordChangePage() {
  const { changePassword, profile } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "비밀번호 형식이 올바르지 않습니다.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(parsed.data);
      navigate(profile?.role === "student" ? "/student" : "/teacher", { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "비밀번호를 변경하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <form className="w-full max-w-md rounded border border-line bg-white p-6 shadow-soft" onSubmit={onSubmit}>
        <h1 className="text-xl font-semibold">비밀번호 변경</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">임시 비밀번호로 로그인한 학생은 평가 응시 전에 새 비밀번호를 설정해야 합니다.</p>
        <label className="mt-5 block text-sm font-medium" htmlFor="new-password">
          새 비밀번호
        </label>
        <input
          className="focus-ring mt-2 w-full rounded border border-line px-3 py-2"
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="mt-4 rounded bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
        <button className="focus-ring mt-5 w-full rounded bg-forest px-4 py-2 font-medium text-white" type="submit" disabled={busy}>
          {busy ? "저장 중" : "변경하기"}
        </button>
      </form>
    </main>
  );
}
