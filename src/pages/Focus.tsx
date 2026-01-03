import { useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, SkipForward, Zap, Coffee, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export default function Focus() {
  const { tasks, loading } = useTasks();
  const { 
    focusTimerRunning, 
    focusTimeRemaining, 
    activeFocusTask,
    startFocus,
    pauseFocus, 
    stopFocus, 
    tickFocus
  } = useAppStore();

  const activeTask = tasks.find(t => t.id === activeFocusTask);
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (focusTimerRunning && focusTimeRemaining > 0) {
      interval = setInterval(() => {
        tickFocus();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusTimerRunning, focusTimeRemaining, tickFocus]);

  const minutes = Math.floor(focusTimeRemaining / 60);
  const seconds = focusTimeRemaining % 60;
  const progress = ((25 * 60 - focusTimeRemaining) / (25 * 60)) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
          <Zap className="w-8 h-8 text-primary" />
          Focus Mode
        </h1>
        <p className="text-muted-foreground mt-2">
          Eliminate distractions. Get in the zone. Complete your tasks.
        </p>
      </div>

      {/* Timer */}
      <div className="bg-card rounded-2xl border border-border p-8 text-center">
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="8"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={553}
              strokeDashoffset={553 - (553 * progress) / 100}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-foreground tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {focusTimerRunning ? 'Focus time' : 'Paused'}
            </span>
          </div>
        </div>

        {activeTask && (
          <div className="mb-6 p-4 rounded-xl bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Working on</p>
            <p className="font-semibold text-foreground">{activeTask.title}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={stopFocus}
            className="h-12 w-12 rounded-full"
          >
            <Square className="h-5 w-5" />
          </Button>
          
          <Button
            size="icon"
            onClick={pauseFocus}
            className={cn(
              'h-16 w-16 rounded-full shadow-glow transition-all duration-300',
              focusTimerRunning && 'animate-pulse-soft'
            )}
          >
            {focusTimerRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Session Type Selection */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" className="gap-2 h-12 px-6">
          <Play className="w-4 h-4" />
          25 min Focus
        </Button>
        <Button variant="outline" className="gap-2 h-12 px-6">
          <Coffee className="w-4 h-4" />
          5 min Break
        </Button>
        <Button variant="outline" className="gap-2 h-12 px-6">
          <Coffee className="w-4 h-4" />
          15 min Break
        </Button>
      </div>

      {/* Task Queue */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Task Queue</h2>

        <div className="space-y-2">
          {pendingTasks.slice(0, 5).map((task) => (
            <div 
              key={task.id} 
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer',
                activeFocusTask === task.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => startFocus(task.id)}
            >
              <Checkbox checked={task.status === 'completed'} disabled />
              <div className="flex-1">
                <p className="font-medium text-foreground">{task.title}</p>
              </div>
              {activeFocusTask !== task.id && (
                <Button size="sm" variant="ghost" className="gap-1">
                  <Play className="w-3 h-3" />
                  Focus
                </Button>
              )}
            </div>
          ))}
        </div>

        {pendingTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks in queue. Add some tasks to focus on!</p>
          </div>
        )}
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">0</p>
          <p className="text-sm text-muted-foreground">Sessions Today</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">0h 0m</p>
          <p className="text-sm text-muted-foreground">Time Focused</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">0</p>
          <p className="text-sm text-muted-foreground">Tasks Completed</p>
        </div>
      </div>
    </div>
  );
}
