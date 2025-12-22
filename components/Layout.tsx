
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Banknote, PieChart, 
  Menu, X, Bell, LogOut, Search, Command, Bot, Zap, Radio,
  Package, ChefHat, Briefcase, Settings, Shield, BarChart2,
  Layers as ProjectIcon, Sparkles
} from 'lucide-react';
import { db } from '../services/mockDb';
import { Role, AIAgentMode } from '../types';

export const Layout: React.FC<{ children: React.ReactNode; userRole: Role }> = ({ children, userRole }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mode, setMode] = useState(db.organizationSettings.agentMode);
  const location = useLocation();
  const navigate = useNavigate();
  const org = db.organizationSettings;

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setMode(db.organizationSettings.agentMode);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', allowedRoles: Object.values(Role) },
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

  const handleLogout = () => {
    db.logout();
    navigate('/login');
    window.location.reload();
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-8 mb-4">
        <div className="flex items-center space-x-3">
          {org.logo ? (
            <img src={org.logo} className="w-10 h-10 rounded-xl object-cover shadow-lg border border-white/10" alt="Brand Logo" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-2xl text-white shadow-lg" style={{ backgroundColor: org.brandColor || 'var(--brand-primary)' }}>P</div>
          )}
          <div className="flex flex-col">
            <span className="font-extrabold text-xl text-white tracking-tight leading-none mb-1">{org.name}</span>
            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-black" style={{ color: `${org.brandColor}aa` || '#818cf8' }}>PXI UNIFIED OS</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto hide-scrollbar">
        {NAV_ITEMS.filter(i => i.allowedRoles.includes(userRole)).map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all group ${
                isActive 
                  ? 'text-white scale-[1.02] shadow-xl' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              style={isActive ? { backgroundColor: org.brandColor || 'var(--brand-primary)', boxShadow: `0 10px 15px ${org.brandColor}33` } : {}}
            >
              <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} style={!isActive ? { color: `${org.brandColor}66` } : {}} />
              <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
           <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-indigo-400"/>
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Business Agent</span>
           </div>
           <p className="text-[10px] text-slate-500 leading-tight">Operating in {org.type} mode.</p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
        >
          <LogOut size={18} className="text-slate-500 group-hover:text-rose-400" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <aside className="hidden md:block w-72 fixed h-full z-30 bg-slate-950 border-r border-white/5">
        <NavContent />
      </aside>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <NavContent />
      </aside>

      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 top-nav-blur h-20 flex items-center px-6 md:px-10 justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden md:flex items-center bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 w-80 group focus-within:ring-2 transition-all" style={{ '--tw-ring-color': `${org.brandColor}33` } as any}>
              <Search size={16} className="text-slate-400" />
              <input className="bg-transparent outline-none text-sm ml-3 flex-1" placeholder="Search operations..." />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500`}>
              <div className={`w-1.5 h-1.5 rounded-full ${mode === AIAgentMode.AI_AGENTIC ? 'animate-pulse' : 'bg-slate-400'}`} style={{ backgroundColor: mode === AIAgentMode.AI_AGENTIC ? org.brandColor : undefined }}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{mode}</span>
            </div>
            
            <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl relative transition-all active:scale-90" style={{ '--hover-text': org.brandColor } as any}>
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none">{db.currentUser?.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{userRole}</p>
              </div>
              <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md overflow-hidden bg-slate-100">
                <img src={db.currentUser?.avatar} className="w-full h-full object-cover" alt="Profile" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 transition-all duration-300">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
