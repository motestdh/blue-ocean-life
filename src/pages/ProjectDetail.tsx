import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Loader2, GripVertical, CalendarIcon, ChevronRight, ChevronDown, Clock, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

const statusColors: Record<string, string> = {
  'new': 'bg-status-new/10 text-status-new',
  'in-progress': 'bg-status-progress/10 text-status-progress',
  'completed': 'bg-status-completed/10 text-status-completed',
  'on-hold': 'bg-status-hold/10 text-status-hold',
  'cancelled': 'bg-status-cancelled/10 text-status-cancelled',
};

function SortableTaskItem({ 
  task, 
  onToggle, 
  onDelete,
  onEdit,
  onAddSubtask,
  onTimerToggle,
  timerState,
  subtasks = [],
  level = 0,
}: { 
  task: Task; 
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onAddSubtask?: (parentId: string) => void;
  onTimerToggle: (taskId: string) => void;
  timerState: { [key: string]: { isRunning: boolean; seconds: number } };
  subtasks?: Task[];
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
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

  const isCompleted = task.status === 'completed';
  const timer = timerState[task.id] || { isRunning: false, seconds: (task.actual_time || 0) * 3600 };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-1">
      <div
        ref={setNodeRef}
        style={{ ...style, marginLeft: `${level * 24}px` }}
        className={cn(
          'flex items-center gap-3 p-4 bg-card rounded-lg border border-border group',
          isDragging && 'opacity-50 shadow-xl z-50'
        )}
      >
        {subtasks.length > 0 ? (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <div className="w-4" />
        )}
        
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggle(task.id, checked as boolean)}
        />
        
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium text-foreground',
            isCompleted && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-sm text-muted-foreground truncate">{task.description}</p>
          )}
        </div>

        {/* Time Tracker */}
        {!isCompleted && (
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
        
        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarIcon className="w-3 h-3" />
            <span>{format(new Date(task.due_date), 'MMM d')}</span>
          </div>
        )}
        
        {onAddSubtask && level === 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100"
            onClick={() => onAddSubtask(task.id)}
            title="Add subtask"
          >
            <Plus className="w-4 h-4 text-primary" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100"
          onClick={() => onEdit(task)}
          title="Edit task"
        >
          <Edit2 className="w-4 h-4 text-muted-foreground" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
      
      {expanded && subtasks.length > 0 && (
        <div className="space-y-1">
          {subtasks.map((subtask) => (
            <SortableTaskItem
              key={subtask.id}
              task={subtask}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onTimerToggle={onTimerToggle}
              timerState={timerState}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, loading: projectLoading, updateProject, deleteProject } = useProjects();
  const { tasks, loading: tasksLoading, addTask, updateTask, deleteTask } = useTasks(id);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [timerState, setTimerState] = useState<{ [key: string]: { isRunning: boolean; seconds: number } }>({});
  
  const project = projects.find(p => p.id === id);
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'new' as 'new' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled',
    due_date: '',
    budget: '',
  });
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    due_date: null as Date | null,
  });

  const [newSubtask, setNewSubtask] = useState({
    title: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

  useEffect(() => {
    if (project) {
      setEditForm({
        title: project.title,
        description: project.description || '',
        priority: project.priority,
        status: project.status,
        due_date: project.due_date || '',
        budget: project.budget?.toString() || '',
      });
    }
  }, [project]);

  useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  const displayTasks = localTasks.length > 0 ? localTasks : tasks;
  const parentTasks = displayTasks.filter(t => !t.parent_task_id);
  const getSubtasks = (parentId: string) => displayTasks.filter(t => t.parent_task_id === parentId);
  const completedTasks = displayTasks.filter(t => t.status === 'completed').length;
  const progress = displayTasks.length > 0 ? Math.round((completedTasks / displayTasks.length) * 100) : 0;

  const handleUpdateProject = async () => {
    if (!id) return;
    
    const result = await updateProject(id, {
      title: editForm.title,
      description: editForm.description,
      priority: editForm.priority,
      status: editForm.status,
      due_date: editForm.due_date || null,
      budget: editForm.budget ? parseFloat(editForm.budget) : null,
      progress,
    });
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Project updated!' });
      setEditDialogOpen(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    
    // Delete all tasks first
    for (const task of displayTasks) {
      await deleteTask(task.id);
    }
    
    const result = await deleteProject(id);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Project deleted!' });
      navigate('/projects');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !id) return;
    
    const result = await addTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      project_id: id,
      due_date: newTask.due_date ? format(newTask.due_date, 'yyyy-MM-dd') : null,
      sort_order: displayTasks.length,
    });
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Task added!' });
      setTaskDialogOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: null });
      if (result.data) {
        setLocalTasks(prev => [...prev, result.data as Task]);
      }
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    const newStatus = completed ? 'completed' : 'todo';
    await updateTask(taskId, { status: newStatus as 'completed' | 'in-progress' | 'todo' });
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as 'completed' | 'in-progress' | 'todo' } : t));
  };

  const handleDeleteTask = async (taskId: string) => {
    // Also delete subtasks
    const subtasksToDelete = displayTasks.filter(t => t.parent_task_id === taskId);
    for (const subtask of subtasksToDelete) {
      await deleteTask(subtask.id);
    }
    await deleteTask(taskId);
    setLocalTasks(prev => prev.filter(t => t.id !== taskId && t.parent_task_id !== taskId));
  };

  const handleOpenSubtaskDialog = (parentId: string) => {
    setParentTaskId(parentId);
    setSubtaskDialogOpen(true);
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.title.trim() || !parentTaskId || !id) return;
    
    const result = await addTask({
      title: newSubtask.title,
      priority: newSubtask.priority,
      project_id: id,
      parent_task_id: parentTaskId,
      sort_order: displayTasks.length,
    });
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Subtask added!' });
      setSubtaskDialogOpen(false);
      setNewSubtask({ title: '', priority: 'medium' });
      setParentTaskId(null);
      if (result.data) {
        setLocalTasks(prev => [...prev, result.data as Task]);
      }
    }
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskDialogOpen(true);
  };

  const handleSaveTask = async (taskId: string, updates: Partial<Task>) => {
    const result = await updateTask(taskId, updates);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Task updated!' });
      setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = displayTasks.findIndex(t => t.id === active.id);
      const newIndex = displayTasks.findIndex(t => t.id === over.id);
      const newOrder = arrayMove(displayTasks, oldIndex, newIndex);
      setLocalTasks(newOrder);
      
      // Update sort_order in database
      newOrder.forEach((task, index) => {
        updateTask(task.id, { sort_order: index });
      });
    }
  };

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="link" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: project.color || '#0EA5E9' }}
              />
              <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
              <span className={cn(
                'text-xs font-medium px-2 py-1 rounded-full capitalize',
                statusColors[project.status]
              )}>
                {project.status.replace('-', ' ')}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{project.title}" and all its tasks. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProject}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-3xl font-bold text-foreground">{progress}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Tasks</p>
            <p className="text-lg font-semibold text-foreground">{completedTasks} / {displayTasks.length}</p>
          </div>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
          <Button onClick={() => setTaskDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={parentTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {parentTasks.map((task) => (
                <SortableTaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onAddSubtask={handleOpenSubtaskDialog}
                  onTimerToggle={handleTimerToggle}
                  timerState={timerState}
                  subtasks={getSubtasks(task.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {displayTasks.length === 0 && (
          <div className="text-center py-8 bg-card rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">No tasks yet</p>
            <Button variant="link" onClick={() => setTaskDialogOpen(true)}>
              Add your first task
            </Button>
          </div>
        )}
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={editForm.priority}
                  onValueChange={(value: 'high' | 'medium' | 'low') => 
                    setEditForm({ ...editForm, priority: value })
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
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => 
                    setEditForm({ ...editForm, status: value as typeof editForm.status })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-budget">Budget</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={editForm.budget}
                  onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <Button onClick={handleUpdateProject} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
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
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newTask.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.due_date ? format(newTask.due_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTask.due_date || undefined}
                      onSelect={(date) => setNewTask({ ...newTask, due_date: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button onClick={handleAddTask} className="w-full">
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Subtask Dialog */}
      <Dialog open={subtaskDialogOpen} onOpenChange={setSubtaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subtask</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="subtask-title">Title</Label>
              <Input
                id="subtask-title"
                value={newSubtask.title}
                onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                placeholder="Subtask title"
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={newSubtask.priority}
                onValueChange={(value: 'high' | 'medium' | 'low') => 
                  setNewSubtask({ ...newSubtask, priority: value })
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
            <Button onClick={handleAddSubtask} className="w-full">
              Add Subtask
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <EditTaskDialog
        task={editingTask}
        open={editTaskDialogOpen}
        onOpenChange={setEditTaskDialogOpen}
        onSave={handleSaveTask}
      />
    </div>
  );
}
