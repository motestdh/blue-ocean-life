import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Note = Database['public']['Tables']['notes']['Row'];
type NoteInsert = Database['public']['Tables']['notes']['Insert'];
type NoteUpdate = Database['public']['Tables']['notes']['Update'];

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (note: Omit<NoteInsert, 'user_id'>) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('notes')
      .insert([{ ...note, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding note:', error);
      return { error: error.message };
    }

    setNotes((prev) => [data, ...prev]);
    return { data };
  };

  const updateNote = async (id: string, updates: NoteUpdate) => {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return { error: error.message };
    }

    setNotes((prev) => prev.map((n) => (n.id === id ? data : n)));
    return { data };
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      return { error: error.message };
    }

    setNotes((prev) => prev.filter((n) => n.id !== id));
    return { success: true };
  };

  return {
    notes,
    loading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
}
