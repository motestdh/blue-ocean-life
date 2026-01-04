import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  Flame, 
  DollarSign,
  Target,
  Calendar,
  Clock,
  Loader2,
  Zap,
  Timer,
  TrendingUp,
  TrendingDown,
  Wallet,
  Check,
  Play,
  Pause,
  MoreVertical,
  Plus,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useTransactions } from '@/hooks/useTransactions';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format, isToday, addDays } from 'date-fns';
import { useAppStore } from '@/stores/useAppStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Project = Database['public']['Tables']['projects']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

// Active Timer Display Component (Blitzit style)
function ActiveTimer({ taskTitle, onPause }: { taskTitle: string; onPause: () => void }) {
  const [time, setTime] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="blitzit-card p-4 gradient-primary text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span className="font-medium">{taskTitle}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="timer-display text-2xl font-bold">{formatTime(time)}</span>
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={onPause}
          >
            <Pause className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Project List Card (Blitzit style)
function ProjectListCard({ project, tasks }: { project: Project; tasks: Task[] }) {
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const pendingTasks = projectTasks.filter(t => t.status !== 'completed');
  const estimatedTime = projectTasks.reduce((sum, t) => sum + (Number(t.estimated_time) || 0), 0);

  const labelColors: Record<string, string> = {
    'W': 'bg-blue-500',
    'P': 'bg-pink-500',
    'G': 'bg-green-500',
    'C': 'bg-cyan-500',
    'O': 'bg-orange-500',
  };

  const initial = project.title.charAt(0).toUpperCase();
  const labelColor = labelColors[initial] || 'bg-primary';

  return (
    <Link to={`/projects/${project.id}`}>
      <div className="blitzit-card p-5 hover-lift cursor-pointer group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold', labelColor)}>
              {initial}
            </div>
            <h3 className="font-semibold text-foreground truncate max-w-[180px]">{project.title}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit list</DropdownMenuItem>
              <DropdownMenuItem>Share list</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Archive list</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {pendingTasks.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">Upcoming</p>
            <div className="space-y-2">
              {pendingTasks.slice(0, 4).map((task, index) => (
                <div 
                  key={task.id} 
                  className={cn(
                    "flex items-center justify-between py-2 px-3 rounded-lg",
                    index === 0 ? "bg-secondary/50" : ""
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                    <span className="text-sm text-foreground truncate max-w-[150px]">{task.title}</span>
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(task.due_date), 'EEE')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Check className="w-8 h-8 mb-2 text-primary" />
            <span className="text-sm">All clear</span>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>{pendingTasks.length} pending tasks</span>
          <span>Est: {Math.floor(estimatedTime / 60)}hr {estimatedTime % 60}mins</span>
        </div>
      </div>
    </Link>
  );
}

// Task Item Component (Blitzit style)
function TaskItem({ task, onToggle, onStartTimer }: { 
  task: Task; 
  onToggle: (id: string) => void;
  onStartTimer: (task: Task) => void;
}) {
  const estimatedMins = Number(task.estimated_time) || 0;
  const actualMins = Number(task.actual_time) || 0;
  
  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const m = mins % 60;
      return `${hrs}hr ${m}min`;
    }
    return `${mins}min`;
  };

  return (
    <div className={cn(
      'group flex items-center gap-3 p-4 rounded-xl blitzit-card hover:border-primary/30 transition-all duration-200',
      task.status === 'completed' && 'opacity-60'
    )}>
      <Button
        variant={task.status === 'completed' ? 'default' : 'outline'}
        size="icon"
        className={cn(
          'h-8 w-8 rounded-full shrink-0',
          task.status === 'completed' && 'bg-primary border-primary'
        )}
        onClick={() => onToggle(task.id)}
      >
        {task.status === 'completed' && <Check className="w-4 h-4" />}
      </Button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-foreground',
          task.status === 'completed' && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDuration(estimatedMins)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100"
          onClick={() => onStartTimer(task)}
        >
          <Play className="w-4 h-4" />
        </Button>
        
        <span className="text-sm text-muted-foreground timer-display">
          {actualMins > 0 ? formatDuration(actualMins) : '00:00'}
        </span>
      </div>
    </div>
  );
}

// Done Task Item
function DoneTaskItem({ task }: { task: Task }) {
  const actualMins = Number(task.actual_time) || 0;
  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const m = mins % 60;
      return `${hrs}hr ${m}min`;
    }
    return `${mins}min`;
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
        <Check className="w-3 h-3 text-primary" />
      </div>
      <span className="text-sm text-muted-foreground line-through flex-1 truncate">
        {task.title}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatDuration(actualMins)}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects();
  const { tasks, loading: tasksLoading, updateTask } = useTasks();
  const { habits, loading: habitsLoading, isCompletedOnDate, toggleHabitCompletion } = useHabits();
  const { income, expenses, balance, loading: transactionsLoading } = useTransactions();
  const { sessionsToday, totalFocusTime, formatDuration } = useFocusSessions();
  const { language } = useAppStore();

  const [activeTimer, setActiveTimer] = useState<Task | null>(null);

  const today = new Date().toISOString().split('T')[0];
  
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const todayTasks = pendingTasks.filter(t => t.due_date === today);
  const completedToday = completedTasks.filter(t => {
    const updated = new Date(t.updated_at);
    return isToday(updated);
  });

  const totalEstimated = pendingTasks.reduce((sum, t) => sum + (Number(t.estimated_time) || 0), 0);
  const totalActual = completedToday.reduce((sum, t) => sum + (Number(t.actual_time) || 0), 0);

  const handleTaskToggle = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, {
        status: task.status === 'completed' ? 'todo' : 'completed'
      });
    }
  };

  const handleStartTimer = (task: Task) => {
    setActiveTimer(task);
  };

  const isLoading = projectsLoading || tasksLoading || habitsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in blitzit-gradient-subtle min-h-screen -m-6 p-6">
      {/* Active Timer (if running) */}
      {activeTimer && (
        <ActiveTimer 
          taskTitle={activeTimer.title} 
          onPause={() => setActiveTimer(null)} 
        />
      )}

      {/* Header with Today's Overview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="gap-2">
            All
            <ChevronDown className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Today</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Est: {Math.floor(totalEstimated / 60)}hrs</span>
          <div className="flex items-center gap-2">
            <Progress 
              value={(completedToday.length / Math.max(todayTasks.length + completedToday.length, 1)) * 100} 
              className="w-24 h-2" 
            />
            <span>{completedToday.length}/{todayTasks.length + completedToday.length} DONE</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Task List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today's Tasks */}
          <div className="space-y-3">
            {todayTasks.length > 0 ? (
              todayTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={handleTaskToggle}
                  onStartTimer={handleStartTimer}
                />
              ))
            ) : (
              <div className="blitzit-card p-8 text-center">
                <Check className="w-12 h-12 mx-auto mb-3 text-primary" />
                <p className="text-muted-foreground">No tasks for today. Enjoy your day! 🎉</p>
              </div>
            )}
          </div>

          {/* Add Task Button */}
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <Plus className="w-4 h-4" />
            ADD TASK
          </Button>

          {/* Scheduled Tasks */}
          {pendingTasks.filter(t => t.due_date && t.due_date !== today).length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  {pendingTasks.filter(t => t.due_date && t.due_date !== today).length} Scheduled tasks
                </span>
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {pendingTasks
                  .filter(t => t.due_date && t.due_date !== today)
                  .slice(0, 3)
                  .map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30"
                    >
                      <span className="text-sm text-foreground">{task.title}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{task.due_date && format(new Date(task.due_date), 'EEE ha')}</span>
                        <span>00:00</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Done Section */}
          {completedToday.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">
                  {completedToday.length} Done
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.floor(totalActual / 60)}hr {totalActual % 60}min
                </span>
              </div>
              <div className="space-y-1">
                {completedToday.map((task) => (
                  <DoneTaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Focus Timer Preview */}
        <div className="space-y-6">
          {/* Focus Mode CTA */}
          <Link to="/focus">
            <div className="blitzit-card p-6 hover-lift cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 gradient-primary opacity-10" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Start Focus</h3>
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  25 min focused work session
                </p>
                <Button className="w-full gradient-button text-white border-0">
                  <Target className="w-4 h-4 mr-2" />
                  Blitzit now
                </Button>
              </div>
            </div>
          </Link>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="blitzit-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{sessionsToday}</p>
              <p className="text-xs text-muted-foreground">Sessions today</p>
            </div>
            <div className="blitzit-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{formatDuration(totalFocusTime)}</p>
              <p className="text-xs text-muted-foreground">Focus time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Lists Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Your Lists</h2>
          <span className="text-sm text-muted-foreground">Lists with your upcoming tasks</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map((project) => (
            <ProjectListCard key={project.id} project={project} tasks={tasks} />
          ))}
          {projects.length === 0 && (
            <div className="col-span-full blitzit-card p-8 text-center">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No projects yet. Create your first project!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}