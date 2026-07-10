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
  Globe
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

// ─── Companies ────────────────────────────────────────────────────────────────
const companies = [
  {
    id: 'hogl',
    name: 'HOGL Energy Limited',
    sector: 'Energy & Downstream',
    description: 'Downstream oil & gas operations, tank farms, and lubricant blending facilities across key Nigerian locations.',
    icon: Flame,
    iconColor: '#f97316',
    accent: 'from-orange-900/40 to-slate-900/80',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500/20 text-orange-300',
    stats: [
      { label: 'Tank Farms', value: '7 Active' },
      { label: 'Daily Throughput', value: '12,000 MT' },
      { label: 'Staff', value: '438' }
    ]
  },
  {
    id: 'ikeja-hotel',
    name: 'Ikeja Hotel Plc',
    sector: 'Hospitality',
    description: 'Honeywell Group holds 14.12% stake in Ikeja Hotel Plc, one of Nigeria\'s premier hospitality institutions.',
    icon: Hotel,
    iconColor: '#a78bfa',
    accent: 'from-violet-900/40 to-slate-900/80',
    border: 'border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-300',
    stats: [
      { label: 'Stake', value: '14.12%' },
      { label: 'Rooms', value: '229' },
      { label: 'Rating', value: '4-Star' }
    ]
  },
  {
    id: 'flour-mills',
    name: 'Honeywell Flour Mills',
    sector: 'Legacy Portfolio',
    description: 'Legacy portfolio asset — Honeywell Flour Mills, now acquired by Flour Mills of Nigeria Plc in a landmark transaction.',
    icon: Wheat,
    iconColor: '#eab308',
    accent: 'from-yellow-900/40 to-slate-900/80',
    border: 'border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-300',
    stats: [
      { label: 'Status', value: 'Divested' },
      { label: 'Acquirer', value: 'FMN Plc' },
      { label: 'Year', value: '2023' }
    ]
  },
  {
    id: 'real-estate',
    name: 'Honeywell Real Estate',
    sector: 'Real Estate & Infrastructure',
    description: 'Real estate development and infrastructure arm managing premium developments across Lagos and Abuja.',
    icon: Landmark,
    iconColor: '#34d399',
    accent: 'from-emerald-900/40 to-slate-900/80',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300',
    stats: [
      { label: 'Active Projects', value: '9' },
      { label: 'GDV', value: '₦74B' },
      { label: 'Staff', value: '312' }
    ]
  }
];

// ─── Shared Services ──────────────────────────────────────────────────────────
const sharedServices = [
  { id: 'asset', label: 'Asset Management', icon: Layers, color: '#d4a017' },
  { id: 'hr-transfer', label: 'Staff Transfer', icon: ArrowRightLeft, color: '#a78bfa' },
  { id: 'accounting', label: 'Consolidated Accounting & Tax', icon: BookOpen, color: '#34d399' },
  { id: 'crm', label: 'CRM', icon: Users, color: '#f97316' },
  { id: 'hr', label: 'HR (Switchable)', icon: BriefcaseBusiness, color: '#60a5fa' },
  { id: 'investment', label: 'Investment Portfolio', icon: TrendingUp, color: '#fb7185' }
];

// ─── ORCA AI Logs ─────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
export const HoneywellGroupWorkspace: React.FC<HoneywellGroupWorkspaceProps> = ({ adminEmail, staffId }) => {
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [activeOrcaTab, setActiveOrcaTab] = useState<'chat' | 'activity'>('chat');
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

  // Auto-rotate ORCA AI logs every 9s, always active in the background
  useEffect(() => {
    const interval = setInterval(() => {
      const msg = ORCA_MESSAGES[Math.floor(Math.random() * ORCA_MESSAGES.length)];
      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      setOrcaLogs(prev => [`${msg.replace('[ORCA]', `[ORCA] ${time} -`)}`, ...prev.slice(0, 49)]);
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isTyping) return;
    
    const userQuery = inputMsg.trim();
    setInputMsg("");
    
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    
    // Add user message to chat list
    setOrcaChat(prev => [{ sender: 'user', time, text: userQuery }, ...prev]);
    setIsTyping(true);
    
    // Add temporary "Analyzing request..." message from ORCA
    setOrcaChat(prev => [{ sender: 'orca', time, text: 'Analyzing request...' }, ...prev]);
    
    try {
      // Build context of recent messages to keep conversation going
      const recentContext = orcaChat
        .slice(0, 8)
        .reverse()
        .map(msg => `${msg.sender === 'user' ? 'User' : 'ORCA'}: ${msg.text}`)
        .join('\n');
      
      const fullContext = `This is a conversation with ORCA, the Chief AI Agent of Honeywell Group. You have full access to details about Honeywell's subsidiaries: HOGL Energy, Ikeja Hotel Plc, Honeywell Flour Mills, and Honeywell Real Estate. \n\nRecent History:\n${recentContext}`;
      
      const result = await processAgentRequest(userQuery, fullContext, 'text');
      
      // Remove the "Analyzing request..." message and replace with the real response
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
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f1f5f9', fontFamily: "'Inter', 'Segoe UI', sans-serif", position: 'relative', overflowX: 'hidden' }}>

      {/* Ambient glow blobs */}
      <div style={{ position: 'absolute', top: 80, left: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '50%', right: 0, width: 400, height: 400, background: 'radial-gradient(circle, rgba(212,160,23,0.04) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f172a', border: '2px solid #d4a017', borderRadius: 14, padding: '12px 20px', boxShadow: '0 8px 32px rgba(212,160,23,0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={16} color="#d4a017" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{toastMsg}</span>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 10 }}>

        {/* ── HEADER BANNER ──────────────────────────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 20, overflow: 'hidden', marginBottom: 24, boxShadow: '0 0 40px rgba(212,160,23,0.08), 0 20px 60px rgba(0,0,0,0.4)' }}>
          {/* Gold top bar */}
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

            {/* ── STATS ROW ──────────────────────────────────────────────────────── */}
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

        {/* ── MAIN GRID ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>

          {/* ── LEFT: OUR COMPANIES ─────────────────────────────────────────────── */}
          <div>
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <LayoutGrid size={18} color="#d4a017" />
                <h2 style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Our Companies</h2>
                <span style={{ marginLeft: 'auto', background: 'rgba(212,160,23,0.15)', color: '#d4a017', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 20, border: '1px solid rgba(212,160,23,0.3)' }}>4 Entities</span>
              </div>

              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {companies.map(company => (
                  <div key={company.id} id={`company-card-${company.id}`}>
                    {/* Company Card */}
                    <div
                      onClick={() => handleCompanyClick(company.id)}
                      style={{
                        background: expandedCompany === company.id ? 'rgba(212,160,23,0.06)' : 'rgba(255,255,255,0.02)',
                        border: expandedCompany === company.id ? `1px solid ${company.iconColor}40` : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 14,
                        padding: '16px 20px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16
                      }}
                      onMouseOver={e => { if (expandedCompany !== company.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseOut={e => { if (expandedCompany !== company.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${company.iconColor}18`, border: `1px solid ${company.iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <company.icon size={20} color={company.iconColor} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0 }}>{company.name}</h3>
                          <p style={{ fontSize: 11, color: '#64748b', margin: '3px 0 0', fontWeight: 600 }}>{company.sector}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {company.stats.slice(0, 2).map((s, si) => (
                            <div key={si} style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 9, color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                              <p style={{ fontSize: 13, fontWeight: 800, color: company.iconColor, margin: '1px 0 0' }}>{s.value}</p>
                            </div>
                          ))}
                        </div>
                        {expandedCompany === company.id ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />}
                      </div>
                    </div>

                    {/* Expanded Mini Panel */}
                    {expandedCompany === company.id && (
                      <div id={`company-panel-${company.id}`} style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${company.iconColor}20`, borderRadius: 14, marginTop: 6, overflow: 'hidden', animation: 'slideDown 0.2s ease' }}>
                        <p style={{ padding: '14px 20px', fontSize: 12, color: '#94a3b8', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{company.description}</p>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {COMPANY_TABS.map(tab => (
                            <button
                              key={tab}
                              id={`tab-${company.id}-${tab.toLowerCase()}`}
                              onClick={() => setActiveTab(prev => ({ ...prev, [company.id]: tab }))}
                              style={{
                                flex: 1,
                                background: 'none',
                                border: 'none',
                                padding: '10px 0',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: activeTab[company.id] === tab ? company.iconColor : '#475569',
                                borderBottom: activeTab[company.id] === tab ? `2px solid ${company.iconColor}` : '2px solid transparent',
                                transition: 'all 0.2s',
                                letterSpacing: '0.05em'
                              }}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Tab Content Placeholder */}
                        <div style={{ padding: '16px 20px', minHeight: 80 }}>
                          {activeTab[company.id] === 'Assets' && (
                            <div style={{ display: 'flex', gap: 12 }}>
                              {company.stats.map((s, si) => (
                                <div key={si} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <p style={{ fontSize: 9, color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</p>
                                  <p style={{ fontSize: 18, fontWeight: 900, color: company.iconColor, margin: '6px 0 0' }}>{s.value}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeTab[company.id] === 'HR/Staff' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {['Department Heads', 'Open Positions', 'Leave Requests'].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{item}</span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{[12, 4, 7][i]}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeTab[company.id] === 'CRM' && (
                            <div style={{ display: 'flex', gap: 10 }}>
                              {['Active Contracts', 'Pipeline', 'Won Deals'].map((item, i) => (
                                <div key={i} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 8px' }}>
                                  <p style={{ fontSize: 18, fontWeight: 900, color: company.iconColor, margin: 0 }}>{[24, 11, 8][i]}</p>
                                  <p style={{ fontSize: 10, color: '#64748b', margin: '4px 0 0', fontWeight: 700 }}>{item}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeTab[company.id] === 'Financials' && (
                            <div style={{ display: 'flex', gap: 10 }}>
                              {['Q2 Revenue', 'EBITDA', 'Net Profit'].map((item, i) => (
                                <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 14px' }}>
                                  <p style={{ fontSize: 9, color: '#64748b', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>{item}</p>
                                  <p style={{ fontSize: 16, fontWeight: 900, color: '#34d399', margin: '6px 0 0' }}>{['₦18.4B', '₦6.2B', '₦4.1B'][i]}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: ORCA AI + QUICK GUIDE ────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ORCA AI Agent Panel */}
            <div style={{ background: '#0f172a', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 20, overflow: 'hidden', flex: 1, boxShadow: '0 0 30px rgba(212,160,23,0.05)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, rgba(212,160,23,0.08), transparent)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={18} color="#d4a017" />
                </div>
                <div>
                  <h3 style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ORCA</h3>
                  <p style={{ fontSize: 10, color: '#d4a017', margin: 0, fontWeight: 600 }}>Chief AI Agent</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', display: 'inline-block' }} />
                  <span style={{ fontSize: 9, color: '#34d399', fontWeight: 800, letterSpacing: '0.1em' }}>LIVE</span>
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
                    fontWeight: 700,
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
                    fontWeight: 700,
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
                  📊 Live Activity Feed
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
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
                        placeholder={isTyping ? "ORCA is thinking..." : "Ask ORCA (e.g. HOGL energy metrics)..."}
                        disabled={isTyping}
                        style={{
                          flex: 1,
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(212,160,23,0.3)',
                          borderRadius: 10,
                          padding: '8px 12px',
                          fontSize: 11,
                          color: '#fff',
                          outline: 'none',
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
                          opacity: (isTyping || !inputMsg.trim()) ? 0.5 : 1,
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

            {/* Quick Guide Card */}
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Sparkles size={16} color="#d4a017" />
                <h3 style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Quick Guide</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Staff ID', value: staffId, color: '#d4a017' },
                  { label: 'Role', value: 'Group Administrator', color: '#a78bfa' },
                  { label: 'Access', value: 'Full Group Access', color: '#34d399' },
                  { label: 'Email', value: adminEmail, color: '#60a5fa' }
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 9, color: '#475569', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</p>
                    <p style={{ fontSize: 12, fontWeight: 800, color: item.color, margin: '4px 0 0', wordBreak: 'break-all' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW: Shared Services + Investment Portfolio ─────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Shared Services */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Layers size={16} color="#d4a017" />
              <h2 style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Shared Services</h2>
            </div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {sharedServices.map(svc => (
                <div
                  key={svc.id}
                  id={`shared-service-${svc.id}`}
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onClick={() => showToast(`${svc.label} — Module Active`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${svc.color}15`, border: `1px solid ${svc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svc.icon size={16} color={svc.color} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', lineHeight: 1.3 }}>{svc.label}</span>
                  </div>
                  <span style={{ fontSize: 9, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 800, flexShrink: 0, letterSpacing: '0.05em' }}>ACTIVE</span>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Portfolio Chart */}
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={16} color="#d4a017" />
                <h2 style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Investment Portfolio</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={12} color="#34d399" />
                <span style={{ fontSize: 10, color: '#34d399', fontWeight: 800 }}>+33.7% YTD</span>
              </div>
            </div>
            <div style={{ padding: '16px 8px 12px' }}>
              <div style={{ marginBottom: 8, paddingLeft: 16 }}>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>₦127B</p>
                <p style={{ fontSize: 10, color: '#64748b', margin: '3px 0 0', fontWeight: 700 }}>Group Portfolio Value · Jun 2026</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
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
      `}</style>
    </div>
  );
};
