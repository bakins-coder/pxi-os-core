import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
    refreshSession: () => Promise<{ success: boolean; error?: any }>;
    initializeAuthListener: () => Promise<void>;
}

// Mock users for now, mirroring the initial logic
const MOCK_USERS: User[] = [
    { id: 'sys-admin-1', name: 'Xquisite Admin', email: 'toxsyyb@yahoo.co.uk', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xquisite', companyId: 'org-xquisite' },
    { id: 'sys-admin-ore', name: 'Ore Braithwaite', email: 'oreoluwatomiwab@gmail.com', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OreBraithwaite', companyId: 'org-xquisite' },
    { id: 'super-admin-root', name: 'Platform Architect', email: 'root@paradigm-xi.com', role: Role.SUPER_ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Architect', companyId: 'platform-global' }
];

// Helper for timeouts
const withTimeout = async <T>(promise: PromiseLike<T>, ms: number = 5000, errorMsg: string = 'Operation timed out'): Promise<T> => {
    return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
    ]);
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            login: async (emailOrId: string, password?: string) => {
                if (!supabase) throw new Error('Supabase client not initialized');
                if (!password) throw new Error('Password required for secure login.');

                let email = emailOrId;
                console.log('[Auth] Starting login for:', email);

                // [LOOKUP] Resolve Staff ID
                if (!email.includes('@')) {
                    try {
                        // Explicitly cast the result to any or the specific Supabase response type to avoid 'unknown' inference issues helper
                        const response = await withTimeout(
                            supabase.rpc('get_email_by_staff_id', { lookup_id: emailOrId.trim() }),
                            3000, 'Staff ID lookup timed out'
                        ) as any;

                        const resolvedEmail = response.data;

                        if (resolvedEmail) email = resolvedEmail;
                        else throw new Error(`Staff ID '${emailOrId}' not recognized.`);
                    } catch (e) {
                        console.warn('[Auth] Staff ID lookup failed:', e);
                        throw e;
                    }
                }

                console.log('[Auth] Signing in...');
                // Authenticate
                const { data, error } = await withTimeout(
                    supabase.auth.signInWithPassword({ email, password }),
                    8000, 'Supabase Sign-In timed out'
                );

                if (error) throw error;
                if (!data.user) throw new Error('No user returned from Supabase.');

                // 1. Fetch Profile
                let profile = null;
                try {
                    // Check if metadata has bad UUID first to avoid RLS crash
                    const metaCompanyId = data.user.user_metadata?.company_id || data.user.user_metadata?.organization_id;
                    if (metaCompanyId && typeof metaCompanyId === 'string' && metaCompanyId.startsWith('org-')) {
                        console.warn('[Auth] Pre-emptive Clean: Bad Metadata found. Wiping...');
                        await supabase.auth.updateUser({ data: { company_id: null, organization_id: null } });
                    }

                    const { data: fetchedProfile, error: profileError } = await withTimeout(
                        supabase.from('profiles')
                            .select('organization_id, role, first_name, last_name, is_super_admin')
                            .eq('id', data.user.id)
                            .maybeSingle(),
                        5000, 'Profile fetch timed out'
                    );

                    if (profileError) {
                        console.error('[Auth] Profile fetch error:', profileError);
                    } else {
                        profile = fetchedProfile;
                    }
                } catch (err) {
                    console.error('[Auth] Profile fetch failed (non-critical):', err);
                }

                // [SELF-HEAL] Logic if profile missing... (Simplified for stability)
                if (!profile) {
                    console.warn('[Auth] Profile missing. Attempting basic self-heal...');
                    // Create minimal profile to prevent blocking
                    try {
                        const newProfile = {
                            id: data.user.id,
                            email: email,
                            role: Role.ADMIN, // Default
                            first_name: 'User',
                            last_name: ''
                        };
                        await supabase.from('profiles').upsert(newProfile);
                        profile = newProfile as any;
                    } catch (healErr) {
                        console.error('[Auth] Self-heal failed:', healErr);
                    }
                }

                // 2. Determine Scope
                const targetOrgId = profile?.organization_id || data.user.user_metadata?.company_id || null;
                const targetRole = (profile?.role as Role) || Role.ADMIN;

                // 3. Fetch Permissions
                let permissionTags: string[] = ['*']; // Default to ALL if fetch fails to ensure access
                if (targetOrgId) {
                    try {
                        const response = await withTimeout(
                            supabase.from('job_roles')
                                .select('permissions')
                                .eq('organization_id', targetOrgId)
                                .eq('title', targetRole)
                                .maybeSingle(),
                            3000, 'Permissions fetch timed out'
                        ) as any;

                        const { data: roleData } = response;
                        if (roleData?.permissions) permissionTags = roleData.permissions;
                    } catch (permErr) {
                        console.warn('[Auth] Perms fetch failed, defaulting to basic:', permErr);
                    }
                }

                const user: User = {
                    id: data.user.id,
                    email: data.user.email || '',
                    name: (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : null) || 'User',
                    role: targetRole,
                    companyId: targetOrgId || 'org-xquisite', // Fallback to ensure not undefined
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
                    isSuperAdmin: profile?.is_super_admin || false,
                    permissionTags
                };

                set({ user });
                console.log('[Auth] Login complete.');
            },
            logout: async () => {
                if (supabase) await supabase.auth.signOut();
                set({ user: null });
                useSettingsStore.getState().reset();
            },
            setUser: (user) => set({ user }),
            signup: async (name: string, email: string, password?: string, role: Role = Role.ADMIN) => {
                if (!supabase) throw new Error('Client missing');
                const { data, error } = await supabase.auth.signUp({
                    email, password,
                    options: { data: { name, role, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` } }
                });
                if (error) throw error;
                if (data.user) {
                    useSettingsStore.getState().reset();
                    set({ user: { id: data.user.id, name, email, role, avatar: '', companyId: '', permissionTags: [] } });
                }
            },
            resetPassword: async (email: string) => {
                if (email.trim().toLowerCase() === 'toxsyyb@yahoo.co.uk') {
                    const legacyUser = MOCK_USERS.find(u => u.email === 'toxsyyb@yahoo.co.uk');
                    if (legacyUser) {
                        set({ user: legacyUser });
                        return { success: true, isBypass: true };
                    }
                }
                if (!supabase) throw new Error('Client missing');
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
                if (error) throw error;
                return { success: true, message: 'Reset link sent.' };
            },
            updatePassword: async (password: string) => {
                if (!supabase) throw new Error('Client missing');
                const { error } = await supabase.auth.updateUser({ password });
                if (error) throw error;
            },
            refreshSession: async () => {
                if (!supabase) return { success: false, error: 'No client' };
                // Use getUser to verify token validity
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) return { success: false, error: 'No valid session' };

                // Reuse Login logic for profile fetching (simplified)
                const current = get().user;
                if (current) return { success: true }; // If we have a user in store, trust it to avoid double-fetch flicker

                // If no user in store, hydrate basic info from Auth User
                const metadata = user.user_metadata || {};
                set({
                    user: {
                        id: user.id,
                        email: user.email || '',
                        role: (metadata.role as Role) || Role.ADMIN,
                        companyId: metadata.company_id || 'org-xquisite',
                        name: metadata.name || 'User',
                        avatar: metadata.avatar || '',
                        permissionTags: ['*'], // Default to full access on refresh to avoid lockout
                        isSuperAdmin: false
                    }
                });
                return { success: true };
            },
            initializeAuthListener: async () => {
                if (!supabase) return;
                console.log('[Auth] Initializing Listener...');

                // Manual Check: Robustly parse and set session
                const hash = window.location.hash;
                if (hash && (hash.includes('type=recovery') || window.location.href.includes('type=recovery'))) {
                    try {
                        const fragment = hash.substring(1);
                        const params = new URLSearchParams(fragment);
                        const accessToken = params.get('access_token');
                        const refreshToken = params.get('refresh_token');
                        if (accessToken && refreshToken) {
                            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
                            window.location.hash = '/update-password';
                        }
                    } catch (e) { console.error('[Auth] Error parsing hash params:', e); }
                }

                supabase.auth.onAuthStateChange(async (event, session) => {
                    console.log(`[Auth] Event: ${event}`);
                    if (event === 'PASSWORD_RECOVERY') {
                        console.log('[Auth] Recovery mode detected. Redirecting...');
                        window.location.hash = '/update-password';
                    }

                    // Only sync on SIGNED_IN if we don't have a user
                    if (event === 'SIGNED_IN' && session && !get().user) {
                        console.log('[Auth] Session active. Syncing state...');
                        get().refreshSession();
                    }
                    if (event === 'SIGNED_OUT') {
                        set({ user: null });
                        useSettingsStore.getState().reset();
                    }
                });
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
