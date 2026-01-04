import { Link } from 'react-router-dom';
import { Flame, Check, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Habit = Database['public']['Tables']['habits']['Row'];

interface HabitsWidgetProps {
  habits: Habit[];
  isCompletedOnDate: (habitId: string, date: string) => boolean;
  onToggle: (habitId: string, date: string) => void;
}

export function HabitsWidget({ habits, isCompletedOnDate, onToggle }: HabitsWidgetProps) {
  const today = new Date().toISOString().split('T')[0];
  const completedCount = habits.filter(h => isCompletedOnDate(h.id, today)).length;
  const progress = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

  const iconMap: Record<string, string> = {
    'activity': '🏃',
    'book': '📚',
    'code': '💻',
    'heart': '❤️',
    'music': '🎵',
    'sun': '☀️',
    'moon': '🌙',
    'coffee': '☕',
    'dumbbell': '💪',
    'brain': '🧠',
  };

  return (
    <div className="blitzit-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Today's Habits</h3>
        </div>
        <Link to="/habits" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Progress value={progress} className="h-2 flex-1" />
        <span className="text-sm font-medium text-foreground">
          {completedCount}/{habits.length}
        </span>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No habits yet. Start building good habits!
        </p>
      ) : (
        <div className="space-y-2">
          {habits.slice(0, 5).map((habit) => {
            const isCompleted = isCompletedOnDate(habit.id, today);
            return (
              <div
                key={habit.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                onClick={() => onToggle(habit.id, today)}
              >
                <button
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                    isCompleted
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30 hover:border-primary/50"
                  )}
                >
                  {isCompleted && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </button>
                
                <span className="text-lg">
                  {iconMap[habit.icon || ''] || '✨'}
                </span>
                
                <span className={cn(
                  "flex-1 text-sm",
                  isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {habit.name}
                </span>
                
                {(habit.current_streak || 0) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>{habit.current_streak}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
