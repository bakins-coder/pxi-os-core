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
}

const DEFAULT_SETTINGS: OrganizationSettings = {
    id: 'org-xquisite',
    name: 'Xquisite Celebrations Limited',
    type: 'Catering',
    currency: 'NGN',
    setupComplete: true,
    enabledModules: ['Catering', 'CRM', 'Finance', 'Logistics', 'Accounting', 'Automation', 'HR'],
    agentMode: AIAgentMode.AI_AGENTIC,
    brandColor: '#ff6b6b',
    integrations: ['WhatsApp', 'Telegram'],
    apiKeys: [],
    address: 'A23 Primrose Drive, Pinnock Beach Estate, Lekki, Lagos',
    contactPhone: '0814 990 6777',
    contactPerson: { email: 'toxsyyb@yahoo.co.uk', jobTitle: 'Administrator', name: 'Xquisite Admin' },
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=XC&backgroundColor=ff6b6b',
    bankInfo: {
        bankName: 'Xquisite Trust Bank',
        accountName: 'Xquisite Celebrations Ltd',
        accountNumber: '0012345678'
    }
};

const INITIAL_SYSTEM_FLAGS = {
    cloudEnabled: false,
    isDemoMode: false,
    strictMode: false,
    partialSetupData: null
};

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
        }),
        {
            name: 'settings-storage',
        }
    )
);
