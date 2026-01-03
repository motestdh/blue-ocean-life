-- Enable realtime for tasks table
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- Enable realtime for projects table
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;

-- Enable realtime for habits table
ALTER TABLE public.habits REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.habits;