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

const normalizeProfileRole = (role: string | null | undefined): 'admin' | 'user' => {
  return String(role ?? 'user').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
};

const resolveProfileName = (profileName: string | null | undefined, user: User) => {
  const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;
  const normalizedProfileName = typeof profileName === 'string' ? profileName.trim() : '';
  const normalizedMetadataName = typeof metadataName === 'string' ? metadataName.trim() : '';

  return normalizedProfileName || normalizedMetadataName || user.email || null;
};

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
    if (!user) {
      set({ profile: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, access_status, access_end, api_key_mode, created_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const profileData = {
        ...(data as unknown as Profile),
        role: normalizeProfileRole(data?.role),
        full_name: resolveProfileName(data?.full_name, user),
      } satisfies Profile;

      console.log('Profile role:', profileData.role);

      const metadataName = user.user_metadata?.full_name || user.user_metadata?.name;

      if ((!data?.full_name || !String(data.full_name).trim()) && typeof metadataName === 'string' && metadataName.trim()) {
        await supabase
          .from('profiles')
          .update({ full_name: metadataName.trim() })
          .eq('id', user.id);
      }

      // Check for automatic expiry
      if (profileData.access_status === 'active' && profileData.access_end && new Date(profileData.access_end) < new Date()) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ access_status: 'expired' })
          .eq('id', user.id)
          .select()
          .single();
        
        if (!updateError && updated) {
          const updatedProfile = {
            ...(updated as unknown as Profile),
            role: normalizeProfileRole(updated.role),
            full_name: resolveProfileName(updated.full_name, user),
          } satisfies Profile;

          set({ profile: updatedProfile, loading: false });
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
      set({
        profile: {
          ...(data as unknown as Profile),
          role: normalizeProfileRole(data.role),
          full_name: resolveProfileName(data.full_name, user),
        },
      });
    }
  }
}));
