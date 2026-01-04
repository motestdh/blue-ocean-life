import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];
type FocusSessionInsert = Database['public']['Tables']['focus_sessions']['Insert'];

export function useFocusSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;
      setSessions(data || []);

      // Check for active session
      const active = data?.find(s => !s.end_time);
      setActiveSession(active || null);
    } catch (err: any) {
      console.error('Error fetching focus sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const startSession = async (taskId?: string, sessionType: string = 'focus') => {
    if (!user) return { error: 'Not authenticated' };

    const session: FocusSessionInsert = {
      user_id: user.id,
      task_id: taskId || null,
      session_type: sessionType,
      start_time: new Date().toISOString(),
      completed: false,
      duration: 0,
    };

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([session])
      .select()
      .single();

    if (error) {
      console.error('Error starting session:', error);
      return { error: error.message };
    }

    setActiveSession(data);
    setSessions(prev => [data, ...prev]);
    return { data };
  };

  const endSession = async (completed: boolean = true) => {
    if (!activeSession) return { error: 'No active session' };

    const endTime = new Date();
    const startTime = new Date(activeSession.start_time);
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const { data, error } = await supabase
      .from('focus_sessions')
      .update({
        end_time: endTime.toISOString(),
        duration: durationSeconds,
        completed,
      })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (error) {
      console.error('Error ending session:', error);
      return { error: error.message };
    }

    // Add focus time to task.actual_time (stored in hours)
    if (activeSession.task_id && activeSession.session_type === 'focus' && durationSeconds > 0) {
      const { data: taskRow, error: taskReadError } = await supabase
        .from('tasks')
        .select('actual_time')
        .eq('id', activeSession.task_id)
        .maybeSingle();

      if (!taskReadError) {
        const currentHours = Number(taskRow?.actual_time) || 0;
        const hoursToAdd = durationSeconds / 3600;

        const { error: taskUpdateError } = await supabase
          .from('tasks')
          .update({ actual_time: currentHours + hoursToAdd })
          .eq('id', activeSession.task_id);

        if (taskUpdateError) {
          console.error('Error updating task time:', taskUpdateError);
        }
      } else {
        console.error('Error reading task time:', taskReadError);
      }
    }

    setActiveSession(null);
    setSessions(prev => prev.map(s => s.id === data.id ? data : s));
    return { data };
  };

  // Today's stats
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => 
    s.start_time.startsWith(today) && s.completed
  );
  
  const sessionsToday = todaySessions.length;
  const totalFocusTime = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const tasksCompleted = todaySessions.filter(s => s.task_id).length;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return {
    sessions,
    loading,
    activeSession,
    startSession,
    endSession,
    sessionsToday,
    totalFocusTime,
    tasksCompleted,
    formatDuration,
    refetch: fetchSessions,
  };
}
