import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_NAV_ORDER = [
  '/', '/calendar', '/projects', '/tasks', '/focus', '/clients', 
  '/finance', '/learning', '/books-podcasts', '/movies-series', 
  '/notes', '/habits', '/analytics'
];

export function useNavOrder() {
  const { user } = useAuth();
  const [navOrder, setNavOrder] = useState<string[]>(DEFAULT_NAV_ORDER);
  const [loading, setLoading] = useState(true);

  const fetchNavOrder = useCallback(async () => {
    if (!user) {
      setNavOrder(DEFAULT_NAV_ORDER);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_nav_order')
        .select('nav_order')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.nav_order && data.nav_order.length > 0) {
        // Merge with defaults to include any new routes
        const merged = [...data.nav_order];
        DEFAULT_NAV_ORDER.forEach(route => {
          if (!merged.includes(route)) merged.push(route);
        });
        setNavOrder(merged);
      } else {
        setNavOrder(DEFAULT_NAV_ORDER);
      }
    } catch (err: any) {
      console.error('Error fetching nav order:', err);
      setNavOrder(DEFAULT_NAV_ORDER);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNavOrder();
  }, [fetchNavOrder]);

  const updateNavOrder = async (newOrder: string[]) => {
    if (!user) return;

    setNavOrder(newOrder);

    const { error } = await supabase
      .from('user_nav_order')
      .upsert({ 
        user_id: user.id, 
        nav_order: newOrder 
      }, { 
        onConflict: 'user_id' 
      });

    if (error) console.error('Error saving nav order:', error);
  };

  return {
    navOrder,
    loading,
    updateNavOrder,
    refetch: fetchNavOrder,
  };
}
