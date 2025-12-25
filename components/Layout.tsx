
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Banknote, 
  Menu, X, Bell, LogOut, Search, Bot, Zap, Radio,
  Package, ChefHat, Briefcase, Settings, Shield, BarChart2,
  Layers as ProjectIcon, Sparkles, Box, BookOpen, CloudLightning, RefreshCw, AlertTriangle
} from 'lucide-react';
import { nexusStore } from '../services/nexusStore';
import { Role } from '../types';

const ParadigmLogo = ({ brandColor }: { brandColor: string }) => (
  <div className="flex items-center gap-3">
    <div className="relative w-10 h-10 group">
      <div className="absolute inset-0 opacity-20 blur-lg group-hover:opacity-40 transition-opacity" style={{ backgroundColor: brandColor }}></div>
      <div className="relative w-full h-full border-2 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform" style={{ borderColor: brandColor }}>
        <Box size={24} className="animate-pulse" style={{ color: brandColor }} />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="font-black text-xl text-white tracking-tighter leading-none mb-0.5 uppercase">Paradigm-Xi</span>
      <span className="text-[9px] uppercase tracking-[0.4em] font-black opacity-70" style={{ color: brandColor }}>Neural OS</span>
    </div>
  </div>
);

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', allowedRoles: Object.values(Role) },
  { label: 'LedgerAI', icon: BookOpen, path: '/accounting', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.FINANCE] },
  { label: 'Agent Foundry', icon: Sparkles, path: '/agent-foundry', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.SALES] },
  { label: 'Ops Command', icon: Radio, path: '/contact-center', allowedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.AGENT] },
  { label: 'CRM', icon: Users, path: '/crm', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.AGENT, Role.SALES] },
  { label: 'Project Hub', icon: ProjectIcon, path: '/projects', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.EVENT_MANAGER, Role.LOGISTICS] },
  { label: 'Inventory', icon: Package, path: '/inventory', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.SALES] },
  { label: 'Catering', icon: ChefHat, path: '/catering', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.SALES] },
  { label: 'Finance', icon: Banknote, path: '/finance', allowedRoles: [Role.ADMIN, Role.FINANCE, Role.MANAGER] },
  { label: 'HR', icon: Briefcase, path: '/hr', allowedRoles: [Role.ADMIN, Role.HR, Role.HR_MANAGER] },
  { label: 'Automation', icon: Bot, path: '/automation', allowedRoles: [Role.ADMIN, Role.MANAGER] },
  { label: 'Team Chat', icon: Zap, path: '/team', allowedRoles: Object.values(Role).filter(r => r !== Role.CUSTOMER) },
  { label: 'Reports', icon: BarChart2, path: '/reports', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.SUPERVISOR, Role.AGENT, Role.SALES] },
  { label: 'Settings', icon: Settings, path: '/settings', allowedRoles: [Role.ADMIN, Role.MANAGER] },
];

const NavContent = ({ userRole, brandColor, handleLogout, currentPath }: { userRole: Role, brandColor: string, handleLogout: () => void, currentPath: string }) => {
  const [isSyncing, setIsSyncing] = useState(nexusStore.isSyncing);

  useEffect(() => {
    const unsubscribe = nexusStore.subscribe(() => {
       setIsSyncing(nexusStore.isSyncing);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      <div className="p-8 mb-4">
        <ParadigmLogo brandColor={brandColor} />
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto hide-scrollbar">
        {NAV_ITEMS.filter(i => i.allowedRoles.includes(userRole)).map(item => {
          const isActive = currentPath === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-white/5 border-l-2' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
              style={isActive ? { borderColor: brandColor, color: brandColor } : {}}
            >
              <item.icon size={18} className={isActive ? '' : 'text-slate-600 group-hover:text-white'} />
              <span className={`text-xs uppercase tracking-widest ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        {nexusStore.isDemoMode && (
          <div className="bg-amber-500/10 rounded-2xl p-4 mb-4 border border-amber-500/20">
             <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-500"/>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Neural Sandbox Active</span>
             </div>
             <p className="text-[8px] text-slate-500 leading-tight uppercase font-bold">Ephemeral Instance • No Cloud Sync</p>
             <button onClick={() => nexusStore.resetInstance()} className="mt-3 w-full py-2 bg-amber-500 text-slate-900 rounded-lg text-[8px] font-black uppercase tracking-widest active:scale-95 transition-all">Exit Sandbox</button>
          </div>
        )}

        {nexusStore.cloudEnabled && !nexusStore.isDemoMode && (
           <div className="bg-[#00ff9d]/5 rounded-2xl p-4 mb-4 border border-[#00ff9d]/10">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <CloudLightning size={14} className="text-[#00ff9d]"/>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#00ff9d]">Cloud Nexus Live</span>
                 </div>
                 {isSyncing && <RefreshCw size={10} className="text-[#00ff9d] animate-spin"/>}
              </div>
              <p className="text-[8px] text-slate-500 leading-tight uppercase font-bold">Latency: Synchronized</p>
           </div>
        )}
        
        <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
           <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: brandColor }}/>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: brandColor }}>Neural Link Active</span>
           </div>
           <p className="text-[10px] text-slate-500 leading-tight mono uppercase">Vibe-Mode: SYNCHRONIZED</p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
        >
          <LogOut size={18} className="text-slate-600 group-hover:text-rose-400" />
          <span className="text-xs font-black uppercase tracking-widest">Disconnect</span>
        </button>
      </div>
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode; userRole: Role }> = ({ children, userRole }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const brandColor = nexusStore.organizationSettings.brandColor || '#00ff9d';

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    nexusStore.logout();
  };

  return (
    <div className="min-h-screen flex bg-[#020617]">
      <aside className="hidden md:block w-72 fixed h-full z-30 bg-[#020617] border-r border-white/5">
        <NavContent userRole={userRole} brandColor={brandColor} handleLogout={handleLogout} currentPath={location.pathname} />
      </aside>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#020617] transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <NavContent userRole={userRole} brandColor={brandColor} handleLogout={handleLogout} currentPath={location.pathname} />
      </aside>

      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl h-20 flex items-center px-6 md:px-10 justify-between border-b border-white/5">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-800 rounded-lg"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden md:flex items-center bg-[#0f172a] border border-white/5 rounded-xl px-4 py-2 w-80 group transition-all" style={{ borderBottomColor: brandColor + '33' }}>
              <Search size={16} className="text-slate-500" />
              <input className="bg-transparent outline-none text-xs ml-3 flex-1 text-slate-300 font-bold uppercase tracking-widest placeholder:text-slate-600" placeholder="Query Neural Cache..." />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {nexusStore.isDemoMode && (
              <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <AlertTriangle size={12}/>
                <span className="text-[9px] font-black uppercase tracking-widest">Simulated Environment</span>
              </div>
            )}
            
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-[#0f172a] text-slate-400`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse`} style={{ backgroundColor: brandColor }}></div>
              <span className="text-[9px] font-black uppercase tracking-widest">Autonomous Loop</span>
            </div>
            
            <button className="p-2.5 text-slate-500 hover:bg-white/5 rounded-xl relative transition-all active:scale-90">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-[#020617]" style={{ backgroundColor: brandColor }}></span>
            </button>
            
            <div className="hidden md:block w-px h-8 bg-white/5 mx-2"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white leading-none uppercase tracking-tight">{nexusStore.currentUser?.name}</p>
                <p className="text-[9px] font-bold uppercase mt-1 opacity-70" style={{ color: brandColor }}>{userRole}</p>
              </div>
              <div className="w-10 h-10 rounded-xl border-2 border-white/10 shadow-md overflow-hidden bg-slate-800">
                <img src={nexusStore.currentUser?.avatar} className="w-full h-full object-cover" alt="Profile" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 transition-all duration-300 bg-[#020617]">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
