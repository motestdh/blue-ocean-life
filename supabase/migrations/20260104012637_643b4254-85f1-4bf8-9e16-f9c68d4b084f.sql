-- Create user categories table
CREATE TABLE public.user_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0EA5E9',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own categories" ON public.user_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON public.user_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.user_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.user_categories FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_categories_user_id ON public.user_categories(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_categories_updated_at BEFORE UPDATE ON public.user_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_nav_order table for sidebar ordering
CREATE TABLE public.user_nav_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nav_order TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_nav_order ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own nav order" ON public.user_nav_order FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own nav order" ON public.user_nav_order FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own nav order" ON public.user_nav_order FOR UPDATE USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_user_nav_order_updated_at BEFORE UPDATE ON public.user_nav_order FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();