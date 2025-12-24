
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
import { AuthPage } from './components/Auth';
import { SetupWizard } from './components/SetupWizard';
import { db } from './services/mockDb';
import { Role, User } from './types';
import { Users, RefreshCw, ShieldAlert, AlertCircle } from 'lucide-react';

const ProtectedRoute: React.FC<React.PropsWithChildren<{ allowedRoles?: Role[], user: User | null }>> = ({ children, allowedRoles, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-20 text-center">
         <AlertCircle size={48} className="text-rose-500 mb-4"/>
         <h2 className="text-2xl font-black text-slate-900">Access Denied</h2>
         <p className="text-slate-500 mt-2">Your role does not have authorization for this sector.</p>
         <button onClick={() => window.location.href = '/'} className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Return to Base</button>
      </div>
    );
  }
  return <>{children}</>;
};

function AppContent() {
  const [user, setUser] = useState<User | null>(db.currentUser);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      await new Promise(r => setTimeout(r, 800));
      setUser(db.currentUser);
      setIsInitializing(false);
    };
    checkAuth();

    const unsubscribe = db.subscribe(() => {
        const brandColor = db.organizationSettings.brandColor || '#4f46e5';
        document.documentElement.style.setProperty('--brand-primary', brandColor);
    });
    return unsubscribe;
  }, []);

  if (isInitializing) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout userRole={user.role}>
      <Routes>
        <Route path="/" element={user.role === Role.CUSTOMER ? <Navigate to="/customer-portal" replace /> : <Dashboard />} />
        <Route path="/agent-foundry" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><AgentHub /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.AGENT, Role.SALES]}><CRM /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER]}><ProjectManagement /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><Inventory /></ProtectedRoute>} />
        <Route path="/catering" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.SALES]}><Catering /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.FINANCE, Role.MANAGER]}><Finance /></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.HR, Role.HR_MANAGER]}><HR /></ProtectedRoute>} />
        <Route path="/automation" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER]}><Automation /></ProtectedRoute>} />
        <Route path="/contact-center" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.AGENT, Role.SUPERVISOR]}><Agent /></ProtectedRoute>} />
        <Route path="/team" element={<TeamCommunication />} />
        <Route path="/reports" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.SUPERVISOR, Role.AGENT, Role.SALES]}><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute user={user} allowedRoles={[Role.ADMIN, Role.MANAGER]}><Settings /></ProtectedRoute>} />
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
