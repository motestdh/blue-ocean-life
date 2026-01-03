import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Note = Database['public']['Tables']['notes']['Row'];

interface EditNoteDialogProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: Partial<Note>) => Promise<{ error?: string }>;
}

export function EditNoteDialog({ note, open, onOpenChange, onSave }: EditNoteDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    folder: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        folder: note.folder || 'General',
      });
    }
  }, [note]);

  const handleSave = async () => {
    if (!note) return;
    
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const result = await onSave(note.id, {
      title: formData.title,
      content: formData.content || null,
      folder: formData.folder || 'General',
    });
    setSaving(false);

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Note updated!' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Note title"
            />
          </div>
          <div>
            <Label htmlFor="edit-folder">Folder</Label>
            <Input
              id="edit-folder"
              value={formData.folder}
              onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
              placeholder="General"
            />
          </div>
          <div>
            <Label htmlFor="edit-content">Content</Label>
            <Textarea
              id="edit-content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your note..."
              rows={10}
              className="resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
