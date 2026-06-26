import { BookOpen, LogIn, ShieldCheck } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { profile } = useAuth();

  if (profile) {
    return <Navigate to={profile.role === "student" ? "/student" : "/teacher"} replace />;
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8 text-ink">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-between">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded bg-forest text-white">
              <BookOpen aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-sm text-slate-500">수업 진단·형성평가</p>
              <h1 className="font-semibold">피드백 관리</h1>
            </div>
          </div>
          <Link className="focus-ring inline-flex items-center gap-2 rounded bg-forest px-4 py-2 text-sm font-medium text-white" to="/login">
            <LogIn aria-hidden="true" size={16} />
            로그인
          </Link>
        </header>

        <div className="grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded bg-forest/10 px-3 py-1 text-sm font-medium text-forest">QR 접속용 첫 화면</p>
            <h2 className="text-3xl font-semibold leading-tight md:text-5xl">학생 평가는 로그인 후 바로 이어집니다</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              교사는 평가와 피드백을 관리하고, 학생은 공개된 평가와 결과만 확인합니다. QR로 접속한 기기에서도 먼저 이 화면을 보여 주고 로그인으로 안내합니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="focus-ring inline-flex items-center gap-2 rounded bg-forest px-5 py-3 font-medium text-white" to="/login">
                <LogIn aria-hidden="true" size={18} />
                로그인하기
              </Link>
              <Link className="focus-ring inline-flex items-center rounded border border-line bg-white px-5 py-3 font-medium" to="/student">
                학생 화면으로 이동
              </Link>
            </div>
          </div>

          <aside className="rounded border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 text-forest" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">개인정보 보호 기준</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  학생 답안과 피드백은 로그인한 본인 또는 담당 교사만 볼 수 있게 설계되어 있습니다. Google 로그인은 교사·관리자 계정에 연결할 수 있습니다.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
