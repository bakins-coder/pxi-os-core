import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Mail,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Sliders,
  RotateCcw,
  Zap,
  ArrowRight,
  FileText
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock Data for CRM leads
interface Lead {
  id: string;
  name: string;
  email: string;
  status: "New" | "Contacted" | "Proposal" | "Won" | "Lost";
  value: number;
  source: string;
}

const initialLeads: Lead[] = [
  { id: "1", name: "Kola Adebayo", email: "kola@adebayogroup.com", status: "Proposal", value: 4500, source: "Web Signup" },
  { id: "2", name: "Chidi Nwachukwu", email: "chidi.n@eduplay.ng", status: "Contacted", value: 2200, source: "School Referral" },
  { id: "3", name: "Fatima Yusuf", email: "fatima.y@wisefoundation.org", status: "Won", value: 12000, source: "Direct Outreach" },
  { id: "4", name: "Tunde Bakare", email: "tbakare@finlit-kids.com", status: "New", value: 1800, source: "Newsletter" }
];

// Mock Data for Products
interface Product {
  id: string;
  name: string;
  category: "Workbook" | "Game" | "Course";
  currentPrice: number;
  stock: number;
  demandFactor: "High" | "Medium" | "Low";
  optimizedPrice?: number;
}

const initialProducts: Product[] = [
  { id: "p1", name: "Ajapsi Math & Money Workbook", category: "Workbook", currentPrice: 15.99, stock: 120, demandFactor: "High" },
  { id: "p2", name: "Coin Counting Board Game", category: "Game", currentPrice: 24.99, stock: 45, demandFactor: "Medium" },
  { id: "p3", name: "WiseUp Teens Budgeting Course", category: "Course", currentPrice: 49.99, stock: 999, demandFactor: "High" },
  { id: "p4", name: "Coloring Financial Storybook", category: "Workbook", currentPrice: 9.99, stock: 210, demandFactor: "Low" },
  { id: "p5", name: "Saves The Day Audio Story", category: "Game", currentPrice: 4.99, stock: 999, demandFactor: "Medium" }
];

// Finance metrics chart data
const chartData = [
  { month: "Jan", revenue: 5400, transactions: 110, activeUsers: 450 },
  { month: "Feb", revenue: 7200, transactions: 140, activeUsers: 590 },
  { month: "Mar", revenue: 9800, transactions: 195, activeUsers: 720 },
  { month: "Apr", revenue: 8900, transactions: 170, activeUsers: 810 },
  { month: "May", revenue: 12400, transactions: 240, activeUsers: 950 },
  { month: "Jun", revenue: 15600, transactions: 310, activeUsers: 1200 }
];

interface InvoiceItem {
  description: string;
  qty: number;
  price: number;
}

interface ParadigmWorkspaceProps {
  onSwitchWorkspace: () => void;
  adminEmail: string;
}

export const ParadigmWorkspace: React.FC<ParadigmWorkspaceProps> = ({ onSwitchWorkspace, adminEmail }) => {
  // Alert/Toast states
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string } | null>(null);
  
  const showToast = (title: string, desc?: string) => {
    setToastMessage({ title, desc });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // UI states
  const [automationPercent, setAutomationPercent] = useState<number>(85);
  const [agentLogs, setAgentLogs] = useState<string[]>([
    "[Kiki] 16:15:02 - Analyzed Kola Adebayo's lead profile. Recommended proposal follow-up.",
    "[Barnaby] 16:13:10 - Checked inventory for Coin Counting Board Game. stock count is optimal.",
    "[Oliver] 16:11:45 - Audited June metrics. Monthly revenue hit all-time high of ₦227,500.",
    "[Kiki] 16:09:20 - Auto-generated email template for Tunde Bakare."
  ]);

  // CRM state
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [newLead, setNewLead] = useState({ name: "", email: "", status: "New" as Lead["status"], value: "" });
  const [selectedLeadId, setSelectedLeadId] = useState<string>("1");
  const [draftedEmail, setDraftedEmail] = useState<string>("");

  // Products state
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Invoice generator state
  const [invoiceMeta, setInvoiceMeta] = useState({
    invoiceNumber: "INV-2026-089",
    clientName: "Data Clinic Ltd",
    clientEmail: "billing@dataclinic.ng",
    clientAddress: "12, Admiralty Way, Lekki Phase 1, Lagos",
    issueDate: "2026-07-01",
    dueDate: "2026-07-15",
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    { description: "MoneeWise WiseUp Custom Workbooks (Bulk)", qty: 100, price: 12.50 },
    { description: "Ajapsi Digital License Subscriptions (1 Year)", qty: 50, price: 8.00 },
    { description: "Onsite Interactive Money Math Workshop Facilitation", qty: 1, price: 400.00 },
  ]);
  const [newItem, setNewItem] = useState<InvoiceItem>({ description: "", qty: 1, price: 0 });

  // Moneewise activities folders expand/collapse states
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    ajapsi: true,
    teens: false,
    wiseup: false
  });

  // Print references
  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  // Dynamic log generator to simulate real-time AI agents
  useEffect(() => {
    const logs = [
      "[Kiki] Outbox queue check: No pending email bounces detected.",
      "[Oliver] Re-calculating regional pricing metrics for West Africa.",
      "[Barnaby] Automatically optimizing CDN cache for game asset storage.",
      "[Kiki] Lead database cleanup complete: 0 duplicate entries removed.",
      "[Oliver] Payment gateway ping: Success. Gateway response latency 120ms.",
      "[Barnaby] Generating printable PDF backups for worksheets."
    ];

    const interval = setInterval(() => {
      const randomLog = logs[Math.floor(Math.random() * logs.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      setAgentLogs(prev => [`[AI Manager] ${timeStr} - ${randomLog.substring(9)}`, ...prev.slice(0, 19)]);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const addAgentLog = (msg: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    setAgentLogs(prev => [`[Manual Override] ${timeStr} - ${msg}`, ...prev.slice(0, 19)]);
  };

  // Slider change handler
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setAutomationPercent(value);
    addAgentLog(`Automation threshold adjusted to ${value}%. Re-calibrating agent response priorities...`);
    showToast(`Automation set to ${value}%`, `Oliver the Owl is re-allocating background compute power.`);
  };

  // Add a CRM lead
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.email) {
      showToast("Validation Error", "Name and Email are required.");
      return;
    }
    const leadVal = parseFloat(newLead.value) || 0;
    const addedLead: Lead = {
      id: Date.now().toString(),
      name: newLead.name,
      email: newLead.email,
      status: newLead.status,
      value: leadVal,
      source: "Manual Admin CRM"
    };
    setLeads(prev => [...prev, addedLead]);
    setNewLead({ name: "", email: "", status: "New", value: "" });
    addAgentLog(`Kiki added new CRM contact: ${addedLead.name} (${addedLead.email})`);
    showToast("Lead Added", `${addedLead.name} has been added to the CRM list.`);
  };

  // Generate Follow-up email template
  const generateFollowUpEmail = () => {
    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead) return;

    let body = `Dear ${lead.name},\n\n`;
    if (lead.status === "New") {
      body += `Thanks for connecting with Ajapasworld! We noticed you recently joined us via ${lead.source}. We would love to introduce you to our premium MoneeWise financial literacy curriculum.\n\nAre you available for a brief 10-minute demo call this week?`;
    } else if (lead.status === "Proposal") {
      body += `I hope you are having a wonderful week. I'm following up on the proposal we sent over for the bulk license order (valued at $${lead.value}).\n\nWe are excited to partner with you to bring these gamified workbooks to your students. Let me know if you have any questions about the Lotus Bank account details or package setup!`;
    } else if (lead.status === "Contacted") {
      body += `It was great speaking with you recently about MoneeWise. Based on our conversation, I recommend our WiseUp financial course for teens and young adults.\n\nI've attached our catalog. Let me know if you would like to schedule a trial session.`;
    } else {
      body += `Thank you for being a valued partner with Ajapasworld! We appreciate your support and would love to hear how the kids are enjoying the Coin Counting game. Let us know if we can assist you with additional worksheets!`;
    }
    body += `\n\nBest regards,\nYanribo\nCRM Manager, Ajapasworld`;

    setDraftedEmail(body);
    addAgentLog(`Yanribo compiled follow-up script for ${lead.name}.`);
    showToast("Follow-up Drafted", `AI follow-up script prepared for ${lead.name}.`);
  };

  // Add Item to Invoice Form
  const handleAddInvoiceItem = () => {
    if (!newItem.description || newItem.price <= 0) {
      showToast("Validation Error", "Item description and valid price are required.");
      return;
    }
    setInvoiceItems(prev => [...prev, newItem]);
    setNewItem({ description: "", qty: 1, price: 0 });
    addAgentLog(`Ajapa added item to invoice: "${newItem.description}"`);
  };

  // Remove Invoice Item
  const handleRemoveInvoiceItem = (index: number) => {
    const removedItem = invoiceItems[index];
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
    addAgentLog(`Ajapa removed item from invoice: "${removedItem.description}"`);
  };

  // Calculate Invoice Math
  const invoiceSubtotal = invoiceItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const invoiceTax = invoiceSubtotal * 0.055; // 5.5% VAT or TAX
  const invoiceTotal = invoiceSubtotal + invoiceTax;

  // Toggle folder expansion
  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  // AI Price optimization formula
  const applyPriceOptimization = (prodId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === prodId) {
        let recommendationMultiplier = 1.0;
        if (p.demandFactor === "High") recommendationMultiplier = 1.15; // 15% increase
        if (p.demandFactor === "Low") recommendationMultiplier = 0.85; // 15% decrease (discount)
        if (p.demandFactor === "Medium") recommendationMultiplier = 1.05; // 5% adjustment
        
        const optimized = parseFloat((p.currentPrice * recommendationMultiplier).toFixed(2));
        addAgentLog(`Ajapsi optimized price for ${p.name}: $${p.currentPrice} -> $${optimized}`);
        showToast("Pricing Optimized", `Price adjusted based on ${p.demandFactor} demand factors.`);
        return {
          ...p,
          currentPrice: optimized,
          optimizedPrice: undefined
        };
      }
      return p;
    }));
  };

  // Optimize all prices suggestions display
  const showOptimizationSuggestions = () => {
    setProducts(prev => prev.map(p => {
      let multiplier = 1.0;
      if (p.demandFactor === "High") multiplier = 1.15;
      if (p.demandFactor === "Low") multiplier = 0.85;
      if (p.demandFactor === "Medium") multiplier = 1.05;
      return {
        ...p,
        optimizedPrice: parseFloat((p.currentPrice * multiplier).toFixed(2))
      };
    }));
    addAgentLog("Ajapsi calculated AI pricing optimization suggestions for all catalog items.");
    showToast("Suggestions Calculated", "Click Apply next to each product to confirm.");
  };

  // Print Invoice trigger
  const handlePrintInvoice = () => {
    addAgentLog(`Printed invoice ${invoiceMeta.invoiceNumber} for client ${invoiceMeta.clientName}.`);
    
    // Create print window and render print preview container
    const printContent = invoicePreviewRef.current?.innerHTML;
    
    if (printContent) {
      const windowUrl = 'about:blank';
      const uniqueName = new Date().getTime();
      const printWindow = window.open(windowUrl, uniqueName.toString(), 'left=50,top=50,width=800,height=900');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${invoiceMeta.invoiceNumber}</title>
              <style>
                body {
                  font-family: sans-serif;
                  margin: 20px;
                  color: #1e1b4b;
                  background: #fff;
                }
                .invoice-print-container {
                  padding: 40px;
                  border: 1px solid #e2e8f0;
                  max-width: 800px;
                  margin: 0 auto;
                }
                .top-bar-gradient {
                  height: 12px;
                  background: linear-gradient(90deg, #4c1d95 0%, #f97316 50%, #eab308 100%);
                  margin-bottom: 30px;
                }
                .header-flex {
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 40px;
                }
                .brand-title {
                  font-size: 28px;
                  font-weight: 700;
                  color: #4c1d95;
                  letter-spacing: -0.5px;
                  margin: 0;
                }
                .brand-subtitle {
                  font-size: 12px;
                  color: #f97316;
                  text-transform: uppercase;
                  font-weight: 600;
                  letter-spacing: 1px;
                  margin-top: 4px;
                }
                .invoice-tag {
                  font-size: 32px;
                  font-weight: 800;
                  color: #4c1d95;
                  text-align: right;
                  margin: 0;
                }
                .meta-table {
                  margin-top: 10px;
                  font-size: 13px;
                  border-collapse: collapse;
                }
                .meta-table td {
                  padding: 4px 8px;
                }
                .meta-label {
                  font-weight: 600;
                  color: #64748b;
                }
                .billing-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 40px;
                  margin-bottom: 40px;
                  background: #f8fafc;
                  padding: 20px;
                  border-radius: 8px;
                  border-left: 4px solid #f97316;
                }
                .bill-section h3 {
                  font-size: 14px;
                  text-transform: uppercase;
                  color: #4c1d95;
                  margin-bottom: 10px;
                  margin-top: 0;
                  letter-spacing: 0.5px;
                }
                .bill-section p {
                  margin: 3px 0;
                  font-size: 13px;
                  color: #334155;
                }
                .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 30px;
                }
                .items-table th {
                  background: #4c1d95;
                  color: white;
                  font-size: 13px;
                  text-transform: uppercase;
                  text-align: left;
                  padding: 12px;
                }
                .items-table td {
                  padding: 12px;
                  border-bottom: 1px solid #e2e8f0;
                  font-size: 13px;
                  color: #334155;
                }
                .text-right {
                  text-align: right !important;
                }
                .totals-flex {
                  display: flex;
                  justify-content: flex-end;
                  margin-bottom: 40px;
                }
                .totals-box {
                  width: 300px;
                }
                .total-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 8px 0;
                  font-size: 13px;
                  border-bottom: 1px solid #e2e8f0;
                }
                .grand-total-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 12px 0;
                  font-size: 16px;
                  font-weight: 700;
                  color: #4c1d95;
                  border-top: 2px solid #f97316;
                  border-bottom: 2px solid #f97316;
                }
                .bank-card {
                  background: linear-gradient(135deg, #1e1b4b 0%, #311062 100%);
                  color: white;
                  padding: 24px;
                  border-radius: 12px;
                  margin-bottom: 30px;
                  border-bottom: 6px solid #eab308;
                  position: relative;
                }
                .bank-card h4 {
                  margin: 0 0 15px 0;
                  color: #eab308;
                  font-size: 14px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                .bank-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 15px;
                  font-size: 13px;
                }
                .bank-item-lbl {
                  color: #94a3b8;
                  font-size: 11px;
                  text-transform: uppercase;
                }
                .bank-item-val {
                  font-weight: 600;
                  margin-top: 2px;
                }
                .footer {
                  text-align: center;
                  font-size: 12px;
                  color: #64748b;
                  margin-top: 50px;
                  border-top: 1px solid #e2e8f0;
                  padding-top: 20px;
                }
              </style>
            </head>
            <body>
              <div class="invoice-print-container">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white relative">
      
      {/* Toast Alert Popups */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 border-2 border-purple-500 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 max-w-sm">
          <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400 animate-pulse" />
            {toastMessage.title}
          </h4>
          {toastMessage.desc && <p className="text-xs text-slate-400 mt-1 font-medium">{toastMessage.desc}</p>}
        </div>
      )}

      {/* Neon glowing backdrop elements */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-orange-950/15 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="flex-grow container mx-auto px-4 py-8 relative z-10">
        
        {/* Workspace Switcher / Back Banner */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping"></span>
            <p className="text-xs font-mono uppercase text-slate-400">
              Workspace Mode: <span className="text-orange-400 font-bold">Ajapasworld</span>
            </p>
          </div>
          <button 
            onClick={onSwitchWorkspace}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg"
          >
            Switch to Xquisite Celebrations <ArrowRight size={14} className="text-emerald-400" />
          </button>
        </div>

        {/* Workspace Banner / Header */}
        <div className="relative mb-8 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/80 shadow-[0_0_25px_rgba(139,92,246,0.15)]">
          <div className="h-44 md:h-64 relative w-full overflow-hidden">
            <img 
              src="/assets/ajapa_family.jpg" 
              alt="Ajapa Family Banner" 
              className="w-full h-full object-cover object-center filter saturate-125 brightness-75 hover:scale-105 transition-all duration-700 ease-out" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
            <div className="absolute bottom-6 left-6 md:left-8">
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-mono text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold shadow-lg shadow-orange-500/20">
                Live Paradigm Admin Session
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-2 font-sans tracking-tight drop-shadow-md">
                Ajapasworld <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-orange-400 to-amber-300 font-display">Workspace</span>
              </h1>
              <p className="text-slate-300 text-sm md:text-base mt-2 max-w-xl">
                Interactive control console for customer relations, live educational product catalog, and invoice processing.
              </p>
            </div>
          </div>
          
          {/* Top Level Real-time Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-t border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
                <Users className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono">CRM LEADS</p>
                <p className="text-xl font-bold font-mono text-purple-300">{leads.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400 border border-orange-500/20">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono">ACTIVE PRODUCTS</p>
                <p className="text-xl font-bold font-mono text-orange-300">{products.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono">JUNE REVENUE</p>
                <p className="text-xl font-bold font-mono text-amber-300">₦227,500</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/10 rounded-lg text-teal-400 border border-teal-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-mono">AI AUTOMATION</p>
                <p className="text-xl font-bold font-mono text-teal-300">{automationPercent}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Staff Grid & Automation Controller */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Control Room / Agent Logs */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="p-6 border-b border-slate-800 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Sliders className="h-5 w-5 text-purple-400" />
                    AI Agent Operations Control
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Kiki, Barnaby, and Oliver orchestrating tasks autonomously.
                  </p>
                </div>
                <div className="flex items-center gap-3 min-w-[200px]">
                  <label htmlFor="automation-slider" className="text-xs text-slate-400 font-mono shrink-0">
                    AUTOPILOT: <span className="text-emerald-400 font-bold">{automationPercent}%</span>
                  </label>
                  <input 
                    type="range"
                    id="automation-slider"
                    min={80} 
                    max={90} 
                    step={1}
                    value={automationPercent} 
                    onChange={handleSliderChange} 
                    className="w-28 md:w-36 accent-purple-500 bg-slate-800 rounded-lg appearance-none cursor-pointer h-2 py-2"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 pt-6">
              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                
                {/* Agent Kiki */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 hover:border-purple-500/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/40">
                        Ki
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Kiki Kangaroo</h4>
                        <p className="text-[10px] text-slate-400 font-mono">CRM Agent</p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shadow-[0_0_10px_#10b981]" />
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    Actively crawling leads, drafting follow-ups, and auto-assigning lead status.
                  </p>
                </div>

                {/* Agent Barnaby */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 hover:border-orange-500/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold border border-orange-500/40">
                        Ba
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Barnaby Beaver</h4>
                        <p className="text-[10px] text-slate-400 font-mono">Products Catalog</p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    Auditing product catalogs, comparing offline worksheet downloads, adjusting CDN.
                  </p>
                </div>

                {/* Agent Oliver */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold border border-amber-500/40">
                        Ol
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Oliver Owl</h4>
                        <p className="text-[10px] text-slate-400 font-mono">Financial Auditor</p>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    Running live database compliance check, calculating VAT audits, auditing bank transfers.
                  </p>
                </div>
              </div>

              {/* Operations Logs Console */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Live Activity Stream</p>
                  <button 
                    className="p-1 hover:bg-white/10 rounded transition-colors text-slate-500 hover:text-slate-300"
                    onClick={() => {
                      setAgentLogs([]);
                      showToast("Console Cleared");
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950 font-mono text-xs">
                  {agentLogs.length === 0 ? (
                    <p className="text-slate-600 italic">No logs available. Operations running smoothly.</p>
                  ) : (
                    agentLogs.map((log, idx) => {
                      let color = "text-slate-400";
                      if (log.includes("[Kiki]")) color = "text-purple-300";
                      if (log.includes("[Barnaby]")) color = "text-orange-300";
                      if (log.includes("[Oliver]")) color = "text-amber-300";
                      if (log.includes("[Manual Override]")) color = "text-red-400";
                      
                      return (
                        <div key={idx} className="flex gap-2 leading-relaxed border-b border-slate-900 pb-1 last:border-0">
                          <span className="text-emerald-500 font-bold shrink-0">&gt;</span>
                          <span className={color}>{log}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts / Info Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between p-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-white mb-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Workspace Quick Guide
              </h3>
              <p className="text-slate-400 text-xs mb-6">
                Your credentials & shortcuts.
              </p>
              
              <div className="space-y-4 text-sm text-slate-300">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <p className="text-xs text-slate-400 font-mono uppercase">User Level Override</p>
                  <p className="font-semibold text-orange-400 mt-1">{adminEmail}</p>
                  <p className="text-xs text-slate-500 mt-1">Automatically mapped to [admin] bypass.</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <p className="text-xs text-slate-400 font-mono uppercase">Lotus Bank Seeded Account</p>
                  <p className="font-semibold text-purple-300 mt-1">Data Clinic</p>
                  <p className="text-xs font-mono text-slate-200 mt-0.5">Account: 1010386319</p>
                  <p className="text-[11px] text-amber-500">Auto-injecting to client receipts.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => {
                  addAgentLog("Triggered system backup to Cloud bucket.");
                  showToast("Backup Initiated", "Database backups saved successfully.");
                }} 
                className="w-full text-xs border border-slate-700 bg-transparent hover:bg-slate-800 text-white rounded-xl py-3 font-semibold transition-all"
              >
                Backup DB
              </button>
              <button 
                onClick={showOptimizationSuggestions}
                className="w-full text-xs bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-3 font-semibold transition-all"
              >
                Optimize Prices
              </button>
            </div>
          </div>
        </div>

        {/* Tabs for CRM, Products, Finance */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* CRM MODULE */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl" id="crm-module">
            <div className="bg-gradient-to-r from-red-950/50 to-slate-900 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-600/30 text-red-400 font-mono text-[10px] rounded uppercase font-bold border border-red-500/20">
                    Lead Management
                  </span>
                  <span className="text-xs text-slate-400 font-medium">CRM module managed by Yanribo (Red wrap turban)</span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                  <Users className="h-6 w-6 text-red-500" />
                  MoneeWise CRM Desk
                </h2>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Leads Listing */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">Active Sales Leads</h3>
                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-xs uppercase">
                        <th className="p-4">Contact</th>
                        <th className="p-4">Channel</th>
                        <th className="p-4">Deal Status</th>
                        <th className="p-4 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                      {leads.map((lead) => {
                        let statusColor = "bg-blue-500/20 text-blue-400 border-blue-500/30";
                        if (lead.status === "New") statusColor = "bg-sky-500/20 text-sky-400 border-sky-500/30";
                        if (lead.status === "Won") statusColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                        if (lead.status === "Proposal") statusColor = "bg-purple-500/20 text-purple-400 border-purple-500/30";
                        if (lead.status === "Contacted") statusColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                        
                        return (
                          <tr 
                            key={lead.id} 
                            onClick={() => setSelectedLeadId(lead.id)}
                            className={`hover:bg-slate-900/60 cursor-pointer transition-colors duration-200 ${selectedLeadId === lead.id ? 'bg-slate-900/80 border-l-2 border-red-500' : ''}`}
                          >
                            <td className="p-4">
                              <div className="font-semibold text-white">{lead.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{lead.email}</div>
                            </td>
                            <td className="p-4 font-mono text-xs text-slate-400">{lead.source}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColor}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono font-semibold text-white">
                              ${lead.value.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Email Script Generator */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-md p-6 mt-6">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Mail className="h-4 w-4 text-red-400" />
                      Yanribo's AI Follow-Up Script Draft
                    </h3>
                    <p className="text-slate-400 text-xs">
                      Auto-generate a script for the selected lead above.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="text-sm text-slate-300">
                        Selected: <span className="font-bold text-white">{leads.find(l => l.id === selectedLeadId)?.name || "None"}</span>
                      </div>
                      <button onClick={generateFollowUpEmail} className="bg-red-700 hover:bg-red-600 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all ml-auto">
                        Draft Script
                      </button>
                    </div>
                    {draftedEmail && (
                      <div className="relative">
                        <textarea 
                          value={draftedEmail} 
                          onChange={(e) => setDraftedEmail(e.target.value)}
                          className="w-full font-mono text-xs bg-slate-900 border border-slate-800 text-slate-200 h-44 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500" 
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(draftedEmail);
                            showToast("Copied", "Draft copied to clipboard.");
                          }} 
                          className="absolute top-2 right-2 text-xs bg-slate-800 hover:bg-slate-700 text-white py-1 px-3 rounded-lg font-bold"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lead Creator Form */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl shadow-md p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Plus className="h-5 w-5 text-red-500" />
                    Create New Lead
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Manually inject contact into the CRM database.
                  </p>
                </div>
                <div>
                  <form onSubmit={handleAddLead} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="lead-name" className="text-xs text-slate-400 font-medium">Full Name</label>
                      <input 
                        id="lead-name" 
                        placeholder="John Doe" 
                        value={newLead.name} 
                        onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full h-10 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="lead-email" className="text-xs text-slate-400 font-medium">Email Address</label>
                      <input 
                        id="lead-email" 
                        type="email"
                        placeholder="john@example.com" 
                        value={newLead.email} 
                        onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full h-10 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="lead-value" className="text-xs text-slate-400 font-medium">Est. Deal Value ($)</label>
                        <input 
                          id="lead-value" 
                          type="number"
                          placeholder="2500" 
                          value={newLead.value} 
                          onChange={(e) => setNewLead(prev => ({ ...prev, value: e.target.value }))}
                          className="w-full h-10 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="lead-status" className="text-xs text-slate-400 font-medium">Status</label>
                        <select 
                          value={newLead.status} 
                          onChange={(e) => setNewLead(prev => ({ ...prev, status: e.target.value as Lead["status"] }))}
                          className="w-full h-10 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Proposal">Proposal</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all mt-2 text-xs">
                      Add to CRM
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCTS MODULE */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl" id="products-module">
            <div className="bg-gradient-to-r from-orange-950/40 to-slate-900 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-orange-600/30 text-orange-400 font-mono text-[10px] rounded uppercase font-bold border border-orange-500/20">
                    Catalog & Operations
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Products managed by Ajapsi (Red beret)</span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                  <Package className="h-6 w-6 text-orange-500" />
                  MoneeWise Product Registry
                </h2>
              </div>
              <button 
                onClick={showOptimizationSuggestions} 
                className="bg-orange-600 hover:bg-orange-500 text-white text-xs gap-2 font-bold px-4 py-2 rounded-xl transition-all flex items-center shadow-lg"
              >
                <Sparkles className="h-4 w-4 animate-pulse" /> Compute AI Price Suggestions
              </button>
            </div>
            
            <div className="p-6">
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-xs uppercase">
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Current Price</th>
                      <th className="p-4">Demand Index</th>
                      <th className="p-4">AI Optimal Price</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                    {products.map((product) => {
                      let demandBadge = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                      if (product.demandFactor === "High") demandBadge = "bg-red-500/10 text-red-400 border-red-500/20";
                      if (product.demandFactor === "Low") demandBadge = "bg-slate-500/10 text-slate-400 border-slate-500/20";

                      return (
                        <tr key={product.id} className="hover:bg-slate-900/40 transition-colors duration-200">
                          <td className="p-4 font-semibold text-white">{product.name}</td>
                          <td className="p-4 font-mono text-xs">{product.category}</td>
                          <td className="p-4 font-mono font-bold text-white">${product.currentPrice}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-xs rounded border uppercase font-mono ${demandBadge}`}>
                              {product.demandFactor}
                            </span>
                          </td>
                          <td className="p-4">
                            {product.optimizedPrice ? (
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="font-bold text-emerald-400">${product.optimizedPrice}</span>
                                <span className={`text-[10px] uppercase px-1 rounded ${product.optimizedPrice > product.currentPrice ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {product.optimizedPrice > product.currentPrice ? '+$' + (product.optimizedPrice - product.currentPrice).toFixed(2) : '-$' + (product.currentPrice - product.optimizedPrice).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-xs font-mono">Compute needed</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              disabled={!product.optimizedPrice} 
                              onClick={() => applyPriceOptimization(product.id)}
                              className={`text-xs font-bold py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-all ${!product.optimizedPrice ? 'opacity-40 cursor-not-allowed bg-slate-800' : ''}`}
                            >
                              Apply
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FINANCE MODULE & CUSTOM INVOICE GENERATOR */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl" id="finance-module">
            <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 p-6 border-b border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-600/30 text-purple-400 font-mono text-[10px] rounded uppercase font-bold border border-purple-500/20">
                      Accounting Desk
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Finance & Invoicing managed by Ajapa (Graduation cap)</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-purple-500" />
                    MoneeWise Finance Desk & Invoice Generator
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* Chart & Invoice Creator */}
              <div className="space-y-8">
                {/* Recharts Chart */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl shadow-md p-6">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                      Revenue and Engagement Metrics (H1 2026)
                    </h3>
                    <p className="text-slate-400 text-xs">
                      Auto-synced dashboard of incoming transactions and subscriber statistics.
                    </p>
                  </div>
                  <div className="h-[250px] pr-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} fontStyle="italic" />
                        <YAxis stroke="#94a3b8" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", color: "#f8fafc" }} />
                        <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="activeUsers" name="Active Users" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Invoice Customizer Form */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl shadow-md p-6">
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-400" />
                      Invoice Data Sheet
                    </h3>
                    <p className="text-slate-400 text-xs">
                      Customize billing details, payment details pre-seeded with Lotus Bank.
                    </p>
                  </div>
                  <div className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="inv-num" className="text-xs text-slate-400 font-medium">Invoice Number</label>
                        <input 
                          id="inv-num" 
                          value={invoiceMeta.invoiceNumber} 
                          onChange={(e) => setInvoiceMeta(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                          className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="client-name" className="text-xs text-slate-400 font-medium">Client Name</label>
                        <input 
                          id="client-name" 
                          value={invoiceMeta.clientName} 
                          onChange={(e) => setInvoiceMeta(prev => ({ ...prev, clientName: e.target.value }))}
                          className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="client-email" className="text-xs text-slate-400 font-medium">Client Email</label>
                        <input 
                          id="client-email" 
                          value={invoiceMeta.clientEmail} 
                          onChange={(e) => setInvoiceMeta(prev => ({ ...prev, clientEmail: e.target.value }))}
                          className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="client-address" className="text-xs text-slate-400 font-medium">Client Address</label>
                        <input 
                          id="client-address" 
                          value={invoiceMeta.clientAddress} 
                          onChange={(e) => setInvoiceMeta(prev => ({ ...prev, clientAddress: e.target.value }))}
                          className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="issue-date" className="text-xs text-slate-400 font-medium">Issue Date</label>
                        <input 
                          id="issue-date" 
                          type="date"
                          value={invoiceMeta.issueDate} 
                          onChange={(e) => setInvoiceMeta(prev => ({ ...prev, issueDate: e.target.value }))}
                          className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="due-date" className="text-xs text-slate-400 font-medium">Due Date</label>
                        <input 
                          id="due-date" 
                          type="date"
                          value={invoiceMeta.dueDate} 
                          onChange={(e) => setInvoiceMeta(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full h-9 px-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" 
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Add Billable Item</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="md:col-span-2 space-y-1">
                          <label htmlFor="item-desc" className="text-[10px] text-slate-500 font-medium">Description</label>
                          <input 
                            id="item-desc" 
                            placeholder="Workbook Licenses" 
                            value={newItem.description} 
                            onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full h-8 px-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs focus:outline-none" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="item-qty" className="text-[10px] text-slate-500 font-medium">Qty</label>
                          <input 
                            id="item-qty" 
                            type="number"
                            min="1" 
                            value={newItem.qty} 
                            onChange={(e) => setNewItem(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                            className="w-full h-8 px-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs focus:outline-none" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor="item-price" className="text-[10px] text-slate-500 font-medium">Price ($)</label>
                          <input 
                            id="item-price" 
                            type="number" 
                            step="0.01"
                            value={newItem.price || ""} 
                            onChange={(e) => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            className="w-full h-8 px-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs focus:outline-none" 
                          />
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleAddInvoiceItem} 
                        className="mt-3 w-full bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs h-8 rounded-xl transition-all"
                      >
                        Insert Item Line
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* HIGH-FIDELITY CUSTOM INVOICE PREVIEW */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-200">Invoice Document Preview</h3>
                  <button 
                    onClick={handlePrintInvoice}
                    className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-500 hover:to-orange-500 text-white gap-2 font-bold text-xs h-9 px-4 rounded-xl flex items-center shadow-lg"
                  >
                    <Printer className="h-4 w-4" /> Print / Export Invoice
                  </button>
                </div>
                
                {/* HTML Invoice Template */}
                <div 
                  ref={invoicePreviewRef}
                  className="bg-white text-slate-900 rounded-xl shadow-2xl p-6 font-sans overflow-hidden border border-slate-200"
                  style={{ minHeight: "650px" }}
                >
                  {/* AJAPA's Gold, Orange, Purple gradient header band */}
                  <div className="h-3 bg-gradient-to-r from-purple-800 via-orange-500 to-yellow-500 rounded-t -mx-6 -mt-6 mb-6" />
                  
                  {/* Top Logo and Invoice ID details */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-purple-950 font-serif" style={{ color: '#3b0764' }}>
                        Ajapa's World
                      </h2>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-orange-600" style={{ color: '#ea580c' }}>
                        Empowering Youth Financially
                      </span>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono leading-tight">
                        info@ajapasworld.com | www.ajapasworld.com<br />
                        Lagos, Nigeria
                      </p>
                    </div>
                    <div className="text-right">
                      <h1 className="text-2xl font-black text-purple-900 tracking-tight uppercase" style={{ color: '#581c87' }}>
                        INVOICE
                      </h1>
                      <table className="mt-2 text-[10px] border-collapse ml-auto text-slate-600 font-mono">
                        <tbody>
                          <tr>
                            <td className="py-0.5 px-2 text-slate-400 font-medium">INVOICE NO:</td>
                            <td className="py-0.5 px-2 font-bold text-slate-900">{invoiceMeta.invoiceNumber}</td>
                          </tr>
                          <tr>
                            <td className="py-0.5 px-2 text-slate-400 font-medium">ISSUE DATE:</td>
                            <td className="py-0.5 px-2 text-slate-900">{invoiceMeta.issueDate}</td>
                          </tr>
                          <tr>
                            <td className="py-0.5 px-2 text-slate-400 font-medium">DUE DATE:</td>
                            <td className="py-0.5 px-2 text-slate-900">{invoiceMeta.dueDate}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Billing Details layout */}
                  <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-lg border-l-4 border-orange-500" style={{ borderLeftColor: '#f97316' }}>
                    <div>
                      <h3 className="text-[11px] font-bold text-purple-900 uppercase tracking-wide mb-1" style={{ color: '#4c1d95' }}>
                        BILLED TO:
                      </h3>
                      <p className="text-xs font-bold text-slate-800">{invoiceMeta.clientName}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{invoiceMeta.clientEmail}</p>
                      <p className="text-[10px] text-slate-600 leading-snug mt-1 max-w-[200px]">
                        {invoiceMeta.clientAddress}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-[11px] font-bold text-purple-900 uppercase tracking-wide mb-1" style={{ color: '#4c1d95' }}>
                        REMIT PAYMENT TO:
                      </h3>
                      <p className="text-xs font-bold text-slate-800">Ajapasworld Operations</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Finance Department</p>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <table className="w-full text-left text-xs mb-6">
                    <thead>
                      <tr className="bg-purple-900 text-white font-mono uppercase text-[9px]" style={{ backgroundColor: '#4c1d95' }}>
                        <th className="p-2.5 rounded-l">Description</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price ($)</th>
                        <th className="p-2.5 text-right rounded-r">Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-medium text-slate-800">
                            <div className="flex items-center justify-between">
                              <span>{item.description}</span>
                              <button 
                                onClick={() => handleRemoveInvoiceItem(idx)}
                                className="text-red-500 hover:text-red-700 ml-2 no-print shrink-0"
                                title="Delete Line Item"
                              >
                                <Trash2 className="h-3 w-3 inline" />
                              </button>
                            </div>
                          </td>
                          <td className="p-2.5 text-center text-slate-600 font-mono">{item.qty}</td>
                          <td className="p-2.5 text-right text-slate-600 font-mono">${item.price.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900 font-mono">${(item.qty * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Section */}
                  <div className="flex justify-end mb-6">
                    <div className="w-56 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Subtotal:</span>
                        <span className="font-mono text-slate-900">${invoiceSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>VAT (5.5%):</span>
                        <span className="font-mono text-slate-900">${invoiceTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold text-purple-900 text-sm border-t-2 border-orange-500 border-b-2 border-orange-500" style={{ color: '#4c1d95', borderTopColor: '#f97316', borderBottomColor: '#f97316' }}>
                        <span>TOTAL DUE:</span>
                        <span className="font-mono">${invoiceTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pre-seeded Bank Remittance Information Card */}
                  <div 
                    className="p-4 rounded-xl text-white font-sans border-b-4 border-yellow-500 shadow-md relative"
                    style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 100%)', borderBottomColor: '#eab308' }}
                  >
                    <h4 className="text-[10px] font-bold tracking-widest text-yellow-400 uppercase mb-2">
                      BANK REMITTANCE DETAILS (LOTUS BANK)
                    </h4>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px]">
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase block">Account Holder</span>
                        <span className="font-bold text-slate-100">Data Clinic</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase block">Bank Name</span>
                        <span className="font-bold text-slate-100">Lotus Bank</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase block">Account Number</span>
                        <span className="font-bold text-yellow-400 font-mono">1010386319</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase block">Swift Code / Sort Code</span>
                        <span className="font-bold text-slate-100 font-mono">LTSBNG22</span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Footer */}
                  <div className="text-center text-[9px] text-slate-400 mt-8 border-t border-slate-100 pt-3">
                    Thank you for partnering with us to build financial confidence in children.
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          {/* MONEYWISE ACTIVITIES PANEL */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl" id="activities-panel">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Folder className="h-6 w-6 text-yellow-500" />
                MoneeWise Activities & Curriculum Panel
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Direct access folder structure linking to active games, stories, budgeting planners, and courses.
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              
              {/* Ajapsi 3-7 Folder */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                <button 
                  onClick={() => toggleFolder("ajapsi")}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 text-left transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    {expandedFolders.ajapsi ? <FolderOpen className="h-5 w-5 text-amber-400" /> : <Folder className="h-5 w-5 text-amber-500" />}
                    <div>
                      <span className="font-bold text-white text-base">Ajapsi Modules (Ages 3-7)</span>
                      <p className="text-xs text-slate-400">Introductory financial awareness, coin recognition, coloring books</p>
                    </div>
                  </div>
                  {expandedFolders.ajapsi ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                </button>
                
                {expandedFolders.ajapsi && (
                  <div className="p-4 bg-slate-950/60 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <a href="#/ajapsi/games/coin-counting" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎮 Game: Coin Counting</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/ajapsi/games/money-math" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎮 Game: Money Math</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/ajapsi/games/saving-challenge" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎮 Game: Saving Challenge</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/ajapsi/games/word-ladder" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎮 Game: Word Ladder</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/ajapsi/stories/saves-the-day" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📖 Story: Saves The Day</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/ajapsi/stories/magic-coin" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📖 Story: Magic Coin</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/ajapsi/stories/piggy-bank-mystery" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📖 Story: Piggy Bank Mystery</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/ajapsi/activities/coloring" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎨 Activity: Coloring Book</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/ajapsi/journal-editor" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>✍️ Utility: Journal Editor</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                  </div>
                )}
              </div>

              {/* Teens 8-15 Folder */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                <button 
                  onClick={() => toggleFolder("teens")}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 text-left transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    {expandedFolders.teens ? <FolderOpen className="h-5 w-5 text-blue-400" /> : <Folder className="h-5 w-5 text-blue-500" />}
                    <div>
                      <span className="font-bold text-white text-base">Teens Modules (Ages 8-15)</span>
                      <p className="text-xs text-slate-400">Intermediate saving challenges, budgeting sheets, entrepreneurship workshops</p>
                    </div>
                  </div>
                  {expandedFolders.teens ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                </button>
                
                {expandedFolders.teens && (
                  <div className="p-4 bg-slate-950/60 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <a href="#/teens/finance/saving-challenge" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📉 Finance: Saving Challenge</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/teens/finance/budgeting" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📉 Finance: Budget Planner</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/teens/finance/investing" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📉 Finance: Investing Simulation</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/teens/entrepreneurship" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💼 Entrepreneurship Workspace</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/teens/lifehacks/study-tips" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🧠 LifeHacks: Study Hacks</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/teens/lifehacks/time-management" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🧠 LifeHacks: Time Management</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/teens/lifehacks/mental-health" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🧠 LifeHacks: Mental Health Support</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/teens/skills/coding-bootcamp" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🚀 Skills: Coding Bootcamp</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/teens/skills/public-speaking" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🚀 Skills: Public Speaking</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/teens/club/business-competition" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🏆 Club: Young CEO Competition</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                  </div>
                )}
              </div>

              {/* WiseUp 16+ Folder */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                <button 
                  onClick={() => toggleFolder("wiseup")}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 text-left transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    {expandedFolders.wiseup ? <FolderOpen className="h-5 w-5 text-purple-400" /> : <Folder className="h-5 w-5 text-purple-500" />}
                    <div>
                      <span className="font-bold text-white text-base">WiseUp Modules (Ages 16+)</span>
                      <p className="text-xs text-slate-400">Advanced financial planning, tax management strategies, career networking</p>
                    </div>
                  </div>
                  {expandedFolders.wiseup ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                </button>
                
                {expandedFolders.wiseup && (
                  <div className="p-4 bg-slate-950/60 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <a href="#/wiseup/finance/investing-basics" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💰 Finance: Investing Basics</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/wiseup/finance/advanced-savings" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💰 Finance: Wealth Accrual</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/wiseup/finance/financial-planning" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💰 Finance: Portfolio Planning</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/wiseup/finance/tax-strategies" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💰 Finance: Tax Optimization</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/wiseup/career" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💼 Career Pathways</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/wiseup/entrepreneurship" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💼 Business Incubator</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/wiseup/life-skills" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🌱 Life Skills Hub</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#/wiseup/community/building" className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🤝 Community Building</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                  </div>
                )}
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
