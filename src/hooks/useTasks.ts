import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export function useTasks(projectId?: string | null) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true });

      if (projectId !== undefined) {
        if (projectId === null) {
          query = query.is('project_id', null);
        } else {
          query = query.eq('project_id', projectId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    fetchTasks();

    // Setup realtime subscription
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as Task;
            if (newTask.user_id === user?.id) {
              setTasks((prev) => {
                if (prev.find(t => t.id === newTask.id)) return prev;
                return [...prev, newTask];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as Task;
            setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
          } else if (payload.eventType === 'DELETE') {
            const deletedTask = payload.old as Task;
            setTasks((prev) => prev.filter((t) => t.id !== deletedTask.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks, user?.id]);

  const addTask = async (task: Omit<TaskInsert, 'user_id'>) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding task:', error);
      return { error: error.message };
    }

    setTasks((prev) => [...prev, data]);
    return { data };
  };

  const updateTask = async (id: string, updates: TaskUpdate) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return { error: error.message };
    }

    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
    return { data };
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return { error: error.message };
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
    return { success: true };
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
