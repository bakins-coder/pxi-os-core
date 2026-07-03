import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ParadigmWorkspace } from '../components/ParadigmWorkspace';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Role } from '../types';
import React from 'react';

// Set VITEST flag
(globalThis as any).VITEST = true;

// Mock Supabase
vi.mock('../services/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnThis(),
        })),
    },
    syncTableToCloud: vi.fn().mockResolvedValue({ success: true }),
    pullCloudState: vi.fn().mockResolvedValue([]),
    pullInventoryViews: vi.fn().mockResolvedValue([]),
}));

// Mock AI
vi.mock('../services/ai', () => ({
    getCFOAdvice: vi.fn().mockResolvedValue({ summary: 'Test', sentiment: 'Healthy' }),
    suggestCOAForTransaction: vi.fn(),
    textToSpeech: vi.fn().mockResolvedValue(""),
}));

// Mock lucide-react using importOriginal
vi.mock('lucide-react', async (importOriginal) => {
    const actual: any = await importOriginal();
    const mockIcon = () => <div />;
    const mocks: any = { ...actual };
    Object.keys(actual).forEach(key => {
        if (typeof actual[key] === 'function') {
            mocks[key] = mockIcon;
        }
    });
    return mocks;
});

describe('ParadigmWorkspace Render Loop Debug', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        useDataStore.setState({
            leads: [],
            inventory: [],
            invoices: [],
            employees: [],
            addLead: vi.fn().mockResolvedValue({}),
            addInventoryItem: vi.fn().mockResolvedValue({}),
            addEmployee: vi.fn().mockResolvedValue({}),
        });

        useAuthStore.setState({
            user: {
                id: 'admin-1',
                email: 'ajapas-admin@ajapasworld.local',
                role: Role.ADMIN,
                companyId: '4376c123-01c9-4a92-9675-8123456789ab'
            } as any
        });

        useSettingsStore.setState({
            settings: {
                brandColor: '#ff6b6b',
                name: 'Ajapasworld'
            } as any
        });
    });

    it('should render successfully without exceeding update depth', () => {
        render(<ParadigmWorkspace onSwitchWorkspace={() => {}} adminEmail="admin@ajapasworld.local" />);
        console.log('ParadigmWorkspace mounted successfully!');
    });
});
