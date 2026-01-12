import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '../types';
import { supabase, syncTableToCloud, pullCloudState } from '../services/supabase';
import { useSettingsStore } from './useSettingsStore';

interface AuthState {
    user: User | null;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    signup: (name: string, email: string, password?: string, role?: Role) => Promise<void>;
    resetPassword: (email: string) => Promise<{ success: boolean; message?: string; isBypass?: boolean }>;
    updatePassword: (password: string) => Promise<void>;
}

// Mock users for now, mirroring the initial logic
const MOCK_USERS: User[] = [
    { id: 'sys-admin-1', name: 'Xquisite Admin', email: 'toxsyyb@yahoo.co.uk', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xquisite', companyId: 'org-xquisite' },
    { id: 'sys-admin-ore', name: 'Ore Braithwaite', email: 'oreoluwatomiwab@gmail.com', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OreBraithwaite', companyId: 'org-xquisite' },
    { id: 'super-admin-root', name: 'Platform Architect', email: 'root@paradigm-xi.com', role: Role.SUPER_ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Architect', companyId: 'platform-global' }
];

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            login: async (email: string, password?: string) => {
                if (!supabase) throw new Error('Supabase client not initialized');

                // If no password provided, try to find in legacy mock list (fallback)
                // or just throw error demanding password. 
                // Decision: We demand password now for real auth.
                if (!password) throw new Error('Password required for secure login.');

                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                if (!data.user) throw new Error('No user returned from Supabase.');

                // Construct User object from Supabase session
                const user: User = {
                    id: data.user.id,
                    email: data.user.email || '',
                    name: data.user.user_metadata.name || 'User',
                    role: (data.user.user_metadata.role as Role) || Role.ADMIN,
                    companyId: data.user.user_metadata.company_id,
                    avatar: data.user.user_metadata.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
                };

                set({ user });
            },
            logout: async () => {
                if (supabase) await supabase.auth.signOut();
                set({ user: null });
                useSettingsStore.getState().reset();
            },
            setUser: (user) => set({ user }),
            signup: async (name: string, email: string, password?: string, role: Role = Role.ADMIN) => {
                if (!supabase) throw new Error('Supabase client not initialized');
                if (!password) throw new Error('Password required for signup.');

                if (!password) throw new Error('Password required for signup.');

                // const companyId = `org-${Date.now()}`; // REMOVED: Deferred to Setup Wizard

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                            role,
                            // company_id: companyId, // DEFER: created during setup wizard
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
                        }
                    }
                });

                if (error) throw error;

                if (data.user) {
                    // Reset any previous settings to ensure clean slate
                    useSettingsStore.getState().reset();

                    const newUser: User = {
                        id: data.user.id,
                        name,
                        email,
                        role,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                        // companyId is intentionally undefined
                        companyId: undefined as any
                    };
                    set({ user: newUser });
                }
            },
            resetPassword: async (email: string) => {
                // TEMPORARY BYPASS: Legacy User Migration
                if (email.trim().toLowerCase() === 'toxsyyb@yahoo.co.uk') {
                    const legacyUser = MOCK_USERS.find(u => u.email === 'toxsyyb@yahoo.co.uk');
                    if (legacyUser) {
                        set({ user: legacyUser });
                        return { success: true, isBypass: true };
                    }
                }

                if (!supabase) throw new Error('Supabase client not initialized');

                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/update-password',
                });

                if (error) throw error;

                return { success: true, message: 'Check your email for the password reset link.' };
            },
            updatePassword: async (password: string) => {
                if (!supabase) throw new Error('Supabase client not initialized');

                const { error } = await supabase.auth.updateUser({
                    password: password
                });

                if (error) throw error;
            }
        }),
        {
            name: 'auth-storage',
        }
    )
);
