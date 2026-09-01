import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

/** Safe internal path stashed before an OAuth round-trip (e.g. a claim link). */
export function takePendingNext(): string | null {
  try {
    const v = sessionStorage.getItem("lp_next");
    if (v) sessionStorage.removeItem("lp_next");
    return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
  } catch {
    return null;
  }
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/welcome" state={{ from: location }} replace />;

  // Resume an interrupted claim/invite destination after sign-in or OAuth return.
  const pending = location.pathname === "/" ? takePendingNext() : null;
  if (pending && pending !== "/") return <Navigate to={pending} replace />;

  return <>{children}</>;
}

