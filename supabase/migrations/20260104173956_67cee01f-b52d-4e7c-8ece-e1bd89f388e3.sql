-- Add gemini_api_key and telegram_bot_token columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gemini_api_key text,
ADD COLUMN IF NOT EXISTS telegram_bot_token text;