import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'user' | 'read' | null;

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('role', { ascending: true })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(data?.role as UserRole);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const canCreate = userRole === 'admin' || userRole === 'user';
  const canEdit = (cardUserId: string, currentUserId: string) => {
    if (userRole === 'admin') return true;
    if (userRole === 'user') return cardUserId === currentUserId;
    return false;
  };
  const canDelete = (cardUserId: string, currentUserId: string) => {
    if (userRole === 'admin') return true;
    if (userRole === 'user') return cardUserId === currentUserId;
    return false;
  };
  const isAdmin = userRole === 'admin';

  return {
    userRole,
    loading,
    canCreate,
    canEdit,
    canDelete,
    isAdmin
  };
};
