import { useState } from 'react';
import { Plus, Flame, TrendingUp, Loader2, Check, Trash2, Target, Edit2 } from 'lucide-react';
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
import type { Database } from '@/integrations/supabase/types';

type Habit = Database['public']['Tables']['habits']['Row'];

const EMOJI_OPTIONS = ['⭐', '💪', '📚', '🏃', '💧', '🧘', '✍️', '🎯', '💤', '🍎'];
const COLOR_OPTIONS = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function Habits() {
  const { habits, loading, addHabit, updateHabit, deleteHabit, isCompletedOnDate, toggleHabitCompletion } = useHabits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null);
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

      {/* Today's Progress */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Today's Progress</p>
              <p className="text-sm text-muted-foreground">{completedToday} of {habits.length} habits completed</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-primary">{Math.round(completionRate)}%</p>
        </div>
        <Progress value={completionRate} className="h-3" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCurrentStreak}</p>
              <p className="text-sm text-muted-foreground">Total Streak Days</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalBestStreak}</p>
              <p className="text-sm text-muted-foreground">Best Streak</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{habits.length}</p>
              <p className="text-sm text-muted-foreground">Active Habits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Today's Habits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((habit) => {
            const isCompleted = isCompletedOnDate(habit.id, today);
            return (
              <div 
                key={habit.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border bg-card transition-all duration-200 group',
                  isCompleted ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border hover:border-primary/30'
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
      <EditHabitDialog
        habit={editingHabit}
        open={!!editingHabit}
        onOpenChange={(open) => !open && setEditingHabit(null)}
        onSave={updateHabit}
      />

      {/* Delete Confirmation */}
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
    </div>
  );
}
