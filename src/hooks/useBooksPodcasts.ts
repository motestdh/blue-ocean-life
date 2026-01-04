import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BookPodcast {
  id: string;
  user_id: string;
  name: string;
  url: string | null;
  type: 'book' | 'podcast';
  status: 'to-consume' | 'in-progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export function useBooksPodcasts() {
  const { user } = useAuth();
  const [items, setItems] = useState<BookPodcast[]>([]);
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
        .from('books_podcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems((data || []) as BookPodcast[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching books/podcasts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Omit<BookPodcast, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('books_podcasts')
      .insert([{ ...item, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding item:', error);
      return { error: error.message };
    }

    setItems((prev) => [data as BookPodcast, ...prev]);
    return { data };
  };

  const updateItem = async (id: string, updates: Partial<BookPodcast>) => {
    const { data, error } = await supabase
      .from('books_podcasts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return { error: error.message };
    }

    setItems((prev) => prev.map((i) => (i.id === id ? data as BookPodcast : i)));
    return { data };
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('books_podcasts')
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
