import { Clock, CalendarDays, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TimeOverviewCardsProps {
  todayEstimated: number;
  todayActual: number;
  todayTaskCount: number;
  tomorrowEstimated: number;
  tomorrowTaskCount: number;
}

export function TimeOverviewCards({
  todayEstimated,
  todayActual,
  todayTaskCount,
  tomorrowEstimated,
  tomorrowTaskCount,
}: TimeOverviewCardsProps) {
  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const todayRemaining = Math.max(0, todayEstimated - todayActual);
  const todayProgress = todayEstimated > 0 ? (todayActual / todayEstimated) * 100 : 0;
  const isOverloaded = tomorrowEstimated > 480; // 8 hours

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Today's Workload */}
      <div className="blitzit-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Today's Workload</h3>
              <p className="text-xs text-muted-foreground">{todayTaskCount} tasks</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-foreground">{formatTime(todayEstimated)}</span>
            <span className="text-sm text-muted-foreground">estimated</span>
          </div>
          
          <Progress value={todayProgress} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatTime(todayActual)} completed
            </span>
            <span className="text-primary font-medium">
              {formatTime(todayRemaining)} remaining
            </span>
          </div>
        </div>
      </div>

      {/* Tomorrow's Workload */}
      <div className={cn(
        "blitzit-card p-5",
        isOverloaded && "border-destructive/50"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isOverloaded ? "bg-destructive/10" : "bg-secondary"
            )}>
              <CalendarDays className={cn(
                "w-5 h-5",
                isOverloaded ? "text-destructive" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Tomorrow's Workload</h3>
              <p className="text-xs text-muted-foreground">{tomorrowTaskCount} tasks scheduled</p>
            </div>
          </div>
          {isOverloaded && (
            <AlertCircle className="w-5 h-5 text-destructive" />
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className={cn(
              "text-3xl font-bold",
              isOverloaded ? "text-destructive" : "text-foreground"
            )}>
              {formatTime(tomorrowEstimated)}
            </span>
            <span className="text-sm text-muted-foreground">estimated</span>
          </div>
          
          {isOverloaded && (
            <p className="text-xs text-destructive">
              Heavy workload! Consider rescheduling some tasks.
            </p>
          )}
          
          {!isOverloaded && tomorrowTaskCount === 0 && (
            <p className="text-xs text-muted-foreground">
              No tasks scheduled yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
