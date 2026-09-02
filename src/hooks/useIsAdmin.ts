import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Admin status is resolved database-side via the `has_role` security-definer
 * function backed by the `user_roles` table. It is never read from user
 * metadata, which the user could edit.
 */
export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    let cancel = false;
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => {
        if (cancel) return;
        setIsAdmin(data === true);
        setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading };
}
