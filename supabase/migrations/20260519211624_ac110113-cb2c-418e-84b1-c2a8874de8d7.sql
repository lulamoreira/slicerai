ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS api_key_mode text 
DEFAULT 'personal' 
CHECK (api_key_mode IN ('personal', 'centralized'));

-- Ensure existing users have a value
UPDATE public.profiles SET api_key_mode = 'personal' 
WHERE api_key_mode IS NULL;