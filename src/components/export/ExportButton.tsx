import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, exportToJSON } from '@/lib/export';
import { toast } from '@/hooks/use-toast';

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  filename: string;
  columns?: { key: keyof T; label: string }[];
}

export function ExportButton<T extends Record<string, unknown>>({ 
  data, 
  filename, 
  columns 
}: ExportButtonProps<T>) {
  const handleExportCSV = () => {
    if (data.length === 0) {
      toast({ title: 'No data', description: 'No data to export', variant: 'destructive' });
      return;
    }
    exportToCSV(data, filename, columns);
    toast({ title: 'Exported', description: `${filename}.csv downloaded` });
  };

  const handleExportJSON = () => {
    if (data.length === 0) {
      toast({ title: 'No data', description: 'No data to export', variant: 'destructive' });
      return;
    }
    exportToJSON(data, filename);
    toast({ title: 'Exported', description: `${filename}.json downloaded` });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
