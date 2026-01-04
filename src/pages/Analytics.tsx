import { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  Target,
  Flame,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useHabits } from '@/hooks/useHabits';
import { useTransactions } from '@/hooks/useTransactions';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { exportAnalyticsToPDF } from '@/lib/pdf-export';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export default function Analytics() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { habits, loading: habitsLoading, completions } = useHabits();
  const { transactions, income, expenses, loading: transactionsLoading } = useTransactions();
  const { sessions, totalFocusTime, formatDuration } = useFocusSessions();
  const { language } = useAppStore();

  const isRTL = language === 'ar';
  const locale = isRTL ? ar : enUS;

  // Task statistics
  const taskStats = useMemo(() => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const total = tasks.length;

    return {
      completed,
      inProgress,
      todo,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [tasks]);

  // Project statistics
  const projectStats = useMemo(() => {
    const byStatus = {
      new: projects.filter(p => p.status === 'new').length,
      inProgress: projects.filter(p => p.status === 'in-progress').length,
      completed: projects.filter(p => p.status === 'completed').length,
      onHold: projects.filter(p => p.status === 'on-hold').length,
    };

    return byStatus;
  }, [projects]);

  // Weekly task completion data
  const weeklyTaskData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const completedOnDay = tasks.filter(t => 
        t.status === 'completed' && 
        t.updated_at && 
        format(new Date(t.updated_at), 'yyyy-MM-dd') === dayStr
      ).length;

      return {
        day: format(day, 'EEE', { locale }),
        completed: completedOnDay
      };
    });
  }, [tasks, locale]);

  // Task priority distribution
  const priorityData = useMemo(() => {
    return [
      { name: isRTL ? 'عالية' : 'High', value: tasks.filter(t => t.priority === 'high').length, color: 'hsl(var(--priority-high))' },
      { name: isRTL ? 'متوسطة' : 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: 'hsl(var(--priority-medium))' },
      { name: isRTL ? 'منخفضة' : 'Low', value: tasks.filter(t => t.priority === 'low').length, color: 'hsl(var(--priority-low))' },
    ].filter(item => item.value > 0);
  }, [tasks, isRTL]);

  // Habit completion rate (last 7 days)
  const habitData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const completedCount = completions.filter(c => c.completed_date === dateStr).length;
      const rate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

      return {
        day: format(date, 'EEE', { locale }),
        rate,
        completed: completedCount
      };
    });

    return last7Days;
  }, [habits, completions, locale]);

  // Financial trends (last 7 days)
  const financialData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayIncome = transactions
        .filter(t => t.type === 'income' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayExpenses = transactions
        .filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        day: format(date, 'EEE', { locale }),
        income: dayIncome,
        expenses: dayExpenses
      };
    });

    return last7Days;
  }, [transactions, locale]);

  const isLoading = tasksLoading || projectsLoading || habitsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleExportPDF = () => {
    exportAnalyticsToPDF({
      period: isRTL ? 'الأسبوع الحالي' : 'This Week',
      tasksCompleted: taskStats.completed,
      tasksTotal: taskStats.total,
      focusHours: Math.round(totalFocusTime / 3600),
      habitsCompleted: completions.length,
      income,
      expenses,
      projectsActive: projectStats.inProgress,
    }, 'analytics-report');
    toast.success(isRTL ? 'تم تصدير التقرير' : 'Report exported');
  };

  return (
    <div className={cn('space-y-6 animate-fade-in', isRTL && 'rtl')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            {isRTL ? 'التحليلات والتقارير' : 'Analytics & Reports'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL ? 'نظرة عامة على أدائك' : 'Overview of your performance'}
          </p>
        </div>
        <Button onClick={handleExportPDF} className="gap-2">
          <Download className="w-4 h-4" />
          {isRTL ? 'تصدير PDF' : 'Export PDF'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'نسبة إنجاز المهام' : 'Task Completion'}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {taskStats.completionRate}%
                </p>
              </div>
              <div className={cn(
                'p-2 rounded-full',
                taskStats.completionRate >= 50 ? 'bg-success/10' : 'bg-warning/10'
              )}>
                <CheckCircle2 className={cn(
                  'w-5 h-5',
                  taskStats.completionRate >= 50 ? 'text-success' : 'text-warning'
                )} />
              </div>
            </div>
            <Progress value={taskStats.completionRate} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'وقت التركيز' : 'Focus Time'}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatDuration(totalFocusTime)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {sessions.length} {isRTL ? 'جلسات' : 'sessions'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'أفضل سلسلة' : 'Best Streak'}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {Math.max(...habits.map(h => h.best_streak || 0), 0)}
                </p>
              </div>
              <div className="p-2 rounded-full bg-warning/10">
                <Flame className="w-5 h-5 text-warning" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {isRTL ? 'أيام متتالية' : 'consecutive days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'صافي الأرباح' : 'Net Income'}
                </p>
                <p className={cn(
                  'text-2xl font-bold mt-1',
                  income - expenses >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  ${(income - expenses).toLocaleString()}
                </p>
              </div>
              <div className={cn(
                'p-2 rounded-full',
                income - expenses >= 0 ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                {income - expenses >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-success" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Task Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {isRTL ? 'المهام المكتملة هذا الأسبوع' : 'Tasks Completed This Week'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyTaskData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {isRTL ? 'توزيع الأولويات' : 'Priority Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {priorityData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habit Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-warning" />
              {isRTL ? 'نسبة إنجاز العادات' : 'Habit Completion Rate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={habitData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`${value}%`, isRTL ? 'نسبة الإنجاز' : 'Completion Rate']}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--warning))" 
                  fill="hsl(var(--warning) / 0.2)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Financial Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              {isRTL ? 'الاتجاه المالي' : 'Financial Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  name={isRTL ? 'الدخل' : 'Income'}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  name={isRTL ? 'المصروفات' : 'Expenses'}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {isRTL ? 'حالة المشاريع' : 'Project Status Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-status-new/10 border border-status-new/20">
              <p className="text-2xl font-bold text-status-new">{projectStats.new}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'جديدة' : 'New'}</p>
            </div>
            <div className="p-4 rounded-lg bg-status-progress/10 border border-status-progress/20">
              <p className="text-2xl font-bold text-status-progress">{projectStats.inProgress}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'قيد التنفيذ' : 'In Progress'}</p>
            </div>
            <div className="p-4 rounded-lg bg-status-completed/10 border border-status-completed/20">
              <p className="text-2xl font-bold text-status-completed">{projectStats.completed}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'مكتملة' : 'Completed'}</p>
            </div>
            <div className="p-4 rounded-lg bg-status-hold/10 border border-status-hold/20">
              <p className="text-2xl font-bold text-status-hold">{projectStats.onHold}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? 'معلقة' : 'On Hold'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
