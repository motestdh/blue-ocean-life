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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      {/* Today's Workload */}
      <div className="blitzit-card p-3 md:p-5">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">Today's Workload</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground">{todayTaskCount} tasks</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl md:text-3xl font-bold text-foreground">{formatTime(todayEstimated)}</span>
            <span className="text-xs md:text-sm text-muted-foreground">estimated</span>
          </div>
          
          <Progress value={todayProgress} className="h-1.5 md:h-2" />
          
          <div className="flex items-center justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">
              {formatTime(todayActual)} done
            </span>
            <span className="text-primary font-medium">
              {formatTime(todayRemaining)} left
            </span>
          </div>
        </div>
      </div>

      {/* Tomorrow's Workload */}
      <div className={cn(
        "blitzit-card p-3 md:p-5",
        isOverloaded && "border-destructive/50"
      )}>
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center",
              isOverloaded ? "bg-destructive/10" : "bg-secondary"
            )}>
              <CalendarDays className={cn(
                "w-4 h-4 md:w-5 md:h-5",
                isOverloaded ? "text-destructive" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">Tomorrow</h3>
              <p className="text-[10px] md:text-xs text-muted-foreground">{tomorrowTaskCount} tasks</p>
            </div>
          </div>
          {isOverloaded && (
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-destructive" />
          )}
        </div>
        
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-baseline justify-between">
            <span className={cn(
              "text-2xl md:text-3xl font-bold",
              isOverloaded ? "text-destructive" : "text-foreground"
            )}>
              {formatTime(tomorrowEstimated)}
            </span>
            <span className="text-xs md:text-sm text-muted-foreground">estimated</span>
          </div>
          
          {isOverloaded && (
            <p className="text-[10px] md:text-xs text-destructive">
              Heavy workload! Consider rescheduling.
            </p>
          )}
          
          {!isOverloaded && tomorrowTaskCount === 0 && (
            <p className="text-[10px] md:text-xs text-muted-foreground">
              No tasks scheduled
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
