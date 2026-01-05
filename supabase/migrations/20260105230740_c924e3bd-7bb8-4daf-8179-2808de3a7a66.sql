
-- Create personal_subscriptions table for user's own subscriptions
CREATE TABLE public.personal_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, weekly
  category TEXT DEFAULT 'other', -- entertainment, software, services, utilities, other
  next_payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, cancelled
  notes TEXT DEFAULT '',
  url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.personal_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own personal subscriptions"
ON public.personal_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal subscriptions"
ON public.personal_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal subscriptions"
ON public.personal_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal subscriptions"
ON public.personal_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_personal_subscriptions_updated_at
BEFORE UPDATE ON public.personal_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
