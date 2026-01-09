import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '../types';
import { supabase, syncTableToCloud, pullCloudState } from '../services/supabase';

interface AuthState {
    user: User | null;
    login: (email: string) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    signup: (name: string, email: string, role?: Role) => Promise<void>;
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
            login: async (email: string) => {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
                const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
                if (!user) throw new Error('Identity not recognized.');
                set({ user });
            },
            logout: () => {
                set({ user: null });
            },
            setUser: (user) => set({ user }),
            signup: async (name: string, email: string, role: Role = Role.ADMIN) => {
                const newUser: User = {
                    id: `u-${Date.now()}`,
                    name,
                    email,
                    role,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                    companyId: `org-${Date.now()}`
                };

                set({ user: newUser });

                // Sync to cloud
                if (supabase) {
                    await syncTableToCloud('users', [newUser]);
                }
            }
        }),
        {
            name: 'auth-storage',
        }
    )
);
