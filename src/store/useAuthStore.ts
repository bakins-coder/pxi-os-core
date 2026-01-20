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

                // 1. Fetch Profile Source of Truth (Database Link)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id, role, name')
                    .eq('id', data.user.id)
                    .single();

                // 2. Determine Authoritative Company ID
                // Prefer Profile (DB) > Metadata (Stale)
                const finalCompanyId = profile?.organization_id || data.user.user_metadata.company_id;

                // Construct User object
                const user: User = {
                    id: data.user.id,
                    email: data.user.email || '',
                    name: profile?.name || data.user.user_metadata.name || 'User',
                    role: (profile?.role as Role) || (data.user.user_metadata.role as Role) || Role.ADMIN,
                    companyId: finalCompanyId,
                    avatar: data.user.user_metadata.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
                };

                // Debug Log for User
                if (!finalCompanyId) {
                    console.warn('CRITICAL: No Company ID found for user. Profile:', profile);
                } else {
                    console.log('Login Successful. Linked to Org:', finalCompanyId);
                }

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

                    // CHECK FOR AUTO-LINKED PROFILE (Staff Onboarding)
                    // The DB trigger 'on_auth_user_created_link_employee' should have linked this user 
                    // to an organization if their email matched an employee record.
                    let linkedCompanyId: string | undefined = undefined;
                    let linkedRole: Role = role;

                    // Small delay to allow DB trigger to complete (usually instant, but safety first)
                    await new Promise(r => setTimeout(r, 500));

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('organization_id, role')
                        .eq('id', data.user.id)
                        .single();

                    if (profile?.organization_id) {
                        console.log('[Auth] User auto-linked to organization:', profile.organization_id);
                        linkedCompanyId = profile.organization_id;
                        linkedRole = (profile.role as Role) || role;
                    }

                    const newUser: User = {
                        id: data.user.id,
                        name,
                        email,
                        role: linkedRole,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                        companyId: linkedCompanyId as any // If undefined, App will show Setup Wizard. If set, Dashboard.
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
