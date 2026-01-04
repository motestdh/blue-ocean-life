import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { useFocusSessions } from '@/hooks/useFocusSessions';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, SkipForward, Zap, Coffee, Loader2, Check, Timer, Target, Flame } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const taskIdFromUrl = searchParams.get('task');
  
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
  const [autoStarted, setAutoStarted] = useState(false);

  const activeTask = tasks.find(t => t.id === activeFocusTask);
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  // Auto-select and start task from URL parameter
  useEffect(() => {
    if (taskIdFromUrl && !autoStarted && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskIdFromUrl);
      if (task && task.status !== 'completed') {
        setActiveFocusTask(taskIdFromUrl);
        setAutoStarted(true);
        // Auto-start the focus session
        handleStart(taskIdFromUrl);
      }
    }
  }, [taskIdFromUrl, tasks, autoStarted]);

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
  const circumference = 2 * Math.PI * 140; // radius = 140

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Session Type Tabs */}
      <div className="flex items-center justify-center">
        <div className="blitzit-card inline-flex p-1.5 gap-1">
          <button 
            className={cn(
              'px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2',
              sessionType === 'focus' 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
            onClick={() => changeSessionType('focus')}
            disabled={isRunning}
          >
            <Zap className="w-4 h-4" />
            Focus
          </button>
          <button 
            className={cn(
              'px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2',
              sessionType === 'short-break' 
                ? 'bg-emerald-500 text-white shadow-lg' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
            onClick={() => changeSessionType('short-break')}
            disabled={isRunning}
          >
            <Coffee className="w-4 h-4" />
            Short Break
          </button>
          <button 
            className={cn(
              'px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2',
              sessionType === 'long-break' 
                ? 'bg-emerald-500 text-white shadow-lg' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
            onClick={() => changeSessionType('long-break')}
            disabled={isRunning}
          >
            <Coffee className="w-4 h-4" />
            Long Break
          </button>
        </div>
      </div>

      {/* Main Timer Card */}
      <div className="blitzit-card p-10 text-center relative overflow-hidden">
        {/* Background glow effect */}
        <div 
          className={cn(
            'absolute inset-0 opacity-20 blur-3xl transition-all duration-1000',
            sessionType === 'focus' ? 'bg-primary' : 'bg-emerald-500',
            isRunning && 'animate-pulse'
          )} 
        />
        
        <div className="relative z-10">
          {/* Timer Circle */}
          <div className="relative w-80 h-80 mx-auto mb-8">
            {/* Outer glow ring */}
            <div 
              className={cn(
                'absolute inset-0 rounded-full transition-all duration-500',
                isRunning && sessionType === 'focus' && 'shadow-[0_0_60px_rgba(var(--primary),0.4)]',
                isRunning && sessionType !== 'focus' && 'shadow-[0_0_60px_rgba(16,185,129,0.4)]'
              )}
            />
            
            {/* SVG Timer */}
            <svg className="w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 320 320">
              {/* Background circle */}
              <circle
                cx="160"
                cy="160"
                r="140"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="12"
                opacity="0.3"
              />
              {/* Progress circle */}
              <circle
                cx="160"
                cy="160"
                r="140"
                fill="none"
                stroke={sessionType === 'focus' ? 'hsl(var(--primary))' : 'rgb(16, 185, 129)'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * progress) / 100}
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: isRunning ? 'drop-shadow(0 0 10px currentColor)' : 'none'
                }}
              />
              {/* Tick marks */}
              {[...Array(60)].map((_, i) => (
                <line
                  key={i}
                  x1="160"
                  y1="30"
                  x2="160"
                  y2={i % 5 === 0 ? "40" : "35"}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={i % 5 === 0 ? "2" : "1"}
                  opacity={i % 5 === 0 ? "0.5" : "0.2"}
                  transform={`rotate(${i * 6} 160 160)`}
                />
              ))}
            </svg>
            
            {/* Timer content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span 
                className={cn(
                  'text-7xl font-bold tabular-nums tracking-tight transition-all duration-300',
                  isRunning ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {String(minutes).padStart(2, '0')}
                <span className={cn(isRunning && 'animate-pulse')}>:</span>
                {String(seconds).padStart(2, '0')}
              </span>
              <span className={cn(
                'text-sm font-medium mt-2 px-4 py-1 rounded-full',
                sessionType === 'focus' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-emerald-500/20 text-emerald-400'
              )}>
                {isRunning 
                  ? (sessionType === 'focus' ? '🔥 Deep Focus' : '☕ Break Time') 
                  : 'Ready to start'
                }
              </span>
            </div>
          </div>

          {/* Active Task Display */}
          {activeTask && (
            <div className="mb-8 mx-auto max-w-md">
              <div className="blitzit-card p-4 border-primary/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Working on</p>
                    <p className="font-semibold text-foreground">{activeTask.title}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={() => handleTaskComplete(activeTask.id)}
                >
                  <Check className="w-4 h-4" />
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleStop}
              className="h-14 w-14 rounded-full border-2 hover:bg-destructive/20 hover:border-destructive hover:text-destructive transition-all duration-300"
            >
              <Square className="h-5 w-5" />
            </Button>
            
            <Button
              size="icon"
              onClick={isRunning ? handlePause : () => handleStart(activeFocusTask || undefined)}
              className={cn(
                'h-20 w-20 rounded-full shadow-2xl transition-all duration-300 relative',
                sessionType === 'focus' 
                  ? 'bg-primary hover:bg-primary/90' 
                  : 'bg-emerald-500 hover:bg-emerald-600',
                isRunning && 'shadow-[0_0_30px_rgba(var(--primary),0.5)]'
              )}
            >
              {isRunning && (
                <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
              )}
              {isRunning ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleSkip}
              className="h-14 w-14 rounded-full border-2 hover:bg-muted transition-all duration-300"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Task Queue */}
        <div className="blitzit-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Task Queue
            </h2>
            <span className="text-sm text-muted-foreground">{pendingTasks.length} tasks</span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {pendingTasks.slice(0, 8).map((task) => (
              <div 
                key={task.id} 
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer group',
                  activeFocusTask === task.id
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                    : 'border-border/50 hover:border-primary/50 hover:bg-white/5'
                )}
                onClick={() => !isRunning && setActiveFocusTask(task.id)}
              >
                <Checkbox 
                  checked={task.status === 'completed'} 
                  onCheckedChange={() => handleTaskComplete(task.id)}
                  className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{task.title}</p>
                  {task.estimated_time && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {task.estimated_time}m estimated
                    </p>
                  )}
                </div>
                {activeFocusTask !== task.id && !isRunning && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStart(task.id);
                    }}
                  >
                    <Play className="w-3 h-3" />
                    Start
                  </Button>
                )}
              </div>
            ))}
          </div>

          {pendingTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tasks in queue</p>
              <p className="text-sm">Add some tasks to focus on!</p>
            </div>
          )}
        </div>

        {/* Session Stats */}
        <div className="space-y-4">
          <div className="blitzit-card p-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              Today's Progress
            </h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <p className="text-3xl font-bold text-primary">{sessionsToday}</p>
                <p className="text-xs text-muted-foreground mt-1">Sessions</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20">
                <p className="text-3xl font-bold text-emerald-400">{formatDuration(totalFocusTime)}</p>
                <p className="text-xs text-muted-foreground mt-1">Focus Time</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20">
                <p className="text-3xl font-bold text-orange-400">{tasksCompleted}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="blitzit-card p-6">
            <h3 className="font-semibold text-foreground mb-3">💡 Focus Tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Put your phone in another room
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Close unnecessary browser tabs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Use noise-canceling headphones
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Take breaks to stay fresh
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
