import { useEffect, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, SkipForward, Zap, Coffee, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

type SessionType = 'focus' | 'short-break' | 'long-break';

const SESSION_DURATIONS: Record<SessionType, number> = {
  'focus': 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

export default function Focus() {
  const { tasks, loading, updateTask } = useTasks();
  const { 
    sessionsToday, 
    totalFocusTime, 
    tasksCompleted, 
    formatDuration,
    startSession,
    endSession,
    activeSession,
  } = useFocusSessions();
  
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATIONS['focus']);
  const [isRunning, setIsRunning] = useState(false);
  const [activeFocusTask, setActiveFocusTask] = useState<string | null>(null);

  const activeTask = tasks.find(t => t.id === activeFocusTask);
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    if (sessionType === 'focus') {
      await endSession(true);
      toast({ title: '🎉 Focus session complete!', description: 'Great work! Take a break.' });
    } else {
      toast({ title: 'Break over!', description: 'Ready to focus again?' });
    }
    
    // Auto switch to next session type
    if (sessionType === 'focus') {
      setSessionType('short-break');
      setTimeRemaining(SESSION_DURATIONS['short-break']);
    } else {
      setSessionType('focus');
      setTimeRemaining(SESSION_DURATIONS['focus']);
    }
  };

  const handleStart = async (taskId?: string) => {
    if (sessionType === 'focus' && !activeSession) {
      await startSession(taskId, 'focus');
    }
    if (taskId) setActiveFocusTask(taskId);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(prev => !prev);
  };

  const handleStop = async () => {
    setIsRunning(false);
    if (activeSession) {
      await endSession(false);
    }
    setTimeRemaining(SESSION_DURATIONS[sessionType]);
    setActiveFocusTask(null);
  };

  const handleSkip = () => {
    setTimeRemaining(0);
  };

  const handleTaskComplete = async (taskId: string) => {
    await updateTask(taskId, { status: 'completed' });
    if (activeFocusTask === taskId) {
      setActiveFocusTask(null);
    }
    toast({ title: '✅ Task completed!' });
  };

  const changeSessionType = (type: SessionType) => {
    if (isRunning) return;
    setSessionType(type);
    setTimeRemaining(SESSION_DURATIONS[type]);
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = ((SESSION_DURATIONS[sessionType] - timeRemaining) / SESSION_DURATIONS[sessionType]) * 100;

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
      <div className="blitzit-card p-8 text-center">
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
              stroke={sessionType === 'focus' ? 'hsl(var(--primary))' : 'hsl(142 76% 36%)'}
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
              {isRunning ? (sessionType === 'focus' ? 'Focus time' : 'Break time') : 'Paused'}
            </span>
          </div>
        </div>

        {activeTask && (
          <div className="mb-6 p-4 rounded-xl bg-muted/50 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Working on</p>
              <p className="font-semibold text-foreground">{activeTask.title}</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2"
              onClick={() => handleTaskComplete(activeTask.id)}
            >
              <Check className="w-4 h-4" />
              Done
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleStop}
            className="h-12 w-12 rounded-full"
          >
            <Square className="h-5 w-5" />
          </Button>
          
          <Button
            size="icon"
            onClick={isRunning ? handlePause : () => handleStart(activeFocusTask || undefined)}
            className={cn(
              'h-16 w-16 rounded-full shadow-glow transition-all duration-300',
              isRunning && 'animate-pulse-soft'
            )}
          >
            {isRunning ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleSkip}
            className="h-12 w-12 rounded-full"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Session Type Selection */}
      <div className="flex items-center justify-center gap-4">
        <Button 
          variant={sessionType === 'focus' ? 'default' : 'outline'} 
          className="gap-2 h-12 px-6"
          onClick={() => changeSessionType('focus')}
          disabled={isRunning}
        >
          <Play className="w-4 h-4" />
          25 min Focus
        </Button>
        <Button 
          variant={sessionType === 'short-break' ? 'default' : 'outline'} 
          className="gap-2 h-12 px-6"
          onClick={() => changeSessionType('short-break')}
          disabled={isRunning}
        >
          <Coffee className="w-4 h-4" />
          5 min Break
        </Button>
        <Button 
          variant={sessionType === 'long-break' ? 'default' : 'outline'} 
          className="gap-2 h-12 px-6"
          onClick={() => changeSessionType('long-break')}
          disabled={isRunning}
        >
          <Coffee className="w-4 h-4" />
          15 min Break
        </Button>
      </div>

      {/* Task Queue */}
      <div className="blitzit-card p-6">
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
              onClick={() => !isRunning && setActiveFocusTask(task.id)}
            >
              <Checkbox 
                checked={task.status === 'completed'} 
                onCheckedChange={() => handleTaskComplete(task.id)}
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">{task.title}</p>
              </div>
              {activeFocusTask !== task.id && !isRunning && (
                <Button size="sm" variant="ghost" className="gap-1" onClick={(e) => {
                  e.stopPropagation();
                  handleStart(task.id);
                }}>
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
        <div className="blitzit-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{sessionsToday}</p>
          <p className="text-sm text-muted-foreground">Sessions Today</p>
        </div>
        <div className="blitzit-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{formatDuration(totalFocusTime)}</p>
          <p className="text-sm text-muted-foreground">Time Focused</p>
        </div>
        <div className="blitzit-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{tasksCompleted}</p>
          <p className="text-sm text-muted-foreground">Tasks Completed</p>
        </div>
      </div>
    </div>
  );
}
