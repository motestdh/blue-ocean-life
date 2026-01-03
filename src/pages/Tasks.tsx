import { useState } from 'react';
import { Plus, Search, Calendar, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTasks } from '@/hooks/useTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

type Task = Database['public']['Tables']['tasks']['Row'];

const priorityDotColors: Record<string, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

function TaskItem({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div className={cn(
      'group flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all duration-200',
      task.status === 'completed' && 'opacity-60'
    )}>
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
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
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
  );
}

export default function Tasks() {
  const { tasks, loading, addTask, updateTask } = useTasks();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    due_date: string;
  }>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });

  const today = new Date().toISOString().split('T')[0];
  
  const todayTasks = tasks.filter(t => t.due_date === today);
  const upcomingTasks = tasks.filter(t => t.due_date && t.due_date > today && t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const handleToggle = async (task: Task) => {
    await updateTask(task.id, {
      status: task.status === 'completed' ? 'todo' : 'completed'
    });
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
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Task created!' });
      setDialogOpen(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
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
    <div className="space-y-2">
      {sectionTasks.length > 0 ? (
        sectionTasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={() => handleToggle(task)} />
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {tasks.filter(t => t.status !== 'completed').length} tasks remaining
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
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
                    onValueChange={(value) => 
                      setNewTask({ ...newTask, priority: value as 'high' | 'medium' | 'low' })
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
      </div>

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

      {/* Tabs */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="today" className="gap-2">
            <Clock className="w-4 h-4" />
            Today
            {todayTasks.length > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {todayTasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <TaskSection 
            sectionTasks={todayTasks} 
            emptyMessage="No tasks for today. Add one to get started!" 
          />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <TaskSection 
            sectionTasks={upcomingTasks} 
            emptyMessage="No upcoming tasks scheduled." 
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <TaskSection 
            sectionTasks={completedTasks} 
            emptyMessage="No completed tasks yet." 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
