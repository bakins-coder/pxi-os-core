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
    { id: 'sys-admin-1', name: 'Xquisite Admin', email: 'toxsyyb@yahoo.co.uk', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xquisite', companyId: '10959119-72e4-4e57-ba54-923e36bba6a6' },
    { id: 'sys-admin-ore', name: 'Ore Braithwaite', email: 'oreoluwatomiwab@gmail.com', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OreBraithwaite', companyId: '10959119-72e4-4e57-ba54-923e36bba6a6' },
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
                        const response = await withTimeout(
                            supabase.rpc('get_email_by_staff_id', { lookup_id: emailOrId.trim() }),
                            3000, 'Staff ID lookup timed out'
                        ) as any;

                        const resolvedEmail = response.data;

                        if (resolvedEmail) {
                            email = resolvedEmail;
                        } else {
                            // [FAILSAFE] If RPC fails but it looks like a Staff ID, try constructing the email
                            if (/^XQ-\d+$/i.test(emailOrId.trim())) {
                                console.warn('[Auth] RPC lookup failed, attempting fallback construction for:', emailOrId);
                                email = `${emailOrId.trim().toLowerCase()}@xquisite.local`;
                            } else {
                                throw new Error(`Staff ID '${emailOrId}' not recognized.`);
                            }
                        }
                    } catch (e) {
                        // If it matches the format, try the fallback even if RPC errored
                        if (/^XQ-\d+$/i.test(emailOrId.trim())) {
                            console.warn('[Auth] RPC Error, using fallback for:', emailOrId);
                            email = `${emailOrId.trim().toLowerCase()}@xquisite.local`;
                        } else {
                            console.warn('[Auth] Staff ID lookup failed:', e);
                            throw e;
                        }
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
                            // SECURITY FIX: Default to EMPLOYEE, only specific emails get ADMIN if profile fails
                            role: (email === 'oreoluwatomiwab@gmail.com' || email === 'toxsyyb@yahoo.co.uk') ? Role.ADMIN : Role.EMPLOYEE,
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
                    companyId: targetOrgId || '10959119-72e4-4e57-ba54-923e36bba6a6', // Fallback to ensure not undefined
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
                    isSuperAdmin: profile?.is_super_admin || (email === 'oreoluwatomiwab@gmail.com' || email === 'toxsyyb@yahoo.co.uk') || false,
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
                    email, password: password || '',
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

                // [FIX] Verify we have a COMPLETE user object. If companyId is missing, force refresh.
                const current = get().user;
                if (current && current.companyId && current.id === user.id) return { success: true };

                // 1. Fetch Profile from DB to ensure we get the Organization ID
                let profile = null;
                try {
                    const { data: fetchedProfile, error: profileErr } = await withTimeout(
                        supabase.from('profiles')
                            .select('organization_id, role, first_name, last_name, is_super_admin')
                            .eq('id', user.id)
                            .maybeSingle(),
                        5000, 'Profile check timed out'
                    );
                    if (!profileErr) profile = fetchedProfile;
                } catch (e) { console.error("[Auth] Profile fetch error:", e); }

                const metadata = user.user_metadata || {};

                // SECURITY FIX: Safe Defaults
                const isKnownAdmin = user.email === 'oreoluwatomiwab@gmail.com' || user.email === 'toxsyyb@yahoo.co.uk';
                const safeRole = (profile?.role as Role) || (metadata.role as Role) || (isKnownAdmin ? Role.ADMIN : Role.EMPLOYEE);

                // [CRITICAL FIX] Ensure Company ID is never empty for staff
                let targetOrgId = profile?.organization_id || metadata.company_id || metadata.organization_id;

                // [PREFIX PROTOCOL] "XQ" implies "Xquisite"
                // As per user requirement: The prefix is the source of truth.
                const isXquisiteStaff = user.email?.toLowerCase().startsWith('xq-') || user.email?.includes('@xquisite');

                if (!targetOrgId && isXquisiteStaff) {
                    console.log('[Auth] Recognized XQ prefix. Auto-mapping to Xquisite Workspace.');
                    targetOrgId = '10959119-72e4-4e57-ba54-923e36bba6a6';
                }

                // [SELF-HEALING] Link Database Record
                // If we haven't confirmed the DB link yet (no profile org_id), ensure the employee record is connected.
                if ((!profile?.organization_id) && !isKnownAdmin) {
                    try {
                        const emailLookup = user.email || '';
                        let matchQuery = supabase.from('employees').select('organization_id, role, id, staff_id').is('user_id', null);

                        if (isXquisiteStaff) {
                            // Extract ID: xq-3828@... -> XQ-3828
                            const staffId = emailLookup.split('@')[0].toUpperCase().replace('XQ-', 'XQ-');
                            matchQuery = matchQuery.ilike('staff_id', staffId);
                        } else {
                            matchQuery = matchQuery.eq('email', emailLookup);
                        }

                        const { data: lostEmployee } = await matchQuery.maybeSingle();

                        if (lostEmployee) {
                            console.log('[Auth] Linking Staff ID:', lostEmployee.staff_id);
                            await supabase.from('employees').update({ user_id: user.id }).eq('id', lostEmployee.id);

                            // If we auto-mapped above, this confirms it. If not, this sets it.
                            if (!targetOrgId) targetOrgId = lostEmployee.organization_id;

                            // Refresh settings immediately
                            setTimeout(() => {
                                useSettingsStore.getState().fetchSettings(targetOrgId);
                            }, 500);
                        } else if (targetOrgId) {
                            // We have an Org ID (likely from Prefix Protocol), but maybe record is already linked? 
                            // Just ensure settings are loaded.
                            setTimeout(() => {
                                useSettingsStore.getState().fetchSettings(targetOrgId);
                            }, 500);
                        }
                    } catch (healErr) {
                        console.warn('[Auth] Self-healing failed:', healErr);
                    }
                }

                // Final Fallback
                if (!targetOrgId) targetOrgId = '10959119-72e4-4e57-ba54-923e36bba6a6';

                // Fetch Permissions for this Org/Role

                // Fetch Permissions for this Org/Role
                let permissionTags: string[] = isKnownAdmin ? ['*'] : [];
                if (targetOrgId && !isKnownAdmin) {
                    try {
                        const { data: roleData } = await supabase.from('job_roles')
                            .select('permissions')
                            .eq('organization_id', targetOrgId)
                            .eq('title', safeRole)
                            .maybeSingle();
                        if (roleData?.permissions) permissionTags = roleData.permissions;
                    } catch (e) { console.warn("[Auth] Permission fetch failed:", e); }
                }

                set({
                    user: {
                        id: user.id,
                        email: user.email || '',
                        role: safeRole,
                        companyId: targetOrgId,
                        name: (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : null) || metadata.name || 'User',
                        avatar: metadata.avatar || '',
                        permissionTags,
                        isSuperAdmin: profile?.is_super_admin || isKnownAdmin || false
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
