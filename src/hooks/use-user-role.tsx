import { useEffect, useState } from "react";
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
}

export function useUserRole(): UserRoleState {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRole = async (userId: string) => {
      const { data } = await supabase.rpc("get_user_role", { _user_id: userId });
      if (!mounted) return;
      setRole((data as AppRole) ?? "read");
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    canCreate: isAdmin || isEditor,
  };
}
