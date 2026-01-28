
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { InvoicePrototype } from './components/InvoicePrototype';
import { ProjectManagement } from './components/ProjectManagement';
import { AgentHub } from './components/AgentHub';
import { SuperAdmin } from './components/SuperAdmin';
import { AuthPage } from './components/Auth';
import { SetupWizard } from './components/SetupWizard';
import { Welcome } from './components/Welcome';
import { KnowledgeBase } from './components/KnowledgeBase';
import { ITPortal } from './components/ITPortal';
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
import { Presentation } from './components/Presentation';

const ProtectedRoute: React.FC<React.PropsWithChildren<{ allowedRoles?: Role[], requiredPermission?: string, user: User | null }>> = ({ children, allowedRoles, requiredPermission, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (user.isSuperAdmin) return <>{children}</>; // Super Admin Bypass

  // 1. Permission Tag Check (Prioritize)
  if (requiredPermission && user.permissionTags?.includes(requiredPermission)) {
    return <>{children}</>;
  }

  if (user.permissionTags?.includes('*')) return <>{children}</>;

  // 2. Role Check (Legacy)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Check if we failed BOTH checks (if both were present) or just the role check
    const [lastError, setLastError] = React.useState<any>(null);
    const [checking, setChecking] = React.useState(false);

    const handleCheck = async () => {
      try {
        setChecking(true);
        const res = await useAuthStore.getState().refreshSession();
        console.log('[App] Manual refresh result:', res);

        if (res && !res.success) {
          setLastError(res.error || 'Unknown fetch error');
          setChecking(false);
        } else {
          setLastError('Permissions synced! Reloading...');
          setTimeout(() => window.location.reload(), 500);
        }
      } catch (err: any) {
        console.error('[App] Manual refresh crashed:', err);
        setLastError(err?.message || 'Code Error');
        setChecking(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center h-full p-20 text-center bg-[#020617]">
        <AlertCircle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Access Denied</h2>
        <p className="text-slate-500 mt-2 font-bold uppercase text-xs tracking-widest">Unauthorized Neural Handshake</p>

        {/* DIAGNOSTIC DUMP: Remove after verification */}
        <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-white/5 text-left max-w-md mx-auto">
          <p className="text-[10px] font-mono text-slate-500 mb-2">DIAGNOSTIC DATA:</p>
          <pre className="text-[9px] text-emerald-400 font-mono overflow-auto whitespace-pre-wrap">
            {JSON.stringify({
              id: user.id || 'N/A',
              name: user.name,
              role: user.role,
              permissionTags: user.permissionTags,
              required: requiredPermission,
              isSuperAdmin: user.isSuperAdmin,
              companyId: user.companyId,
              fetchError: lastError
            }, null, 2)}
          </pre>
          <button
            onClick={handleCheck}
            disabled={checking}
            className="mt-4 w-full bg-indigo-500/20 text-indigo-300 py-2 rounded text-[10px] font-bold uppercase hover:bg-indigo-500/30"
          >
            {checking ? 'Probing Database...' : 'Force Refresh Permissions'}
          </button>
        </div>
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

  // ... (Keep existing effects for hydration/online status - no changes needed here)
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network status: ONLINE. Attempting sync...');
      useDataStore.getState().syncWithCloud();
      useDataStore.getState().hydrateFromCloud();
    };
    const handleOffline = () => console.log('Network status: OFFLINE. Local mode active.');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize Auth Listener
    useAuthStore.getState().initializeAuthListener();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // ... (Keep existing hydration logic - no changes needed here)
    const hydrate = async () => {
      if (settings.brandColor) {
        document.documentElement.style.setProperty('--brand-primary', settings.brandColor);
      }
      if (user?.companyId && !settings.setupComplete) {
        // ... (Keep existing auto-repair logic)
        const { supabase } = await import('./services/supabase');
        if (supabase) {
          // ...
        }
      }
      if (user && !user.companyId) {
        // ...
      }
      await new Promise(r => setTimeout(r, 600));
      if (user) {
        useAuthStore.getState().refreshSession();
      }
      setIsInitializing(false);
    };
    hydrate();
  }, [settings.brandColor, user?.id]);

  useEffect(() => {
    const { subscribeToRealtimeUpdates, unsubscribeFromRealtimeUpdates, hydrateFromCloud } = useDataStore.getState();
    if (user) {
      hydrateFromCloud();
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

  // [RECOVERY FIX] Allow authenticated users (who just clicked reset link) to see the update password screen
  // instead of being redirected to Dashboard.
  const location = useLocation();
  if (user && location.pathname === '/update-password') {
    return <AuthPage initialView="update-password" />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/update-password" element={<AuthPage initialView="update-password" />} />
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
        <Route path="/presentation" element={<Presentation />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }

  return (
    <Layout userRole={user.role}>
      <Routes>
        <Route path="/" element={user.role === Role.CUSTOMER ? <Navigate to="/customer-portal" replace /> : <Dashboard />} />

        {/* Public/Special Routes */}
        <Route path="/presentation" element={<Presentation />} />

        <Route path="/super-admin" element={<ProtectedRoute user={user} allowedRoles={[Role.SUPER_ADMIN]}><SuperAdmin /></ProtectedRoute>} />
        <Route path="/executive-hub" element={<ProtectedRoute user={user} requiredPermission="access:finance_all" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><AgentHub /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute user={user} requiredPermission="access:crm" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.AGENT, Role.SALES]}><CRM /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute user={user} requiredPermission="access:projects" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.EVENT_MANAGER, Role.LOGISTICS]}><ProjectManagement /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute user={user} requiredPermission="access:inventory" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><Inventory /></ProtectedRoute>} />
        <Route path="/catering" element={<ProtectedRoute user={user} requiredPermission="access:catering" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><Catering /></ProtectedRoute>} />
        <Route path="/portion-monitor" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.EVENT_MANAGER, Role.EVENT_COORDINATOR, Role.SUPERVISOR]}><PortionMonitor /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute user={user} requiredPermission="access:finance" allowedRoles={[Role.ADMIN, Role.FINANCE, Role.MANAGER]}><Finance /></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute user={user} requiredPermission="access:hr" allowedRoles={Object.values(Role).filter(r => r !== Role.CUSTOMER)}><HR /></ProtectedRoute>} />
        <Route path="/automation" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER]}><Automation /></ProtectedRoute>} />
        <Route path="/contact-center" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.AGENT, Role.SUPERVISOR]}><Agent /></ProtectedRoute>} />
        <Route path="/team" element={<TeamCommunication />} />
        <Route path="/docs" element={<KnowledgeBase />} />
        <Route path="/analytics" element={<ProtectedRoute user={user} requiredPermission="access:reports" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.FINANCE]}><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute user={user} requiredPermission="access:reports" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.SUPERVISOR, Role.AGENT, Role.SALES]}><Reports /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}><ITPortal /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute user={user} allowedRoles={Object.values(Role).filter(r => r !== Role.CUSTOMER)}><Settings /></ProtectedRoute>} />
        <Route path="/customer-portal" element={<CustomerPortal />} />
        <Route path="/brochure" element={<PublicBrochure />} />
        <Route path="/invoice/:id" element={<InvoicePrototype />} />
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
