import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  FolderOpen,
  CheckSquare,
  Users,
  FileText,
  Wallet,
  Flame,
  Search,
  Clock,
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { useNotes } from '@/hooks/useNotes';
import { Badge } from '@/components/ui/badge';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { tasks } = useTasks();
  const { projects } = useProjects();
  const { clients } = useClients();
  const { notes } = useNotes();

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const filteredTasks = useMemo(() => {
    if (!search) return tasks?.slice(0, 5) || [];
    const query = search.toLowerCase();
    return tasks?.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    ).slice(0, 5) || [];
  }, [tasks, search]);

  const filteredProjects = useMemo(() => {
    if (!search) return projects?.slice(0, 5) || [];
    const query = search.toLowerCase();
    return projects?.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    ).slice(0, 5) || [];
  }, [projects, search]);

  const filteredClients = useMemo(() => {
    if (!search) return clients?.slice(0, 5) || [];
    const query = search.toLowerCase();
    return clients?.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.company?.toLowerCase().includes(query)
    ).slice(0, 5) || [];
  }, [clients, search]);

  const filteredNotes = useMemo(() => {
    if (!search) return notes?.slice(0, 5) || [];
    const query = search.toLowerCase();
    return notes?.filter(n => 
      n.title.toLowerCase().includes(query) ||
      n.content?.toLowerCase().includes(query)
    ).slice(0, 5) || [];
  }, [notes, search]);

  const hasResults = 
    filteredTasks.length > 0 || 
    filteredProjects.length > 0 || 
    filteredClients.length > 0 || 
    filteredNotes.length > 0;

  const handleSelectTask = (taskId: string) => {
    navigate('/tasks');
    onOpenChange(false);
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    onOpenChange(false);
  };

  const handleSelectClient = (clientId: string) => {
    navigate('/clients');
    onOpenChange(false);
  };

  const handleSelectNote = (noteId: string) => {
    navigate('/notes');
    onOpenChange(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'in-progress': return 'bg-blue-500/10 text-blue-500';
      case 'todo': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="ابحث في المهام، المشاريع، العملاء، الملاحظات..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {!hasResults && (
          <CommandEmpty>
            <div className="flex flex-col items-center py-6 text-muted-foreground">
              <Search className="w-10 h-10 mb-2 opacity-50" />
              <p>لا توجد نتائج</p>
              <p className="text-sm">جرب البحث بكلمات مختلفة</p>
            </div>
          </CommandEmpty>
        )}
        
        {filteredTasks.length > 0 && (
          <CommandGroup heading="المهام">
            {filteredTasks.map((task) => (
              <CommandItem
                key={task.id}
                onSelect={() => handleSelectTask(task.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-muted-foreground" />
                  <span>{task.title}</span>
                </div>
                <Badge variant="secondary" className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredProjects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="المشاريع">
              {filteredProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => handleSelectProject(project.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <span>{project.title}</span>
                  </div>
                  <Badge variant="secondary" className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredClients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="العملاء">
              {filteredClients.map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => handleSelectClient(client.id)}
                >
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{client.name}</span>
                  {client.company && (
                    <span className="text-muted-foreground text-sm mr-2">
                      - {client.company}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {filteredNotes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="الملاحظات">
              {filteredNotes.map((note) => (
                <CommandItem
                  key={note.id}
                  onSelect={() => handleSelectNote(note.id)}
                >
                  <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>{note.title}</span>
                  {note.folder && (
                    <Badge variant="outline" className="mr-2 text-xs">
                      {note.folder}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function useGlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setOpen(true);
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return { open, setOpen };
}
