import { create } from 'zustand';
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  access_status: 'active' | 'pending' | 'expired' | 'blocked';
  access_type: string;
  access_start: string;
  access_end: string | null;
  created_at: string;
  last_login: string | null;
  renewal_requested_at: string | null;
  notes: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  
  setSession: (user: User | null) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setSession: async (user) => {
    set({ user, loading: true });
    if (user) {
      await get().fetchProfile();
    } else {
      set({ profile: null, loading: false });
    }
    set({ initialized: true });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Check for automatic expiry
      if (data.access_status === 'active' && data.access_end && new Date(data.access_end) < new Date()) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ access_status: 'expired' })
          .eq('id', user.id)
          .select()
          .single();
        
        if (!updateError && updated) {
          set({ profile: updated });
          return;
        }
      }

      set({ profile: data, loading: false });
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ loading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  updateProfile: async (updates) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      set({ profile: data });
    }
  }
}));
