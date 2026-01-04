-- Add section column to lessons table for organizing lessons into modules
ALTER TABLE public.lessons 
ADD COLUMN section text DEFAULT NULL;

COMMENT ON COLUMN public.lessons.section IS 'Section or module name for organizing lessons (e.g., Basics, Grammar)';