import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useUserCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as UserCategory[]);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (name: string, color: string = '#0EA5E9') => {
    if (!user) return { error: 'Not authenticated' };

    const maxOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.sort_order)) + 1 
      : 0;

    const { data, error } = await supabase
      .from('user_categories')
      .insert([{ name, color, user_id: user.id, sort_order: maxOrder }])
      .select()
      .single();

    if (error) return { error: error.message };
    setCategories(prev => [...prev, data as UserCategory]);
    return { data };
  };

  const updateCategory = async (id: string, updates: Partial<UserCategory>) => {
    const { data, error } = await supabase
      .from('user_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message };
    setCategories(prev => prev.map(c => c.id === id ? data as UserCategory : c));
    return { data };
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('user_categories')
      .delete()
      .eq('id', id);

    if (error) return { error: error.message };
    setCategories(prev => prev.filter(c => c.id !== id));
    return { success: true };
  };

  const reorderCategories = async (newOrder: UserCategory[]) => {
    setCategories(newOrder);
    
    const updates = newOrder.map((cat, index) => 
      supabase
        .from('user_categories')
        .update({ sort_order: index })
        .eq('id', cat.id)
    );

    await Promise.all(updates);
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refetch: fetchCategories,
  };
}
