import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/domain";
import { SetupNotice } from "./SetupNotice";

export function RequireRole({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { profile, loading, configured } = useAuth();
  const location = useLocation();

  if (loading) return <div className="rounded border border-line bg-white p-6">사용자 정보를 확인하고 있습니다.</div>;
  if (!configured && !profile) return <SetupNotice />;
  if (!profile) return <Navigate to="/login" replace state={{ from: location }} />;
  if (profile.must_change_password) return <Navigate to="/change-password" replace />;
  if (!roles.includes(profile.role)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
