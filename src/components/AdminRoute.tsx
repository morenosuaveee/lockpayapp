import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading } = useIsAdmin();

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login?next=/admin/users" replace />;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive-soft">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-lg font-semibold">Restricted area</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This dashboard is limited to authorized Lock Pay administrators.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
