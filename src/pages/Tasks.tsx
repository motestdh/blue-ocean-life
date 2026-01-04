import { useState, useEffect } from 'react';
import { Plus, Search, Calendar, CheckCircle2, Clock, Loader2, GripVertical, Play, Pause, LayoutList, Kanban, ChevronRight, ChevronDown } from 'lucide-react';
import { ExportButton } from '@/components/export/ExportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTasks } from '@/hooks/useTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { useAppStore } from '@/stores/useAppStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Task = Database['public']['Tables']['tasks']['Row'];

const priorityDotColors: Record<string, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

interface SortableTaskItemProps {
  task: Task;
  onToggle: () => void;
  onTimeUpdate: (taskId: string, time: number) => void;
  timerState: { [key: string]: { isRunning: boolean; seconds: number } };
  onTimerToggle: (taskId: string) => void;
  onAddSubtask: (parentId: string) => void;
  subtasks: Task[];
  allTasks: Task[];
}

function SortableTaskItem({ task, onToggle, onTimeUpdate, timerState, onTimerToggle, onAddSubtask, subtasks, allTasks }: SortableTaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const timer = timerState[task.id] || { isRunning: false, seconds: (task.actual_time || 0) * 3600 };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasSubtasks = subtasks.length > 0;

  return (
    <div className="space-y-1">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group flex items-center gap-3 p-3 rounded-xl blitzit-card hover:border-primary/30 transition-all duration-200',
          task.status === 'completed' && 'opacity-60',
          isDragging && 'opacity-50 shadow-lg'
        )}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "p-0.5 rounded hover:bg-muted transition-colors",
            !hasSubtasks && "invisible"
          )}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <Checkbox
          checked={task.status === 'completed'}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />

        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium text-foreground truncate',
            task.status === 'completed' && 'line-through text-muted-foreground'
          )}>
            {task.title}
            {hasSubtasks && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({subtasks.filter(s => s.status === 'completed').length}/{subtasks.length})
              </span>
            )}
          </p>
          {task.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Add Subtask Button */}
          {task.status !== 'completed' && (
            <button
              onClick={() => onAddSubtask(task.id)}
              className="p-1.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              title="Add subtask"
            >
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}

          {/* Time Tracker */}
          {task.status !== 'completed' && (
            <div className="flex items-center gap-1">
              <div className={cn(
                'flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-md',
                timer.isRunning ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                <Clock className="w-3 h-3" />
                <span>{formatTime(timer.seconds)}</span>
              </div>
              <button
                onClick={() => onTimerToggle(task.id)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                {timer.isRunning ? (
                  <Pause className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          <div className={cn('w-2 h-2 rounded-full', priorityDotColors[task.priority])} />
          
          {task.estimated_time && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{task.estimated_time}h</span>
            </div>
          )}
          
          {task.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(task.due_date), 'MMM d')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {expanded && hasSubtasks && (
        <div className="ml-8 pl-4 border-l-2 border-muted space-y-1">
          {subtasks.map((subtask) => (
            <SortableTaskItem
              key={subtask.id}
              task={subtask}
              onToggle={() => onToggle()}
              onTimeUpdate={onTimeUpdate}
              timerState={timerState}
              onTimerToggle={onTimerToggle}
              onAddSubtask={onAddSubtask}
              subtasks={allTasks.filter(t => t.parent_task_id === subtask.id)}
              allTasks={allTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const { tasks, loading, addTask, updateTask } = useTasks();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [timerState, setTimerState] = useState<{ [key: string]: { isRunning: boolean; seconds: number } }>({});
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const rtlEnabled = useAppStore((state) => state.rtlEnabled);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    due_date: '',
    parent_task_id: null as string | null,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize timer state from tasks
  useEffect(() => {
    const initialState: { [key: string]: { isRunning: boolean; seconds: number } } = {};
    tasks.forEach(task => {
      if (!timerState[task.id]) {
        initialState[task.id] = { isRunning: false, seconds: (task.actual_time || 0) * 3600 };
      }
    });
    if (Object.keys(initialState).length > 0) {
      setTimerState(prev => ({ ...prev, ...initialState }));
    }
  }, [tasks]);

  // Timer interval effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerState(prev => {
        const newState = { ...prev };
        let hasChanges = false;
        Object.keys(newState).forEach(taskId => {
          if (newState[taskId].isRunning) {
            newState[taskId] = { ...newState[taskId], seconds: newState[taskId].seconds + 1 };
            hasChanges = true;
          }
        });
        return hasChanges ? newState : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Sync local tasks with fetched tasks
  if (tasks.length > 0 && localTasks.length === 0) {
    setLocalTasks(tasks);
  }

  const displayTasks = localTasks.length > 0 ? localTasks : tasks;

  const today = new Date().toISOString().split('T')[0];
  
  // Filter only root tasks (no parent) for main display
  const rootTasks = displayTasks.filter(t => !t.parent_task_id);
  const todayTasks = rootTasks.filter(t => t.due_date === today);
  const upcomingTasks = rootTasks.filter(t => t.due_date && t.due_date > today && t.status !== 'completed');
  const completedTasks = rootTasks.filter(t => t.status === 'completed');
  const allActiveTasks = rootTasks.filter(t => t.status !== 'completed');

  const getSubtasks = (parentId: string) => displayTasks.filter(t => t.parent_task_id === parentId);

  const handleAddSubtask = (parentId: string) => {
    setNewTask({ ...newTask, parent_task_id: parentId });
    setDialogOpen(true);
  };

  const handleToggle = async (task: Task) => {
    await updateTask(task.id, {
      status: task.status === 'completed' ? 'todo' : 'completed'
    });
    setLocalTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: task.status === 'completed' ? 'todo' : 'completed' } : t
    ));
  };

  const handleTimerToggle = async (taskId: string) => {
    const current = timerState[taskId] || { isRunning: false, seconds: 0 };
    
    if (current.isRunning) {
      // Stop timer and save time
      await updateTask(taskId, { actual_time: current.seconds / 3600 });
    }
    
    setTimerState(prev => ({
      ...prev,
      [taskId]: { ...current, isRunning: !current.isRunning }
    }));
  };

  const handleTimeUpdate = async (taskId: string, time: number) => {
    await updateTask(taskId, { actual_time: time });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayTasks.findIndex(t => t.id === active.id);
      const newIndex = displayTasks.findIndex(t => t.id === over.id);

      const newOrder = arrayMove(displayTasks, oldIndex, newIndex);
      setLocalTasks(newOrder);

      // Update sort_order in database
      await updateTask(active.id as string, { sort_order: newIndex });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    const result = await addTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      due_date: newTask.due_date || null,
      parent_task_id: newTask.parent_task_id,
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: newTask.parent_task_id ? 'Subtask created!' : 'Task created!' });
      setDialogOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', parent_task_id: null });
      if (result.data) {
        setLocalTasks(prev => [...prev, result.data as Task]);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const TaskSection = ({ sectionTasks, emptyMessage }: { sectionTasks: Task[], emptyMessage: string }) => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sectionTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {sectionTasks.length > 0 ? (
            sectionTasks.map((task) => (
              <SortableTaskItem 
                key={task.id} 
                task={task} 
                onToggle={() => handleToggle(task)}
                onTimeUpdate={handleTimeUpdate}
                timerState={timerState}
                onTimerToggle={handleTimerToggle}
                onAddSubtask={handleAddSubtask}
                subtasks={getSubtasks(task.id)}
                allTasks={displayTasks}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{emptyMessage}</p>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {displayTasks.filter(t => t.status !== 'completed').length} tasks remaining
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              )}
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
          <ExportButton 
            data={displayTasks as unknown as Record<string, unknown>[]}
            filename="tasks"
            columns={[
              { key: 'title' as keyof Record<string, unknown>, label: 'Title' },
              { key: 'description' as keyof Record<string, unknown>, label: 'Description' },
              { key: 'status' as keyof Record<string, unknown>, label: 'Status' },
              { key: 'priority' as keyof Record<string, unknown>, label: 'Priority' },
              { key: 'due_date' as keyof Record<string, unknown>, label: 'Due Date' },
              { key: 'actual_time' as keyof Record<string, unknown>, label: 'Time (hours)' },
            ]}
          />
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            {rtlEnabled ? 'مهمة جديدة' : 'Add Task'}
          </Button>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newTask.parent_task_id ? 'Add Subtask' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: 'high' | 'medium' | 'low') => 
                    setNewTask({ ...newTask, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleCreateTask} className="w-full">
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={displayTasks}
          onUpdateTask={async (id, data) => {
            await updateTask(id, data);
            setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
          }}
          onAddTask={() => setDialogOpen(true)}
          rtl={rtlEnabled}
        />
      ) : (
        /* List View - Tabs */
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="today" className="gap-2">
              <Clock className="w-4 h-4" />
              {rtlEnabled ? 'اليوم' : 'Today'}
              {todayTasks.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {todayTasks.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="w-4 h-4" />
              {rtlEnabled ? 'القادمة' : 'Upcoming'}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              {rtlEnabled ? 'الكل' : 'All Tasks'}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {rtlEnabled ? 'مكتملة' : 'Completed'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            <TaskSection 
              sectionTasks={todayTasks} 
              emptyMessage={rtlEnabled ? 'لا توجد مهام لليوم' : 'No tasks for today. Add one to get started!'} 
            />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <TaskSection 
              sectionTasks={upcomingTasks} 
              emptyMessage={rtlEnabled ? 'لا توجد مهام قادمة' : 'No upcoming tasks scheduled.'} 
            />
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <TaskSection 
              sectionTasks={allActiveTasks} 
              emptyMessage={rtlEnabled ? 'لا توجد مهام' : 'No tasks yet. Create your first task!'} 
            />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <TaskSection 
              sectionTasks={completedTasks} 
              emptyMessage={rtlEnabled ? 'لا توجد مهام مكتملة' : 'No completed tasks yet.'} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
