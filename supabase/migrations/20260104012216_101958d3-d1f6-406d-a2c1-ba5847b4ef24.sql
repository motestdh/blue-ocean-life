-- Create books_podcasts table
CREATE TABLE public.books_podcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  type TEXT NOT NULL DEFAULT 'book', -- 'book' or 'podcast'
  status TEXT DEFAULT 'to-consume', -- 'to-consume', 'in-progress', 'completed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movies_series table
CREATE TABLE public.movies_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'movie', -- 'movie' or 'series'
  status TEXT DEFAULT 'to-watch', -- 'to-watch', 'watching', 'completed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books_podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies_series ENABLE ROW LEVEL SECURITY;

-- RLS policies for books_podcasts
CREATE POLICY "Users can view their own books_podcasts" ON public.books_podcasts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own books_podcasts" ON public.books_podcasts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own books_podcasts" ON public.books_podcasts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own books_podcasts" ON public.books_podcasts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for movies_series
CREATE POLICY "Users can view their own movies_series" ON public.movies_series FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own movies_series" ON public.movies_series FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own movies_series" ON public.movies_series FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own movies_series" ON public.movies_series FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_books_podcasts_user_id ON public.books_podcasts(user_id);
CREATE INDEX idx_movies_series_user_id ON public.movies_series(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_books_podcasts_updated_at BEFORE UPDATE ON public.books_podcasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_movies_series_updated_at BEFORE UPDATE ON public.movies_series FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();