import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataStore } from '../store/useDataStore';

// Mock Supabase to prevent real network calls during syncWithCloud
vi.mock('../services/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            upsert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: {}, error: null }))
                })),
                error: null
            })),
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    order: vi.fn(() => Promise.resolve({ data: [], error: null }))
                }))
            }))
        })),
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn()
        }))
    }
}));

describe('Cuisine Orders', () => {
    beforeEach(() => {
        useDataStore.setState({
            cateringEvents: [],
            invoices: [],
            contacts: [],
            calendarEvents: [],
            projects: []
        });
    });

    it('should create a cuisine order with correct properties', async () => {
        const { result } = renderHook(() => useDataStore());

        const orderData = {
            customerName: 'Cuisine Test Customer',
            eventDate: '2026-03-01',
            guestCount: 20,
            items: [
                {
                    inventoryItemId: 'prawns-1',
                    name: 'Grilled jumbo prawns',
                    quantity: 10,
                    priceCents: 900000,
                    costCents: 450000
                },
                {
                    inventoryItemId: 'chicken-1',
                    name: 'Stewed Chicken',
                    quantity: 10,
                    priceCents: 250000,
                    costCents: 125000
                }
            ],
            orderType: 'Cuisine' as const,
            banquetDetails: {
                notes: 'Test Cuisine Order',
                eventType: 'Cuisine Delivery'
            }
        };

        let cateringResult;
        await act(async () => {
            cateringResult = await result.current.createCateringOrder(orderData);
        });

        // Verify Event
        expect(result.current.cateringEvents).toHaveLength(1);
        const event = result.current.cateringEvents[0];
        expect(event.customerName).toBe('Cuisine Test Customer');
        expect(event.orderType).toBe('Cuisine');
        expect(event.items).toHaveLength(2);
        expect(event.status).toBe('Confirmed');

        // Verify Invoice
        expect(result.current.invoices).toHaveLength(1);
        const invoice = result.current.invoices[0];
        expect(invoice.contactId).toBeDefined();
        expect(invoice.subtotalCents).toBe(10 * 900000 + 10 * 250000); // 9,000,000 + 2,500,000 = 11,500,000

        // Verify Project
        expect(result.current.projects).toHaveLength(1);
        expect(result.current.projects[0].name).toContain('Cuisine Test Customer');
    });

    it('should default to Banquet if orderType is not provided', async () => {
        const { result } = renderHook(() => useDataStore());

        const orderData = {
            customerName: 'Default Test',
            eventDate: '2026-03-02',
            guestCount: 50,
            items: [
                {
                    inventoryItemId: 'item-1',
                    name: 'Standard Meal',
                    quantity: 50,
                    priceCents: 500000,
                    costCents: 200000
                }
            ],
            // orderType omitted
            banquetDetails: {
                location: 'Lagos'
            }
        };

        await act(async () => {
            await result.current.createCateringOrder(orderData);
        });

        expect(result.current.cateringEvents[0].orderType).toBe('Banquet');
    });
});
