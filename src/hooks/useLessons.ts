import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Lesson {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  duration_minutes: number | null;
  description: string | null;
  is_completed: boolean | null;
  sort_order: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface LessonInsert {
  course_id: string;
  title: string;
  duration_minutes?: number;
  description?: string;
  is_completed?: boolean;
  sort_order?: number;
}

interface LessonUpdate {
  title?: string;
  duration_minutes?: number;
  description?: string | null;
  is_completed?: boolean;
  sort_order?: number;
  completed_at?: string | null;
}

export function useLessons(courseId?: string) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    if (!user) {
      setLessons([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('lessons')
        .select('*')
        .order('sort_order', { ascending: true });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLessons((data as Lesson[]) || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const addLesson = async (lesson: LessonInsert) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('lessons')
      .insert([{ ...lesson, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding lesson:', error);
      return { error: error.message };
    }

    setLessons((prev) => [...prev, data as Lesson]);
    return { data };
  };

  const updateLesson = async (id: string, updates: LessonUpdate) => {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lesson:', error);
      return { error: error.message };
    }

    setLessons((prev) => prev.map((l) => (l.id === id ? (data as Lesson) : l)));
    return { data };
  };

  const deleteLesson = async (id: string) => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lesson:', error);
      return { error: error.message };
    }

    setLessons((prev) => prev.filter((l) => l.id !== id));
    return { success: true };
  };

  const toggleLessonComplete = async (lesson: Lesson) => {
    const isCompleted = !lesson.is_completed;
    return updateLesson(lesson.id, {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    });
  };

  const getLessonsByCourse = (courseId: string) => {
    return lessons.filter((l) => l.course_id === courseId);
  };

  const completedCount = lessons.filter((l) => l.is_completed).length;
  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
  const completedDuration = lessons
    .filter((l) => l.is_completed)
    .reduce((sum, l) => sum + (l.duration_minutes || 0), 0);

  return {
    lessons,
    loading,
    error,
    addLesson,
    updateLesson,
    deleteLesson,
    toggleLessonComplete,
    getLessonsByCourse,
    completedCount,
    totalCount: lessons.length,
    totalDuration,
    completedDuration,
    refetch: fetchLessons,
  };
}
