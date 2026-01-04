import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, LayoutGrid, List, Loader2, GripVertical, CalendarIcon, Tag, Edit2, Trash2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjects } from '@/hooks/useProjects';
import { useUserCategories } from '@/hooks/useUserCategories';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

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

// Sortable category item
function SortableCategoryItem({ 
  category, 
  onEdit, 
  onDelete 
}: { 
  category: { id: string; name: string; color: string }; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg bg-muted/50 group',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ backgroundColor: category.color }}
      />
      <span className="flex-1 text-sm">{category.name}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={onEdit}
      >
        <Edit2 className="w-3 h-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

function SortableProjectCard({ 
  project, 
  onClick, 
  onCategoryChange,
  categories
}: { 
  project: Project; 
  onClick: () => void;
  onCategoryChange: (id: string, category: string) => void;
  categories: { id: string; name: string }[];
}) {
  const [editingCategory, setEditingCategory] = useState(false);
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

      {/* Category badge with edit */}
      <div 
        className="inline-flex items-center gap-1 mt-1"
        onClick={(e) => e.stopPropagation()}
      >
        {editingCategory ? (
          <Select
            value={(project as any).category || 'General'}
            onValueChange={(value) => {
              onCategoryChange(project.id, value);
              setEditingCategory(false);
            }}
          >
            <SelectTrigger className="h-6 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge 
            variant="secondary" 
            className="text-xs cursor-pointer hover:bg-primary/20 transition-colors gap-1"
            onClick={() => setEditingCategory(true)}
          >
            <Tag className="w-3 h-3" />
            {(project as any).category || 'General'}
            <Edit2 className="w-2.5 h-2.5 opacity-50" />
          </Badge>
        )}
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
            <CalendarIcon className="w-3.5 h-3.5" />
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
  const { categories: userCategories, loading: catsLoading, addCategory, updateCategory, deleteCategory, reorderCategories } = useUserCategories();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<{ id: string; name: string; color: string } | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0EA5E9');
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'new' as 'new' | 'in-progress' | 'on-hold',
    due_date: new Date(),
    category: 'General',
  });

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
  useEffect(() => {
    if (projects.length > 0) {
      setLocalProjects(projects);
    }
  }, [projects]);

  const displayProjects = localProjects.length > 0 ? localProjects : projects;

  // Get categories - user categories + default "General"
  const categoryList = useMemo(() => {
    const baseCategories = [{ id: 'general', name: 'General', color: '#6B7280' }];
    return [...baseCategories, ...userCategories];
  }, [userCategories]);

  const allCategoryNames = useMemo(() => {
    return ['all', ...categoryList.map(c => c.name)];
  }, [categoryList]);

  const filteredProjects = displayProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || project.status === filter;
    const matchesCategory = categoryFilter === 'all' || (project as any).category === categoryFilter;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const handleCategoryChange = async (id: string, category: string) => {
    await updateProject(id, { category } as any);
    setLocalProjects(prev => prev.map(p => p.id === id ? { ...p, category } as Project : p));
  };

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
      due_date: format(newProject.due_date, 'yyyy-MM-dd'),
      category: newProject.category,
    } as any);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Project created!' });
      setDialogOpen(false);
      setNewProject({ title: '', description: '', priority: 'medium', status: 'new', due_date: new Date(), category: 'General' });
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={newProject.category}
                  onValueChange={(value) => 
                    setNewProject({ ...newProject, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryList.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
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
                        !newProject.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newProject.due_date ? format(newProject.due_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newProject.due_date}
                      onSelect={(date) => setNewProject({ ...newProject, due_date: date || new Date() })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button onClick={handleCreateProject} className="w-full">
              Create Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Tabs with Manage Button */}
      <div className="flex items-center gap-2">
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="flex-1">
          <TabsList className="w-full justify-start overflow-x-auto bg-muted/50 h-auto p-1 flex-wrap">
            {allCategoryNames.map((cat) => (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {cat === 'all' ? 'All Categories' : cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setCategoryDialogOpen(true)}
        >
          <Settings2 className="w-4 h-4" />
          Manage
        </Button>
      </div>

      {/* Category Management Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Add new category */}
            <div className="flex gap-2">
              <Input
                placeholder="New category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1"
              />
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <Button
                onClick={async () => {
                  if (!newCatName.trim()) return;
                  if (editingCat) {
                    await updateCategory(editingCat.id, { name: newCatName, color: newCatColor });
                    setEditingCat(null);
                  } else {
                    await addCategory(newCatName, newCatColor);
                  }
                  setNewCatName('');
                  setNewCatColor('#0EA5E9');
                  toast({ title: 'Success', description: editingCat ? 'Category updated' : 'Category added' });
                }}
              >
                {editingCat ? 'Update' : 'Add'}
              </Button>
            </div>

            {/* Category list with drag and drop */}
            <DndContext
              sensors={categorySensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                  const oldIndex = userCategories.findIndex(c => c.id === active.id);
                  const newIndex = userCategories.findIndex(c => c.id === over.id);
                  const newOrder = arrayMove(userCategories, oldIndex, newIndex);
                  reorderCategories(newOrder);
                }
              }}
            >
              <SortableContext items={userCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Fixed General category */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 opacity-60">
                    <div className="w-4" />
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span className="flex-1 text-sm">General (default)</span>
                  </div>
                  
                  {userCategories.map((cat) => (
                    <SortableCategoryItem
                      key={cat.id}
                      category={cat}
                      onEdit={() => {
                        setEditingCat(cat);
                        setNewCatName(cat.name);
                        setNewCatColor(cat.color);
                      }}
                      onDelete={async () => {
                        await deleteCategory(cat.id);
                        toast({ title: 'Deleted', description: 'Category removed' });
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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
                onCategoryChange={handleCategoryChange}
                categories={categoryList}
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
