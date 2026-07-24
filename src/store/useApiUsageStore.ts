import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiRequestLog {
    timestamp: number;
    tokens?: number;
}

interface ApiUsageState {
    requests: ApiRequestLog[];
    logRequest: (tokens?: number) => void;
    getMetrics: () => {
        rpm: number; // Requests in last 60s
        rpd: number; // Requests in last 24h
        tpm: number; // Tokens in last 60s
    };
    cleanup: () => void;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const useApiUsageStore = create<ApiUsageState>()(
    persist(
        (set, get) => ({
            requests: [],
            logRequest: (tokens?: number) => {
                const now = Date.now();
                set((state) => {
                    // Only keep requests from the last 24 hours to prevent memory bloat
                    const filteredRequests = state.requests.filter(r => now - r.timestamp <= DAY_MS);
                    return {
                        requests: [...filteredRequests, { timestamp: now, tokens }]
                    };
                });
            },
            getMetrics: () => {
                const now = Date.now();
                const { requests } = get();
                
                const lastMinute = requests.filter(r => now - r.timestamp <= MINUTE_MS);
                const lastDay = requests.filter(r => now - r.timestamp <= DAY_MS);
                
                const rpm = lastMinute.length;
                const rpd = lastDay.length;
                const tpm = lastMinute.reduce((sum, r) => sum + (r.tokens || 0), 0);
                
                return { rpm, rpd, tpm };
            },
            cleanup: () => {
                const now = Date.now();
                set((state) => ({
                    requests: state.requests.filter(r => now - r.timestamp <= DAY_MS)
                }));
            }
        }),
        {
            name: 'api-usage-storage',
        }
    )
);
