import { create } from 'zustand';
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user';
  access_status: 'active' | 'pending' | 'expired' | 'blocked';
  api_key_mode: 'personal' | 'centralized';
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
        .select('full_name, role, access_status, access_end, api_key_mode, created_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      let profileData = data as unknown as Profile;

      // Normalize role to lowercase
      if (profileData.role) {
        profileData.role = profileData.role.toLowerCase() as 'admin' | 'user';
      }

      // Ensure full_name is populated from metadata or email as fallback
      if (!profileData.full_name) {
        profileData.full_name = user.user_metadata?.full_name || user.email || null;
      }

      // Update profile in DB if name was missing but present in metadata
      if (!data.full_name && user.user_metadata?.full_name) {
        await supabase.from('profiles')
          .update({ full_name: user.user_metadata.full_name })
          .eq('id', user.id);
      }

      console.log('Fetched profile role:', profileData?.role);

      // Check for automatic expiry
      if (profileData.access_status === 'active' && profileData.access_end && new Date(profileData.access_end) < new Date()) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ access_status: 'expired' })
          .eq('id', user.id)
          .select()
          .single();
        
        if (!updateError && updated) {
          set({ profile: updated as unknown as Profile, loading: false });
          return;
        }
      }

      set({ profile: profileData, loading: false });
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
      set({ profile: data as unknown as Profile });
    }
  }
}));
