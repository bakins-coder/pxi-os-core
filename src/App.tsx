
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CRM } from './components/CRM';
import { Finance } from './components/Finance';

import { Agent } from './components/Agent';
import { TeamCommunication } from './components/TeamCommunication';
import { Reports } from './components/Reports';
import { CustomerPortal } from './components/CustomerPortal';
import { Automation } from './components/Automation';
import { Inventory } from './components/Inventory';
import { Catering } from './components/Catering';
import { HR } from './components/HR';
import { Settings } from './components/Settings';
import { ProjectManagement } from './components/ProjectManagement';
import { AgentHub } from './components/AgentHub';
import { SuperAdmin } from './components/SuperAdmin';
import { AuthPage } from './components/Auth';
import { SetupWizard } from './components/SetupWizard';
import { Welcome } from './components/Welcome';
import { KnowledgeBase } from './components/KnowledgeBase';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { PortionMonitor } from './components/PortionMonitor';
import { PublicBrochure } from './components/PublicBrochure';
import { useAuthStore } from './store/useAuthStore';
import { useDataStore } from './store/useDataStore';
import { useSettingsStore } from './store/useSettingsStore';
import { Role, User } from './types';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PWAInstallPrompt, AppUpdateNotification } from './components/PWAComponents';

const ProtectedRoute: React.FC<React.PropsWithChildren<{ allowedRoles?: Role[], user: User | null }>> = ({ children, allowedRoles, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20 text-center bg-[#020617]">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Access Denied</h2>
        <p className="text-slate-500 mt-2 font-bold uppercase text-xs tracking-widest">Unauthorized Neural Handshake</p>
        <button onClick={() => window.location.hash = '/'} className="mt-8 bg-[#00ff9d] text-slate-900 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(0,255,157,0.3)]">Return to Base</button>
      </div>
    );
  }
  return <>{children}</>;
};

function AppContent() {
  const user = useAuthStore((state) => state.user);
  const { settings, setBrandColor } = useSettingsStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      // Initialize brand color from store
      if (settings.brandColor) {
        document.documentElement.style.setProperty('--brand-primary', settings.brandColor);
      }

      // AUTO-REPAIR 1: If user has a companyId but settings say setup is incomplete
      if (user?.companyId && !settings.setupComplete) {
        const { supabase } = await import('./services/supabase');
        if (supabase) {
          console.log('[App] Attempting to restore workspace settings for company:', user.companyId);
          try {
            const { data: org, error, status } = await supabase.from('organizations').select('*').eq('id', user.companyId).single();

            if (error) {
              console.error('[App] Failed to restore workspace. Error:', error);
              // If unauthorized (401/403) or not found (406), we might have a stale ID or bad keys
              // We should allow the user to escape this state
              if (error.code === 'PGRST116' || status === 406 || status === 401 || status === 403) {
                console.warn('[App] Organization not found or access denied. Checking profile...');
                // Check if the user actually has a DIFFERENT organization in their profile
                const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();

                if (profile?.organization_id && profile.organization_id !== user.companyId) {
                  console.log('[App] Found correct organization in profile. Updating...');
                  // We will let the AUTO-REPAIR 2 block handle this fix on the next render cycle 
                  // by clearing the invalid ID now
                  useAuthStore.getState().setUser({ ...user, companyId: undefined } as any);
                } else {
                  console.warn('[App] No valid organization found. Resetting workspace state to allow Setup.');
                  // Clear the companyId so they fall through to the SetupWizard / Welcome routes
                  useAuthStore.getState().setUser({ ...user, companyId: undefined } as any);
                }
              }
            } else if (org) {
              console.log('[App] Workspace restored successfully:', org.name);
              useSettingsStore.getState().completeSetup({
                id: org.id,
                name: org.name,
                type: org.type as any,
                size: org.size as any,
                brandColor: org.brand_color,
                logo: org.logo,
                address: org.address,
                firs_tin: org.firs_tin,
                contactPhone: org.contact_phone
              });
            }
          } catch (err) {
            console.error('[App] Unexpected error during workspace restoration:', err);
            // Safety valve: if we really crash here, let them out
            useAuthStore.getState().setUser({ ...user, companyId: undefined } as any);
          }
        }
      }

      // AUTO-REPAIR 2: If user is logged in but companyId is MISSING in session (Stale JWT), check DB
      if (user && !user.companyId) {
        const { supabase } = await import('./services/supabase');
        if (supabase) {
          const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single();

          if (profile?.organization_id) {
            console.log('Detected missing companyId in session. Fetching from DB (Case B)...');
            const { data: org } = await supabase.from('organizations').select('*').eq('id', profile.organization_id).single();

            if (org) {
              // Update User Store
              useAuthStore.getState().setUser({
                ...user,
                companyId: org.id,
                role: profile.role || user.role
              });

              // Update Settings Store
              useSettingsStore.getState().completeSetup({
                id: org.id,
                name: org.name,
                type: org.type as any,
                size: org.size as any,
                brandColor: org.brand_color,
                logo: org.logo,
                address: org.address,
                firs_tin: org.firs_tin,
                contactPhone: org.contact_phone
              });
            }
          }
        }
      }

      // Simulate hydration/check
      await new Promise(r => setTimeout(r, 600));
      setIsInitializing(false);
    };
    hydrate();
  }, [settings.brandColor, user?.id]);

  // Subscribe to real-time updates and fetch data when user is authenticated
  useEffect(() => {
    const { subscribeToRealtimeUpdates, unsubscribeFromRealtimeUpdates, hydrateFromCloud } = useDataStore.getState();

    if (user) {
      console.log('User authenticated, starting hydration cycle...');
      // 1. Fetch latest data (fixes 'Mock Data' issue)
      hydrateFromCloud();
      // 2. Listen for changes
      subscribeToRealtimeUpdates();
    }

    return () => {
      unsubscribeFromRealtimeUpdates();
    };
  }, [user]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-10">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
          <div className="absolute inset-0 rounded-full border-2 border-t-[#00ff9d] animate-spin"></div>
          <div className="absolute inset-4 flex items-center justify-center">
            <Loader2 size={24} className="text-[#00ff9d]/40" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Syncing Environment...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/brochure" element={<PublicBrochure />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!user.companyId) {
    return (
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/setup-wizard" element={<SetupWizard onComplete={() => window.location.hash = '/'} />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }

  // Fallback if settings say incomplete but we have companyId (migration edge case)
  if (!settings.setupComplete) {
    // CRITICAL FIX: If we have a companyId, DO NOT show the wizard. 
    // Instead, show a loader while the 'hydrate' effect fetches the profile.
    if (user.companyId) {
      return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-10">
          <div className="relative w-20 h-20 mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
            <div className="absolute inset-0 rounded-full border-2 border-t-[#00ff9d] animate-spin"></div>
            <div className="absolute inset-4 flex items-center justify-center">
              <RefreshCw size={24} className="text-[#00ff9d]" />
            </div>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Restoring Workspace</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 animate-pulse">Retrieving Organization Data...</p>
          {/* Fallback button if it gets stuck for more than 10s */}
          <button
            onClick={() => window.location.reload()}
            className="mt-12 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors"
          >
            Stuck? Reload
          </button>
        </div>
      );
    }
    // Only show wizard if we genuinely have no companyId
    return <SetupWizard onComplete={() => useSettingsStore.getState().completeSetup({})} />;
  }

  return (
    <Layout userRole={user.role}>
      <Routes>
        <Route path="/" element={user.role === Role.CUSTOMER ? <Navigate to="/customer-portal" replace /> : <Dashboard />} />

        <Route path="/super-admin" element={<ProtectedRoute user={user} allowedRoles={[Role.SUPER_ADMIN]}><SuperAdmin /></ProtectedRoute>} />
        <Route path="/executive-hub" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><AgentHub /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.AGENT, Role.SALES]}><CRM /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.EVENT_MANAGER, Role.LOGISTICS]}><ProjectManagement /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><Inventory /></ProtectedRoute>} />
        <Route path="/catering" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><Catering /></ProtectedRoute>} />
        <Route path="/portion-monitor" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.EVENT_MANAGER, Role.EVENT_COORDINATOR, Role.SUPERVISOR]}><PortionMonitor /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.FINANCE, Role.MANAGER]}><Finance /></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.HR, Role.HR_MANAGER]}><HR /></ProtectedRoute>} />
        <Route path="/automation" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER]}><Automation /></ProtectedRoute>} />
        <Route path="/contact-center" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.AGENT, Role.SUPERVISOR]}><Agent /></ProtectedRoute>} />
        <Route path="/team" element={<TeamCommunication />} />
        <Route path="/docs" element={<KnowledgeBase />} />
        <Route path="/analytics" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.FINANCE]}><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.SUPERVISOR, Role.AGENT, Role.SALES]}><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER]}><Settings /></ProtectedRoute>} />
        <Route path="/customer-portal" element={<CustomerPortal />} />
        <Route path="/brochure" element={<PublicBrochure />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <AppContent />
        <PWAInstallPrompt />
        <AppUpdateNotification />
      </ErrorBoundary>
    </HashRouter>
  );
}

export default App;
