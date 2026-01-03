import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Habit = Database['public']['Tables']['habits']['Row'];
type HabitInsert = Database['public']['Tables']['habits']['Insert'];
type HabitUpdate = Database['public']['Tables']['habits']['Update'];
type HabitCompletion = Database['public']['Tables']['habit_completions']['Row'];

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setCompletions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [habitsResult, completionsResult] = await Promise.all([
        supabase.from('habits').select('*').order('created_at', { ascending: true }),
        supabase.from('habit_completions').select('*'),
      ]);

      if (habitsResult.error) throw habitsResult.error;
      if (completionsResult.error) throw completionsResult.error;

      setHabits(habitsResult.data || []);
      setCompletions(completionsResult.data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching habits:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const addHabit = async (habit: Omit<HabitInsert, 'user_id'>) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('habits')
      .insert([{ ...habit, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding habit:', error);
      return { error: error.message };
    }

    setHabits((prev) => [...prev, data]);
    return { data };
  };

  const updateHabit = async (id: string, updates: HabitUpdate) => {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating habit:', error);
      return { error: error.message };
    }

    setHabits((prev) => prev.map((h) => (h.id === id ? data : h)));
    return { data };
  };

  const deleteHabit = async (id: string) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting habit:', error);
      return { error: error.message };
    }

    setHabits((prev) => prev.filter((h) => h.id !== id));
    return { success: true };
  };

  const toggleHabitCompletion = async (habitId: string, date: string) => {
    if (!user) return { error: 'Not authenticated' };

    const existing = completions.find(
      (c) => c.habit_id === habitId && c.completed_date === date
    );

    if (existing) {
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existing.id);

      if (error) {
        console.error('Error removing completion:', error);
        return { error: error.message };
      }

      setCompletions((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      const { data, error } = await supabase
        .from('habit_completions')
        .insert([{ habit_id: habitId, user_id: user.id, completed_date: date }])
        .select()
        .single();

      if (error) {
        console.error('Error adding completion:', error);
        return { error: error.message };
      }

      setCompletions((prev) => [...prev, data]);
    }

    return { success: true };
  };

  const isCompletedOnDate = (habitId: string, date: string) => {
    return completions.some(
      (c) => c.habit_id === habitId && c.completed_date === date
    );
  };

  return {
    habits,
    completions,
    loading,
    error,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    isCompletedOnDate,
    refetch: fetchHabits,
  };
}
