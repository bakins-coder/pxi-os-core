
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CRM } from './components/CRM';
import { Finance } from './components/Finance';
import { Accounting } from './components/Accounting';
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
import { AuthPage } from './components/Auth';
import { SetupWizard } from './components/SetupWizard';
import { db } from './services/mockDb';
import { Role, User } from './types';
import { AlertCircle, Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<React.PropsWithChildren<{ allowedRoles?: Role[], user: User | null }>> = ({ children, allowedRoles, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20 text-center bg-[#020617]">
         <AlertCircle size={48} className="text-rose-500 mb-4"/>
         <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Access Denied</h2>
         <p className="text-slate-500 mt-2 font-bold uppercase text-xs tracking-widest">Unauthorized Neural Handshake</p>
         <button onClick={() => window.location.hash = '/'} className="mt-8 bg-[#00ff9d] text-slate-900 px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(0,255,157,0.3)]">Return to Base</button>
      </div>
    );
  }
  return <>{children}</>;
};

function AppContent() {
  const [user, setUser] = useState<User | null>(db.currentUser);
  const [setupComplete, setSetupComplete] = useState(db.organizationSettings.setupComplete);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      // Short artificial delay to let splash screen show and verify identity
      await new Promise(r => setTimeout(r, 600));
      setUser(db.currentUser);
      setIsInitializing(false);
    };
    checkAuth();

    const unsubscribe = db.subscribe(() => {
        setUser(db.currentUser);
        setSetupComplete(db.organizationSettings.setupComplete);
        const brandColor = db.organizationSettings.brandColor || '#00ff9d';
        document.documentElement.style.setProperty('--brand-primary', brandColor);
    });
    return unsubscribe;
  }, []);

  // Show a themed loader instead of null during transitions or initialization
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

  // Handle Unauthorized users
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Handle Incomplete Setup
  if (!setupComplete) {
    return (
      <SetupWizard onComplete={() => setSetupComplete(true)} />
    );
  }

  return (
    <Layout userRole={user.role}>
      <Routes>
        <Route path="/" element={user.role === Role.CUSTOMER ? <Navigate to="/customer-portal" replace /> : <Dashboard />} />
        <Route path="/accounting" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.FINANCE]}><Accounting /></ProtectedRoute>} />
        <Route path="/agent-foundry" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><AgentHub /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.AGENT, Role.SALES]}><CRM /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.EVENT_MANAGER, Role.LOGISTICS]}><ProjectManagement /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><Inventory /></ProtectedRoute>} />
        <Route path="/catering" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><Catering /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.FINANCE, Role.MANAGER]}><Finance /></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.HR, Role.HR_MANAGER]}><HR /></ProtectedRoute>} />
        <Route path="/automation" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER]}><Automation /></ProtectedRoute>} />
        <Route path="/contact-center" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.AGENT, Role.SUPERVISOR]}><Agent /></ProtectedRoute>} />
        <Route path="/team" element={<TeamCommunication />} />
        <Route path="/reports" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.SUPERVISOR, Role.AGENT, Role.SALES]}><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER]}><Settings /></ProtectedRoute>} />
        <Route path="/customer-portal" element={<CustomerPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
