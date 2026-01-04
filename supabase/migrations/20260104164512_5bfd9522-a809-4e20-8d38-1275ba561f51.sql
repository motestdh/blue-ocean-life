-- Add notification settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_email TEXT,
ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_time TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';