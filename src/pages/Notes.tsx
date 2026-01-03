import { Plus, Search, FileText, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const sampleNotes = [
  {
    id: '1',
    title: 'Project Requirements',
    preview: 'Key requirements for the website redesign project including...',
    folder: 'Work',
    updatedAt: '2 hours ago',
    isPinned: true,
  },
  {
    id: '2',
    title: 'Meeting Notes - Jan 15',
    preview: 'Discussed the Q1 marketing strategy and outlined key milestones...',
    folder: 'Meetings',
    updatedAt: 'Yesterday',
    isPinned: false,
  },
  {
    id: '3',
    title: 'Learning Resources',
    preview: 'Collection of useful resources for learning React and TypeScript...',
    folder: 'Personal',
    updatedAt: '3 days ago',
    isPinned: false,
  },
];

export default function Notes() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground mt-1">
            Capture your ideas and thoughts
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Note
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          className="pl-9"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleNotes.map((note) => (
          <div
            key={note.id}
            className={cn(
              'p-5 rounded-xl border bg-card hover:border-primary/30 transition-all duration-200 cursor-pointer hover-lift',
              note.isPinned && 'border-primary/50'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-foreground">{note.title}</h3>
              {note.isPinned && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Pinned
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {note.preview}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Folder className="w-3.5 h-3.5" />
                {note.folder}
              </span>
              <span>{note.updatedAt}</span>
            </div>
          </div>
        ))}
      </div>

      {sampleNotes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No notes yet. Start writing!</p>
        </div>
      )}
    </div>
  );
}
