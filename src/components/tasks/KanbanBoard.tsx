import { useState } from 'react';
import { Plus, GripVertical, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskStatus = 'todo' | 'in-progress' | 'completed';

const priorityColors: Record<string, string> = {
  high: 'border-l-priority-high',
  medium: 'border-l-priority-medium',
  low: 'border-l-priority-low',
};

const columns: { id: TaskStatus; title: string; titleAr: string; color: string }[] = [
  { id: 'todo', title: 'To Do', titleAr: 'للتنفيذ', color: 'bg-muted' },
  { id: 'in-progress', title: 'In Progress', titleAr: 'قيد التنفيذ', color: 'bg-primary/10' },
  { id: 'completed', title: 'Completed', titleAr: 'مكتملة', color: 'bg-success/10' },
];

interface KanbanCardProps {
  task: Task;
}

function KanbanCard({ task }: KanbanCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all',
        'border-l-4',
        priorityColors[task.priority],
        isDragging && 'opacity-50 shadow-lg'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium text-sm text-foreground line-clamp-2',
            task.status === 'completed' && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(task.due_date), 'MMM d')}</span>
              </div>
            )}
            {task.estimated_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{task.estimated_time}h</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: typeof columns[0];
  tasks: Task[];
  onAddTask?: () => void;
  rtl?: boolean;
}

function KanbanColumn({ column, tasks, onAddTask, rtl }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className={cn('rounded-xl p-4', column.color)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              {rtl ? column.titleAr : column.title}
            </h3>
            <span className="text-xs bg-background text-muted-foreground px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          {column.id === 'todo' && onAddTask && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddTask}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[200px]">
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {rtl ? 'لا توجد مهام' : 'No tasks'}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onAddTask?: () => void;
  rtl?: boolean;
}

export function KanbanBoard({ tasks, onUpdateTask, onAddTask, rtl }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const getTasksByStatus = (status: TaskStatus) => 
    tasks.filter(t => t.status === status);

  const findContainer = (id: string): TaskStatus | null => {
    const task = tasks.find(t => t.id === id);
    return task?.status as TaskStatus || null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);

    if (!activeTask) return;

    // Check if dropping over a column
    const overColumn = columns.find(c => c.id === over.id);
    if (overColumn && activeTask.status !== overColumn.id) {
      onUpdateTask(activeTask.id, { status: overColumn.id });
    }

    // Check if dropping over a task in a different column
    if (overTask && activeTask.status !== overTask.status) {
      onUpdateTask(activeTask.id, { status: overTask.status });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Final update when dropped on column
    const overColumn = columns.find(c => c.id === over.id);
    if (overColumn && activeTask.status !== overColumn.id) {
      onUpdateTask(activeTask.id, { status: overColumn.id });
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn(
        'flex gap-4 overflow-x-auto pb-4',
        rtl && 'flex-row-reverse'
      )}>
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            onAddTask={column.id === 'todo' ? onAddTask : undefined}
            rtl={rtl}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
