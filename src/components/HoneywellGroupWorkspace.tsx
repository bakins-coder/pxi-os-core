import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Building2,
  Users,
  TrendingUp,
  Layers,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Hotel,
  Wheat,
  Flame,
  Landmark,
  LayoutGrid,
  ArrowRightLeft,
  BookOpen,
  CreditCard,
  LogOut,
  BarChart3,
  CheckCircle2,
  Zap,
  Brain,
  Globe,
  Clock,
  Settings,
  ShieldCheck,
  Plus,
  MapPin,
  UserCheck,
  MessageSquare,
  GitBranch,
  FlaskConical,
  Send,
  Paperclip,
  Hash,
  Activity
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuthStore } from '../store/useAuthStore';
import { processAgentRequest } from '../services/ai';

// ─── Types ────────────────────────────────────────────────────────────────────
interface HoneywellGroupWorkspaceProps {
  adminEmail: string;
  staffId: string;
}

// ─── Portfolio Chart Data ─────────────────────────────────────────────────────
const portfolioData = [
  { month: 'Jan', value: 95 },
  { month: 'Feb', value: 102 },
  { month: 'Mar', value: 108 },
  { month: 'Apr', value: 115 },
  { month: 'May', value: 121 },
  { month: 'Jun', value: 127 }
];

// ─── Companies (ApexGroup Styled metadata) ────────────────────────────────────
const companies = [
  {
    id: 'hogl',
    name: 'HOGL Energy Limited',
    sector: 'ENERGY & LOGISTICS',
    description: 'Leading downstream petroleum logistics, storage, and retail distribution holding. Manages massive reservoir assets across key coastal shipping hubs.',
    icon: Flame,
    iconColor: '#f97316',
    image: '/hogl_refinery.png',
    location: 'Apapa, Lagos, Nigeria',
    status: 'ACTIVE',
    groupStake: '100% (Wholly Owned)',
    stakePct: 100,
    marketCap: '₦45.0 Billion',
    shareVal: '$30.0M USD',
    qTurnover: '$8.50M',
    ytdRevenue: '$24.50M',
    profitMargin: '+12.4%',
    ceo: 'Olabisi Okunola',
    subId: 'SUB-HOGL',
    stats: [
      { label: 'Tank Farms', value: '7 Active' },
      { label: 'Daily Throughput', value: '12,000 MT' },
      { label: 'Staff', value: '438' }
    ]
  },
  {
    id: 'ikeja-hotel',
    name: 'Ikeja Hotel Plc',
    sector: 'HOSPITALITY',
    description: 'Premier hospitality portfolio holding iconic luxury properties, banquet halls, and leisure facilities catering to business tourists in Nigeria.',
    icon: Hotel,
    iconColor: '#a78bfa',
    image: '/ikeja_hotel.png',
    location: 'Ikeja, Lagos, Nigeria',
    status: 'ACTIVE',
    groupStake: '14.12% (Portfolio Stake)',
    stakePct: 14.12,
    marketCap: '₦32.0 Billion',
    shareVal: '$21.3M USD',
    qTurnover: '$5.20M',
    ytdRevenue: '$14.80M',
    profitMargin: '+15.8%',
    ceo: 'Theophilus Netufo',
    subId: 'SUB-IKEJA',
    stats: [
      { label: 'Stake', value: '14.12%' },
      { label: 'Rooms', value: '229' },
      { label: 'Rating', value: '4-Star' }
    ]
  },
  {
    id: 'flour-mills',
    name: 'Honeywell Flour Mills',
    sector: 'AGRIBUSINESS',
    description: 'Legacy industrial grain processing and milling conglomerate. Divested to Flour Mills of Nigeria (FMN) in a historic transaction.',
    icon: Wheat,
    iconColor: '#eab308',
    image: '/flour_mills.png',
    location: 'Tin Can Island, Lagos, Nigeria',
    status: 'DIVESTED',
    groupStake: '100% (Legacy Holdings)',
    stakePct: 100,
    marketCap: '₦24.0 Billion',
    shareVal: '$16.0M USD',
    qTurnover: '$4.10M',
    ytdRevenue: '$11.50M',
    profitMargin: '+8.9%',
    ceo: 'Dr. Amina Yusuf',
    subId: 'SUB-HFMC',
    stats: [
      { label: 'Status', value: 'Divested' },
      { label: 'Acquirer', value: 'FMN Plc' },
      { label: 'Year', value: '2023' }
    ]
  },
  {
    id: 'real-estate',
    name: 'Honeywell Real Estate',
    sector: 'REAL ESTATE & INFRASTRUCTURE',
    description: 'Ultra-premium residential and commercial property development company specializing in state-of-the-art smart structures in Ikoyi, Victoria Island, and Lekki.',
    icon: Landmark,
    iconColor: '#34d399',
    image: '/real_estate.png',
    location: 'Ikoyi, Lagos, Nigeria',
    status: 'ACTIVE',
    groupStake: '100% (Wholly Owned)',
    stakePct: 100,
    marketCap: '₦58.0 Billion',
    shareVal: '$38.7M USD',
    qTurnover: '$1.10M',
    ytdRevenue: '$31.20M',
    profitMargin: '+22.1%',
    ceo: 'Arc. Chidi Opara',
    subId: 'SUB-REALESTATE',
    stats: [
      { label: 'Active Projects', value: '9' },
      { label: 'GDV', value: '₦74B' },
      { label: 'Staff', value: '312' }
    ]
  }
];

// ─── Shared Services Modules ──────────────────────────────────────────────────
const sharedServices = [
  { id: 'asset', label: 'Asset Management', icon: Layers, color: '#d4a017' },
  { id: 'hr-transfer', label: 'Staff Transfer', icon: ArrowRightLeft, color: '#a78bfa' },
  { id: 'accounting', label: 'Consolidated Accounting & Tax', icon: BookOpen, color: '#34d399' },
  { id: 'crm', label: 'CRM', icon: Users, color: '#f97316' },
  { id: 'hr', label: 'HR (Switchable)', icon: BriefcaseBusiness, color: '#60a5fa' },
  { id: 'investment', label: 'Investment Portfolio', icon: TrendingUp, color: '#fb7185' }
];

// ─── ORCA AI Log rotation messages ───────────────────────────────────────────
const ORCA_MESSAGES = [
  '[ORCA] Cross-company payroll reconciliation complete across all 4 entities.',
  '[ORCA] HOGL Energy: Detected anomaly in Tank Farm 3 throughput. Flagging for review.',
  '[ORCA] Ikeja Hotel Plc: Q2 dividend receipt of ₦148M posted to group accounts.',
  '[ORCA] Real Estate arm: 3 new lease agreements awaiting MD signature.',
  '[ORCA] Consolidated tax filing for FY2025 prepared. Effective rate: 28.4%.',
  '[ORCA] Group headcount variance: +12 net new hires in Q2 across all subsidiaries.',
  '[ORCA] HOGL Energy: Lubricant blending plant running at 87% capacity. Optimal.',
  '[ORCA] Portfolio rebalancing suggestion: Increase real estate allocation by 4%.',
  '[ORCA] Staff transfer request from HOGL to Real Estate arm approved — 2 engineers.',
  '[ORCA] Honeywell Real Estate: GDV milestone hit — ₦74B as of June 30.',
  '[ORCA] Group board meeting scheduled: July 22 at Corporate HQ, Ikoyi Lagos.',
  '[ORCA] Investment portfolio IRR tracking at 19.2% — above 18% target.',
];

const COMPANY_TABS = ['Assets', 'HR/Staff', 'CRM', 'Financials'];

export const HoneywellGroupWorkspace: React.FC<HoneywellGroupWorkspaceProps> = ({ adminEmail, staffId }) => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<'subsidiaries' | 'services' | 'orca' | 'compliance' | 'scenarios' | 'collab'>('subsidiaries');

  // AI Scenario Planning state
  const [scenarioInputs, setScenarioInputs] = useState({ subsidiary: 'hogl', metric: 'revenue', change: '+15', horizon: '6 months' });
  const [scenarioResult, setScenarioResult] = useState<null | { headline: string; impacts: { label: string; value: string; color: string }[]; summary: string }>(null);
  const [scenarioRunning, setScenarioRunning] = useState(false);

  // Collaboration Hub state
  const [collabChannel, setCollabChannel] = useState<'general' | 'hogl' | 'ikeja' | 'realestate'>('general');
  const [collabMessages, setCollabMessages] = useState<{ author: string; company: string; time: string; text: string; type: 'text' | 'file' }[]>([
    { author: 'Arc. Chidi Opara', company: 'Honeywell Real Estate', time: '14:22', text: 'Shared Q2 property valuation report for group review.', type: 'file' },
    { author: 'Olabisi Okunola', company: 'HOGL Energy', time: '13:47', text: 'Tank Farm 3 throughput data is updated. Please review before the board meeting.', type: 'text' },
    { author: 'Group Admin', company: 'Honeywell Group HQ', time: '13:10', text: 'Reminder: Group board meeting is scheduled for July 22 at Ikoyi HQ. All CEOs should prepare subsidiary reports.', type: 'text' },
  ]);
  const [collabInput, setCollabInput] = useState('');
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [activeOrcaTab, setActiveOrcaTab] = useState<'chat' | 'activity'>('chat');
  
  // Real-time responsive layout controls
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orcaMinimized, setOrcaMinimized] = useState(false);
  
  // Real-time clock state for Lagos
  const [lagosTime, setLagosTime] = useState("");

  const [orcaChat, setOrcaChat] = useState<{ sender: 'user' | 'orca', time: string, text: string }[]>([
    { sender: 'orca', time: '02:45:01', text: 'Hello Group Admin. I am ORCA, your Chief AI. How can I assist you with Honeywell Group operations today?' }
  ]);
  
  const [orcaLogs, setOrcaLogs] = useState<string[]>([
    `[ORCA] 02:45:01 - Group dashboard initialised. Monitoring all 4 entities.`,
    `[ORCA] 02:44:48 - Investment portfolio IRR tracking at 19.2% — above 18% target.`,
    `[ORCA] 02:44:30 - Consolidated tax filing for FY2025 prepared. Effective rate: 28.4%.`,
  ]);
  
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Lagos Clock Timer
  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Lagos',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      setLagosTime(formatter.format(new Date()));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Background logs rotation
  useEffect(() => {
    const interval = setInterval(() => {
      const msg = ORCA_MESSAGES[Math.floor(Math.random() * ORCA_MESSAGES.length)];
      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      setOrcaLogs(prev => [`${msg.replace('[ORCA]', `[ORCA] ${time} -`)}`, ...prev.slice(0, 49)]);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCompanyClick = (id: string) => {
    setExpandedCompany(prev => (prev === id ? null : id));
    if (!activeTab[id]) {
      setActiveTab(prev => ({ ...prev, [id]: 'Assets' }));
    }
  };

  const handleSignOut = async () => {
    showToast('Signing out...');
    await useAuthStore.getState().logout();
    setTimeout(() => window.location.reload(), 500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isTyping) return;
    
    const userQuery = inputMsg.trim();
    setInputMsg("");
    
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    
    setOrcaChat(prev => [{ sender: 'user', time, text: userQuery }, ...prev]);
    setIsTyping(true);
    setOrcaChat(prev => [{ sender: 'orca', time, text: 'Analyzing request...' }, ...prev]);
    
    try {
      const recentContext = orcaChat
        .slice(0, 8)
        .reverse()
        .map(msg => `${msg.sender === 'user' ? 'User' : 'ORCA'}: ${msg.text}`)
        .join('\n');
      
      const fullContext = `This is a conversation with ORCA, the Chief AI Agent of Honeywell Group. You have full access to details about Honeywell's subsidiaries: HOGL Energy, Ikeja Hotel Plc, Honeywell Flour Mills, and Honeywell Real Estate. \n\nRecent History:\n${recentContext}`;
      
      const result = await processAgentRequest(userQuery, fullContext, 'text');
      
      setOrcaChat(prev => {
        const filtered = prev.filter(msg => msg.text !== 'Analyzing request...');
        return [{ sender: 'orca', time, text: result.response }, ...filtered];
      });
      
      if (result.intent && result.intent !== 'GENERAL_QUERY') {
        showToast(`ORCA Intent Triggered: ${result.intent}`);
      }
    } catch (err: any) {
      console.error("ORCA request failed:", err);
      setOrcaChat(prev => {
        const filtered = prev.filter(msg => msg.text !== 'Analyzing request...');
        return [{ sender: 'orca', time, text: `Error connecting to neural network: ${err.message || 'Timeout'}` }, ...filtered];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#0f172a', border: '1px solid #d4a017', borderRadius: 8, padding: '8px 14px' }}>
          <p style={{ color: '#d4a017', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{label}</p>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>₦{payload[0].value}B</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f1f5f9', fontFamily: "'Inter', 'Segoe UI', sans-serif", display: 'flex', overflow: 'hidden' }}>

      {/* ── LEFT SIDEBAR NAVIGATION (COLLAPSIBLE) ────────────────────────────────── */}
      <div style={{
        width: sidebarCollapsed ? 76 : 280,
        background: '#0b0f19',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: sidebarCollapsed ? '24px 10px' : '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        flexShrink: 0,
        transition: 'all 0.3s ease',
        alignItems: sidebarCollapsed ? 'center' : 'stretch',
        position: 'relative'
      }}>
        
        {/* Collapse/Expand Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'absolute',
            right: -12,
            top: 32,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#0b0f19',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#d4a017',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 50,
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.color = '#fff'}
          onMouseOut={e => e.currentTarget.style.color = '#d4a017'}
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} />}
        </button>

        {/* Brand Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: 'linear-gradient(135deg, #d4a017, #f5c842)', color: '#020617', fontWeight: 900, borderRadius: 10, fontSize: 20, flexShrink: 0 }}>
            H
          </div>
          {!sidebarCollapsed && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.05em' }}>HONEYWELL<span style={{ color: '#d4a017' }}>GROUP</span></h2>
              <span style={{ fontSize: 9, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>HQ Console v4.0</span>
            </div>
          )}
        </div>

        {/* Lagos Time Widget */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: sidebarCollapsed ? '10px 0' : '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: sidebarCollapsed ? 0 : 8,
          width: '100%'
        }} title={sidebarCollapsed ? `Lagos Time: ${lagosTime}` : undefined}>
          <Clock size={14} color="#d4a017" style={{ flexShrink: 0 }} />
          {!sidebarCollapsed && (
            <>
              <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lagos:</span>
              <span style={{ fontSize: 11, color: '#fff', fontFamily: 'monospace', fontWeight: 700, marginLeft: 'auto' }}>{lagosTime || "00:00:00 AM"}</span>
            </>
          )}
        </div>

        {/* Active Role Selector Widget */}
        <div 
          style={{
            background: 'rgba(212,160,23,0.06)',
            border: '1px solid rgba(212,160,23,0.2)',
            borderRadius: 10,
            padding: sidebarCollapsed ? '10px' : '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            cursor: 'pointer',
            width: '100%'
          }} 
          onClick={() => showToast('Role details verified under RBAC security policy.')}
          title={sidebarCollapsed ? 'Role: Group Administrator' : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: sidebarCollapsed ? 0 : 8 }}>
            <UserCheck size={14} color="#d4a017" style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#d4a017', letterSpacing: '0.05em' }}>Group Admin</span>
            )}
          </div>
          {!sidebarCollapsed && <ChevronDown size={12} color="#d4a017" />}
        </div>

        {/* Navigation Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 4px' }}>
              <span style={{ fontSize: 10, color: '#475569', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Core Navigation</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                Live
              </span>
            </div>
          )}

          {[
            { id: 'subsidiaries', label: 'Subsidiaries', icon: LayoutGrid },
            { id: 'services', label: 'Shared Services', icon: Layers },
            { id: 'orca', label: 'Chief AI (ORCA)', icon: Brain },
            { id: 'scenarios', label: 'AI Scenario Planner', icon: FlaskConical },
            { id: 'collab', label: 'Collaboration Hub', icon: MessageSquare },
            { id: 'compliance', label: 'Compliance Logs', icon: ShieldCheck }
          ].map(item => {
            const isActive = activeSidebarTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSidebarTab(item.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  gap: sidebarCollapsed ? 0 : 12,
                  background: isActive ? 'rgba(212,160,23,0.1)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #d4a017' : '3px solid transparent',
                  padding: sidebarCollapsed ? '12px 0' : '12px 14px',
                  borderRadius: sidebarCollapsed ? '10px' : '0 10px 10px 0',
                  color: isActive ? '#fff' : '#64748b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: sidebarCollapsed ? 'center' : 'left',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                title={sidebarCollapsed ? item.label : undefined}
                onMouseOver={e => { if(!isActive) e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { if(!isActive) e.currentTarget.style.color = '#64748b'; }}
              >
                <item.icon size={16} color={isActive ? '#d4a017' : '#64748b'} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && item.label}
                {!sidebarCollapsed && item.id === 'compliance' && (
                  <span style={{ marginLeft: 'auto', background: '#d4a017', color: '#000', fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                )}
                {sidebarCollapsed && item.id === 'compliance' && (
                  <span style={{ position: 'absolute', top: 4, right: 4, background: '#d4a017', color: '#000', fontSize: 8, fontWeight: 900, width: 12, height: 12, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, width: '100%', display: 'flex', flexDirection: 'column', alignItems: sidebarCollapsed ? 'center' : 'stretch' }}>
          {!sidebarCollapsed && <span style={{ fontSize: 9, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>RBAC Scope Active</span>}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: sidebarCollapsed ? 0 : '4px 0 0', display: 'flex', alignItems: 'center', gap: sidebarCollapsed ? 0 : 6 }} title={sidebarCollapsed ? 'RBAC Scope: Group Administrator' : undefined}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', flexShrink: 0, marginRight: sidebarCollapsed ? 0 : 6 }} />
            {!sidebarCollapsed && "Group Administrator"}
          </p>
        </div>
      </div>

      {/* ── RIGHT MAIN CONTENT AREA ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'relative' }}>
        
        {/* Floating ORCA AI tab restore indicator */}
        {orcaMinimized && activeSidebarTab === 'subsidiaries' && (
          <button
            onClick={() => setOrcaMinimized(false)}
            style={{
              position: 'fixed',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(212,160,23,0.12)',
              border: '1px solid rgba(212,160,23,0.35)',
              borderRight: 'none',
              color: '#d4a017',
              borderRadius: '12px 0 0 12px',
              width: 32,
              height: 74,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              zIndex: 100,
              boxShadow: '-4px 0 15px rgba(0,0,0,0.5)',
              transition: 'all 0.2s ease',
              padding: 0
            }}
            title="Expand ORCA AI Panel"
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(212,160,23,0.22)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(212,160,23,0.12)';
              e.currentTarget.style.color = '#d4a017';
            }}
          >
            <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} />
            <Brain size={14} />
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          </button>
        )}

        {/* Toast Notification */}
        {toastMsg && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0b0f19', border: '2px solid #d4a017', borderRadius: 14, padding: '12px 20px', boxShadow: '0 8px 32px rgba(212,160,23,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={16} color="#d4a017" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{toastMsg}</span>
          </div>
        )}

        <div style={{ padding: '32px 36px', width: '100%', maxWidth: 1400, margin: '0 auto' }}>
          
          {/* ── HEADER BANNER (KEPT THE SAME AS PREVIOUS DESIGN) ───────────────────── */}
          <div style={{ background: 'linear-gradient(135deg, #0b0f19 0%, #1e293b 50%, #0b0f19 100%)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 20, overflow: 'hidden', marginBottom: 32, boxShadow: '0 0 40px rgba(212,160,23,0.08), 0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ height: 4, background: 'linear-gradient(90deg, #d4a017, #f5c842, #d4a017)' }} />

            <div style={{ padding: '36px 40px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.4)', color: '#d4a017', fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', padding: '4px 12px', borderRadius: 20, marginBottom: 14, textTransform: 'uppercase' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4a017', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                    Live Paradigm Admin Session
                  </span>
                  <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: 0, lineHeight: 1 }}>
                    HONEYWELL <span style={{ background: 'linear-gradient(135deg, #d4a017, #f5c842)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>GROUP</span>
                  </h1>
                  <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Globe size={14} color="#d4a017" />
                    Ikoyi, Lagos · Founded 1972 · Investment Holding Group
                  </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                  <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={16} color="#d4a017" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#d4a017', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Group Admin Access</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    id="hwg-signout-btn"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '8px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.05em', transition: 'all 0.2s' }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                </div>
              </div>

              {/* ── HEADER STATS ROW ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { icon: TrendingUp, label: 'Total Assets', value: '₦485B', color: '#d4a017' },
                  { icon: Building2, label: 'Active Companies', value: '4', color: '#a78bfa' },
                  { icon: Users, label: 'Group Headcount', value: '2,847', color: '#34d399' },
                  { icon: BarChart3, label: 'Portfolio Value', value: '₦127B', color: '#60a5fa' }
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}18`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <stat.icon size={20} color={stat.color} />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: '#64748b', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{stat.label}</p>
                      <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '3px 0 0', letterSpacing: '-0.5px' }}>{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── TAB CONTENT 1: SUBSIDIARIES PORTFOLIO (APEXGROUP STYLE) ────────────────── */}
          {activeSidebarTab === 'subsidiaries' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Section Header Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Centralised Subsidiaries Portfolio</h2>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Live profiles and ownership models of Honeywell Group operating companies.</p>
                </div>
                <button
                  onClick={() => showToast('Subsidiary registration module locked under Admin role.')}
                  style={{
                    background: '#d4a017',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px 20px',
                    color: '#020617',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    letterSpacing: '0.05em'
                  }}
                >
                  <Plus size={14} strokeWidth={3} /> REGISTER SUBSIDIARY
                </button>
              </div>

              {/* Conglomerate Level KPI Cards (ApexGroup Styled) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {[
                  { label: 'GROUP MARKET VALUATION', value: '₦127.0B', subtitle: 'Equivalent to ~ $85.0M USD', icon: TrendingUp },
                  { label: 'TOTAL CONGLOMERATE WORKFORCE', value: '2,847', subtitle: 'Active medical HMO aligned', icon: Users },
                  { label: 'CONSOLIDATED ASSET POSTURE', value: '₦485.0B', subtitle: 'Audited under IFRS guidelines', icon: Landmark }
                ].map((kpi, i) => (
                  <div key={i} style={{ background: '#0e121e', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 9, color: '#475569', fontWeight: 800, letterSpacing: '0.1em' }}>{kpi.label}</span>
                      <h3 style={{ fontSize: 28, fontWeight: 900, color: '#d4a017', margin: '8px 0 4px', letterSpacing: '-0.5px' }}>{kpi.value}</h3>
                      <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{kpi.subtitle}</span>
                    </div>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <kpi.icon size={20} color="#d4a017" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Subsidiaries Grid + Floating ORCA AI Panel Side-by-Side (RESPONSIVE GRID WIDTHS) */}
              <div style={{ display: 'grid', gridTemplateColumns: orcaMinimized ? '1fr' : '1fr 360px', gap: 24, transition: 'all 0.3s ease' }}>
                
                {/* Subsidiaries Cards Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {companies.map(company => (
                    <div key={company.id} id={`company-card-${company.id}`} style={{ background: '#0e121e', border: expandedCompany === company.id ? '1px solid rgba(212,160,23,0.4)' : '1px solid rgba(255,255,255,0.05)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,0.3)', transition: 'all 0.25s' }}>
                      
                      {/* Image cover with overlay badges */}
                      <div style={{ position: 'relative', height: 200, width: '100%', overflow: 'hidden' }}>
                        <img src={company.image} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(9,13,22,0.1), rgba(9,13,22,0.85))' }} />
                        
                        {/* Sector Badge overlay */}
                        <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(9,13,22,0.85)', border: '1px solid rgba(212,160,23,0.3)', color: '#d4a017', fontSize: 9, fontWeight: 900, padding: '4px 10px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          {company.sector}
                        </div>

                        {/* Status Badge overlay */}
                        <div style={{ position: 'absolute', top: 16, right: 16, background: company.status === 'ACTIVE' ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)', border: company.status === 'ACTIVE' ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(239,68,68,0.3)', color: company.status === 'ACTIVE' ? '#34d399' : '#f87171', fontSize: 9, fontWeight: 900, padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: company.status === 'ACTIVE' ? '#34d399' : '#ef4444', display: 'inline-block' }} />
                          {company.status}
                        </div>

                        {/* Title and location inside image bottom area */}
                        <div style={{ position: 'absolute', bottom: 16, left: 20 }}>
                          <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>{company.name}</h3>
                          <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            <MapPin size={12} color="#d4a017" />
                            {company.location}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>{company.description}</p>
                        
                        {/* Group Stake Progress Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>
                            <span>Group Stake:</span>
                            <span style={{ color: '#d4a017' }}>{company.groupStake}</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
                            <div style={{ height: '100%', width: `${company.stakePct}%`, background: 'linear-gradient(90deg, #d4a017, #f5c842)', borderRadius: 3 }} />
                          </div>
                        </div>

                        {/* Capital and Valuation Metrics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(0,0,0,0.15)', padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div>
                            <span style={{ fontSize: 9, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market Capital (Naira)</span>
                            <h4 style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: '4px 0 0' }}>{company.marketCap}</h4>
                          </div>
                          <div>
                            <span style={{ fontSize: 9, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group Share Valuation</span>
                            <h4 style={{ fontSize: 14, fontWeight: 900, color: '#10b981', margin: '4px 0 0' }}>{company.shareVal}</h4>
                          </div>
                        </div>

                        {/* Financial Indicators Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 9, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>Q_Turnover</span>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: '4px 0 0' }}>{company.qTurnover}</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 9, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>YTD_Revenue</span>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: '4px 0 0' }}>{company.ytdRevenue}</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: 9, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>Profit_Margin</span>
                            <p style={{ fontSize: 13, fontWeight: 800, color: '#34d399', margin: '4px 0 0' }}>{company.profitMargin}</p>
                          </div>
                        </div>

                        {/* Expandable Tabs Button */}
                        <button
                          onClick={() => handleCompanyClick(company.id)}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 10,
                            padding: '10px',
                            color: '#94a3b8',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transition: 'all 0.2s'
                          }}
                        >
                          {expandedCompany === company.id ? 'Collapse Operational Console' : 'Expand Operational Console'}
                          {expandedCompany === company.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      </div>

                      {/* Expanded Mini Panel Content (CARDS INTERFACE INSTEAD OF TABS) */}
                      {expandedCompany === company.id && (
                        <div style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          
                          {/* Inner Tabs switcher styled as interactive Sub-Cards Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '20px 24px 12px' }}>
                            {[
                              { id: 'Assets', label: 'Assets & Operations', icon: company.id === 'hogl' ? Flame : (company.id === 'ikeja-hotel' ? Hotel : (company.id === 'flour-mills' ? Wheat : Landmark)), color: '#d4a017', desc: company.id === 'hogl' ? '7 Active Tanks' : (company.id === 'ikeja-hotel' ? '229 Luxury Rooms' : (company.id === 'flour-mills' ? 'Legacy Acquired' : '9 Active Projects')) },
                              { id: 'HR/Staff', label: 'Workforce & HR', icon: Users, color: '#a78bfa', desc: company.id === 'hogl' ? '438 Active Staff' : (company.id === 'ikeja-hotel' ? '184 Hotel Staff' : (company.id === 'flour-mills' ? 'Alumni Mapped' : '312 Real Estate Staff')) },
                              { id: 'CRM', label: 'CRM & Pipelines', icon: Globe, color: '#60a5fa', desc: company.id === 'hogl' ? '24 Contracts' : (company.id === 'ikeja-hotel' ? '11 Group Bookings' : (company.id === 'flour-mills' ? 'Archived Records' : '34 Client Leases')) },
                              { id: 'Financials', label: 'Financial Ledger', icon: TrendingUp, color: '#34d399', desc: company.id === 'hogl' ? '+$24.50M YTD' : (company.id === 'ikeja-hotel' ? '+$14.80M YTD' : (company.id === 'flour-mills' ? '+$11.50M YTD' : '+$31.20M YTD')) }
                            ].map(tabCard => {
                              const isSelected = activeTab[company.id] === tabCard.id;
                              return (
                                <div
                                  key={tabCard.id}
                                  onClick={() => setActiveTab(prev => ({ ...prev, [company.id]: tabCard.id }))}
                                  style={{
                                    background: isSelected ? 'rgba(212,160,23,0.06)' : 'rgba(255,255,255,0.02)',
                                    border: isSelected ? '1px solid #d4a017' : '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 14,
                                    padding: '14px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                    boxShadow: isSelected ? '0 0 15px rgba(212,160,23,0.15)' : 'none',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}
                                  onMouseOver={e => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                                    }
                                  }}
                                  onMouseOut={e => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                    }
                                  }}
                                >
                                  {/* Selection indicator glow */}
                                  {isSelected && (
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, background: 'rgba(212,160,23,0.2)', borderRadius: '0 0 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4a017' }} />
                                    </div>
                                  )}
                                  
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: 8,
                                      background: `${tabCard.color}15`,
                                      border: `1px solid ${tabCard.color}30`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}>
                                      <tabCard.icon size={14} color={tabCard.color} />
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: isSelected ? '#fff' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      {tabCard.id === 'HR/Staff' ? 'Workforce' : (tabCard.id === 'Financials' ? 'Financials' : tabCard.id)}
                                    </span>
                                  </div>

                                  <div>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: isSelected ? '#d4a017' : '#cbd5e1', margin: 0 }}>{tabCard.label}</p>
                                    <p style={{ fontSize: 9, color: '#64748b', margin: '4px 0 0', fontWeight: 600 }}>{tabCard.desc}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Inner Tab contents (Expanded panel below sub-cards) */}
                          <div style={{ padding: '0 24px 20px', minHeight: 100 }}>
                            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 14, padding: '20px', animation: 'slideDown 0.3s ease' }}>
                              {activeTab[company.id] === 'Assets' && (
                                <div style={{ display: 'flex', gap: 12 }}>
                                  {company.stats.map((s, si) => (
                                    <div key={si} style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                      <p style={{ fontSize: 9, color: '#64748b', margin: 0, fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</p>
                                      <p style={{ fontSize: 16, fontWeight: 900, color: '#d4a017', margin: '6px 0 0' }}>{s.value}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {activeTab[company.id] === 'HR/Staff' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {['Department Heads', 'Open Positions', 'Leave Requests'].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{item}</span>
                                      <span style={{ fontSize: 11, fontWeight: 900, color: '#fff' }}>{[12, 4, 7][i]}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {activeTab[company.id] === 'CRM' && (
                                <div style={{ display: 'flex', gap: 10 }}>
                                  {['Active Contracts', 'Pipeline', 'Won Deals'].map((item, i) => (
                                    <div key={i} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 8px' }}>
                                      <p style={{ fontSize: 16, fontWeight: 900, color: '#d4a017', margin: 0 }}>{[24, 11, 8][i]}</p>
                                      <p style={{ fontSize: 9, color: '#64748b', margin: '4px 0 0', fontWeight: 800 }}>{item}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {activeTab[company.id] === 'Financials' && (
                                <div style={{ display: 'flex', gap: 10 }}>
                                  {['Q2 Revenue', 'EBITDA', 'Net Profit'].map((item, i) => (
                                    <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 14px' }}>
                                      <p style={{ fontSize: 9, color: '#64748b', margin: 0, fontWeight: 800, textTransform: 'uppercase' }}>{item}</p>
                                      <p style={{ fontSize: 14, fontWeight: 900, color: '#34d399', margin: '6px 0 0' }}>{['₦18.4B', '₦6.2B', '₦4.1B'][i]}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Card Footer info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 10, color: '#475569', fontWeight: 700 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={12} color="#475569" />
                          CEO: {company.ceo}
                        </span>
                        <span>ID: {company.subId}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Floating ORCA AI Column (CAN BE MINIMIZED) */}
                {!orcaMinimized && (
                  <div>
                    <div style={{ background: '#0e121e', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 20, overflow: 'hidden', position: 'sticky', top: 24, boxShadow: '0 0 30px rgba(212,160,23,0.05)' }}>
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, rgba(212,160,23,0.08), transparent)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Brain size={18} color="#d4a017" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: 12, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ORCA</h3>
                          <p style={{ fontSize: 10, color: '#d4a017', margin: 0, fontWeight: 700 }}>Chief AI Agent</p>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                            <span style={{ fontSize: 9, color: '#34d399', fontWeight: 800, letterSpacing: '0.05em' }}>LIVE</span>
                          </div>
                          
                          {/* Minimize Toggle Button */}
                          <button
                            onClick={() => setOrcaMinimized(true)}
                            style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: '#64748b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              transition: 'all 0.2s'
                            }}
                            title="Minimize ORCA Panel"
                            onMouseOver={e => {
                              e.currentTarget.style.color = '#fff';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.color = '#64748b';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            }}
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <button
                          onClick={() => setActiveOrcaTab('chat')}
                          style={{
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            padding: '10px 0',
                            fontSize: 10,
                            fontWeight: 800,
                            cursor: 'pointer',
                            color: activeOrcaTab === 'chat' ? '#d4a017' : '#475569',
                            borderBottom: activeOrcaTab === 'chat' ? '2px solid #d4a017' : '2px solid transparent',
                            transition: 'all 0.2s',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                          }}
                        >
                          💬 AI Conversation
                        </button>
                        <button
                          onClick={() => setActiveOrcaTab('activity')}
                          style={{
                            flex: 1,
                            background: 'none',
                            border: 'none',
                            padding: '10px 0',
                            fontSize: 10,
                            fontWeight: 800,
                            cursor: 'pointer',
                            color: activeOrcaTab === 'activity' ? '#d4a017' : '#475569',
                            borderBottom: activeOrcaTab === 'activity' ? '2px solid #d4a017' : '2px solid transparent',
                            transition: 'all 0.2s',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          📊 Live Activity
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        </button>
                      </div>

                      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {activeOrcaTab === 'chat' ? (
                          <>
                            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '10px 12px', height: 260, overflowY: 'auto', fontFamily: 'monospace', display: 'flex', flexDirection: 'column-reverse', gap: 6 }}>
                              <div ref={logEndRef} />
                              {orcaChat.map((msg, i) => {
                                let color = msg.sender === 'user' ? '#60a5fa' : (msg.text.includes('Analyzing request...') ? '#f5c842' : '#e2e8f0');
                                return (
                                  <div key={i} style={{ display: 'flex', gap: 6, paddingBottom: 4, lineHeight: 1.4 }}>
                                    <span style={{ color: msg.sender === 'user' ? '#60a5fa' : '#d4a017', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>
                                      {msg.sender === 'user' ? '👤' : '›'}
                                    </span>
                                    <span style={{ fontSize: 10, color, transition: 'color 0.3s', wordBreak: 'break-word' }}>
                                      {msg.sender === 'user' ? `[YOU] ${msg.time} - ${msg.text}` : `[ORCA] ${msg.time} - ${msg.text}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="text"
                                value={inputMsg}
                                onChange={e => setInputMsg(e.target.value)}
                                placeholder={isTyping ? "ORCA is thinking..." : "Ask ORCA..."}
                                disabled={isTyping}
                                style={{
                                  flex: 1,
                                  background: 'rgba(0,0,0,0.6)',
                                  border: '1px solid rgba(212,160,23,0.3)',
                                  borderRadius: 10,
                                  padding: '8px 12px',
                                  fontSize: 11,
                                  color: '#fff',
                                  outline: 'none'
                                }}
                              />
                              <button
                                type="submit"
                                disabled={isTyping || !inputMsg.trim()}
                                style={{
                                  background: 'linear-gradient(135deg, #d4a017, #f5c842)',
                                  border: 'none',
                                  borderRadius: 10,
                                  padding: '8px 14px',
                                  color: '#020617',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  opacity: (isTyping || !inputMsg.trim()) ? 0.5 : 1
                                }}
                              >
                                Send
                              </button>
                            </form>
                          </>
                        ) : (
                          <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '10px 12px', height: 300, overflowY: 'auto', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {orcaLogs.map((log, i) => (
                              <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.04)', lineHeight: 1.5 }}>
                                <span style={{ color: '#d4a017', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>›</span>
                                <span style={{ fontSize: 10, color: i === 0 ? '#e2e8f0' : '#64748b', transition: 'color 0.3s' }}>{log}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(212,160,23,0.06)', borderRadius: 8 }}>
                          <Zap size={11} color="#d4a017" />
                          <span style={{ fontSize: 9, color: '#94a3b8' }}>
                            {activeOrcaTab === 'chat' 
                              ? (isTyping ? "ORCA is querying group ledger..." : "Real-time AI query console active")
                              : "Live background auditing stream active"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ── TAB CONTENT 2: SHARED SERVICES & INVESTMENT PORTFOLIO ────────────────── */}
          {activeSidebarTab === 'services' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              
              {/* Shared Services Modules Grid */}
              <div style={{ background: '#0e121e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Layers size={16} color="#d4a017" />
                  <h2 style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Shared Services Modules</h2>
                </div>
                <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {sharedServices.map(svc => (
                    <div
                      key={svc.id}
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onClick={() => showToast(`${svc.label} — Shared Service Module is fully operational.`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${svc.color}15`, border: `1px solid ${svc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svc.icon size={18} color={svc.color} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', lineHeight: 1.3 }}>{svc.label}</span>
                      </div>
                      <span style={{ fontSize: 9, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', padding: '3px 10px', borderRadius: 20, fontWeight: 800, letterSpacing: '0.05em' }}>ACTIVE</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investment Portfolio detailed chart block */}
              <div style={{ background: '#0e121e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TrendingUp size={16} color="#d4a017" />
                    <h2 style={{ fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Investment Portfolio Analytics</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={12} color="#34d399" />
                    <span style={{ fontSize: 10, color: '#34d399', fontWeight: 800 }}>+33.7% YTD</span>
                  </div>
                </div>
                <div style={{ padding: '24px 16px 16px' }}>
                  <div style={{ marginBottom: 16, paddingLeft: 16 }}>
                    <p style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>₦127B</p>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '4px 0 0', fontWeight: 700 }}>Group Portfolio Value · June 2026</p>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={portfolioData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d4a017" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#d4a017" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v}B`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#d4a017"
                        strokeWidth={2.5}
                        fill="url(#goldGradient)"
                        dot={{ fill: '#d4a017', r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#f5c842', strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* ── TAB CONTENT 3: FULL ORCA CHAT CONSOLE ──────────────────────────────── */}
          {activeSidebarTab === 'orca' && (
            <div style={{ background: '#0e121e', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 20, overflow: 'hidden', minHeight: 500, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, rgba(212,160,23,0.1), transparent)' }}>
                <Brain size={24} color="#d4a017" />
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>ORCA Chief AI Agent Console</h2>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Dedicated operations interface with cross-subsidiary auditing logs and neural network chat.</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 10px #34d399' }} />
                  <span style={{ fontSize: 10, color: '#34d399', fontWeight: 900 }}>AI AGENT ONLINE</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', flex: 1, minHeight: 400 }}>
                
                {/* Full Chat Column */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)', padding: 24, gap: 16 }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: '16px 20px', flex: 1, overflowY: 'auto', minHeight: 300, display: 'flex', flexDirection: 'column-reverse', gap: 8 }}>
                    <div ref={logEndRef} />
                    {orcaChat.map((msg, i) => {
                      let color = msg.sender === 'user' ? '#60a5fa' : (msg.text.includes('Analyzing request...') ? '#f5c842' : '#e2e8f0');
                      return (
                        <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 6, lineHeight: 1.5 }}>
                          <span style={{ fontSize: 14 }}>{msg.sender === 'user' ? '👤' : '🤖'}</span>
                          <div>
                            <div style={{ fontSize: 9, color: '#475569', fontWeight: 800 }}>{msg.sender === 'user' ? 'YOU' : 'ORCA'} · {msg.time}</div>
                            <div style={{ fontSize: 12, color, marginTop: 3, wordBreak: 'break-word' }}>{msg.text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="text"
                      value={inputMsg}
                      onChange={e => setInputMsg(e.target.value)}
                      placeholder={isTyping ? "ORCA is processing..." : "Ask ORCA anything about the group operations..."}
                      disabled={isTyping}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid rgba(212,160,23,0.3)',
                        borderRadius: 12,
                        padding: '12px 16px',
                        fontSize: 12,
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isTyping || !inputMsg.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #d4a017, #f5c842)',
                        border: 'none',
                        borderRadius: 12,
                        padding: '0 24px',
                        color: '#020617',
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: 'pointer',
                        opacity: (isTyping || !inputMsg.trim()) ? 0.5 : 1
                      }}
                    >
                      Send
                    </button>
                  </form>
                </div>

                {/* Audit Stream Column */}
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <span style={{ fontSize: 10, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Audit Stream</span>
                  <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '12px 14px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'monospace' }}>
                    {orcaLogs.map((log, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.03)', lineHeight: 1.4, fontSize: 10, color: i === 0 ? '#fff' : '#64748b' }}>
                        <span style={{ color: '#d4a017' }}>›</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── TAB CONTENT 5: AI SCENARIO PLANNER ───────────────────────────────── */}
          {activeSidebarTab === 'scenarios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Hero Header */}
              <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(212,160,23,0.08) 100%)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 20, marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    <FlaskConical size={12} />
                    ORCA Powered
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Advanced AI Scenario Planning</h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0', lineHeight: 1.5 }}>Expand ORCA's capabilities to run complex 'what-if' scenarios for financial and operational planning, allowing executives to explore potential outcomes of strategic decisions with greater depth.</p>
                </div>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(212,160,23,0.15))', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 24 }}>
                  <FlaskConical size={36} color="#a78bfa" />
                </div>
              </div>

              {/* Scenario Builder + Results Side by Side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                
                {/* Scenario Input Builder */}
                <div style={{ background: '#0e121e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <GitBranch size={16} color="#a78bfa" />
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Configure Scenario</h3>
                  </div>

                  {/* Subsidiary Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Target Subsidiary</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[{ id: 'hogl', label: 'HOGL Energy', color: '#f97316' }, { id: 'ikeja', label: 'Ikeja Hotel', color: '#a78bfa' }, { id: 'flour', label: 'Flour Mills', color: '#eab308' }, { id: 'realestate', label: 'Real Estate', color: '#34d399' }].map(sub => (
                        <button key={sub.id} onClick={() => setScenarioInputs(p => ({ ...p, subsidiary: sub.id }))} style={{ background: scenarioInputs.subsidiary === sub.id ? `${sub.color}15` : 'rgba(255,255,255,0.02)', border: scenarioInputs.subsidiary === sub.id ? `1px solid ${sub.color}50` : '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', color: scenarioInputs.subsidiary === sub.id ? sub.color : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>{sub.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Metric Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>What-If Metric</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['revenue', 'headcount', 'capex', 'margin'].map(m => (
                        <button key={m} onClick={() => setScenarioInputs(p => ({ ...p, metric: m }))} style={{ background: scenarioInputs.metric === m ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.02)', border: scenarioInputs.metric === m ? '1px solid rgba(212,160,23,0.4)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 14px', color: scenarioInputs.metric === m ? '#d4a017' : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize' }}>{m}</button>
                      ))}
                    </div>
                  </div>

                  {/* Change Magnitude */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Change Magnitude</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['+5', '+10', '+15', '+25', '-10', '-20'].map(c => (
                        <button key={c} onClick={() => setScenarioInputs(p => ({ ...p, change: c }))} style={{ background: scenarioInputs.change === c ? (c.startsWith('-') ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)') : 'rgba(255,255,255,0.02)', border: scenarioInputs.change === c ? (c.startsWith('-') ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(52,211,153,0.35)') : '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', color: scenarioInputs.change === c ? (c.startsWith('-') ? '#f87171' : '#34d399') : '#64748b', fontSize: 11, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}>{c}%</button>
                      ))}
                    </div>
                  </div>

                  {/* Time Horizon */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Planning Horizon</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['3 months', '6 months', '1 year', '3 years'].map(h => (
                        <button key={h} onClick={() => setScenarioInputs(p => ({ ...p, horizon: h }))} style={{ background: scenarioInputs.horizon === h ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.02)', border: scenarioInputs.horizon === h ? '1px solid rgba(96,165,250,0.35)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', color: scenarioInputs.horizon === h ? '#60a5fa' : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>{h}</button>
                      ))}
                    </div>
                  </div>

                  {/* Run Button */}
                  <button
                    disabled={scenarioRunning}
                    onClick={async () => {
                      setScenarioRunning(true);
                      setScenarioResult(null);
                      await new Promise(r => setTimeout(r, 1800));
                      const subName = { hogl: 'HOGL Energy', ikeja: 'Ikeja Hotel Plc', flour: 'Honeywell Flour Mills', realestate: 'Honeywell Real Estate' }[scenarioInputs.subsidiary] || 'HOGL Energy';
                      const isPositive = scenarioInputs.change.startsWith('+');
                      const pct = parseInt(scenarioInputs.change);
                      setScenarioResult({
                        headline: `${scenarioInputs.change}% ${scenarioInputs.metric} shift in ${subName} over ${scenarioInputs.horizon}`,
                        summary: `Based on ${subName}'s current ${scenarioInputs.metric} baseline and market dynamics, a ${scenarioInputs.change}% adjustment over ${scenarioInputs.horizon} is projected to have the following group-wide impact. ORCA recommends ${isPositive ? 'proceeding with phased implementation and monitoring key risk indicators' : 'reviewing cost mitigation strategies and exploring alternative revenue streams'}.`,
                        impacts: [
                          { label: 'Group Portfolio Impact', value: isPositive ? `+₦${Math.abs(pct * 1.3).toFixed(1)}B` : `-₦${Math.abs(pct * 1.3).toFixed(1)}B`, color: isPositive ? '#34d399' : '#f87171' },
                          { label: 'Headcount Effect', value: isPositive ? `+${Math.abs(pct * 4)} roles` : `-${Math.abs(pct * 4)} roles`, color: isPositive ? '#60a5fa' : '#f87171' },
                          { label: 'Tax Liability Delta', value: isPositive ? `+₦${(Math.abs(pct) * 0.28).toFixed(2)}B` : `-₦${(Math.abs(pct) * 0.28).toFixed(2)}B`, color: '#f59e0b' },
                          { label: 'Group IRR Shift', value: isPositive ? `+${(Math.abs(pct) * 0.3).toFixed(1)}%` : `-${(Math.abs(pct) * 0.3).toFixed(1)}%`, color: isPositive ? '#34d399' : '#f87171' },
                        ]
                      });
                      setScenarioRunning(false);
                    }}
                    style={{ background: scenarioRunning ? 'rgba(139,92,246,0.15)' : 'linear-gradient(135deg, #7c3aed, #a78bfa)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontSize: 13, fontWeight: 900, cursor: scenarioRunning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s', letterSpacing: '0.05em' }}
                  >
                    <Activity size={16} />
                    {scenarioRunning ? 'ORCA is computing scenario...' : 'RUN AI SCENARIO ANALYSIS'}
                  </button>
                </div>

                {/* Scenario Results Panel */}
                <div style={{ background: '#0e121e', border: scenarioResult ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.3s' }}>
                  {scenarioRunning && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 300 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #a78bfa', animation: 'spin 1s linear infinite' }} />
                      <p style={{ color: '#a78bfa', fontSize: 13, fontWeight: 700 }}>ORCA is computing scenario outcomes...</p>
                      <p style={{ color: '#64748b', fontSize: 11 }}>Analysing group financials, market conditions, and risk vectors</p>
                    </div>
                  )}
                  {!scenarioRunning && !scenarioResult && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 300 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FlaskConical size={28} color="#a78bfa" /></div>
                      <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, textAlign: 'center', maxWidth: 240 }}>Configure a scenario and click Run to see ORCA's projected outcomes.</p>
                    </div>
                  )}
                  {!scenarioRunning && scenarioResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'slideDown 0.4s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={16} color="#a78bfa" />
                        <h3 style={{ fontSize: 12, fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scenario Results</h3>
                      </div>
                      <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', margin: 0 }}>{scenarioResult.headline}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {scenarioResult.impacts.map((impact, i) => (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '14px 16px' }}>
                            <p style={{ fontSize: 9, color: '#64748b', margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{impact.label}</p>
                            <p style={{ fontSize: 20, fontWeight: 900, color: impact.color, margin: '6px 0 0', letterSpacing: '-0.5px' }}>{impact.value}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '14px 16px', borderLeft: '3px solid #a78bfa' }}>
                        <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>ORCA Recommendation</p>
                        <p style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{scenarioResult.summary}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB CONTENT 6: COLLABORATION HUB ─────────────────────────────────── */}
          {activeSidebarTab === 'collab' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Hero Header */}
              <div style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(52,211,153,0.06) 100%)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 20, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 20, marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    <MessageSquare size={12} />
                    Cross-Subsidiary
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>Cross-Departmental Collaboration</h2>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0', lineHeight: 1.5 }}>Introduce a feature that allows for direct communication and file sharing between departments on specific projects or tasks, fostering better teamwork and reducing information silos.</p>
                </div>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(52,211,153,0.12))', border: '1px solid rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 24 }}>
                  <MessageSquare size={36} color="#60a5fa" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>

                {/* Channel Sidebar */}
                <div style={{ background: '#0e121e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ fontSize: 10, color: '#475569', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Channels</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 8 }}>
                    {[
                      { id: 'general', label: 'Group-Wide', desc: 'All subsidiaries', color: '#d4a017', dot: '#34d399' },
                      { id: 'hogl', label: 'HOGL Energy', desc: 'Energy & Logistics', color: '#f97316', dot: '#34d399' },
                      { id: 'ikeja', label: 'Ikeja Hotel', desc: 'Hospitality', color: '#a78bfa', dot: '#34d399' },
                      { id: 'realestate', label: 'Real Estate', desc: 'Infrastructure', color: '#34d399', dot: '#64748b' },
                    ].map(ch => (
                      <button key={ch.id} onClick={() => setCollabChannel(ch.id as any)} style={{ background: collabChannel === ch.id ? 'rgba(255,255,255,0.05)' : 'transparent', border: collabChannel === ch.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: 13 }}>#</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: collabChannel === ch.id ? '#fff' : '#94a3b8' }}>{ch.label}</div>
                          <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{ch.desc}</div>
                        </div>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: ch.dot, display: 'inline-block', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>

                  {/* Shared Files Section */}
                  <div style={{ margin: '8px 8px 0', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p style={{ fontSize: 9, color: '#475569', fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Paperclip size={10} color="#475569" /> Pinned Files
                    </p>
                    {[
                      { name: 'Q2_Group_Financials.pdf', size: '2.4 MB' },
                      { name: 'HOGL_TankFarm_Report.xlsx', size: '840 KB' },
                      { name: 'RE_Valuation_2026.pdf', size: '1.1 MB' },
                    ].map((file, i) => (
                      <div key={i} onClick={() => showToast(`Downloading ${file.name}...`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}>
                        <Paperclip size={10} color="#60a5fa" />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 9, color: '#94a3b8', margin: 0, fontWeight: 600, wordBreak: 'break-all' }}>{file.name}</p>
                          <p style={{ fontSize: 8, color: '#475569', margin: 0 }}>{file.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Area */}
                <div style={{ background: '#0e121e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                  {/* Channel Header */}
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Hash size={16} color="#60a5fa" />
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>
                      {{ general: 'Group-Wide', hogl: 'HOGL Energy', ikeja: 'Ikeja Hotel Plc', realestate: 'Real Estate' }[collabChannel]}
                    </h3>
                    <span style={{ marginLeft: 'auto', fontSize: 9, color: '#34d399', fontWeight: 800, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', padding: '2px 8px', borderRadius: 20 }}>4 members online</span>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 300, maxHeight: 400 }}>
                    {collabMessages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, animation: 'slideDown 0.3s ease' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(52,211,153,0.15))', border: '1px solid rgba(96,165,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 900, color: '#60a5fa' }}>
                          {msg.author.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{msg.author}</span>
                            <span style={{ fontSize: 9, color: '#475569', background: 'rgba(255,255,255,0.04)', padding: '1px 8px', borderRadius: 10 }}>{msg.company}</span>
                            <span style={{ fontSize: 9, color: '#475569', marginLeft: 'auto' }}>{msg.time}</span>
                          </div>
                          {msg.type === 'file' ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }} onClick={() => showToast('Opening shared file...')}>
                              <Paperclip size={14} color="#60a5fa" />
                              <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 700 }}>{msg.text}</span>
                            </div>
                          ) : (
                            <p style={{ fontSize: 12, color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <form onSubmit={e => {
                      e.preventDefault();
                      if (!collabInput.trim()) return;
                      const now = new Date();
                      const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                      setCollabMessages(prev => [{ author: 'Group Admin', company: 'Honeywell Group HQ', time, text: collabInput.trim(), type: 'text' }, ...prev]);
                      setCollabInput('');
                    }} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0 12px', gap: 10 }}>
                        <input type="text" value={collabInput} onChange={e => setCollabInput(e.target.value)} placeholder={`Message #{{ general: 'group-wide', hogl: 'hogl-energy', ikeja: 'ikeja-hotel', realestate: 'real-estate' }[collabChannel]}...`} style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 12, padding: '12px 0', outline: 'none' }} />
                        <button type="button" onClick={() => showToast('File sharing: Attach files from subsidiary document stores.')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0, transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='#64748b'}>
                          <Paperclip size={16} />
                        </button>
                      </div>
                      <button type="submit" disabled={!collabInput.trim()} style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', border: 'none', borderRadius: 12, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: collabInput.trim() ? 'pointer' : 'not-allowed', opacity: collabInput.trim() ? 1 : 0.5, transition: 'all 0.2s', flexShrink: 0 }}>
                        <Send size={16} color="#fff" />
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── TAB CONTENT 4: COMPLIANCE LOGS ────────────────────────────────────── */}
          {activeSidebarTab === 'compliance' && (
            <div style={{ background: '#0e121e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={20} color="#34d399" />
                  Consolidated Compliance & Tax Audit Logs
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Real-time corporate compliance checkpoints across all registered holding entities.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { title: 'IFRS-16 Leasing Compliance Audit', desc: 'Real estate lease schedules cross-checked with standard group ledger mapping.', status: 'COMPLIANT', date: 'Yesterday' },
                  { title: 'FIRS Corporate Tax Remittance Prep', desc: 'Tax calculation for FY2025 prepared locally. Consolidated effective tax rate: 28.4%.', status: 'PENDING REMITTANCE', date: '2 days ago' },
                  { title: 'HOGL Downstream Environmental License', desc: 'Permits and local community trust audits for downstream oil & gas distribution renewed successfully.', status: 'COMPLIANT', date: 'July 01, 2026' }
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>{item.title}</h4>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>{item.desc}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        background: item.status === 'COMPLIANT' ? 'rgba(52,211,153,0.15)' : 'rgba(245,158,11,0.15)',
                        border: item.status === 'COMPLIANT' ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(245,158,11,0.3)',
                        color: item.status === 'COMPLIANT' ? '#34d399' : '#f59e0b',
                        fontSize: 9,
                        fontWeight: 900,
                        padding: '4px 10px',
                        borderRadius: 6
                      }}>{item.status}</span>
                      <p style={{ fontSize: 9, color: '#475569', margin: '6px 0 0', fontWeight: 700 }}>{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
