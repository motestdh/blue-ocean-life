import { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeTrackerProps {
  taskId: string;
  actualTime?: number | null;
  onTimeUpdate: (taskId: string, time: number) => void;
}

export function TimeTracker({ taskId, actualTime = 0, onTimeUpdate }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState((actualTime || 0) * 3600); // Convert hours to seconds
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Date.now());
  };

  const handlePause = () => {
    setIsRunning(false);
    // Save time to database (convert seconds to hours)
    onTimeUpdate(taskId, seconds / 3600);
  };

  const handleStop = () => {
    setIsRunning(false);
    // Save final time to database
    onTimeUpdate(taskId, seconds / 3600);
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-md',
        isRunning ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      )}>
        <Clock className="w-3 h-3" />
        <span>{formatTime(seconds)}</span>
      </div>
      
      {!isRunning ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleStart}
        >
          <Play className="w-3 h-3" />
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handlePause}
          >
            <Pause className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={handleStop}
          >
            <Square className="w-3 h-3" />
          </Button>
        </>
      )}
    </div>
  );
}
