import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user" | "read";

interface UserRoleState {
  user: any | null;
  role: AppRole | null;
  email: string | null;
  loading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isVisitor: boolean;
  canCreate: boolean;
  isVerified: boolean;
  refreshVerified: () => Promise<boolean>;
}

export function useUserRole(): UserRoleState {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const fetchVerified = useCallback(async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", userId)
      .maybeSingle();
    const v = !!(data as any)?.is_verified;
    setIsVerified(v);
    return v;
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrate = async (userId: string) => {
      const [{ data: roleData }, _] = await Promise.all([
        supabase.rpc("get_user_role", { _user_id: userId }),
        fetchVerified(userId),
      ]);
      if (!mounted) return;
      setRole((roleData as AppRole) ?? "read");
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) hydrate(session.user.id);
      else { setRole(null); setIsVerified(false); setLoading(false); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) { setLoading(true); hydrate(session.user.id); }
      else { setRole(null); setIsVerified(false); setLoading(false); }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchVerified]);

  const refreshVerified = useCallback(async () => {
    if (!user) return false;
    return fetchVerified(user.id);
  }, [user, fetchVerified]);

  const isAdmin = role === "admin";
  const isEditor = role === "user";
  const isVisitor = role === "read" || role === null;

  return {
    user,
    role,
    email: user?.email ?? null,
    loading,
    isAdmin,
    isEditor,
    isVisitor,
    canCreate: (isAdmin || isEditor) && isVerified,
    isVerified: isVerified || isAdmin, // admins always considered verified
    refreshVerified,
  };
}
