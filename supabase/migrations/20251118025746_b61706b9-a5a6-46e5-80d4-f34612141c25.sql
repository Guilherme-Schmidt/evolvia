-- Add birth_date and location to profiles table
ALTER TABLE public.profiles
ADD COLUMN birth_date date,
ADD COLUMN location text;