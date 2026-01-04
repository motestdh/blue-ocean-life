import { useState, useMemo } from 'react';
import { Plus, Flame, TrendingUp, Loader2, Check, Trash2, Target, Edit2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { EditHabitDialog } from '@/components/dialogs/EditHabitDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Database } from '@/integrations/supabase/types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isToday, subMonths, addMonths, subWeeks, addWeeks } from 'date-fns';

type Habit = Database['public']['Tables']['habits']['Row'];

const EMOJI_OPTIONS = ['⭐', '💪', '📚', '🏃', '💧', '🧘', '✍️', '🎯', '💤', '🍎'];
const COLOR_OPTIONS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function Habits() {
  const { habits, completions, loading, addHabit, updateHabit, deleteHabit, isCompletedOnDate, toggleHabitCompletion } = useHabits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    icon: '⭐',
    color: '#0EA5E9',
  });

  const today = new Date().toISOString().split('T')[0];
  const totalCurrentStreak = habits.reduce((sum, h) => sum + (h.current_streak || 0), 0);
  const totalBestStreak = habits.reduce((sum, h) => sum + (h.best_streak || 0), 0);
  const completedToday = habits.filter(h => isCompletedOnDate(h.id, today)).length;
  const completionRate = habits.length > 0 ? (completedToday / habits.length) * 100 : 0;

  // Week days for the current week
  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
    });
  }, [currentWeekStart]);

  // Monthly calendar days
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const totalPossible = habits.length * 7;
    let completed = 0;
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      habits.forEach(habit => {
        if (isCompletedOnDate(habit.id, dateStr)) completed++;
      });
    });
    return {
      completed,
      total: totalPossible,
      percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0,
    };
  }, [habits, weekDays, isCompletedOnDate]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
    const totalPossible = habits.length * daysInMonth.length;
    let completed = 0;
    daysInMonth.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      habits.forEach(habit => {
        if (isCompletedOnDate(habit.id, dateStr)) completed++;
      });
    });
    return {
      completed,
      total: totalPossible,
      percentage: totalPossible > 0 ? (completed / totalPossible) * 100 : 0,
      daysInMonth: daysInMonth.length,
    };
  }, [habits, currentMonth, isCompletedOnDate]);

  // Get completion count for a specific day (for heatmap intensity)
  const getDayCompletionData = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let completed = 0;
    habits.forEach(habit => {
      if (isCompletedOnDate(habit.id, dateStr)) completed++;
    });
    return {
      completed,
      total: habits.length,
      percentage: habits.length > 0 ? (completed / habits.length) * 100 : 0,
    };
  };

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    const result = await addHabit({
      name: newHabit.name,
      description: newHabit.description,
      icon: newHabit.icon,
      color: newHabit.color,
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Habit created!' });
      setDialogOpen(false);
      setNewHabit({ name: '', description: '', icon: '⭐', color: '#0EA5E9' });
    }
  };

  const handleDeleteHabit = async () => {
    if (!deletingHabit) return;
    
    const result = await deleteHabit(deletingHabit.id);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Habit deleted!' });
    }
    setDeletingHabit(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Habits</h1>
          <p className="text-muted-foreground mt-1">
            Build better habits, one day at a time
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="e.g., Drink water, Exercise"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  placeholder="Why is this habit important?"
                />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, icon: emoji })}
                      className={cn(
                        'w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all',
                        newHabit.icon === emoji 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, color })}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        newHabit.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateHabit} className="w-full">
                Create Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="blitzit-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{Math.round(completionRate)}%</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
          </div>
        </div>

        <div className="blitzit-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10">
              <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{Math.round(weeklyStats.percentage)}%</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>

        <div className="blitzit-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCurrentStreak}</p>
              <p className="text-sm text-muted-foreground">Total Streak</p>
            </div>
          </div>
        </div>

        <div className="blitzit-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalBestStreak}</p>
              <p className="text-sm text-muted-foreground">Best Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Weekly/Monthly View */}
      <Tabs defaultValue="week" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="week">Weekly View</TabsTrigger>
          <TabsTrigger value="month">Monthly View</TabsTrigger>
        </TabsList>

        {/* Weekly View */}
        <TabsContent value="week" className="space-y-4">
          <div className="blitzit-card p-6">
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">
                  {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {weeklyStats.completed} of {weeklyStats.total} completed ({Math.round(weeklyStats.percentage)}%)
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Weekly Progress Bar */}
            <div className="mb-6">
              <Progress value={weeklyStats.percentage} className="h-3" />
            </div>

            {/* Weekly Habit Grid */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4 text-sm font-medium text-muted-foreground min-w-[150px]">Habit</th>
                    {weekDays.map((day) => (
                      <th key={day.toISOString()} className="text-center py-2 px-1">
                        <div className={cn(
                          'text-xs font-medium',
                          isToday(day) ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {format(day, 'EEE')}
                        </div>
                        <div className={cn(
                          'text-sm font-semibold mt-0.5',
                          isToday(day) ? 'text-primary' : 'text-foreground'
                        )}>
                          {format(day, 'd')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit) => (
                    <tr key={habit.id} className="border-t border-border/50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{habit.icon}</span>
                          <span className="font-medium text-foreground text-sm truncate max-w-[120px]">
                            {habit.name}
                          </span>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const isCompleted = isCompletedOnDate(habit.id, dateStr);
                        const isFuture = day > new Date();
                        return (
                          <td key={day.toISOString()} className="text-center py-3 px-1">
                            <button
                              onClick={() => !isFuture && toggleHabitCompletion(habit.id, dateStr)}
                              disabled={isFuture}
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all',
                                isCompleted 
                                  ? 'shadow-sm' 
                                  : isFuture
                                    ? 'bg-muted/30 cursor-not-allowed'
                                    : 'bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/30',
                                isToday(day) && !isCompleted && 'ring-2 ring-primary/30'
                              )}
                              style={{
                                backgroundColor: isCompleted ? habit.color || '#0EA5E9' : undefined,
                              }}
                            >
                              {isCompleted && <Check className="w-4 h-4 text-white" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {habits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No habits yet. Create one to start tracking!</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Monthly View */}
        <TabsContent value="month" className="space-y-4">
          <div className="blitzit-card p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <h3 className="font-semibold text-foreground text-lg">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {monthlyStats.completed} of {monthlyStats.total} completed ({Math.round(monthlyStats.percentage)}%)
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Monthly Progress Bar */}
            <div className="mb-6">
              <Progress value={monthlyStats.percentage} className="h-3" />
            </div>

            {/* Monthly Heatmap Calendar */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {monthDays.map((day) => {
                const dayData = getDayCompletionData(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const isFuture = day > new Date();
                
                // Calculate intensity for heatmap (0-4 levels)
                let intensity = 0;
                if (dayData.percentage >= 100) intensity = 4;
                else if (dayData.percentage >= 75) intensity = 3;
                else if (dayData.percentage >= 50) intensity = 2;
                else if (dayData.percentage >= 25) intensity = 1;
                else if (dayData.completed > 0) intensity = 1;
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative',
                      !isCurrentMonth && 'opacity-30',
                      isTodayDate && 'ring-2 ring-primary',
                      isFuture && 'opacity-50'
                    )}
                    style={{
                      backgroundColor: intensity > 0 && !isFuture
                        ? `hsl(var(--primary) / ${intensity * 0.2 + 0.1})`
                        : 'hsl(var(--muted) / 0.3)',
                    }}
                  >
                    <span className={cn(
                      'font-medium',
                      isTodayDate ? 'text-primary' : 'text-foreground'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {isCurrentMonth && !isFuture && habits.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {dayData.completed}/{dayData.total}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: level === 0 
                        ? 'hsl(var(--muted) / 0.3)'
                        : `hsl(var(--primary) / ${level * 0.2 + 0.1})`,
                    }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Per-Habit Monthly Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map((habit) => {
              const daysInMonth = eachDayOfInterval({
                start: startOfMonth(currentMonth),
                end: endOfMonth(currentMonth),
              });
              let habitCompleted = 0;
              daysInMonth.forEach(day => {
                if (isCompletedOnDate(habit.id, format(day, 'yyyy-MM-dd'))) {
                  habitCompleted++;
                }
              });
              const habitPercentage = (habitCompleted / daysInMonth.length) * 100;

              return (
                <div key={habit.id} className="blitzit-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      {habit.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{habit.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {habitCompleted} of {daysInMonth.length} days ({Math.round(habitPercentage)}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-foreground">{habit.current_streak || 0}</span>
                    </div>
                  </div>
                  <Progress 
                    value={habitPercentage} 
                    className="h-2"
                    style={{ 
                      '--progress-background': habit.color 
                    } as React.CSSProperties}
                  />
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Today's Habits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Today's Habits</h2>
          <div className="text-sm text-muted-foreground">
            {completedToday}/{habits.length} completed
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const isCompleted = isCompletedOnDate(habit.id, today);
            return (
              <div 
                key={habit.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl blitzit-card transition-all duration-200 group hover-lift',
                  isCompleted ? 'border-emerald-500/50 bg-emerald-500/5' : 'hover:border-primary/30'
                )}
              >
                <button
                  onClick={() => toggleHabitCompletion(habit.id, today)}
                  className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0',
                    isCompleted 
                      ? 'shadow-lg' 
                      : 'border-2 hover:scale-105'
                  )}
                  style={{ 
                    backgroundColor: isCompleted ? (habit.color || '#0EA5E9') : 'transparent',
                    borderColor: habit.color || '#0EA5E9'
                  }}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6 text-white" />
                  ) : (
                    <span className="text-2xl">{habit.icon}</span>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium transition-all',
                    isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}>
                    {habit.name}
                  </p>
                  {habit.description && (
                    <p className="text-sm text-muted-foreground truncate">{habit.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-foreground">{habit.current_streak || 0}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEditingHabit(habit)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => setDeletingHabit(habit)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {habits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No habits yet</p>
            <p className="text-sm mt-1">Start building your daily routine!</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingHabit && (
        <EditHabitDialog
          habit={editingHabit}
          open={!!editingHabit}
          onOpenChange={(open) => !open && setEditingHabit(null)}
          onSave={updateHabit}
        />
      )}

      {/* Delete Confirmation */}
      {deletingHabit && (
        <AlertDialog open={!!deletingHabit} onOpenChange={(open) => !open && setDeletingHabit(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Habit</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingHabit?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteHabit} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
