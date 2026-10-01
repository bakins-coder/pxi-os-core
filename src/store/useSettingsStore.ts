import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrganizationSettings, AIAgentMode, IndustryType, AppModule } from '../types';
import { supabase } from '../services/supabase';

interface SettingsState {
    settings: OrganizationSettings;
    updateSettings: (settings: Partial<OrganizationSettings>) => void;
    setBrandColor: (color: string) => void;
    cloudEnabled: boolean;
    isDemoMode: boolean;
    strictMode: boolean;
    useLocalLLM: boolean;
    partialSetupData: any | null;
    completeSetup: (settings: Partial<OrganizationSettings>) => void;
    updatePartialSetup: (data: any) => void;
    toggleStrictMode: () => void;
    toggleLocalLLM: () => void;
    reset: () => void;
    fetchSettings: (orgId: string) => Promise<void>;
}

const DEFAULT_SETTINGS: OrganizationSettings = {
    id: '',
    name: 'Paradigm-Xi',
    type: 'General',
    secondaryTypes: [],
    currency: 'NGN',
    setupComplete: false,
    enabledModules: ['CRM', 'Finance', 'Reports', 'Logistics'],
    agentMode: AIAgentMode.AI_AGENTIC,
    brandColor: '#f37021',
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
    useLocalLLM: false,
    partialSetupData: null
};

const BRANDING_OVERRIDES: Record<string, Partial<OrganizationSettings>> = {
    'Xquisite Celebrations Limited': {
        name: 'Xquisite Celebrations Limited',
        brandColor: '#00ff9d',
        logo: '/xquisite-logo.png',
        type: 'Catering',
        enabledModules: ['Catering', 'Inventory', 'Finance', 'CRM', 'Reports']
    },
    'Wembley Cakes': {
        name: 'Wembley Cakes',
        brandColor: '#f37021',
        logo: '/wembley_logo.jpg',
        type: 'Bakery',
        enabledModules: ['CRM', 'Finance', 'Catering']
    },
    'J Ishola-Williams Sports Foundation': {
        name: 'J Ishola-Williams Sports Foundation',
        brandColor: '#ff6b6b',
        logo: '/jiwsf-logo.png',
        type: 'Sports Foundation',
        enabledModules: ['Finance', 'HR', 'CRM', 'Reports']
    },
    'KRONHOMES LIMITED': {
        name: 'KRONHOMES LIMITED',
        brandColor: '#00ff9d',
        logo: '',
        type: 'General',
        enabledModules: ['CRM', 'Reports', 'Finance', 'Logistics']
    }
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
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
                set((state) => {
                    const finalSettings = { ...state.settings, ...newSettings };
                    const override = finalSettings.name ? BRANDING_OVERRIDES[finalSettings.name] : null;

                    const merged = {
                        ...finalSettings,
                        ...(override || {}),
                        setupComplete: true
                    };

                    if (merged.brandColor) {
                        document.documentElement.style.setProperty('--brand-primary', merged.brandColor);
                    }

                    return {
                        settings: merged,
                        partialSetupData: null
                    };
                }),
            toggleStrictMode: () => set((state) => ({ strictMode: !state.strictMode })),
            toggleLocalLLM: () => set((state) => ({ useLocalLLM: !state.useLocalLLM })),
            reset: () => set({ settings: DEFAULT_SETTINGS, ...INITIAL_SYSTEM_FLAGS }),
            fetchSettings: async (orgId: string) => {
                try {
                    console.log('[Settings] Fetching settings for:', orgId);
                    
                    // Immediate override for known organizations
                    if (orgId === 'xquisite-id' || orgId === '10959119-72e4-4e57-ba54-923e36bba6a6') {
                        console.log('[Settings] Xquisite ID detected. Loading Xquisite profile...');
                        const xquisiteProfile = BRANDING_OVERRIDES['Xquisite Celebrations Limited'];
                        set((state) => ({
                            settings: {
                                ...state.settings,
                                ...xquisiteProfile,
                                id: orgId,
                                name: 'Xquisite Celebrations Limited',
                                brandColor: '#00ff9d',
                                logo: '/xquisite-logo.png',
                                type: 'Catering',
                                setupComplete: true
                            }
                        }));
                        document.documentElement.style.setProperty('--brand-primary', '#00ff9d');
                    }

                    if (orgId === 'jiwsf-id' || orgId === '075f43bf-c708-4cf7-aa02-aa26a82e57d4') {
                        console.log('[Settings] Foundation ID detected. Loading Foundation profile...');
                        const jiwsfProfile = BRANDING_OVERRIDES['J Ishola-Williams Sports Foundation'];
                        set((state) => ({
                            settings: {
                                ...state.settings,
                                ...jiwsfProfile,
                                id: orgId,
                                setupComplete: true
                            }
                        }));
                        document.documentElement.style.setProperty('--brand-primary', '#ff6b6b');
                    }

                    if (!supabase) return;
                    const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).single();
                    if (data) {
                        console.log('[Settings] Fetched:', data.name);
                        const isXq = data.name?.toLowerCase().includes('xquisite') || orgId === '10959119-72e4-4e57-ba54-923e36bba6a6';
                        const override = BRANDING_OVERRIDES[data.name] || (isXq ? BRANDING_OVERRIDES['Xquisite Celebrations Limited'] : {}) || {};

                        set((state) => {
                            const brandColor = data.brand_color || override.brandColor || (isXq ? '#00ff9d' : state.settings.brandColor);
                            if (brandColor) {
                                document.documentElement.style.setProperty('--brand-primary', brandColor);
                            }

                            return {
                                settings: {
                                    ...state.settings,
                                    id: data.id,
                                    name: data.name || (isXq ? 'Xquisite Celebrations Limited' : state.settings.name),
                                    brandColor,
                                    logo: data.logo || override.logo || (isXq ? '/xquisite-logo.png' : state.settings.logo),
                                    type: data.type || state.settings.type,
                                    secondaryTypes: data.secondary_types || state.settings.secondaryTypes || [],
                                    setupComplete: true,
                                    enabledModules: data.enabled_modules || state.settings.enabledModules,
                                    address: data.address || state.settings.address,
                                    contactPhone: data.contact_phone || state.settings.contactPhone,
                                    currency: data.currency || state.settings.currency
                                }
                            };
                        });
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
