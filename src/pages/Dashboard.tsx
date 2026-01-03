import { 
  FolderKanban, 
  CheckSquare, 
  Flame, 
  DollarSign,
  Target,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useTransactions } from '@/hooks/useTransactions';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Wallet, Check } from 'lucide-react';

type Project = Database['public']['Tables']['projects']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

// Stat Card Component
function StatCard({ title, value, icon, iconBgColor = 'bg-primary/10' }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover-lift cursor-pointer">
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-lg', iconBgColor)}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </div>
    </div>
  );
}

// Project Card Component
function ProjectCard({ project }: { project: Project }) {
  const statusColors: Record<string, string> = {
    'new': 'bg-status-new/10 text-status-new',
    'in-progress': 'bg-status-progress/10 text-status-progress',
    'completed': 'bg-status-completed/10 text-status-completed',
    'on-hold': 'bg-status-hold/10 text-status-hold',
    'cancelled': 'bg-status-cancelled/10 text-status-cancelled',
  };

  const priorityColors: Record<string, string> = {
    high: 'border-l-priority-high',
    medium: 'border-l-priority-medium',
    low: 'border-l-priority-low',
  };

  return (
    <div className={cn(
      'bg-card rounded-xl border border-border p-5 hover-lift cursor-pointer border-l-4',
      priorityColors[project.priority]
    )}>
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: project.color || '#0EA5E9' }}
        />
        <h3 className="font-semibold text-foreground">{project.title}</h3>
      </div>

      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
        {project.description}
      </p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{project.progress || 0}%</span>
        </div>
        <Progress value={project.progress || 0} className="h-2" />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full capitalize',
          statusColors[project.status]
        )}>
          {project.status.replace('-', ' ')}
        </span>
        {project.due_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(project.due_date), 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Item Component
function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const priorityDotColors: Record<string, string> = {
    high: 'bg-priority-high',
    medium: 'bg-priority-medium',
    low: 'bg-priority-low',
  };

  return (
    <div className={cn(
      'group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all duration-200',
      task.status === 'completed' && 'opacity-60'
    )}>
      <Checkbox
        checked={task.status === 'completed'}
        onCheckedChange={() => onToggle(task.id)}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-foreground truncate',
          task.status === 'completed' && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className={cn('w-2 h-2 rounded-full', priorityDotColors[task.priority])} />
        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(task.due_date), 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Finance Summary Component
function FinanceSummary({ income, expenses, balance }: { income: number; expenses: number; balance: number }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Financial Overview</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Income</span>
          </div>
          <span className="font-semibold text-success">
            +${income.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Expenses</span>
          </div>
          <span className="font-semibold text-destructive">
            -${expenses.toLocaleString()}
          </span>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Balance</span>
            <span className={cn(
              'text-lg font-bold',
              balance >= 0 ? 'text-success' : 'text-destructive'
            )}>
              ${balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Habit Card Component
function HabitCard({ habit, isCompleted, onToggle }: { 
  habit: Database['public']['Tables']['habits']['Row']; 
  isCompleted: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200">
      <Button
        variant={isCompleted ? 'default' : 'outline'}
        size="icon"
        onClick={onToggle}
        className={cn(
          'h-10 w-10 rounded-full transition-all duration-300',
          isCompleted && 'shadow-glow'
        )}
        style={{ 
          backgroundColor: isCompleted ? (habit.color || '#0EA5E9') : undefined,
          borderColor: habit.color || '#0EA5E9'
        }}
      >
        {isCompleted ? (
          <Check className="h-5 w-5 text-white" />
        ) : (
          <span className="text-lg">{habit.icon}</span>
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{habit.name}</p>
        <p className="text-sm text-muted-foreground">{habit.description}</p>
      </div>

      <div className="flex items-center gap-1.5 text-sm">
        <Flame className="w-4 h-4 text-warning" />
        <span className="font-semibold text-foreground">{habit.current_streak || 0}</span>
        <span className="text-muted-foreground">day streak</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects();
  const { tasks, loading: tasksLoading, updateTask } = useTasks();
  const { habits, loading: habitsLoading, isCompletedOnDate, toggleHabitCompletion } = useHabits();
  const { income, expenses, balance, loading: transactionsLoading } = useTransactions();

  const today = new Date().toISOString().split('T')[0];
  
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalStreak = habits.reduce((sum, h) => sum + (h.current_streak || 0), 0);
  
  const todayTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    return t.due_date === today && t.status !== 'completed';
  }).slice(0, 5);

  const upcomingProjects = projects
    .filter(p => p.status !== 'completed' && p.status !== 'cancelled')
    .slice(0, 3);

  const handleTaskToggle = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, {
        status: task.status === 'completed' ? 'todo' : 'completed'
      });
    }
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
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Good morning! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={<FolderKanban className="w-5 h-5 text-primary" />}
        />
        <StatCard
          title="Tasks Completed"
          value={`${completedTasks}/${tasks.length}`}
          icon={<CheckSquare className="w-5 h-5 text-success" />}
          iconBgColor="bg-success/10"
        />
        <StatCard
          title="Habit Streak"
          value={`${totalStreak} days`}
          icon={<Flame className="w-5 h-5 text-warning" />}
          iconBgColor="bg-warning/10"
        />
        <StatCard
          title="This Month"
          value={`$${income.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-success" />}
          iconBgColor="bg-success/10"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Today's Priority</h2>
            </div>
            <Link to="/tasks">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {todayTasks.length > 0 ? (
              todayTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={handleTaskToggle} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tasks for today. Enjoy your day! 🎉</p>
              </div>
            )}
          </div>

          {/* Focus Mode CTA */}
          <Link to="/focus">
            <div className="mt-6 p-5 rounded-xl gradient-primary text-white hover:opacity-90 transition-opacity cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Start Focus Session</h3>
                  <p className="text-white/80 text-sm mt-1">
                    25 min focused work • No distractions
                  </p>
                </div>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Target className="w-4 h-4" />
                  Start Now
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Finance Summary */}
          <FinanceSummary income={income} expenses={expenses} balance={balance} />

          {/* Habits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Today's Habits</h2>
              <Link to="/habits">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {habits.slice(0, 3).map((habit) => (
                <HabitCard 
                  key={habit.id} 
                  habit={habit} 
                  isCompleted={isCompletedOnDate(habit.id, today)}
                  onToggle={() => toggleHabitCompletion(habit.id, today)}
                />
              ))}
              {habits.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No habits yet. Create one to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Active Projects</h2>
          <Link to="/projects">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          {upcomingProjects.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active projects. Create your first project!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
