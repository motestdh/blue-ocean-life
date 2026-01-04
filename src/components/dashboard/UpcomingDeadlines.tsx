import { format, addDays, isToday, isTomorrow, isPast } from 'date-fns';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckSquare, FolderKanban, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  type: 'task' | 'project';
  priority?: string;
}

interface UpcomingDeadlinesProps {
  tasks: Task[];
  projects: Project[];
}

export function UpcomingDeadlines({ tasks, projects }: UpcomingDeadlinesProps) {
  const now = new Date();
  const weekFromNow = addDays(now, 7);

  // Combine tasks and projects with due dates
  const deadlines: DeadlineItem[] = [
    ...tasks
      .filter(t => t.due_date && t.status !== 'completed')
      .map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.due_date!,
        type: 'task' as const,
        priority: t.priority,
      })),
    ...projects
      .filter(p => p.due_date && p.status !== 'completed')
      .map(p => ({
        id: p.id,
        title: p.title,
        dueDate: p.due_date!,
        type: 'project' as const,
        priority: p.priority,
      })),
  ]
    .filter(item => {
      const due = new Date(item.dueDate);
      return due <= weekFromNow;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return 'Overdue';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const getDateColor = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return 'text-destructive';
    if (isToday(date)) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className="blitzit-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-foreground">Upcoming Deadlines</h3>
        </div>
        <Link to="/tasks" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {deadlines.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No upcoming deadlines this week
        </p>
      ) : (
        <div className="space-y-3">
          {deadlines.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              to={item.type === 'task' ? '/tasks' : `/projects/${item.id}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                item.type === 'task' ? "bg-primary/10" : "bg-secondary"
              )}>
                {item.type === 'task' ? (
                  <CheckSquare className="w-4 h-4 text-primary" />
                ) : (
                  <FolderKanban className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{item.title}</p>
                <p className={cn("text-xs", getDateColor(item.dueDate))}>
                  {getDateLabel(item.dueDate)}
                </p>
              </div>

              {item.priority === 'high' && (
                <Badge variant="destructive" className="text-xs">
                  High
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
