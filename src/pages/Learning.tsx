import { Plus, BookOpen, Play, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const sampleCourses = [
  {
    id: '1',
    title: 'React Advanced Patterns',
    platform: 'Frontend Masters',
    instructor: 'Kent C. Dodds',
    totalLessons: 24,
    completedLessons: 18,
    status: 'in-progress',
  },
  {
    id: '2',
    title: 'TypeScript Fundamentals',
    platform: 'Egghead',
    instructor: 'Mike North',
    totalLessons: 16,
    completedLessons: 16,
    status: 'completed',
  },
  {
    id: '3',
    title: 'Node.js Microservices',
    platform: 'Udemy',
    instructor: 'Stephen Grider',
    totalLessons: 32,
    completedLessons: 0,
    status: 'not-started',
  },
];

const statusColors: Record<string, string> = {
  'not-started': 'bg-muted text-muted-foreground',
  'in-progress': 'bg-status-progress/10 text-status-progress',
  'completed': 'bg-status-completed/10 text-status-completed',
};

export default function Learning() {
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
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{sampleCourses.length}</p>
              <p className="text-sm text-muted-foreground">Total Courses</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-status-progress/10">
              <Play className="w-5 h-5 text-status-progress" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {sampleCourses.filter(c => c.status === 'in-progress').length}
              </p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-status-completed/10">
              <CheckCircle2 className="w-5 h-5 text-status-completed" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {sampleCourses.filter(c => c.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {sampleCourses.map((course) => {
          const progress = (course.completedLessons / course.totalLessons) * 100;
          
          return (
            <div
              key={course.id}
              className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{course.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {course.platform} • {course.instructor}
                  </p>
                </div>
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full capitalize',
                  statusColors[course.status]
                )}>
                  {course.status.replace('-', ' ')}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">
                    {course.completedLessons}/{course.totalLessons} lessons
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          );
        })}
      </div>

      {sampleCourses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No courses yet. Start learning something new!</p>
        </div>
      )}
    </div>
  );
}
