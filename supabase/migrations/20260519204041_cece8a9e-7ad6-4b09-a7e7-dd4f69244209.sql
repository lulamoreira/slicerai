-- Table: profiles
CREATE TABLE public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  full_name       text,
  role            text NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
  access_status   text NOT NULL DEFAULT 'pending', -- 'active' | 'expired' | 'pending' | 'blocked'
  access_type     text DEFAULT 'manual',          -- 'manual' | 'subscription' (future)
  access_start    timestamptz DEFAULT now(),
  access_end      timestamptz,                    -- NULL = indefinite
  created_at      timestamptz DEFAULT now(),
  last_login      timestamptz,
  renewal_requested_at timestamptz,              -- when user last requested renewal
  notes           text                           -- admin notes about this user
);

-- Table: access_requests
CREATE TABLE public.access_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email  text NOT NULL,
  type        text NOT NULL,  -- 'new_access' | 'renewal'
  message     text,
  status      text DEFAULT 'pending',  -- 'pending' | 'approved' | 'denied'
  created_at  timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles(id)
);

-- Table: subscriptions
CREATE TABLE public.subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan                text DEFAULT 'free',   -- 'free' | 'monthly' | 'yearly' (future)
  price_cents         int DEFAULT 0,
  currency            text DEFAULT 'BRL',
  payment_provider    text,                  -- 'stripe' | 'mercadopago' (future)
  external_id         text,                  -- Stripe subscription ID (future)
  status              text DEFAULT 'manual', -- 'manual' | 'active' | 'canceled' | 'past_due'
  current_period_start timestamptz,
  current_period_end   timestamptz,
  created_at          timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile limited fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Access requests policies
CREATE POLICY "Users see own requests"
  ON public.access_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own requests"
  ON public.access_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin manages all requests"
  ON public.access_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscriptions policies
CREATE POLICY "Users see own subscription"
  ON public.subscriptions FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Admin manages all subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, access_status, access_type, access_end)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'lula1973@gmail.com' THEN 'admin' ELSE 'user' END,
    CASE WHEN NEW.email = 'lula1973@gmail.com' THEN 'active' ELSE 'pending' END,
    'manual',
    CASE WHEN NEW.email = 'lula1973@gmail.com' THEN NULL ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable pg_cron and pg_net for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;