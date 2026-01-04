import { useState } from 'react';
import { Plus, BookOpen, Play, CheckCircle2, Trash2, Loader2, ChevronDown, ChevronRight, Clock, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useCourses } from '@/hooks/useCourses';
import { useLessons } from '@/hooks/useLessons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  const { courses, loading: coursesLoading, addCourse, updateCourse, deleteCourse } = useCourses();
  const { lessons, loading: lessonsLoading, addLesson, updateLesson, deleteLesson, toggleLessonComplete, getLessonsByCourse } = useLessons();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editLessonData, setEditLessonData] = useState({ title: '', duration_minutes: '', description: '' });
  
  const [newCourse, setNewCourse] = useState({
    title: '',
    platform: '',
    instructor: '',
    status: 'not-started',
    notes: '',
  });

  const [newLesson, setNewLesson] = useState({
    title: '',
    duration_minutes: '',
    description: '',
  });

  const loading = coursesLoading || lessonsLoading;

  const inProgressCount = courses.filter(c => c.status === 'in-progress').length;
  const completedCount = courses.filter(c => c.status === 'completed').length;

  const toggleCourseExpanded = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    const result = await addCourse({
      title: newCourse.title,
      platform: newCourse.platform || null,
      instructor: newCourse.instructor || null,
      total_lessons: 0,
      completed_lessons: 0,
      status: newCourse.status,
      notes: newCourse.notes || null,
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Course added!' });
      setDialogOpen(false);
      setNewCourse({ title: '', platform: '', instructor: '', status: 'not-started', notes: '' });
    }
  };

  const handleCreateLesson = async () => {
    if (!newLesson.title.trim() || !selectedCourseId) {
      toast({ title: 'Error', description: 'Lesson title is required', variant: 'destructive' });
      return;
    }

    const courseLessons = getLessonsByCourse(selectedCourseId);
    const result = await addLesson({
      course_id: selectedCourseId,
      title: newLesson.title,
      duration_minutes: newLesson.duration_minutes ? parseInt(newLesson.duration_minutes) : 0,
      description: newLesson.description || undefined,
      sort_order: courseLessons.length,
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Lesson added!' });
      // Update course total_lessons count
      const course = courses.find(c => c.id === selectedCourseId);
      if (course) {
        await updateCourse(selectedCourseId, { 
          total_lessons: (course.total_lessons || 0) + 1,
          status: course.status === 'not-started' ? 'in-progress' : course.status,
        });
      }
      setLessonDialogOpen(false);
      setNewLesson({ title: '', duration_minutes: '', description: '' });
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

  const handleDeleteLesson = async (lessonId: string, courseId: string) => {
    const result = await deleteLesson(lessonId);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      // Update course counts
      const course = courses.find(c => c.id === courseId);
      const courseLessons = getLessonsByCourse(courseId);
      const lesson = courseLessons.find(l => l.id === lessonId);
      if (course && lesson) {
        await updateCourse(courseId, { 
          total_lessons: Math.max((course.total_lessons || 0) - 1, 0),
          completed_lessons: lesson.is_completed 
            ? Math.max((course.completed_lessons || 0) - 1, 0) 
            : course.completed_lessons,
        });
      }
      toast({ title: 'Success', description: 'Lesson deleted!' });
    }
  };

  const handleToggleLessonComplete = async (lesson: any, courseId: string) => {
    const result = await toggleLessonComplete(lesson);
    if (!result.error) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        const newCompletedCount = lesson.is_completed 
          ? Math.max((course.completed_lessons || 0) - 1, 0)
          : (course.completed_lessons || 0) + 1;
        const newStatus = newCompletedCount === course.total_lessons ? 'completed' : 
                          newCompletedCount === 0 ? 'not-started' : 'in-progress';
        await updateCourse(courseId, { 
          completed_lessons: newCompletedCount,
          status: newStatus,
        });
      }
    }
  };

  const startEditLesson = (lesson: any) => {
    setEditingLesson(lesson.id);
    setEditLessonData({
      title: lesson.title,
      duration_minutes: lesson.duration_minutes?.toString() || '',
      description: lesson.description || '',
    });
  };

  const saveEditLesson = async (lessonId: string) => {
    await updateLesson(lessonId, {
      title: editLessonData.title,
      duration_minutes: editLessonData.duration_minutes ? parseInt(editLessonData.duration_minutes) : 0,
      description: editLessonData.description || null,
    });
    setEditingLesson(null);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
            Track your courses and lessons
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
          const courseLessons = getLessonsByCourse(course.id);
          const completedLessons = courseLessons.filter(l => l.is_completed).length;
          const totalDuration = courseLessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
          const progress = courseLessons.length > 0 
            ? (completedLessons / courseLessons.length) * 100 
            : 0;
          const isExpanded = expandedCourses.has(course.id);
          
          return (
            <Collapsible
              key={course.id}
              open={isExpanded}
              onOpenChange={() => toggleCourseExpanded(course.id)}
            >
              <div className="rounded-xl blitzit-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="p-5 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {[course.platform, course.instructor].filter(Boolean).join(' • ') || 'No details'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {totalDuration > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(totalDuration)}
                          </span>
                        )}
                        <span className={cn(
                          'text-xs font-medium px-2 py-1 rounded-full capitalize',
                          statusColors[course.status || 'not-started']
                        )}>
                          {(course.status || 'not-started').replace('-', ' ')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 ml-8">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">
                          {completedLessons}/{courseLessons.length} lessons
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-border px-5 py-4 space-y-3 bg-muted/20">
                    {/* Add Lesson Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setLessonDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Lesson
                    </Button>

                    {/* Lessons List */}
                    {courseLessons.length > 0 ? (
                      <div className="space-y-2">
                        {courseLessons.map((lesson, index) => (
                          <div
                            key={lesson.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border transition-all",
                              lesson.is_completed 
                                ? "bg-emerald-500/5 border-emerald-500/20" 
                                : "bg-card border-border"
                            )}
                          >
                            <Checkbox
                              checked={lesson.is_completed || false}
                              onCheckedChange={() => handleToggleLessonComplete(lesson, course.id)}
                              className="mt-1"
                            />
                            
                            {editingLesson === lesson.id ? (
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={editLessonData.title}
                                  onChange={(e) => setEditLessonData({ ...editLessonData, title: e.target.value })}
                                  placeholder="Lesson title"
                                  className="h-8"
                                />
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    value={editLessonData.duration_minutes}
                                    onChange={(e) => setEditLessonData({ ...editLessonData, duration_minutes: e.target.value })}
                                    placeholder="Duration (min)"
                                    className="h-8 w-32"
                                  />
                                  <Input
                                    value={editLessonData.description}
                                    onChange={(e) => setEditLessonData({ ...editLessonData, description: e.target.value })}
                                    placeholder="Description"
                                    className="h-8 flex-1"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" className="h-7" onClick={() => saveEditLesson(lesson.id)}>
                                    <Check className="w-3 h-3 mr-1" /> Save
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingLesson(null)}>
                                    <X className="w-3 h-3 mr-1" /> Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{index + 1}.</span>
                                    <p className={cn(
                                      "font-medium",
                                      lesson.is_completed && "line-through text-muted-foreground"
                                    )}>
                                      {lesson.title}
                                    </p>
                                  </div>
                                  {lesson.description && (
                                    <p className="text-sm text-muted-foreground mt-1 truncate">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {lesson.duration_minutes && lesson.duration_minutes > 0 && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDuration(lesson.duration_minutes)}
                                    </span>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => startEditLesson(lesson)}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteLesson(lesson.id, course.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No lessons yet. Add your first lesson!
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No courses yet. Start learning something new!</p>
        </div>
      )}

      {/* Add Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                placeholder="e.g., Introduction to React Hooks"
              />
            </div>
            <div>
              <Label htmlFor="lesson-duration">Duration (minutes)</Label>
              <Input
                id="lesson-duration"
                type="number"
                value={newLesson.duration_minutes}
                onChange={(e) => setNewLesson({ ...newLesson, duration_minutes: e.target.value })}
                placeholder="30"
              />
            </div>
            <div>
              <Label htmlFor="lesson-description">Description / Notes</Label>
              <Textarea
                id="lesson-description"
                value={newLesson.description}
                onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                placeholder="What will you learn in this lesson?"
              />
            </div>
            <Button onClick={handleCreateLesson} className="w-full">
              Add Lesson
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
