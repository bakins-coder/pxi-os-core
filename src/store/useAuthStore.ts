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
}

// Mock users for now, mirroring the initial logic
const MOCK_USERS: User[] = [
    { id: 'sys-admin-1', name: 'Xquisite Admin', email: 'toxsyyb@yahoo.co.uk', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xquisite', companyId: 'org-xquisite' },
    { id: 'sys-admin-ore', name: 'Ore Braithwaite', email: 'oreoluwatomiwab@gmail.com', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OreBraithwaite', companyId: 'org-xquisite' },
    { id: 'super-admin-root', name: 'Platform Architect', email: 'root@paradigm-xi.com', role: Role.SUPER_ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Architect', companyId: 'platform-global' }
];

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            login: async (emailOrId: string, password?: string) => {
                if (!supabase) throw new Error('Supabase client not initialized');
                if (!password) throw new Error('Password required for secure login.');

                let email = emailOrId;

                // [LOOKUP] Resolve Staff ID to Email
                if (!email.includes('@')) {
                    // Assume it's a Staff ID (e.g. XQ-0001)
                    // Use RPC to bypass RLS for anonymous users
                    const { data: resolvedEmail, error: lookupError } = await supabase
                        .rpc('get_email_by_staff_id', { lookup_id: emailOrId.trim() });

                    if (resolvedEmail) {
                        email = resolvedEmail;
                        console.log(`[Auth] Resolved Staff ID ${emailOrId} -> ${email}`);
                    } else {
                        throw new Error(`Staff ID '${emailOrId}' not recognized.`);
                    }
                }

                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                if (!data.user) throw new Error('No user returned from Supabase.');

                // 1. Fetch Profile Source of Truth
                let { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id, role, first_name, last_name')
                    .eq('id', data.user.id)
                    .single();

                // [SELF-HEAL] If Profile is missing OR missing Organization ID, try to heal it.
                if (!profile || !profile.organization_id) {
                    console.warn('[Auth] Incomplete Profile detected! Auto-healing...');
                    const metadata = data.user.user_metadata || {};
                    // Try to finding employee record to sync details
                    const { data: emp } = await supabase.from('employees').select('role, organization_id, first_name, last_name, id')
                        .or(`email.eq.${email},staff_id.eq.${email.split('@')[0]}`)
                        .single();

                    const newProfilePayload = {
                        id: data.user.id,
                        email: email,
                        organization_id: emp?.organization_id || profile?.organization_id ||
                            (typeof metadata.company_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metadata.company_id) ? metadata.company_id : undefined),
                        role: emp?.role || metadata.role || profile?.role || 'Employee',
                        first_name: emp?.first_name || profile?.first_name || (metadata.name ? metadata.name.split(' ')[0] : email.split('@')[0]),
                        last_name: emp?.last_name || profile?.last_name || (metadata.name ? metadata.name.split(' ').slice(1).join(' ') : 'User'),
                        is_super_admin: false
                    };

                    const { error: upsertError } = await supabase.from('profiles').upsert(newProfilePayload);
                    if (upsertError) {
                        console.error('[Auth] Failed to heal profile:', upsertError);
                        // Don't block login if it fails, filtering will just return empty which is safer than crashing
                    } else {
                        // Re-fetch only if successful
                        const { data: healedProfile } = await supabase.from('profiles').select('organization_id, role, first_name, last_name').eq('id', data.user.id).single();
                        profile = healedProfile;
                    }
                }

                // 2. Determine Authoritative Company ID
                const finalCompanyId = profile?.organization_id || data.user.user_metadata.company_id;

                // 3. Fetch Role Permissions if tied to an org
                let permissionTags: string[] = [];
                if (finalCompanyId && profile?.role) {
                    const { data: roleData } = await supabase
                        .from('job_roles')
                        .select('permissions')
                        .eq('organization_id', finalCompanyId)
                        .eq('title', profile.role)
                        .single();

                    if (roleData?.permissions) {
                        permissionTags = roleData.permissions;
                    }
                }

                // Construct User object
                const user: User = {
                    id: data.user.id,
                    email: data.user.email || '',
                    name: (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : null) || data.user.user_metadata.name || 'User',
                    role: (profile?.role as Role) || (data.user.user_metadata.role as Role) || Role.ADMIN,
                    companyId: finalCompanyId,
                    avatar: data.user.user_metadata.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
                    isSuperAdmin: false, // Temporarily disabled
                    permissionTags
                };

                if (!finalCompanyId) console.warn('CRITICAL: No Company ID found for user.', profile);
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

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                            role,
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
                        }
                    }
                });

                if (error) throw error;

                if (data.user) {
                    useSettingsStore.getState().reset();

                    // Explicitly create profile to avoid trigger race conditions
                    const { error: profileError } = await supabase.from('profiles').insert([{
                        id: data.user.id,
                        email: email,
                        first_name: name.split(' ')[0],
                        last_name: name.split(' ').slice(1).join(' ') || 'User',
                        role: role,
                        // organization_id left null initially, will be filled by invite logic or remains null for new org creators
                    }]);

                    // Ignore duplicates (if trigger won)
                    if (profileError && !profileError.message.includes('duplicate key')) {
                        console.error("Manual profile creation failed:", profileError);
                    }

                    // Perform immediate login context setup
                    const newUser: User = {
                        id: data.user.id,
                        name,
                        email,
                        role: role,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                        companyId: undefined as unknown as string, // Will be set on next load or flow
                        permissionTags: []
                    };
                    set({ user: newUser });
                }
            },
            resetPassword: async (email: string) => {
                // ... (Keep existing)
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
            },
            refreshSession: async () => {
                if (!supabase) return { success: false, error: 'No client' };
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return { success: false, error: 'No user session' };

                // Re-fetch Profile
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('organization_id, role, first_name, last_name, is_super_admin')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('[Auth] Refresh failed:', error);
                    return { success: false, error };
                }

                if (profile) {
                    const currentUser = get().user;

                    // Fetch Permissions on refresh too
                    let permissionTags: string[] = currentUser?.permissionTags || [];
                    const targetOrgId = (profile.is_super_admin) ? currentUser?.companyId : (profile.organization_id || currentUser?.companyId);
                    const targetRole = (profile.role as Role) || currentUser?.role;

                    if (targetOrgId && targetRole) {
                        const { data: roleData } = await supabase
                            .from('job_roles')
                            .select('permissions')
                            .eq('organization_id', targetOrgId)
                            .eq('title', targetRole)
                            .single();

                        if (roleData?.permissions) {
                            permissionTags = roleData.permissions;
                        }
                    }

                    if (currentUser) {
                        set({
                            user: {
                                ...currentUser,
                                role: targetRole || currentUser.role,
                                companyId: targetOrgId,
                                isSuperAdmin: profile.is_super_admin || false,
                                name: (profile.first_name || profile.last_name)
                                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                                    : currentUser.name,
                                permissionTags
                            }
                        });
                        console.log('[Auth] Session refreshed. Perms:', permissionTags.length);
                        return { success: true };
                    }
                }
                return { success: false, error: 'Profile not found' };
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
