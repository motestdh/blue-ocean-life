import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { AddEventDialog } from '@/components/calendar/AddEventDialog';
import { toast } from '@/hooks/use-toast';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { tasks, addTask } = useTasks();
  const { habits } = useHabits();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(t => t.due_date === dateStr);
    
    // Add habits as daily events
    const dayOfWeek = date.getDay();
    const dailyHabits = habits.filter(h => h.frequency === 'daily').map(h => ({
      id: `habit-${h.id}`,
      title: `${h.icon} ${h.name}`,
      type: 'habit' as const,
      color: h.color,
    }));

    return [
      ...dayTasks.map(t => ({
        id: t.id,
        title: t.title,
        type: 'task' as const,
        priority: t.priority,
      })),
      ...dailyHabits,
    ];
  };

  const handleAddEvent = async (data: {
    title: string;
    description: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
  }) => {
    const result = await addTask({
      title: data.title,
      description: data.description,
      due_date: data.due_date,
      priority: data.priority,
    });
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      return { error: result.error };
    }
    
    toast({ title: 'Success', description: 'Event added to calendar!' });
    return {};
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setAddEventOpen(true);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      default: return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View all your deadlines, events, and habits
          </p>
        </div>
        <Button className="gap-2" onClick={() => {
          setSelectedDate(new Date());
          setAddEventOpen(true);
        }}>
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const events = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={index}
                className={cn(
                  'min-h-[100px] p-2 border-b border-r border-border last:border-r-0 transition-colors hover:bg-muted/50 cursor-pointer',
                  !isCurrentMonth && 'bg-muted/30'
                )}
                onClick={() => handleDayClick(day)}
              >
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1',
                  isCurrentDay && 'bg-primary text-primary-foreground font-semibold',
                  !isCurrentMonth && 'text-muted-foreground'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs p-1 rounded border truncate',
                        event.type === 'habit' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : getPriorityColor(event.priority || 'low')
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{events.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Event Dialog */}
      <AddEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        selectedDate={selectedDate}
        onAddTask={handleAddEvent}
      />
    </div>
  );
}
