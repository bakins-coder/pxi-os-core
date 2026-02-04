import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrganizationSettings, AIAgentMode } from '../types';

interface SettingsState {
    settings: OrganizationSettings;
    updateSettings: (settings: Partial<OrganizationSettings>) => void;
    setBrandColor: (color: string) => void;
    cloudEnabled: boolean;
    isDemoMode: boolean;
    strictMode: boolean;
    partialSetupData: any | null;
    completeSetup: (settings: Partial<OrganizationSettings>) => void;
    updatePartialSetup: (data: any) => void;
    toggleStrictMode: () => void;
    reset: () => void;
    fetchSettings: (orgId: string) => Promise<void>;
}

const DEFAULT_SETTINGS: OrganizationSettings = {
    id: '',
    name: 'My New Workspace',
    type: 'General',
    currency: 'NGN',
    setupComplete: false,
    enabledModules: ['CRM', 'Finance', 'Reports'],
    agentMode: AIAgentMode.AI_AGENTIC,
    brandColor: '#00ff9d',
    integrations: [],
    apiKeys: [],
    address: '',
    contactPhone: '',
    contactPerson: { email: '', jobTitle: '', name: '' },
    logo: '',
    bankInfo: {
        bankName: '',
        accountName: '',
        accountNumber: ''
    }
};

const INITIAL_SYSTEM_FLAGS = {
    cloudEnabled: false,
    isDemoMode: false,
    strictMode: false,
    partialSetupData: null
};

import { supabase } from '../services/supabase';

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: DEFAULT_SETTINGS,
            ...INITIAL_SYSTEM_FLAGS,
            updateSettings: (newSettings) =>
                set((state) => ({ settings: { ...state.settings, ...newSettings } })),
            setBrandColor: (color) =>
                set((state) => {
                    document.documentElement.style.setProperty('--brand-primary', color);
                    return { settings: { ...state.settings, brandColor: color } };
                }),
            updatePartialSetup: (data) => set({ partialSetupData: data }),
            completeSetup: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings, setupComplete: true },
                    partialSetupData: null
                })),
            toggleStrictMode: () => set((state) => ({ strictMode: !state.strictMode })),
            reset: () => set({ settings: DEFAULT_SETTINGS, ...INITIAL_SYSTEM_FLAGS }),
            fetchSettings: async (orgId: string) => {
                try {
                    console.log('[Settings] Fetching settings for:', orgId);
                    if (!supabase) return;
                    const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).single();
                    if (data) {
                        console.log('[Settings] Fetched:', data.name);
                        set((state) => ({
                            settings: {
                                ...state.settings,
                                id: data.id,
                                name: data.name,
                                brandColor: data.brand_color || state.settings.brandColor,
                                // FIX: DB column is 'logo', not 'logo_url'
                                logo: data.logo || state.settings.logo,
                                setupComplete: true
                            }
                        }));
                    } else if (error) {
                        console.error('[Settings] Fetch error:', error);
                    }
                } catch (err) {
                    console.error('Failed to fetch settings:', err);
                }
            }
        }),
        {
            name: 'settings-storage',
        }
    )
);
