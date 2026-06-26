import { BookOpen, ChartNoAxesCombined, ClipboardList, GraduationCap, LayoutDashboard, LogOut, UsersRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";

const teacherNav = [
  { to: "/teacher", label: "대시보드", icon: LayoutDashboard },
  { to: "/teacher/classes", label: "학급", icon: UsersRound },
  { to: "/teacher/assessments/new", label: "평가 만들기", icon: ClipboardList },
  { to: "/teacher/analytics", label: "분석", icon: ChartNoAxesCombined },
];

const studentNav = [
  { to: "/student", label: "내 학습", icon: GraduationCap },
];

export function AppShell() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const nav = profile?.role === "student" ? studentNav : teacherNav;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded bg-forest text-white">
              <BookOpen aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-sm text-slate-500">수업 진단·형성평가</p>
              <h1 className="text-lg font-semibold">피드백 관리</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">{profile?.display_name ?? "로그인 필요"}</span>
            <button
              className="focus-ring inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm hover:bg-slate-50"
              type="button"
              onClick={() => {
                void signOut().then(() => navigate("/login"));
              }}
            >
              <LogOut aria-hidden="true" size={16} />
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <nav aria-label="주요 메뉴" className="rounded border border-line bg-white p-2 shadow-soft md:sticky md:top-6 md:self-start">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/teacher" || to === "/student"}
              className={({ isActive }) =>
                clsx(
                  "focus-ring mb-1 flex items-center gap-2 rounded px-3 py-2 text-sm font-medium",
                  isActive ? "bg-forest text-white" : "text-slate-700 hover:bg-slate-100",
                )
              }
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
