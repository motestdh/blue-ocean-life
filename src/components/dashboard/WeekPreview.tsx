import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface WeekPreviewProps {
  tasks: Task[];
}

export function WeekPreview({ tasks }: WeekPreviewProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTasksForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(t => t.due_date === dateStr && t.status !== 'completed');
  };

  return (
    <div className="blitzit-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">This Week</h3>
        </div>
        <Link to="/calendar" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
          Full calendar <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const taskCount = dayTasks.length;
          const today = isToday(day);
          
          return (
            <Link
              key={day.toISOString()}
              to={`/calendar?date=${format(day, 'yyyy-MM-dd')}`}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-colors",
                today 
                  ? "bg-primary/10 border border-primary/30" 
                  : "hover:bg-secondary/50"
              )}
            >
              <span className={cn(
                "text-xs font-medium mb-1",
                today ? "text-primary" : "text-muted-foreground"
              )}>
                {format(day, 'EEE')}
              </span>
              <span className={cn(
                "text-lg font-bold mb-1",
                today ? "text-primary" : "text-foreground"
              )}>
                {format(day, 'd')}
              </span>
              {taskCount > 0 ? (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  ))}
                  {taskCount > 3 && (
                    <span className="text-[10px] text-muted-foreground ml-0.5">+</span>
                  )}
                </div>
              ) : (
                <div className="h-2" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
