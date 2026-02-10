
import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Banknote,
  Menu, X, Bell, LogOut, Search, Bot, Zap, Radio,
  Package, ChefHat, Briefcase, Settings, Shield, BarChart2, Activity,
  Layers as ProjectIcon, Sparkles, Box, BookOpen, CloudLightning, RefreshCw, AlertTriangle, Building2, Mic, Square, HelpCircle, Calendar,
  ClipboardList, Plane, Fuel, Smartphone, Laptop
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { Role } from '../types';
import { processVoiceCommand } from '../services/ai';
import { useDataStore } from '../store/useDataStore';
import { ChatWidget } from './ChatWidget';

const SyncIndicator = () => {
  const { syncStatus, lastSyncError, isSyncing, syncWithCloud, realtimeStatus } = useDataStore();

  const statusColors = {
    'Synced': 'bg-emerald-500',
    'Syncing': 'bg-amber-500 animate-pulse',
    'Error': 'bg-rose-500',
    'Offline': 'bg-slate-500'
  };

  const realtimeColors = {
    'Connected': 'bg-emerald-500',
    'Connecting': 'bg-amber-500 animate-pulse',
    'Disconnected': 'bg-slate-500'
  };

  return (
    <div className="flex items-center gap-2 group relative">
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColors[syncStatus]}`}></div>
      <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest truncate hidden sm:inline">
        {syncStatus} • RT: {realtimeStatus}
      </span>
      {syncStatus === 'Error' && (
        <button
          onClick={(e) => { e.stopPropagation(); syncWithCloud(); }}
          className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
        >
          <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
        </button>
      )}
      {lastSyncError && (
        <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-slate-900 border border-white/10 p-2 rounded shadow-2xl z-50 min-w-[200px]">
          <p className="text-[8px] text-rose-400 font-bold uppercase tracking-widest mb-1">Last Sync Failure</p>
          <p className="text-[9px] text-slate-400 leading-tight">{lastSyncError}</p>
        </div>
      )}
    </div>
  );
};

const ParadigmLogo = ({ brandColor, orgName }: { brandColor: string, orgName: string }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 group shrink-0">
        <div className="absolute inset-0 opacity-20 blur-lg group-hover:opacity-40 transition-opacity" style={{ backgroundColor: brandColor }}></div>
        <div className="relative w-full h-full border-2 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform" style={{ borderColor: brandColor }}>
          <Box size={24} className="animate-pulse" style={{ color: brandColor }} />
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-black text-xl text-white tracking-tighter leading-none mb-0.5 uppercase truncate">{orgName}</span>
        <span className="text-[9px] uppercase tracking-[0.4em] font-black opacity-70" style={{ color: brandColor }}>Smart Platform</span>
      </div>
    </div>
  );
};

const NAV_ITEMS = [
  { label: 'Super Admin', icon: Shield, path: '/super-admin', allowedRoles: [Role.SUPER_ADMIN] },
  { label: 'IT Console', icon: Building2, path: '/admin/settings', allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN] },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', requiredPermission: 'access:dashboard', allowedRoles: Object.values(Role) },

  { label: 'Strategic Hub', icon: Sparkles, path: '/executive-hub', requiredPermission: 'access:finance_all', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.SALES] },
  { label: 'Service Hub', icon: Radio, path: '/contact-center', requiredPermission: 'access:catering', allowedRoles: [Role.ADMIN, Role.SUPERVISOR, Role.AGENT] },
  { label: 'CRM', icon: Users, path: '/crm', requiredPermission: 'access:crm', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.AGENT, Role.SALES, Role.LOGISTICS_OFFICER, Role.EVENT_COORDINATOR, Role.BANQUET_MANAGER] },
  { label: 'Project Hub', icon: ProjectIcon, path: '/projects', requiredPermission: 'access:projects', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.EVENT_MANAGER, Role.LOGISTICS, Role.LOGISTICS_OFFICER, Role.EVENT_COORDINATOR, Role.BANQUET_MANAGER] },
  { label: 'Inventory', icon: Package, path: '/inventory', requiredPermission: 'access:inventory', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.SALES, Role.LOGISTICS_OFFICER, Role.EVENT_COORDINATOR, Role.BANQUET_MANAGER] },

  // Industry Specific
  { label: 'Catering Ops', icon: ChefHat, path: '/catering', requiredPermission: 'access:catering', allowedIndustries: ['Catering'], allowedRoles: [Role.ADMIN, Role.MANAGER, Role.SALES, Role.EVENT_MANAGER, Role.EVENT_COORDINATOR, Role.BANQUET_MANAGER] },
  { label: 'Flight Ops', icon: Plane, path: '/projects', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.LOGISTICS_OFFICER], allowedIndustries: ['Aviation'] },

  { label: 'Finance', icon: Banknote, path: '/finance', requiredPermission: 'access:finance', allowedRoles: [Role.ADMIN, Role.FINANCE, Role.MANAGER] },
  { label: 'Human Resources', icon: Briefcase, path: '/hr', requiredPermission: 'access:hr', allowedRoles: Object.values(Role) },
  { label: 'Requisitions', icon: ClipboardList, path: '/requisitions', allowedRoles: [Role.SUPER_ADMIN, Role.CEO, Role.ADMIN] },
  { label: 'Automation', icon: Bot, path: '/automation', allowedRoles: [Role.ADMIN, Role.MANAGER] },
  { label: 'Analytics', icon: Activity, path: '/analytics', requiredPermission: 'access:reports', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.FINANCE] },
  { label: 'Reporting', icon: BarChart2, path: '/reports', requiredPermission: 'access:reports', allowedRoles: [Role.ADMIN, Role.MANAGER, Role.FINANCE, Role.SUPERVISOR, Role.AGENT, Role.SALES] },
  { label: 'User Guides', icon: HelpCircle, path: '/docs', requiredPermission: 'access:docs', allowedRoles: Object.values(Role) },
  { label: 'Team Messages', icon: Zap, path: '/team', requiredPermission: 'access:team_chat', allowedRoles: Object.values(Role).filter(r => r !== Role.CUSTOMER) },
  { label: 'Settings', icon: Settings, path: '/settings', allowedRoles: Object.values(Role).filter(r => r !== Role.CUSTOMER) },
];

const NavContent = ({ userRole, brandColor, orgName, handleLogout, currentPath }: { userRole: Role, brandColor: string, orgName: string, handleLogout: () => void, currentPath: string }) => {
  const { strictMode, settings } = useSettingsStore();
  const { departmentMatrix, messages } = useDataStore();
  const { user: currentUser } = useAuthStore();

  const unreadMessagesCount = messages.filter(m =>
    m.recipientId === currentUser?.id && !m.readAt && m.status !== 'read'
  ).length;

  // Find the exact matrix role that matches the user's assigned role string
  const userMatrixRole = departmentMatrix
    .flatMap(d => d.roles)
    .find(r => r.title === userRole);

  const hasPermission = (required?: string, allowedRoles?: Role[]) => {
    // 1. Super Admin Bypass
    // 1. Super Admin Bypass
    if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN || userRole === Role.CEO || userRole === Role.CHAIRMAN) return true;

    const isSuperAdmin = useAuthStore.getState().user?.isSuperAdmin;
    if (isSuperAdmin) return true;

    // 2. Legacy Role Check (Keep existing logic if no permission tag)
    if (allowedRoles && allowedRoles.includes(userRole)) return true;
    if (!required) return true; // Public if no requirement? Or default deny? Let's say public.

    // 3. Permission Tag Check (Prioritize explicit tags from DB)
    const userPermissions = useAuthStore.getState().user?.permissionTags || [];

    if (required && userPermissions.includes(required)) return true;
    if (userPermissions.includes('*')) return true;

    // 4. Fallback to Matrix (Static Definition)
    if (userMatrixRole?.permissions?.includes(required)) return true;
    if (userMatrixRole?.permissions?.includes('*')) return true;

    return false;
  };

  const handleOpenAssistant = () => {
    window.dispatchEvent(new CustomEvent('open-assistant'));
  };

  return (
    <div className="flex flex-col h-full bg-[#020617]">
      <div className="p-8 mb-4">
        <ParadigmLogo brandColor={brandColor} orgName={orgName} />
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto hide-scrollbar">
        {NAV_ITEMS.filter(i => {
          // Simplify View for MD - PRIORITY CHECK
          const isMD = ['toksyyb@yahoo.co.uk', 'toxsyyb@yahoo.co.uk'].includes(currentUser?.email?.toLowerCase() || '') ||
            ['SQ-0001', 'XQ-0001'].includes(currentUser?.staffId?.toUpperCase() || '');

          if (isMD) {
            const hiddenForMD = ['Super Admin', 'IT Console', 'Automation', 'Service Hub', 'Strategic Hub', 'Reporting'];
            if (hiddenForMD.includes(i.label)) return false;
          }

          // Strict Administrative Check - ONLY for verified Admins
          if (i.label === 'Super Admin' || i.label === 'IT Console') {
            // Use currentUser from hook for reactivity
            const isSuper = !!currentUser?.isSuperAdmin;
            const isAdmin = currentUser?.role === Role.ADMIN || currentUser?.role === Role.SUPER_ADMIN;

            if (i.label === 'Super Admin') return isSuper;
            if (i.label === 'IT Console') return isSuper || isAdmin;
          }

          if (!hasPermission(i.requiredPermission, i.allowedRoles)) return false;

          if (i.label === 'Requisitions') {
            const isSuper = !!currentUser?.isSuperAdmin || currentUser?.role === Role.SUPER_ADMIN;
            // MD check reused from above
            if (!isMD && !isSuper) return false;
          }

          if (i.allowedIndustries) {
            const industryMatch = i.allowedIndustries.includes(settings.type as any);
            const moduleEnabled = i.label === 'Catering Ops' && settings.enabledModules?.includes('Catering');

            if (!industryMatch && !moduleEnabled) return false;
          }

          return true;
        }).map(item => {
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${isActive
                ? 'bg-white/5 border-l-2'
                : 'text-slate-500 hover:bg-white/5 hover:text-white'
                }`}
              style={isActive ? { borderColor: brandColor, color: brandColor } : {}}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <item.icon size={18} className={isActive ? '' : 'text-slate-600 group-hover:text-white shrink-0'} />
                <span className={`text-[10px] uppercase tracking-widest truncate ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
              </div>

              {item.label === 'Team Messages' && unreadMessagesCount > 0 && (
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full opacity-40 bg-emerald-400" style={{ backgroundColor: brandColor }}></div>
                  <div className="relative min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black text-[#020617] shadow-lg" style={{ backgroundColor: brandColor }}>
                    {unreadMessagesCount}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/5">
        {!strictMode && (
          <button
            onClick={handleOpenAssistant}
            className="w-full text-left bg-white/5 rounded-2xl p-4 mb-4 border border-white/5 group transition-colors hover:bg-white/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-slate-400 group-hover:text-indigo-400 transition-colors shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intelligent Assistant</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight uppercase font-bold tracking-tighter italic">"Awaiting neural command..."</p>
          </button>
        )}
        {strictMode && (
          <div className="bg-slate-900/50 p-4 mb-4 rounded-2xl border border-white/5 border-dashed text-center">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600">Manual Mode Active</p>
          </div>
        )}
        <button
          onClick={() => import('../services/clear_cache').then(m => m.clearAllClientCache())}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all group mb-2 border border-rose-500/20"
        >
          <RefreshCw size={18} className="text-rose-500 group-hover:text-rose-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-widest">Reset App</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
        >
          <LogOut size={18} className="text-slate-600 group-hover:text-rose-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export const Layout: React.FC<{ children: React.ReactNode; userRole: Role }> = ({ children, userRole }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings, strictMode } = useSettingsStore();
  const { user: currentUser, logout } = useAuthStore();

  const brandColor = settings.brandColor || '#00ff9d';
  const orgName = settings.name || 'Paradigm-Xi';

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Profile Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Mobile Simulator State
  const [showMobileSimulator, setShowMobileSimulator] = useState(false);
  const [simulatorScale, setSimulatorScale] = useState(1);
  const isIframe = window.self !== window.top;

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
  };

  const toggleVoiceCommand = async () => {
    if (isVoiceActive) {
      mediaRecorderRef.current?.stop();
      setIsVoiceActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            setIsProcessing(true);
            setVoiceFeedback("Analyzing instruction...");
            const result = await processVoiceCommand(base64, 'audio/webm', `Current Screen: ${location.pathname}`);
            if (result.intent === 'navigate' && result.data?.path) navigate(result.data.path);
            setVoiceFeedback(result.feedback || "Command completed.");
            setTimeout(() => { setIsProcessing(false); setVoiceFeedback(''); }, 3000);
          };
        };
        recorder.start();
        setIsVoiceActive(true);
        setVoiceFeedback("Listening for instructions...");
      } catch (err) { alert("Microphone hardware link failed."); }
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="min-h-screen flex bg-[#020617]">
      <aside className="hidden md:block w-72 fixed h-full z-30 bg-[#020617] border-r border-white/5">
        <NavContent userRole={userRole} brandColor={brandColor} orgName={orgName} handleLogout={handleLogout} currentPath={location.pathname} />
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE SIMULATOR OVERLAY */}
      {showMobileSimulator && !isIframe && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
          {/* Fixed Header Controls */}
          <div className="flex-none flex items-center justify-between p-6 border-b border-white/10 bg-slate-950/50 backdrop-blur-sm z-50">
            <div className="flex items-center gap-4 text-white">
              <div className="p-2 bg-white/10 rounded-full"><Smartphone size={20} className="text-[#00ff9d]" /></div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Mobile Simulator</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">Previewing: {location.pathname}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSimulatorScale(s => s === 1 ? 0.85 : 1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
              >
                {simulatorScale === 1 ? 'Fit Screen' : '100%'}
              </button>
              <button
                onClick={() => setShowMobileSimulator(false)}
                className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-rose-500/25 flex items-center gap-2"
              >
                <X size={14} /> Close Preview
              </button>
            </div>
          </div>

          {/* Scrollable Phone Area */}
          <div className="flex-1 overflow-y-auto flex flex-col items-center py-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <div
              className="transition-transform duration-300 origin-top shrink-0"
              style={{ transform: `scale(${simulatorScale})`, marginBottom: simulatorScale === 1 ? 0 : '-100px' }}
            >
              <div className="relative w-[375px] h-[812px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden ring-4 ring-slate-950">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-950 rounded-b-2xl z-20"></div>

                <iframe
                  src={window.location.href}
                  className="w-full h-full bg-white text-slate-900"
                  title="Mobile Preview"
                />

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-950/20 rounded-full z-20 pointer-events-none"></div>
              </div>
            </div>
            <p className="mt-8 text-slate-500 text-[10px] font-black uppercase tracking-widest shrink-0 pb-10">Interactive Preview • iPhone Dimensions</p>
          </div>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#020617] transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <NavContent userRole={userRole} brandColor={brandColor} orgName={orgName} handleLogout={handleLogout} currentPath={location.pathname} />
      </aside>

      <div className="flex-1 md:ml-72 flex flex-col min-h-screen w-full overflow-x-hidden">
        <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl h-16 md:h-20 flex items-center px-4 md:px-10 justify-between border-b border-white/5 w-full">
          <div className="flex items-center gap-4 md:gap-6 min-w-0">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-800 rounded-lg shrink-0"><Menu size={24} /></button>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate hidden md:block">Date: {formattedDate}</span>
              <SyncIndicator />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="relative">
              {voiceFeedback && (
                <div className="absolute right-0 top-12 bg-[#00ff9d] text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-2xl animate-in zoom-in slide-in-from-top-2 z-50">
                  {voiceFeedback}
                </div>
              )}
              {!strictMode && (
                <button
                  onClick={toggleVoiceCommand}
                  disabled={isProcessing}
                  className={`p-2.5 md:p-3 rounded-2xl transition-all active:scale-90 border flex items-center gap-2 ${isVoiceActive ? 'bg-rose-500 border-rose-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' : isProcessing ? 'bg-slate-800 border-white/10 text-[#00ff9d]' : 'bg-white/5 border-white/5 text-slate-400 hover:text-[#00ff9d]'}`}
                >
                  {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : isVoiceActive ? <Square size={18} className="fill-white" /> : <Mic size={18} />}
                  <span className="hidden lg:block text-[9px] font-black uppercase tracking-widest">{isVoiceActive ? 'Stop' : 'Voice Assist'}</span>
                </button>
              )}
            </div>

            {!isIframe && (
              <button
                onClick={() => setShowMobileSimulator(true)}
                className="hidden md:flex p-2.5 text-slate-500 hover:bg-white/5 hover:text-[#00ff9d] rounded-xl transition-all active:scale-90 items-center gap-2 group"
                title="Mobile Simulator"
              >
                <Smartphone size={20} />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Mobile View</span>
              </button>
            )}

            <button onClick={() => navigate('/docs')} className="hidden sm:flex p-2.5 text-slate-500 hover:bg-white/5 rounded-xl transition-all active:scale-90" title="Knowledge Base"><HelpCircle size={20} /></button>
            <button className="p-2.5 text-slate-500 hover:bg-white/5 rounded-xl relative transition-all active:scale-90"><Bell size={20} /><span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border-2 border-[#020617]" style={{ backgroundColor: brandColor }}></span></button>

            <div className="flex items-center gap-2 md:gap-4 shrink-0 relative">
              {/* ... voice and other icons ... */}

              {/* Profile Dropdown Area */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 ml-2 hover:bg-white/5 p-1.5 pr-3 rounded-2xl transition-all group"
                >
                  <div className="text-right hidden xl:block min-w-0">
                    <p className="text-xs font-black text-white leading-none uppercase tracking-tight truncate">{currentUser?.name}</p>
                    <p className="text-[9px] font-bold uppercase mt-1 opacity-70 truncate" style={{ color: brandColor }}>{userRole}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl border-2 shadow-md overflow-hidden bg-slate-800 shrink-0 transition-all ${isProfileOpen ? 'border-white' : 'border-white/10 group-hover:border-white/30'}`}>
                    <img src={currentUser?.avatar} className="w-full h-full object-cover" alt="Profile" />
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-4 w-72 bg-[#020617] border border-white/10 rounded-3xl shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-2">
                    {/* Dropdown Header */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                      <div className="w-14 h-14 rounded-2xl border-2 border-white/10 overflow-hidden shrink-0">
                        <img src={currentUser?.avatar} className="w-full h-full object-cover" alt="Profile" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">{currentUser?.name}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[140px]">{currentUser?.email}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-widest text-[#00ff9d]">
                          {userRole}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-2">
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                      >
                        <Settings size={16} className="group-hover:text-[#00ff9d] transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Global Settings</span>
                      </Link>

                      <button
                        onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                        className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"
                      >
                        <LogOut size={16} className="group-hover:text-rose-500 transition-colors" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sign Out</span>
                      </button>
                    </div>

                    {/* Footer Stats / Fluff */}
                    <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-600">
                      <span>Session ID: {currentUser?.id?.slice(0, 8)}</span>
                      <span className="text-[#00ff9d]">Secure</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-10 pb-64 md:pb-10 transition-all duration-300 bg-[#020617] w-full overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>
      <ChatWidget />
    </div>
  );
};
