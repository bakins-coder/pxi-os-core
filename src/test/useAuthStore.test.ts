import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../services/supabase';
import { Role } from '../types';

vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
        })),
        is: vi.fn(() => ({
            eq: vi.fn(() => ({
                maybeSingle: vi.fn(),
            })),
            ilike: vi.fn(() => ({
                maybeSingle: vi.fn(),
            }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
  syncTableToCloud: vi.fn(),
  pullCloudState: vi.fn(),
}));

describe('useAuthStore - Identity Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setUser(null);
  });

  it('should resolve staffId from employees table for Gmail addresses', async () => {
    const mockUser = {
      id: 'user-014',
      email: 'hussainitolani@gmail.com',
      user_metadata: { company_id: 'xq-org-id' },
    };

    const mockProfile = {
      organization_id: 'xq-org-id',
      role: 'Catering Operations Manager',
      first_name: null, // Profile is incomplete
      last_name: null,
    };

    const mockEmployee = {
      staff_id: 'XQ-0014',
      name: 'Tolani Hussaini',
      organization_id: 'xq-org-id',
    };

    // Setup mocks
    (supabase!.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // First call to profiles
    (supabase!.from as any).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: mockProfile, error: null }) }) }),
        };
      }
      if (table === 'employees') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: mockEmployee, error: null }) }) }),
        };
      }
      return {
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
      };
    });

    await useAuthStore.getState().refreshSession();

    const user = useAuthStore.getState().user;
    expect(user).not.toBeNull();
    expect(user?.staffId).toBe('XQ-0014');
    expect(user?.name).toBe('Tolani Hussaini');
    expect(user?.email).toBe('hussainitolani@gmail.com');
  });

  it('should fall back to email parsing if employee record is not found', async () => {
    const mockUser = {
      id: 'user-012',
      email: 'xq-0012@xquisite.local',
      user_metadata: {},
    };

    (supabase!.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
    (supabase!.from as any).mockImplementation((table: string) => {
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
      };
    });

    await useAuthStore.getState().refreshSession();

    const user = useAuthStore.getState().user;
    expect(user?.staffId).toBe('XQ-0012');
  });
});
