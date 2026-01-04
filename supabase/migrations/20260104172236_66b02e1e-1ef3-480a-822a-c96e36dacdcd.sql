-- Create table for user currency rates
CREATE TABLE public.user_currency_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  usd_to_eur NUMERIC NOT NULL DEFAULT 0.82,
  eur_to_dzd NUMERIC NOT NULL DEFAULT 275,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_currency_rates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own currency rates" 
ON public.user_currency_rates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own currency rates" 
ON public.user_currency_rates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own currency rates" 
ON public.user_currency_rates 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_currency_rates_updated_at
BEFORE UPDATE ON public.user_currency_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();