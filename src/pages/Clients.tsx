import { Plus, Search, Users, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const sampleClients = [
  {
    id: '1',
    name: 'Acme Corp',
    email: 'contact@acme.com',
    phone: '+1 555-0123',
    status: 'active',
    projects: 3,
    revenue: 15000,
  },
  {
    id: '2',
    name: 'TechStart Inc',
    email: 'hello@techstart.io',
    phone: '+1 555-0456',
    status: 'lead',
    projects: 1,
    revenue: 5000,
  },
  {
    id: '3',
    name: 'Design Studio',
    email: 'info@designstudio.co',
    phone: '+1 555-0789',
    status: 'past',
    projects: 2,
    revenue: 8500,
  },
];

const statusColors: Record<string, string> = {
  lead: 'bg-status-new/10 text-status-new',
  active: 'bg-status-completed/10 text-status-completed',
  past: 'bg-muted text-muted-foreground',
  partner: 'bg-status-progress/10 text-status-progress',
};

export default function Clients() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client relationships
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          className="pl-9"
        />
      </div>

      {/* Clients List */}
      <div className="space-y-3">
        {sampleClients.map((client) => (
          <div
            key={client.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-200 cursor-pointer"
          >
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {client.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{client.name}</p>
                <Badge className={cn('capitalize', statusColors[client.status])}>
                  {client.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {client.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {client.phone}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-foreground">${client.revenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{client.projects} projects</p>
            </div>
          </div>
        ))}
      </div>

      {sampleClients.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No clients yet. Add your first client!</p>
        </div>
      )}
    </div>
  );
}
