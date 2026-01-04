import { GraduationCap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import type { Database } from '@/integrations/supabase/types';

type Course = Database['public']['Tables']['courses']['Row'];

interface LearningWidgetProps {
  courses: Course[];
}

export function LearningWidget({ courses }: LearningWidgetProps) {
  const activeCourses = courses.filter(c => c.status === 'in-progress');
  
  const totalLessons = activeCourses.reduce((sum, c) => sum + (c.total_lessons || 0), 0);
  const completedLessons = activeCourses.reduce((sum, c) => sum + (c.completed_lessons || 0), 0);
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="blitzit-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Learning</h3>
        </div>
        <Link to="/learning" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {activeCourses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No active courses. Start learning something new!
        </p>
      ) : (
        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall Progress</span>
              <span>{completedLessons}/{totalLessons} lessons</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Active Courses List */}
          <div className="space-y-3">
            {activeCourses.slice(0, 3).map((course) => {
              const progress = course.total_lessons 
                ? ((course.completed_lessons || 0) / course.total_lessons) * 100 
                : 0;
              
              return (
                <div key={course.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate max-w-[180px]">
                      {course.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              );
            })}
          </div>

          {activeCourses.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{activeCourses.length - 3} more courses
            </p>
          )}
        </div>
      )}
    </div>
  );
}
