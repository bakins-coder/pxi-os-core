
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
import { FulfillmentHub } from './components/FulfillmentHub';
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
import { ExternalMonitor } from './components/ExternalMonitor';
import { Procurement } from './components/Procurement';
import { ProspectingHub } from './components/ProspectingHub';
import { RequisitionsHub } from './components/RequisitionsHub';
import { Presentation } from './components/Presentation';
import { CustomerAgentStandalone } from './components/CustomerAgentStandalone';
import { MockupPreview } from './components/MockupPreview';
import { DiscoveryForm } from './components/Onboarding/DiscoveryForm';
import { useAuthStore } from './store/useAuthStore';
import { useDataStore } from './store/useDataStore';
import { useSettingsStore } from './store/useSettingsStore';
import { Role, User } from './types';
import { AlertCircle, Loader2, RefreshCw, AlertTriangle, Box } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PWAInstallPrompt, AppUpdateNotification } from './components/PWAComponents';

const ProtectedRoute: React.FC<React.PropsWithChildren<{ allowedRoles?: Role[], requiredPermission?: string, user: User | null }>> = ({ children, allowedRoles, requiredPermission, user }) => {
  const [lastError, setLastError] = React.useState<any>(null);
  const [checking, setChecking] = React.useState(false);
  const { settings } = useSettingsStore();

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

  if (!user) return <Navigate to="/login" replace />;
  if (user.isSuperAdmin || user.role === Role.CEO || user.role === Role.CHAIRMAN) return <>{children}</>; // Executive Bypass

  // 1. Permission Tag Check (Prioritize)
  if (requiredPermission && user.permissionTags?.includes(requiredPermission)) {
    return <>{children}</>;
  }

  if (user.permissionTags?.includes('*')) return <>{children}</>;

  // 2. Role Check (Legacy)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
        <div className="max-w-md w-full text-center">
          <div className="relative w-24 h-24 mx-auto mb-8 border-2 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-500 shadow-2xl" style={{ borderColor: settings.brandColor }}>
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <Box size={24} style={{ color: settings.brandColor }} className="opacity-40" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Access Denied</h2>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">Unauthorized Neural Handshake</p>

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

          <button
            onClick={() => window.location.hash = '/'}
            className="mt-8 bg-[#00ff9d] text-slate-900 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(0,255,157,0.3)]"
          >
            Return to Base
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function AppContent() {
  const user = useAuthStore((state) => state.user);
  const { settings, setBrandColor } = useSettingsStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const location = useLocation();

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
    const hydrate = async () => {
      if (settings.brandColor) {
        document.documentElement.style.setProperty('--brand-primary', settings.brandColor);
      }
      if (user?.companyId && (user.companyId !== settings.id || !settings.setupComplete)) {
        console.log('[App] Company ID mismatch or incomplete setup. Fetching settings...');
        useSettingsStore.getState().fetchSettings(user.companyId);
      }
      
      await new Promise(r => setTimeout(r, 600));
      if (user) {
        useAuthStore.getState().refreshSession();
      }
      setIsInitializing(false);
    };
    hydrate();
  }, [settings.brandColor, user?.id, settings.id]);

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
  if (user && location.pathname === '/update-password') {
    return <AuthPage initialView="update-password" />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/update-password" element={<AuthPage initialView="update-password" />} />
        <Route path="/brochure" element={<PublicBrochure />} />
        <Route path="/invoice/:id" element={<InvoicePrototype />} />
        <Route path="/monitor/:token" element={<ExternalMonitor />} />
        <Route path="/omni-agent" element={<CustomerAgentStandalone />} />
        <Route path="/mockup/:leadId" element={<MockupPreview />} />
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

        <Route path="/super-admin" element={<ProtectedRoute user={user} allowedRoles={[Role.SUPER_ADMIN, Role.SYSTEM_ADMIN]}><SuperAdmin /></ProtectedRoute>} />
        <Route path="/executive-hub" element={<ProtectedRoute user={user} requiredPermission="access:finance_all" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES, Role.SYSTEM_ADMIN]}><AgentHub /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute user={user} requiredPermission="access:crm" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.AGENT, Role.SALES, Role.CATERING_OPERATIONS_MANAGER, Role.SYSTEM_ADMIN]}><CRM /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute user={user} requiredPermission="access:projects" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.EVENT_MANAGER, Role.LOGISTICS, Role.CATERING_OPERATIONS_MANAGER, Role.SYSTEM_ADMIN]}><ProjectManagement /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute user={user} requiredPermission="access:inventory" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES, Role.CATERING_OPERATIONS_MANAGER, Role.SYSTEM_ADMIN]}><Inventory /></ProtectedRoute>} />
        <Route path="/catering" element={<ProtectedRoute user={user} requiredPermission="access:catering" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES, Role.CATERING_OPERATIONS_MANAGER]}><FulfillmentHub vertical="Catering" /></ProtectedRoute>} />
258:         <Route path="/bakery" element={<ProtectedRoute user={user} requiredPermission="access:catering" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES, Role.CATERING_OPERATIONS_MANAGER]}><FulfillmentHub vertical="Bakery" /></ProtectedRoute>} />
259:         <Route path="/retail" element={<ProtectedRoute user={user} requiredPermission="access:catering" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES, Role.CATERING_OPERATIONS_MANAGER]}><FulfillmentHub vertical="Retail" /></ProtectedRoute>} />
        <Route path="/portion-monitor" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.EVENT_MANAGER, Role.EVENT_COORDINATOR, Role.SUPERVISOR, Role.CATERING_OPERATIONS_MANAGER]}><PortionMonitor /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute user={user} requiredPermission="access:finance" allowedRoles={[Role.ADMIN, Role.FINANCE, Role.MANAGER]}><Finance /></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute user={user} requiredPermission="access:hr" allowedRoles={Object.values(Role).filter(r => r !== Role.CUSTOMER)}><HR /></ProtectedRoute>} />
        <Route path="/requisitions" element={<ProtectedRoute user={user} allowedRoles={[Role.SUPER_ADMIN, Role.CEO, Role.ADMIN]}><RequisitionsHub /></ProtectedRoute>} />
        <Route path="/automation" element={<ProtectedRoute user={user} requiredPermission="access:automation" allowedRoles={[Role.ADMIN, Role.MANAGER]}><Automation /></ProtectedRoute>} />
        <Route path="/contact-center" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.AGENT, Role.SUPERVISOR]}><Agent /></ProtectedRoute>} />
        <Route path="/team" element={<TeamCommunication />} />
        <Route path="/docs" element={<KnowledgeBase />} />
        <Route path="/analytics" element={<ProtectedRoute user={user} requiredPermission="access:reports" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.FINANCE]}><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute user={user} requiredPermission="access:reports" allowedRoles={[Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.SUPERVISOR, Role.AGENT, Role.SALES]}><Reports /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}><ITPortal /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute user={user} allowedRoles={Object.values(Role).filter(r => r !== Role.CUSTOMER)}><Settings /></ProtectedRoute>} />
        <Route path="/customer-portal" element={<CustomerPortal />} />
        <Route path="/procurement" element={<ProtectedRoute user={user} allowedRoles={Object.values(Role).filter(r => r !== Role.CUSTOMER)}><Procurement /></ProtectedRoute>} />
        <Route path="/brochure" element={<PublicBrochure />} />
        <Route path="/invoice/:id" element={<InvoicePrototype />} />
        <Route path="/monitor/:token" element={<ExternalMonitor />} />
        <Route path="/omni-agent" element={<CustomerAgentStandalone />} />
        <Route path="/prospecting" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><ProspectingHub /></ProtectedRoute>} />
        <Route path="/mockup/:leadId" element={<MockupPreview />} />
        <Route path="/discovery" element={<DiscoveryForm onComplete={(answers: any) => {
          console.log('Discovery Complete:', answers);
          window.location.hash = '/';
        }} />} />
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
