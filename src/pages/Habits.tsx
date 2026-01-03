import { useState } from 'react';
import { Plus, Flame, TrendingUp, Loader2, Check } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

export default function Habits() {
  const { habits, loading, addHabit, isCompletedOnDate, toggleHabitCompletion } = useHabits();
  const [dialogOpen, setDialogOpen] = useState(false);
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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="Habit name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  placeholder="Habit description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon (emoji)</Label>
                  <Input
                    id="icon"
                    value={newHabit.icon}
                    onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                    placeholder="⭐"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={newHabit.color}
                    onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCreateHabit} className="w-full">
                Create Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-warning/10">
              <Flame className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCurrentStreak}</p>
              <p className="text-sm text-muted-foreground">Total Streak Days</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
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
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedToday}/{habits.length}</p>
              <p className="text-sm text-muted-foreground">Completed Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Today's Habits</h2>
        <div className="space-y-3">
          {habits.map((habit) => {
            const isCompleted = isCompletedOnDate(habit.id, today);
            return (
              <div 
                key={habit.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200"
              >
                <Button
                  variant={isCompleted ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => toggleHabitCompletion(habit.id, today)}
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
          })}
        </div>

        {habits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No habits yet. Start building your routine!</p>
          </div>
        )}
      </div>
    </div>
  );
}
