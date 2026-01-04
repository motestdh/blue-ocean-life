import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, LayoutGrid, List, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Project = Database['public']['Tables']['projects']['Row'];

const statusColors: Record<string, string> = {
  'new': 'bg-status-new/10 text-status-new',
  'in-progress': 'bg-status-progress/10 text-status-progress',
  'completed': 'bg-status-completed/10 text-status-completed',
  'on-hold': 'bg-status-hold/10 text-status-hold',
  'cancelled': 'bg-status-cancelled/10 text-status-cancelled',
};

const priorityColors: Record<string, string> = {
  high: 'border-l-priority-high',
  medium: 'border-l-priority-medium',
  low: 'border-l-priority-low',
};

function SortableProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        'blitzit-card p-5 hover-lift cursor-pointer border-l-4 relative group',
        priorityColors[project.priority],
        isDragging && 'opacity-50 shadow-xl z-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-3 right-3 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: project.color || '#0EA5E9' }}
        />
        <h3 className="font-semibold text-foreground">{project.title}</h3>
      </div>

      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
        {project.description}
      </p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-foreground">{project.progress || 0}%</span>
        </div>
        <Progress value={project.progress || 0} className="h-2" />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded-full capitalize',
          statusColors[project.status]
        )}>
          {project.status.replace('-', ' ')}
        </span>
        {project.due_date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(project.due_date), 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const { projects, loading, addProject, updateProject } = useProjects();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'new' as 'new' | 'in-progress' | 'on-hold',
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

  // Sync local projects with fetched projects
  if (projects.length > 0 && localProjects.length === 0) {
    setLocalProjects(projects);
  }

  const displayProjects = localProjects.length > 0 ? localProjects : projects;

  const filteredProjects = displayProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || project.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayProjects.findIndex(p => p.id === active.id);
      const newIndex = displayProjects.findIndex(p => p.id === over.id);

      const newOrder = arrayMove(displayProjects, oldIndex, newIndex);
      setLocalProjects(newOrder);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    const result = await addProject({
      title: newProject.title,
      description: newProject.description,
      priority: newProject.priority,
      status: newProject.status,
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Project created!' });
      setDialogOpen(false);
      setNewProject({ title: '', description: '', priority: 'medium', status: 'new' });
      if (result.data) {
        setLocalProjects(prev => [result.data as Project, ...prev]);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your projects
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                placeholder="Project title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Project description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={newProject.priority}
                  onValueChange={(value: 'high' | 'medium' | 'low') => 
                    setNewProject({ ...newProject, priority: value })
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
                  value={newProject.status}
                  onValueChange={(value: 'new' | 'in-progress' | 'on-hold') => 
                    setNewProject({ ...newProject, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateProject} className="w-full">
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={filteredProjects.map(p => p.id)} strategy={rectSortingStrategy}>
          <div className={cn(
            view === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          )}>
            {filteredProjects.map((project) => (
              <SortableProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found</p>
        </div>
      )}
    </div>
  );
}
