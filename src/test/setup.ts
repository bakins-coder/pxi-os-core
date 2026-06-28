import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

(globalThis as any).VITEST = true;
(globalThis as any).vitest = true;
(globalThis as any).alert = (msg: string) => console.log('[Headless Alert]', msg);

// Clean up after each test
afterEach(() => {
    cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
        return [];
    }
    unobserve() { }
};

// Mock Supabase
vi.mock('../services/supabase', () => {
    function makeChainableResponse(response = { data: null, error: null }) {
        const chain: any = {};
        const passthru = () => chain;
        chain.select = passthru;
        chain.eq = passthru;
        chain.ilike = passthru;
        chain.limit = passthru;
        chain.order = passthru;
        chain.insert = passthru;
        chain.update = passthru;
        chain.delete = passthru;
        chain.single = async () => ({ data: response.data, error: response.error });
        chain.maybeSingle = async () => ({ data: response.data, error: response.error });
        chain.then = (onFulfilled: any) => Promise.resolve({ data: response.data, error: response.error }).then(onFulfilled);
        return chain;
    }
    const channelStub = () => ({
        on: () => channelStub(),
        subscribe: () => ({}),
    });
    return {
        supabase: {
            from: (tableName: string) => makeChainableResponse(),
            channel: (name?: string) => channelStub(),
            removeChannel: () => {}
        },
        syncTableToCloud: vi.fn(),
        pullCloudState: vi.fn(),
        mapIncomingRow: vi.fn(),
        pullInventoryViews: vi.fn(),
        postReusableMovement: vi.fn(),
        postRentalMovement: vi.fn(),
        postIngredientMovement: vi.fn(),
        uploadEntityImage: vi.fn(),
        saveEntityMedia: vi.fn(),
    };
});

// Mock lucide-react
vi.mock('lucide-react', async () => {
    const orig: any = await vi.importActual('lucide-react');
    return {
        ...orig,
        Truck: orig.Truck || ((props: any) => null)
    };
});
