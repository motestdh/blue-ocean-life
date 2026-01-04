import { useState } from 'react';
import { Plus, Book, Headphones, ExternalLink, Loader2, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useBooksPodcasts, BookPodcast } from '@/hooks/useBooksPodcasts';
import { cn } from '@/lib/utils';

const statusColors = {
  'to-consume': 'bg-amber-500/10 text-amber-500',
  'in-progress': 'bg-blue-500/10 text-blue-500',
  'completed': 'bg-green-500/10 text-green-500',
};

export default function BooksPodcasts() {
  const { items, loading, addItem, updateItem, deleteItem } = useBooksPodcasts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BookPodcast | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'book' | 'podcast'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'still'>('all');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'book' as 'book' | 'podcast',
    status: 'to-consume' as 'to-consume' | 'in-progress' | 'completed',
  });

  const filteredItems = items.filter(item => {
    const matchesType = activeTab === 'all' || item.type === activeTab;
    const matchesStatus = statusFilter === 'all' 
      || (statusFilter === 'completed' && item.status === 'completed')
      || (statusFilter === 'still' && item.status !== 'completed');
    return matchesType && matchesStatus;
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    if (editingItem) {
      const result = await updateItem(editingItem.id, formData);
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Item updated!' });
        handleClose();
      }
    } else {
      const result = await addItem(formData);
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Item added!' });
        handleClose();
      }
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: '', url: '', type: 'book', status: 'to-consume' });
  };

  const handleEdit = (item: BookPodcast) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      url: item.url || '',
      type: item.type,
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteItem(id);
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Item removed' });
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
          <h1 className="text-2xl font-bold text-foreground">Books & Podcasts</h1>
          <p className="text-muted-foreground mt-1">Track your reading and listening</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Add New
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="space-y-3">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="book" className="gap-2">
              <Book className="w-4 h-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="podcast" className="gap-2">
              <Headphones className="w-4 h-4" />
              Podcasts
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              variant={statusFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All Status
            </Button>
            <Button 
              variant={statusFilter === 'completed' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </Button>
            <Button 
              variant={statusFilter === 'still' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setStatusFilter('still')}
            >
              Still
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="blitzit-card p-5 hover-lift group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      item.type === 'book' ? 'bg-amber-500/10' : 'bg-purple-500/10'
                    )}>
                      {item.type === 'book' ? (
                        <Book className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Headphones className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <Badge className={cn('text-xs mt-1', statusColors[item.status])}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Link
                  </a>
                )}
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found. Add your first one!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label>URL (optional)</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: 'book' | 'podcast') => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: 'to-consume' | 'in-progress' | 'completed') => 
                    setFormData({ ...formData, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to-consume">To Consume</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
