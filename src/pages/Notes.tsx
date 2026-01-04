import { useState } from 'react';
import { Plus, Search, FileText, Folder, Trash2, Pin, Loader2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNotes } from '@/hooks/useNotes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { EditNoteDialog } from '@/components/dialogs/EditNoteDialog';
import { formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Note = Database['public']['Tables']['notes']['Row'];

export default function Notes() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    folder: 'General',
  });

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.folder?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: pinned first, then by updated_at
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const handleCreateNote = async () => {
    if (!newNote.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    const result = await addNote({
      title: newNote.title,
      content: newNote.content || null,
      folder: newNote.folder || 'General',
    });

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Note created!' });
      setDialogOpen(false);
      setNewNote({ title: '', content: '', folder: 'General' });
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    const result = await updateNote(id, { is_pinned: !currentPinned });
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeleteNote = async () => {
    if (!deletingNote) return;
    
    const result = await deleteNote(deletingNote.id);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Note deleted!' });
    }
    setDeletingNote(null);
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
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground mt-1">
            Capture your ideas and thoughts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title"
                />
              </div>
              <div>
                <Label htmlFor="folder">Folder</Label>
                <Input
                  id="folder"
                  value={newNote.folder}
                  onChange={(e) => setNewNote({ ...newNote, folder: e.target.value })}
                  placeholder="General"
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note..."
                  rows={6}
                />
              </div>
              <Button onClick={handleCreateNote} className="w-full">
                Create Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedNotes.map((note) => (
          <div
            key={note.id}
            className={cn(
              'p-5 rounded-xl blitzit-card hover:border-primary/30 transition-all duration-200 group cursor-pointer hover-lift',
              note.is_pinned && 'border-primary/50'
            )}
            onClick={() => setEditingNote(note)}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-foreground">{note.title}</h3>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePin(note.id, note.is_pinned || false);
                  }}
                >
                  <Pin className={cn('w-3.5 h-3.5', note.is_pinned && 'fill-primary text-primary')} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingNote(note);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingNote(note);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {note.content || 'No content'}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Folder className="w-3.5 h-3.5" />
                {note.folder || 'General'}
              </span>
              <span>{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
            </div>
          </div>
        ))}
      </div>

      {sortedNotes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{notes.length === 0 ? 'No notes yet. Start writing!' : 'No notes match your search.'}</p>
        </div>
      )}

      {/* Edit Dialog */}
      <EditNoteDialog
        note={editingNote}
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
        onSave={updateNote}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingNote} onOpenChange={(open) => !open && setDeletingNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingNote?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
