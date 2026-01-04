import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MovieSeries {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: 'movie' | 'series';
  status: 'to-watch' | 'watching' | 'completed';
  created_at: string;
  updated_at: string;
}

export function useMoviesSeries() {
  const { user } = useAuth();
  const [items, setItems] = useState<MovieSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('movies_series')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data || []) as MovieSeries[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching movies/series:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Omit<MovieSeries, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('movies_series')
      .insert([{ ...item, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding item:', error);
      return { error: error.message };
    }

    setItems((prev) => [data as MovieSeries, ...prev]);
    return { data };
  };

  const updateItem = async (id: string, updates: Partial<MovieSeries>) => {
    const { data, error } = await supabase
      .from('movies_series')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return { error: error.message };
    }

    setItems((prev) => prev.map((i) => (i.id === id ? data as MovieSeries : i)));
    return { data };
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('movies_series')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      return { error: error.message };
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    return { success: true };
  };

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchItems,
  };
}
