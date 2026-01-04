-- Add category column to projects table
ALTER TABLE public.projects ADD COLUMN category text DEFAULT 'General';

-- Create index for better filtering performance
CREATE INDEX idx_projects_category ON public.projects(category);