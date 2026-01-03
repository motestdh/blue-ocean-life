import { useState, useEffect } from 'react';
import { Plus, FolderOpen, CheckSquare, Users, FileText, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { useNotes } from '@/hooks/useNotes';
import { useTransactions } from '@/hooks/useTransactions';
import { cn } from '@/lib/utils';

type QuickAddType = 'project' | 'task' | 'client' | 'note' | 'transaction';

interface QuickAddDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function QuickAddDialog({ trigger, open: controlledOpen, onOpenChange }: QuickAddDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<QuickAddType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const { addProject } = useProjects();
  const { addTask } = useTasks();
  const { addClient } = useClients();
  const { addNote } = useNotes();
  const { addTransaction } = useTransactions();

  const quickAddOptions = [
    { type: 'project' as const, icon: FolderOpen, label: 'Project', color: 'bg-blue-500/10 text-blue-600' },
    { type: 'task' as const, icon: CheckSquare, label: 'Task', color: 'bg-emerald-500/10 text-emerald-600' },
    { type: 'client' as const, icon: Users, label: 'Client', color: 'bg-purple-500/10 text-purple-600' },
    { type: 'note' as const, icon: FileText, label: 'Note', color: 'bg-amber-500/10 text-amber-600' },
    { type: 'transaction' as const, icon: Wallet, label: 'Transaction', color: 'bg-pink-500/10 text-pink-600' },
  ];

  const handleSubmit = async () => {
    if (!selectedType) return;

    let result: { error?: string } = {};

    switch (selectedType) {
      case 'project':
        if (!formData.title?.trim()) {
          toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
          return;
        }
        result = await addProject({ title: formData.title, description: formData.description || '' });
        break;

      case 'task':
        if (!formData.title?.trim()) {
          toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
          return;
        }
        result = await addTask({ title: formData.title, description: formData.description || '' });
        break;

      case 'client':
        if (!formData.name?.trim()) {
          toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
          return;
        }
        result = await addClient({ name: formData.name, email: formData.email || null });
        break;

      case 'note':
        if (!formData.title?.trim()) {
          toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
          return;
        }
        result = await addNote({ title: formData.title, content: formData.content || '' });
        break;

      case 'transaction':
        if (!formData.amount || !formData.category) {
          toast({ title: 'Error', description: 'Amount and category are required', variant: 'destructive' });
          return;
        }
        result = await addTransaction({
          type: (formData.type as 'income' | 'expense') || 'expense',
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description || '',
        });
        break;
    }

    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${selectedType} created!` });
      handleClose();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedType(null);
    setFormData({});
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedType(null);
      setFormData({});
    }
  }, [open]);

  const renderForm = () => {
    switch (selectedType) {
      case 'project':
      case 'task':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={`${selectedType} title`}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
        );

      case 'client':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Client name"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
          </div>
        );

      case 'note':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Note title"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your note..."
                rows={4}
              />
            </div>
          </div>
        );

      case 'transaction':
        return (
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select
                value={formData.type || 'expense'}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Software, Food"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedType ? `Add ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}` : 'Quick Add'}
          </DialogTitle>
        </DialogHeader>

        {!selectedType ? (
          <div className="grid grid-cols-2 gap-3 py-4">
            {quickAddOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border border-border',
                  'hover:border-primary/50 hover:bg-muted/50 transition-all duration-200'
                )}
              >
                <div className={cn('p-3 rounded-lg', option.color)}>
                  <option.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-foreground">{option.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-4">
            {renderForm()}
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setSelectedType(null)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} className="flex-1">
                Create
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
