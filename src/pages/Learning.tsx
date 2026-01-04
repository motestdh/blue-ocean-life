import { useState } from 'react';
import { Plus, BookOpen, Play, CheckCircle2, Trash2, Loader2, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useCourses } from '@/hooks/useCourses';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'completed': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export default function Learning() {
  const { courses, loading, addCourse, updateCourse, deleteCourse } = useCourses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lessonInputs, setLessonInputs] = useState<Record<string, string>>({});
  const [newCourse, setNewCourse] = useState({
    title: '',
    platform: '',
    instructor: '',
    total_lessons: '',
    status: 'not-started',
    notes: '',
  });

  const inProgressCount = courses.filter(c => c.status === 'in-progress').length;
  const completedCount = courses.filter(c => c.status === 'completed').length;

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    const result = await addCourse({
      title: newCourse.title,
      platform: newCourse.platform || null,
      instructor: newCourse.instructor || null,
      total_lessons: newCourse.total_lessons ? parseInt(newCourse.total_lessons) : 0,
      completed_lessons: 0,
      status: newCourse.status,
      notes: newCourse.notes || null,
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Course added!' });
      setDialogOpen(false);
      setNewCourse({ title: '', platform: '', instructor: '', total_lessons: '', status: 'not-started', notes: '' });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    const result = await deleteCourse(id);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Course deleted!' });
    }
  };

  const handleIncrementLesson = async (course: typeof courses[0], amount: number = 1) => {
    const newCompleted = Math.min(
      Math.max((course.completed_lessons || 0) + amount, 0),
      course.total_lessons || 0
    );
    const newStatus = newCompleted === course.total_lessons ? 'completed' : 
                      newCompleted === 0 ? 'not-started' : 'in-progress';
    
    await updateCourse(course.id, { 
      completed_lessons: newCompleted,
      status: newStatus
    });
    
    // Clear the input after adding
    if (amount > 1) {
      setLessonInputs(prev => ({ ...prev, [course.id]: '' }));
    }
  };

  const handleAddCustomLessons = (course: typeof courses[0]) => {
    const amount = parseInt(lessonInputs[course.id] || '0');
    if (amount > 0) {
      handleIncrementLesson(course, amount);
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
          <h1 className="text-2xl font-bold text-foreground">Learning</h1>
          <p className="text-muted-foreground mt-1">
            Track your courses and progress
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="Course title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Input
                    id="platform"
                    value={newCourse.platform}
                    onChange={(e) => setNewCourse({ ...newCourse, platform: e.target.value })}
                    placeholder="Udemy, Coursera..."
                  />
                </div>
                <div>
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    value={newCourse.instructor}
                    onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
                    placeholder="Instructor name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_lessons">Total Lessons</Label>
                  <Input
                    id="total_lessons"
                    type="number"
                    value={newCourse.total_lessons}
                    onChange={(e) => setNewCourse({ ...newCourse, total_lessons: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={newCourse.status}
                    onValueChange={(value) => setNewCourse({ ...newCourse, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newCourse.notes}
                  onChange={(e) => setNewCourse({ ...newCourse, notes: e.target.value })}
                  placeholder="Course notes..."
                />
              </div>
              <Button onClick={handleCreateCourse} className="w-full">
                Add Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="blitzit-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Total Courses</p>
            </div>
          </div>
        </div>

        <div className="blitzit-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10">
              <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{inProgressCount}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>

        <div className="blitzit-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {courses.map((course) => {
          const progress = course.total_lessons 
            ? ((course.completed_lessons || 0) / course.total_lessons) * 100 
            : 0;
          
          return (
            <div
              key={course.id}
              className="p-5 rounded-xl blitzit-card hover:border-primary/30 transition-all duration-200 group hover-lift"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[course.platform, course.instructor].filter(Boolean).join(' • ') || 'No details'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full capitalize',
                    statusColors[course.status || 'not-started']
                  )}>
                    {(course.status || 'not-started').replace('-', ' ')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {course.completed_lessons || 0}/{course.total_lessons || 0} lessons
                    </span>
                    {course.status !== 'completed' && (course.total_lessons || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleIncrementLesson(course, -1)}
                          disabled={(course.completed_lessons || 0) === 0}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleIncrementLesson(course, 1)}
                        >
                          +1
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                            >
                              +Custom
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-3" align="end">
                            <div className="space-y-2">
                              <Label className="text-xs">Add lessons</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="5"
                                  className="h-8"
                                  value={lessonInputs[course.id] || ''}
                                  onChange={(e) => setLessonInputs(prev => ({
                                    ...prev,
                                    [course.id]: e.target.value
                                  }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddCustomLessons(course);
                                  }}
                                />
                                <Button
                                  size="sm"
                                  className="h-8"
                                  onClick={() => handleAddCustomLessons(course)}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No courses yet. Start learning something new!</p>
        </div>
      )}
    </div>
  );
}
