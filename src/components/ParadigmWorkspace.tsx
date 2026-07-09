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
  FileText,
  MessageSquare,
  Send,
  Mic,
  Square,
  Volume2,
  LogOut
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
import { useDataStore } from "../store/useDataStore";
import { useAuthStore } from "../store/useAuthStore";
import { generateAIResponse, textToSpeech, processVoiceCommand } from "../services/ai";
import { decodeBase64, decodeRawPcmToAudioBuffer } from "../services/audioUtils";

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

// Avatar overrides: always use local PNG for the Ajapa tortoise characters
// regardless of what the database or persisted store has stored.
const STAFF_AVATAR_OVERRIDES: Record<string, string> = {
  'Yanribo': '/assets/yanribo.jpg',
  'Ajapsi':  '/assets/ajapsi.jpg',
  'Ajapa':   '/assets/ajapa.jpg',
};
const getStaffAvatar = (firstName: string, storedAvatar: string): string =>
  STAFF_AVATAR_OVERRIDES[firstName] ?? storedAvatar;

const defaultEmployees = [
  { id: "e1", firstName: "Yanribo", lastName: "the Tortoise", role: "AI Strategist", avatar: "/assets/yanribo.jpg" },
  { id: "e2", firstName: "Ajapsi", lastName: "the Tortoise", role: "Product Designer", avatar: "/assets/ajapsi.jpg" },
  { id: "e3", firstName: "Ajapa", lastName: "the Tortoise", role: "Financial Auditor", avatar: "/assets/ajapa.jpg" },
  { id: "e4", firstName: "Kiki", lastName: "Kangaroo", role: "CRM Coordinator", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kiki" },
  { id: "e5", firstName: "Barnaby", lastName: "Beaver", role: "Catalog Optimizer", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Barnaby" },
  { id: "e6", firstName: "Oliver", lastName: "Owl", role: "Security Auditor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver" }
];

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  createdAt: string;
}

const initialChats: Record<string, ChatMessage[]> = {
  Yanribo: [
    {
      id: "w1",
      text: "Hello Akin! I am Yanribo. I'm reviewing our CRM leads and making sure we stay in touch with our potential partners. How can I help you strategize today?",
      sender: "bot",
      createdAt: new Date().toISOString()
    }
  ],
  Ajapsi: [
    {
      id: "w2",
      text: "Hey Akin! Ajapsi here! Woohoo! I'm super excited about our curriculum games and workbooks. Let's make learning about money awesome! Got any new ideas?",
      sender: "bot",
      createdAt: new Date().toISOString()
    }
  ],
  Ajapa: [
    {
      id: "w3",
      text: "Greetings, Akin. This is Ajapa. I am carefully auditing our invoices and matching them with our Lotus Bank payments (Account 1010386319). Please let me know if you want to inspect a ledger report.",
      sender: "bot",
      createdAt: new Date().toISOString()
    }
  ],
  Kiki: [
    {
      id: "w4",
      text: "Hi Akin! Kiki Kangaroo on the move! Ready to speed up our client outreach and dispatch new automated emails. Let us know who we should ping next!",
      sender: "bot",
      createdAt: new Date().toISOString()
    }
  ],
  Barnaby: [
    {
      id: "w5",
      text: "Hello, Akin. Barnaby Beaver here. I'm organizing the product catalog inventory count and cross-checking the offline backup worksheets. Busy as always, let's get building!",
      sender: "bot",
      createdAt: new Date().toISOString()
    }
  ],
  Oliver: [
    {
      id: "w6",
      text: "Akin. Oliver Owl reporting. I have run the compliance analysis on the main database. No integrity errors found. Let me know if you need specific field validation.",
      sender: "bot",
      createdAt: new Date().toISOString()
    }
  ]
};

const mapDbLeadToLocal = (dbLead: any): Lead => {
  let localStatus: Lead["status"] = "New";
  if (dbLead.status === "Converted") localStatus = "Won";
  else if (dbLead.status === "Qualified") localStatus = "Proposal";
  else if (dbLead.status === "Lost") localStatus = "Lost";
  else if (dbLead.status === "New") localStatus = "New";
  
  return {
    id: dbLead.id,
    name: dbLead.name,
    email: dbLead.email || "",
    status: localStatus,
    value: dbLead.value || 0,
    source: dbLead.source || "Web Signup"
  };
};

const mapLocalStatusToDb = (localStatus: Lead["status"]): any => {
  if (localStatus === "Won") return "Converted";
  if (localStatus === "Proposal" || localStatus === "Contacted") return "Qualified";
  return localStatus;
};

const getDemandFactor = (name: string): "High" | "Medium" | "Low" => {
  if (name.includes("Workbook") || name.includes("Course")) return "High";
  if (name.includes("Coloring")) return "Low";
  return "Medium";
};

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
  const logout = useAuthStore(state => state.logout);
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

  // Zustand state bindings
  const dbLeads = useDataStore(state => state.leads);
  const leads = dbLeads.map(mapDbLeadToLocal);
  const dbInvoices = useDataStore(state => state.invoices);
  const juneRevenueTotal = dbInvoices
    .filter(inv => {
      if (!inv.date) return false;
      const dateObj = new Date(inv.date);
      return dateObj.getMonth() === 5 && inv.status === 'Paid';
    })
    .reduce((sum, inv) => sum + (inv.totalCents || 0), 0) / 100;
  
  const juneRevenueFormatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(juneRevenueTotal);

  const [newLead, setNewLead] = useState({ name: "", email: "", status: "New" as Lead["status"], value: "" });
  const [selectedLeadId, setSelectedLeadId] = useState<string>("1");
  const [draftedEmail, setDraftedEmail] = useState<string>("");

  // Product pricing optimization state
  const [optimizedPrices, setOptimizedPrices] = useState<Record<string, number>>({});
  const dbInventory = useDataStore(state => state.inventory);
  const products = dbInventory.filter(i => i.type === 'product').map(item => {
    const currentPrice = (item.priceCents || 0) / 100;
    const demandFactor = getDemandFactor(item.name);
    const optimizedPrice = optimizedPrices[item.id];
    return {
      id: item.id,
      name: item.name,
      category: item.category as any,
      currentPrice,
      stock: item.stockQuantity || 0,
      demandFactor,
      optimizedPrice
    };
  });

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

  // AI Staff Communication Desk state
  const employees = useDataStore(state => state.employees);
  const displayEmployees = employees.length > 0 ? employees : defaultEmployees;
  const [selectedStaff, setSelectedStaff] = useState<any>(defaultEmployees[0]);
  const [staffInput, setStaffInput] = useState("");
  const [isStaffRecording, setIsStaffRecording] = useState(false);
  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const [staffChats, setStaffChats] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('paradigm_staff_chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...initialChats };
        for (const key of Object.keys(parsed)) {
          if (parsed[key] && parsed[key].length > 0) {
            merged[key] = parsed[key];
          }
        }
        return merged;
      }
      return initialChats;
    } catch {
      return initialChats;
    }
  });

  useEffect(() => {
    localStorage.setItem('paradigm_staff_chats', JSON.stringify(staffChats));
  }, [staffChats]);
  // Audio references
  const staffMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const staffAudioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Database Seeding Effect for Leads, Products, and Employees
  useEffect(() => {
    const seedInitialData = async () => {
      const storeLeads = useDataStore.getState().leads;
      if (storeLeads.length === 0) {
        for (const l of initialLeads) {
          await useDataStore.getState().addLead({
            id: l.id,
            name: l.name,
            email: l.email,
            status: mapLocalStatusToDb(l.status),
            source: l.source,
            interestLevel: 'High',
            createdAt: new Date().toISOString()
          } as any);
        }
      }

      const storeProducts = useDataStore.getState().inventory.filter(i => i.type === 'product');
      if (storeProducts.length === 0) {
        const companyId = useAuthStore.getState().user?.companyId || '';
        for (const p of initialProducts) {
          await useDataStore.getState().addInventoryItem({
            id: p.id,
            name: p.name,
            category: p.category,
            priceCents: Math.round(p.currentPrice * 100),
            stockQuantity: p.stock,
            type: 'product' as any,
            companyId: companyId
          });
        }
      }

      const storeEmployees = useDataStore.getState().employees;
      if (storeEmployees.length === 0) {
        const companyId = useAuthStore.getState().user?.companyId || '';
        for (const emp of defaultEmployees) {
          await useDataStore.getState().addEmployee({
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: `${emp.firstName.toLowerCase()}@ajapasworld.com`,
            role: emp.role,
            salaryCents: 15000000,
            status: 'Active' as any,
            companyId,
            dob: new Date(1990, 0, 1).toISOString(),
            gender: 'Male',
            dateOfEmployment: new Date().toISOString(),
            address: 'Lagos, Nigeria',
            avatar: emp.avatar
          } as any);
        }
      }

      // Seed Invoices and Bookkeeping Entries if empty
      const storeInvoices = useDataStore.getState().invoices;
      if (storeInvoices.length === 0) {
        const companyId = useAuthStore.getState().user?.companyId || '';
        
        // Seed Invoices
        const invoicesToSeed = [
          {
            id: 'inv-1',
            number: 'INV-2026-001',
            companyId,
            contactId: 'c1',
            customerName: 'Kola Adebayo',
            date: '2026-06-15',
            dueDate: '2026-06-30',
            status: 'Paid' as any,
            type: 'Sales' as any,
            totalCents: 15000000,
            paidAmountCents: 15000000,
            lines: [{ id: 'l1', description: 'Ajapsi Math & Money Workbook (Bulk)', quantity: 10, unitPriceCents: 1500000 }]
          },
          {
            id: 'inv-2',
            number: 'INV-2026-002',
            companyId,
            contactId: 'c2',
            customerName: 'Tunde Bakare',
            date: '2026-06-20',
            dueDate: '2026-07-05',
            status: 'Paid' as any,
            type: 'Sales' as any,
            totalCents: 7750000,
            paidAmountCents: 7750000,
            lines: [{ id: 'l2', description: 'Coin Counting Board Game (Bulk)', quantity: 5, unitPriceCents: 1550000 }]
          },
          {
            id: 'inv-3',
            number: 'INV-2026-003',
            companyId,
            contactId: 'c3',
            customerName: 'Funmi Alao',
            date: '2026-06-25',
            dueDate: '2026-07-10',
            status: 'Unpaid' as any,
            type: 'Sales' as any,
            totalCents: 4500000,
            paidAmountCents: 0,
            lines: [{ id: 'l3', description: 'WiseUp Teens Budgeting Course', quantity: 1, unitPriceCents: 4500000 }]
          }
        ];

        for (const inv of invoicesToSeed) {
          await useDataStore.getState().addInvoice(inv as any);
        }

        // Seed Bookkeeping Entries
        const bookkeepingToSeed = [
          {
            id: 'b-1',
            date: '2026-06-15',
            type: 'Inflow' as const,
            category: 'Sales Revenue',
            description: 'Payment for Invoice INV-2026-001 (Kola Adebayo)',
            amountCents: 15000000,
            referenceId: 'inv-1'
          },
          {
            id: 'b-2',
            date: '2026-06-20',
            type: 'Inflow' as const,
            category: 'Sales Revenue',
            description: 'Payment for Invoice INV-2026-002 (Tunde Bakare)',
            amountCents: 7750000,
            referenceId: 'inv-2'
          },
          {
            id: 'b-3',
            date: '2026-06-22',
            type: 'Outflow' as const,
            category: 'Operating Expense',
            description: 'Advertising campaign on Facebook and Google',
            amountCents: 5000000
          },
          {
            id: 'b-4',
            date: '2026-06-26',
            type: 'Outflow' as const,
            category: 'Office Rent',
            description: 'Monthly co-working space rental payment',
            amountCents: 8000000
          }
        ];

        for (const entry of bookkeepingToSeed) {
          await useDataStore.getState().addBookkeepingEntry(entry as any);
        }
      }

      // Auto-migrate old seeded records (e.g. Chameleon to Tortoise)
      const storeEmployeesAfter = useDataStore.getState().employees;
      if (storeEmployeesAfter.length > 0) {
        // Auto-migrate avatar paths and names for the Ajapa tortoise characters
        const avatarFixes: Record<string, { lastName: string; avatar: string }> = {
          'Yanribo': { lastName: 'the Tortoise', avatar: '/assets/yanribo.jpg' },
          'Ajapsi':  { lastName: 'the Tortoise', avatar: '/assets/ajapsi.jpg' },
          'Ajapa':   { lastName: 'the Tortoise', avatar: '/assets/ajapa.jpg' },
        };
        for (const emp of storeEmployeesAfter) {
          const fix = avatarFixes[emp.firstName];
          if (fix && (emp.avatar !== fix.avatar || emp.lastName !== fix.lastName)) {
            useDataStore.getState().updateEmployee(emp.id, fix as any);
          }
        }
      }
    };
    seedInitialData();
  }, []);

  // Update selectedStaff dynamically if displayEmployees changes.
  // Also handles the case where selectedStaff was seeded from defaultEmployees
  // (id="e1") but the persisted store has employees with Supabase UUIDs.
  useEffect(() => {
    if (displayEmployees.length > 0) {
      const match = displayEmployees.find(e => e.id === selectedStaff?.id);
      if (match) {
        // Sync latest data (e.g. lastName "the Tortoise" after migration)
        setSelectedStaff(match);
      } else {
        // selectedStaff id doesn't exist in the live list (UUID vs e1 mismatch).
        // Try to find by firstName instead so the user sees the right person.
        const byName = selectedStaff?.firstName
          ? displayEmployees.find(e => e.firstName === selectedStaff.firstName)
          : null;
        setSelectedStaff(byName ?? displayEmployees[0]);
      }
    }
  }, [displayEmployees]);

  // AI-invoicing communication event listeners
  useEffect(() => {
    const handleUpdateInvoiceForm = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      if (data.clientName) setInvoiceMeta(prev => ({ ...prev, clientName: data.clientName }));
      if (data.clientEmail) setInvoiceMeta(prev => ({ ...prev, clientEmail: data.clientEmail }));
      if (data.clientAddress) setInvoiceMeta(prev => ({ ...prev, clientAddress: data.clientAddress }));
      if (data.invoiceNumber) setInvoiceMeta(prev => ({ ...prev, invoiceNumber: data.invoiceNumber }));
      if (data.issueDate) setInvoiceMeta(prev => ({ ...prev, issueDate: data.issueDate }));
      if (data.dueDate) setInvoiceMeta(prev => ({ ...prev, dueDate: data.dueDate }));
      if (data.items) {
        setInvoiceItems(data.items.map((it: any) => ({
          description: it.description,
          qty: it.qty,
          price: it.price
        })));
      }
      showToast("Invoice Drafted", `Ajapa drafted the invoice details into the preview.`);
    };

    const handleInvoiceRecorded = () => {
      showToast("Payment Recorded", `Ajapa has successfully registered the payment and updated the revenue!`);
    };

    window.addEventListener('update_invoice_form', handleUpdateInvoiceForm);
    window.addEventListener('invoice_recorded_by_ai', handleInvoiceRecorded);
    return () => {
      window.removeEventListener('update_invoice_form', handleUpdateInvoiceForm);
      window.removeEventListener('invoice_recorded_by_ai', handleInvoiceRecorded);
    };
  }, []);

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
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.email) {
      showToast("Validation Error", "Name and Email are required.");
      return;
    }
    const leadVal = parseFloat(newLead.value) || 0;
    const addedLead: Lead = {
      id: crypto.randomUUID(),
      name: newLead.name,
      email: newLead.email,
      status: newLead.status,
      value: leadVal,
      source: "Manual Admin CRM"
    };

    const dbStatus = mapLocalStatusToDb(newLead.status);
    await useDataStore.getState().addLead({
      id: addedLead.id,
      name: addedLead.name,
      email: addedLead.email,
      status: dbStatus,
      source: addedLead.source,
      interestLevel: 'High',
      createdAt: new Date().toISOString()
    } as any);

    setNewLead({ name: "", email: "", status: "New", value: "" });
    addAgentLog(`Kiki added new CRM contact: ${addedLead.name} (${addedLead.email})`);
    showToast("Lead Added", `${addedLead.name} has been added to the CRM list.`);
  };

  // Generate Follow-up email template
  const generateFollowUpEmail = () => {
    const lead = leads.find(l => l.id === selectedLeadId) || leads[0];
    if (!lead) return;

    let body = `Dear ${lead.name},\n\n`;
    if (lead.status === "New") {
      body += `Thanks for connecting with Ajapasworld! We noticed you recently joined us via ${lead.source}. We would love to introduce you to our premium MoneeWise financial literacy curriculum.\n\nAre you available for a brief 10-minute demo call this week?`;
    } else if (lead.status === "Proposal") {
      body += `I hope you are having a wonderful week. I'm following up on the proposal we sent over for the bulk license order (valued at ₦${Number(lead.value).toLocaleString()}).\n\nWe are excited to partner with you to bring these gamified workbooks to your students. Let me know if you have any questions about the Lotus Bank account details or package setup!`;
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
  const applyPriceOptimization = async (prodId: string) => {
    const item = products.find(p => p.id === prodId);
    if (!item) return;
    const optPrice = optimizedPrices[prodId];
    if (!optPrice) return;
    
    await useDataStore.getState().updateInventoryItem(prodId, { priceCents: Math.round(optPrice * 100) });
    
    setOptimizedPrices(prev => {
      const updated = { ...prev };
      delete updated[prodId];
      return updated;
    });
    
    addAgentLog(`Ajapsi optimized price for ${item.name}: ₦${item.currentPrice.toFixed(2)} -> ₦${optPrice.toFixed(2)}`);
    showToast("Pricing Optimized", `Price adjusted based on ${item.demandFactor} demand factors.`);
  };

  // Optimize all prices suggestions display
  const showOptimizationSuggestions = () => {
    const suggestions: Record<string, number> = {};
    products.forEach(p => {
      let multiplier = 1.0;
      if (p.demandFactor === "High") multiplier = 1.15;
      if (p.demandFactor === "Low") multiplier = 0.85;
      if (p.demandFactor === "Medium") multiplier = 1.05;
      suggestions[p.id] = parseFloat((p.currentPrice * multiplier).toFixed(2));
    });
    setOptimizedPrices(suggestions);
    addAgentLog("Ajapsi calculated AI pricing optimization suggestions for all catalog items.");
    showToast("Suggestions Calculated", "Click Apply next to each product to confirm.");
  };

  // Save / Record Invoice to Zustand Store
  const handleSaveInvoice = async () => {
    const companyId = useAuthStore.getState().user?.companyId || '';
    const newInvoiceId = `inv-${Date.now()}`;
    
    const lines = invoiceItems.map((item, idx) => ({
      id: `line-${idx}-${Date.now()}`,
      description: item.description,
      quantity: item.qty,
      unitPriceCents: Math.round(item.price * 100)
    }));

    const subtotalCents = Math.round(invoiceSubtotal * 100);
    const taxCents = Math.round(invoiceTax * 100);
    const totalCents = Math.round(invoiceTotal * 100);

    await useDataStore.getState().addInvoice({
      id: newInvoiceId,
      number: invoiceMeta.invoiceNumber,
      companyId,
      customerName: invoiceMeta.clientName,
      date: invoiceMeta.issueDate,
      dueDate: invoiceMeta.dueDate,
      status: 'Sent' as any,
      type: 'Sales',
      lines,
      subtotalCents,
      totalCents,
      paidAmountCents: 0,
      description: `Lotus Bank Remittance: A/C 1010386319 (Sort: LTSBNG22)`
    });

    addAgentLog(`Ajapa recorded invoice ${invoiceMeta.invoiceNumber} in local database.`);
    showToast("Invoice Recorded", `Invoice ${invoiceMeta.invoiceNumber} saved to database store.`);
  };

  // Audio helpers
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const playRawPcm = async (base64: string) => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const pcmData = decodeBase64(base64);
      const audioBuffer = await decodeRawPcmToAudioBuffer(pcmData, ctx, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.error("Audio Playback Error:", e);
    }
  };

  const playVoice = async (text: string) => {
    try {
      showToast("Generating Voice...", "Talking with neural network.");
      const base64Audio = await textToSpeech(text);
      if (base64Audio) {
        await playRawPcm(base64Audio);
        return;
      }
    } catch (e) {
      console.warn("AI TTS failed, falling back to browser synthesis:", e);
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en")) || voices.find(v => v.lang.startsWith("en"));
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
      };
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speak;
      } else {
        speak();
      }
    }
  };

  const startStaffRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      staffMediaRecorderRef.current = mediaRecorder;
      staffAudioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) staffAudioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = handleStaffAudioStop;
      mediaRecorder.start();
      setIsStaffRecording(true);
      showToast("Recording Voice...", "Speak now.");
    } catch (err) {
      showToast("Mic Failed", "Could not link recording hardware.");
    }
  };

  const stopStaffRecording = () => {
    if (staffMediaRecorderRef.current && isStaffRecording) {
      staffMediaRecorderRef.current.stop();
      setIsStaffRecording(false);
      staffMediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleStaffAudioStop = async () => {
    const audioBlob = new Blob(staffAudioChunksRef.current, { type: 'audio/webm' });
    setIsStaffTyping(true);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const voiceResult = await processVoiceCommand(base64String, 'audio/webm', `Chatting with AI Staff ${selectedStaff.firstName}`);
        const transcription = voiceResult.transcription || voiceResult.feedback || "Voice input recorded.";
        if (transcription) {
          await sendStaffMessage(transcription);
        }
      } catch (e) {
        console.error("Transcription error:", e);
        showToast("Error", "Could not transcribe audio.");
      } finally {
        setIsStaffTyping(false);
      }
    };
  };

  const sendStaffMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text,
      sender: 'user',
      createdAt: new Date().toISOString()
    };

    const staffId = selectedStaff.firstName;
    const currentMsgs = staffChats[staffId] || [];
    const updatedMsgs = [...currentMsgs, userMsg];
    setStaffChats(prev => ({
      ...prev,
      [staffId]: updatedMsgs
    }));

    setIsStaffTyping(true);

    try {
      let personaContext = "";
      if (selectedStaff.firstName === "Yanribo") {
        personaContext = "You are Yanribo, the wise, maternal, and strategic AI tortoise (Mamma Ajapa). You help Akin with business strategy, marketing ideas, and lead followups. Keep your tone encouraging, thoughtful, and professional.";
      } else if (selectedStaff.firstName === "Ajapsi") {
        personaContext = "You are Ajapsi, the energetic, playful tortoise. You are the product designer, full of child-like enthusiasm, focused on games, educational workbooks, and teenager budgeting planners. Keep your tone bubbly, exciting, and friendly with emojis!";
      } else if (selectedStaff.firstName === "Ajapa") {
        personaContext = "You are Ajapa, the scholarly, cautious, and academic tortoise who wears a graduation cap and glasses. You focus on math, school curriculum, bookkeeping audits, and matching bank transfers (like Lotus Bank Account 1010386319). Keep your tone formal, analytical, precise, and polite.";
      } else if (selectedStaff.firstName === "Kiki") {
        personaContext = "You are Kiki Kangaroo, the bubbly, fast-paced outreach lead. You focus on lead communications, email templates, and CRM contact details. Keep your tone energetic, brief, direct, and active.";
      } else if (selectedStaff.firstName === "Barnaby") {
        personaContext = "You are Barnaby Beaver, the organized and busy catalog coordinator. You focus on raw materials list, inventory stock quantities, and offline backup worksheets. Keep your tone busy, practical, productive, and task-oriented.";
      } else if (selectedStaff.firstName === "Oliver") {
        personaContext = "You are Oliver Owl, the calm, quiet, and highly analytical security auditor. You focus on database compliance, system overview KPIs, and technical validation logs. Keep your tone serious, precise, brief, and logical.";
      }

      // Format previous 10 messages of the chat history for Gemini
      const historyLimit = 10;
      const previousMsgs = updatedMsgs.slice(-historyLimit - 1, -1);
      const chatHistory = previousMsgs.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      const responseText = await generateAIResponse(text, personaContext, undefined, chatHistory);
      
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        text: responseText,
        sender: 'bot',
        createdAt: new Date().toISOString()
      };

      setStaffChats(prev => ({
        ...prev,
        [staffId]: [...(prev[staffId] || []), botMsg]
      }));

    } catch (err) {
      console.error("AI communication failed:", err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        text: "Sorry Akin, I am experiencing connection issues. Please try again in a moment.",
        sender: 'bot',
        createdAt: new Date().toISOString()
      };
      setStaffChats(prev => ({
        ...prev,
        [staffId]: [...(prev[staffId] || []), errorMsg]
      }));
    } finally {
      setIsStaffTyping(false);
    }
  };

  // Activity click handler to route/scroll directly to modules
  const handleActivityLinkClick = (e: React.MouseEvent, activityName: string, targetModuleId: string) => {
    e.preventDefault();
    showToast("Opening Module", `Navigating to ${activityName} tools in the workspace.`);
    const el = document.getElementById(targetModuleId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Print Invoice trigger
  const handlePrintInvoice = () => {
    addAgentLog(`Printed invoice ${invoiceMeta.invoiceNumber} for client ${invoiceMeta.clientName}.`);
    
    let printContent = invoicePreviewRef.current?.innerHTML || '';
    if (printContent) {
      // Replace all relative asset paths with absolute URLs so they load in about:blank
      const origin = window.location.origin;
      printContent = printContent.replace(/src="\/assets\//g, `src="${origin}/assets/`);
      
      const printWindow = window.open('about:blank', '_blank', 'left=50,top=50,width=850,height=950');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice - ${invoiceMeta.invoiceNumber}</title>
              <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
              <!-- Tailwind CDN so that the preview styles match 100% when printed -->
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                body {
                  font-family: 'Outfit', 'Inter', sans-serif;
                  background-color: #fff;
                  color: #1e293b;
                  padding: 20px;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                @media print {
                  body {
                    padding: 0;
                    margin: 0;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              </style>
            </head>
            <body>
              <div style="max-width: 850px; margin: 0 auto;">
                ${printContent}
              </div>
              <script>
                // Wait for all images to finish loading before bringing up the print dialog
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    window.close();
                  }, 500);
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
          <div className="flex items-center gap-3">
            <button 
              onClick={onSwitchWorkspace}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg"
            >
              Switch to Xquisite Celebrations <ArrowRight size={14} className="text-emerald-400" />
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg"
            >
              Sign Out <LogOut size={14} className="text-rose-400" />
            </button>
          </div>
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
                <p className="text-xl font-bold font-mono text-amber-300">{juneRevenueFormatted}</p>
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
          
          {/* AI STAFF COMMUNICATION DESK */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl" id="staff-communication-desk">
            <div className="bg-gradient-to-r from-teal-950/50 to-slate-900 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-teal-600/30 text-teal-400 font-mono text-[10px] rounded uppercase font-bold border border-teal-500/20">
                    AI Communication
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Real-time team collaboration desk</span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-teal-500 animate-pulse" />
                  MoneeWise AI Staff Communication Desk (Inbox)
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[480px]">
              {/* Sidebar */}
              <div className="border-r border-slate-800 p-4 bg-slate-950/30 space-y-2">
                <h3 className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-4 px-2">Team Directory</h3>
                {displayEmployees.map((emp: any) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedStaff(emp)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all relative ${
                      selectedStaff.id === emp.id 
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/10' 
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <img src={getStaffAvatar(emp.firstName, emp.avatar)} className="w-10 h-10 rounded-full object-cover bg-slate-800" alt={emp.firstName} />
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-xs truncate">{emp.firstName} {emp.lastName}</div>
                      <div className={`text-[10px] font-mono opacity-70 truncate ${selectedStaff.id === emp.id ? 'text-slate-900' : 'text-slate-400'}`}>{emp.role}</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </button>
                ))}
              </div>

              {/* Chat Area */}
              <div className="md:col-span-3 flex flex-col h-[480px] bg-slate-950/20">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={getStaffAvatar(selectedStaff.firstName, selectedStaff.avatar)} className="w-9 h-9 rounded-full object-cover bg-slate-800" alt={selectedStaff.firstName} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{selectedStaff.firstName} {selectedStaff.lastName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{selectedStaff.role} • Online</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Clear chat history with ${selectedStaff.firstName}?`)) {
                        setStaffChats(prev => {
                          const updated = { ...prev };
                          updated[selectedStaff.firstName] = initialChats[selectedStaff.firstName] || [];
                          return updated;
                        });
                      }
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-red-400 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-400 font-bold transition-all no-print flex items-center gap-1.5"
                    title="Clear Conversation History"
                  >
                    Clear History
                  </button>
                </div>

                {/* Messages Body */}
                <div className="flex-grow p-4 overflow-y-auto space-y-4">
                  {(staffChats[selectedStaff.firstName] || []).map((msg) => {
                    const isMe = msg.sender === 'user';
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-2xl ${
                          isMe 
                            ? 'bg-teal-500 text-slate-950 font-medium rounded-tr-sm shadow-md' 
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                        }`}>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <div className="flex justify-between items-center mt-2 gap-4">
                            <span className={`text-[8px] font-mono ${isMe ? 'text-slate-950/60' : 'text-slate-500'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!isMe && (
                              <button
                                onClick={() => playVoice(msg.text)}
                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-teal-400 hover:text-teal-300 transition-colors"
                              >
                                <Volume2 size={12} /> Play Voice
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isStaffTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-sm flex space-x-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-slate-800 bg-slate-900/40">
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                    <input
                      className="flex-grow bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
                      placeholder={`Send a message to ${selectedStaff.firstName}...`}
                      value={staffInput}
                      onChange={(e) => setStaffInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          sendStaffMessage(staffInput);
                          setStaffInput('');
                        }
                      }}
                    />
                    
                    {isStaffRecording ? (
                      <button onClick={stopStaffRecording} className="p-2 bg-rose-500/20 text-rose-400 rounded-full hover:scale-105 transition-all">
                        <Square size={14} className="fill-current" />
                      </button>
                    ) : (
                      <button onClick={startStaffRecording} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-teal-400 transition-colors">
                        <Mic size={14} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        sendStaffMessage(staffInput);
                        setStaffInput('');
                      }}
                      disabled={!staffInput.trim() || isStaffTyping || isStaffRecording}
                      className="p-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-full disabled:opacity-20 transition-all"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* CRM MODULE */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl" id="crm-module">
            <div className="bg-gradient-to-r from-red-950/50 to-slate-900 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src="/assets/yanribo.jpg" className="w-16 h-16 rounded-full object-cover border-2 border-red-500 bg-slate-850" alt="Yanribo" />
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
                              ₦{lead.value.toLocaleString()}
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
                        <label htmlFor="lead-value" className="text-xs text-slate-400 font-medium">Est. Deal Value (₦)</label>
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
              <div className="flex items-center gap-4">
                <img src="/assets/ajapsi.jpg" className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 bg-slate-850" alt="Ajapsi" />
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
                          <td className="p-4 font-mono font-bold text-white">₦{product.currentPrice}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 text-xs rounded border uppercase font-mono ${demandBadge}`}>
                              {product.demandFactor}
                            </span>
                          </td>
                          <td className="p-4">
                            {product.optimizedPrice ? (
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="font-bold text-emerald-400">₦{product.optimizedPrice}</span>
                                <span className={`text-[10px] uppercase px-1 rounded ${product.optimizedPrice > product.currentPrice ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {product.optimizedPrice > product.currentPrice ? '+₦' + (product.optimizedPrice - product.currentPrice).toFixed(2) : '-₦' + (product.currentPrice - product.optimizedPrice).toFixed(2)}
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
                <div className="flex items-center gap-4">
                  <img src="/assets/ajapa.jpg" className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 bg-slate-850" alt="Ajapa" />
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
                        <Area type="monotone" dataKey="revenue" name="Revenue (₦)" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
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
                          <label htmlFor="item-price" className="text-[10px] text-slate-500 font-medium">Price (₦)</label>
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
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleSaveInvoice}
                      className="bg-purple-700 hover:bg-purple-600 text-white gap-2 font-bold text-xs h-9 px-4 rounded-xl flex items-center shadow-lg transition-all"
                    >
                      <Plus className="h-4 w-4" /> Record Invoice
                    </button>
                    <button 
                      onClick={handlePrintInvoice}
                      className="bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-500 hover:to-orange-500 text-white gap-2 font-bold text-xs h-9 px-4 rounded-xl flex items-center shadow-lg"
                    >
                      <Printer className="h-4 w-4" /> Print / Export Invoice
                    </button>
                  </div>
                </div>
                
                {/* HTML Invoice Template */}
                <div 
                  ref={invoicePreviewRef}
                  className="bg-white text-slate-900 rounded-2xl shadow-2xl font-sans overflow-hidden border border-slate-200 flex max-w-[850px] mx-auto relative"
                  style={{ minHeight: "650px" }}
                >
                  {/* Left colorful strip */}
                  <div 
                    className="w-4 shrink-0 bg-repeat-y" 
                    style={{ 
                      backgroundImage: 'linear-gradient(180deg, #ea580c 20%, #eab308 20%, #eab308 40%, #8b5cf6 40%, #8b5cf6 60%, #3b82f6 60%, #3b82f6 80%, #10b981 80%, #10b981 100%)', 
                      backgroundSize: '100% 60px' 
                    }} 
                  />

                  {/* Main content body */}
                  <div className="flex-grow p-6 flex flex-col bg-[#fdfbf7]">
                    
                    {/* Brand Banner Header */}
                    <div className="relative p-6 text-white rounded-xl overflow-hidden min-h-[160px] mb-6 shadow-md">
                      <img 
                        src="/assets/ajapa_family.jpg" 
                        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.7] saturate-125" 
                        alt="Header Banner" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-950/80 via-purple-950/40 to-slate-950/50" />
                      
                      <div className="relative z-10 flex justify-between items-start h-full">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-extrabold tracking-wider font-sans text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-green-400 drop-shadow-md">AJAPSI</span>
                            <span className="bg-purple-600 text-white font-mono text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase shadow">MONEEWISE</span>
                          </div>
                          <p className="text-[9px] text-yellow-300 font-bold tracking-wide mt-1 drop-shadow-sm">Learn. Play. Grow. The Ajapsi Way!</p>
                          
                          {/* Mini Blackboard */}
                          <div className="mt-4 bg-slate-950/95 border-2 border-amber-800 rounded-lg p-2 max-w-[170px] shadow-lg transform -rotate-1">
                            <p className="font-sans text-[9px] text-amber-100 text-center font-bold leading-tight">
                              MoneeWise Kids make <span className="text-yellow-400">Smart Choices!</span> 😊
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1 items-end">
                          <span className="text-xl font-black text-white tracking-widest uppercase bg-purple-900/40 px-3 py-1 rounded border border-purple-500/20 mb-2">INVOICE</span>
                          <div className="flex flex-col gap-1 items-end">
                            <span className="px-2.5 py-0.5 bg-orange-600/95 border border-orange-500 text-[8px] font-black tracking-wider uppercase rounded shadow transform rotate-1">LEARN</span>
                            <span className="px-2.5 py-0.5 bg-purple-600/95 border border-purple-500 text-[8px] font-black tracking-wider uppercase rounded shadow transform -rotate-1">SAVE</span>
                            <span className="px-2.5 py-0.5 bg-emerald-600/95 border border-emerald-500 text-[8px] font-black tracking-wider uppercase rounded shadow transform rotate-1">GROW</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Billing Cards Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      
                      {/* Left: Invoice details */}
                      <div className="bg-white border border-emerald-500/20 rounded-xl p-3 shadow-sm space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold">#</div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-mono uppercase tracking-wide">Invoice No.</span>
                            <span className="font-bold text-xs text-slate-800 font-mono">{invoiceMeta.invoiceNumber}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs">📅</div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-mono uppercase tracking-wide">Invoice Date</span>
                            <span className="font-bold text-xs text-slate-800 font-mono">{invoiceMeta.issueDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs">⏳</div>
                          <div>
                            <span className="text-[8px] text-slate-400 block font-mono uppercase tracking-wide">Due Date</span>
                            <span className="font-bold text-xs text-slate-800 font-mono">{invoiceMeta.dueDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Center: Bill To Details */}
                      <div className="bg-white border border-blue-500/20 rounded-xl p-3 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="bg-blue-50 text-blue-800 text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider border border-blue-100">Bill To:</span>
                          <div className="mt-2 text-xs font-bold text-slate-800 border-b border-dashed border-slate-200 pb-1">{invoiceMeta.clientName}</div>
                          <div className="text-[9px] text-slate-500 border-b border-dashed border-slate-200 py-0.5 truncate">{invoiceMeta.clientEmail}</div>
                          <div className="text-[9px] text-slate-600 border-b border-dashed border-slate-200 py-0.5 truncate">{invoiceMeta.clientAddress}</div>
                        </div>
                      </div>

                      {/* Right: Dashed Speech Bubble */}
                      <div className="bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 rounded-2xl p-4 flex items-center justify-center text-center">
                        <p className="font-sans text-[10px] text-emerald-800 font-black italic leading-relaxed">
                          "Smart today, Wise tomorrow, That's the Ajapsi way!" 🐢✨
                        </p>
                      </div>

                    </div>

                    {/* Table of items */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6 bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-purple-950 text-white font-mono uppercase text-[9px]">
                            <th className="p-3">Item Description</th>
                            <th className="p-3 text-center">Quantity</th>
                            <th className="p-3 text-right">Unit Price (₦)</th>
                            <th className="p-3 text-right">Total (₦)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoiceItems.map((item, idx) => {
                            const getProductThumbnail = (description: string): string => {
                              const desc = description.toLowerCase();
                              if (desc.includes('ajapsi') || desc.includes('workbook') || desc.includes('license') || desc.includes('subscription')) {
                                return '/assets/ajapsi.jpg';
                              }
                              if (desc.includes('ajapa') || desc.includes('course') || desc.includes('facilitation') || desc.includes('workshop')) {
                                return '/assets/ajapa.jpg';
                              }
                              if (desc.includes('yanribo') || desc.includes('crm') || desc.includes('email')) {
                                return '/assets/yanribo.jpg';
                              }
                              return '/assets/family.png';
                            };
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                                  <img 
                                    src={getProductThumbnail(item.description)} 
                                    className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0" 
                                    alt="Thumbnail" 
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <span>{item.description}</span>
                                    <button 
                                      onClick={() => handleRemoveInvoiceItem(idx)}
                                      className="text-red-500 hover:text-red-700 ml-1 no-print shrink-0"
                                      title="Delete Line Item"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 inline" />
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 text-center text-slate-600 font-mono">{item.qty}</td>
                                <td className="p-3 text-right text-slate-600 font-mono">₦{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="p-3 text-right font-bold text-slate-900 font-mono">₦{(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom illustration & remittance grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-auto">
                      
                      {/* Bottom Left illustration box */}
                      <div className="md:col-span-5 flex flex-col items-center bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                        <img 
                          src="/assets/family.png" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-yellow-500 shadow-sm" 
                          alt="Ajapa Family" 
                        />
                        <div className="mt-3 bg-slate-950 border-2 border-purple-500/30 rounded-lg p-2.5 text-center transform rotate-1 shadow-md">
                          <p className="text-[9px] font-sans font-bold text-purple-200 leading-snug">
                            Good choices today, a better tomorrow! 💜
                          </p>
                        </div>
                      </div>

                      {/* Bottom Right totals & payment box */}
                      <div className="md:col-span-7 flex flex-col gap-3">
                        
                        {/* Totals card */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-1.5">
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-bold text-slate-800 font-mono">₦{invoiceSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                            <span className="text-slate-500">VAT (5.5%)</span>
                            <span className="font-bold text-slate-800 font-mono">₦{invoiceTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between py-2 px-3 font-extrabold text-white text-sm bg-purple-950 rounded-lg shadow-sm">
                            <span>TOTAL AMOUNT DUE</span>
                            <span className="font-mono">₦{invoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        {/* Remittance Details Card */}
                        <div className="p-4 rounded-xl text-white border-b-4 border-yellow-500 shadow-md relative overflow-hidden bg-gradient-to-br from-indigo-950 to-purple-950">
                          <h4 className="text-[9px] font-black tracking-widest text-yellow-400 uppercase mb-2">
                            PAYMENT DETAILS (LOTUS BANK)
                          </h4>
                          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[9px]">
                            <div>
                              <span className="text-[8px] text-indigo-300 uppercase block font-semibold">Account Name</span>
                              <span className="font-bold text-indigo-50">Data Clinic</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-indigo-300 uppercase block font-semibold">Bank Name</span>
                              <span className="font-bold text-indigo-50">Lotus Bank</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[8px] text-indigo-300 uppercase block font-semibold">Account Number</span>
                              <span className="font-black text-yellow-400 font-mono text-[11px]">1010386319</span>
                            </div>
                          </div>
                        </div>

                        {/* Yellow Sticky notes */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3.5 relative overflow-hidden shadow-sm">
                          <span className="absolute top-2 right-2 text-yellow-600 text-xs">⭐</span>
                          <h5 className="text-[9px] font-black text-yellow-800 uppercase tracking-wider mb-1">Notes:</h5>
                          <ul className="list-disc pl-4 text-[9px] text-yellow-900 space-y-1">
                            <li>Thank you for your business.</li>
                            <li>Kindly include the invoice number as the payment reference.</li>
                            <li>Please send proof of payment after payment has been made.</li>
                          </ul>
                        </div>

                      </div>

                    </div>

                    {/* Thank you footer */}
                    <div className="bg-sky-600 text-white text-center text-[10px] font-bold py-2 rounded-lg mt-6 shadow-sm flex items-center justify-center gap-1.5">
                      <span>THANK YOU! We appreciate your support and partnership.</span>
                      <span className="text-red-300">❤️</span>
                    </div>

                  </div>

                  {/* Right colorful strip */}
                  <div 
                    className="w-4 shrink-0 bg-repeat-y" 
                    style={{ 
                      backgroundImage: 'linear-gradient(180deg, #ea580c 20%, #eab308 20%, #eab308 40%, #8b5cf6 40%, #8b5cf6 60%, #3b82f6 60%, #3b82f6 80%, #10b981 80%, #10b981 100%)', 
                      backgroundSize: '100% 60px' 
                    }} 
                  />
                </div>
              </div>
              
              {/* RECORDED INVOICES LEDGER */}
              <div className="xl:col-span-2 border-t border-slate-800 pt-8 mt-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-400" />
                  Recorded Invoices Ledger (Lotus Bank A/C 1010386319)
                </h3>
                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-xs uppercase">
                        <th className="p-4">Invoice No</th>
                        <th className="p-4">Client Name</th>
                        <th className="p-4">Issue Date</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Total (₦)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm text-slate-300">
                      {dbInvoices.map((inv) => {
                        let statusColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                        if (inv.status === "Paid") statusColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                        if (inv.status === "Sent") statusColor = "bg-blue-500/20 text-blue-400 border-blue-500/30";
                        return (
                          <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors duration-200">
                            <td className="p-4 font-mono font-bold text-white">{inv.number}</td>
                            <td className="p-4 font-semibold text-slate-300">{inv.customerName}</td>
                            <td className="p-4 font-mono text-xs text-slate-400">{inv.date}</td>
                            <td className="p-4 font-mono text-xs text-slate-400">{inv.dueDate}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColor}`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono font-semibold text-white">
                              ₦{((inv.totalCents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* MONEYWISE ACTIVITIES PANEL */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl" id="activities-panel">
            <div className="p-6 border-b border-slate-800 flex items-center gap-4">
              <img src="/assets/family.png" className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500 bg-slate-850" alt="Ajapa Family" />
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Folder className="h-6 w-6 text-yellow-500" />
                  MoneeWise Activities & Curriculum Panel
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Direct access folder structure linking to active games, stories, budgeting planners, and courses.
                </p>
              </div>
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
                    <a href="#coin-counting" onClick={(e) => handleActivityLinkClick(e, "Coin Counting Game", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎮 Game: Coin Counting</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#money-math" onClick={(e) => handleActivityLinkClick(e, "Money Math Game", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎮 Game: Money Math</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#saving-challenge" onClick={(e) => handleActivityLinkClick(e, "Saving Challenge Game", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎮 Game: Saving Challenge</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#word-ladder" onClick={(e) => handleActivityLinkClick(e, "Word Ladder Game", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎮 Game: Word Ladder</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#saves-the-day" onClick={(e) => handleActivityLinkClick(e, "Saves The Day Story", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📖 Story: Saves The Day</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#magic-coin" onClick={(e) => handleActivityLinkClick(e, "Magic Coin Story", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📖 Story: Magic Coin</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#piggy-bank-mystery" onClick={(e) => handleActivityLinkClick(e, "Piggy Bank Mystery Story", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📖 Story: Piggy Bank Mystery</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#coloring" onClick={(e) => handleActivityLinkClick(e, "Coloring Book Activity", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🎨 Activity: Coloring Book</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#journal-editor" onClick={(e) => handleActivityLinkClick(e, "Journal Editor Utility", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
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
                    <a href="#saving-challenge" onClick={(e) => handleActivityLinkClick(e, "Saving Challenge Desk", "finance-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📉 Finance: Saving Challenge</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#budgeting" onClick={(e) => handleActivityLinkClick(e, "Budget Planner", "finance-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📉 Finance: Budget Planner</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#investing" onClick={(e) => handleActivityLinkClick(e, "Investing Simulation", "finance-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>📉 Finance: Investing Simulation</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#entrepreneurship" onClick={(e) => handleActivityLinkClick(e, "Entrepreneurship Workspace", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💼 Entrepreneurship Workspace</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#study-tips" onClick={(e) => handleActivityLinkClick(e, "Study Hacks Tips", "activities-panel")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🧠 LifeHacks: Study Hacks</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#time-management" onClick={(e) => handleActivityLinkClick(e, "Time Management Hacks", "activities-panel")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🧠 LifeHacks: Time Management</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#mental-health" onClick={(e) => handleActivityLinkClick(e, "Mental Health Support", "activities-panel")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🧠 LifeHacks: Mental Health Support</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#coding-bootcamp" onClick={(e) => handleActivityLinkClick(e, "Coding Bootcamp Skills", "activities-panel")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🚀 Skills: Coding Bootcamp</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#public-speaking" onClick={(e) => handleActivityLinkClick(e, "Public Speaking Skills", "activities-panel")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🚀 Skills: Public Speaking</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#business-competition" onClick={(e) => handleActivityLinkClick(e, "Young CEO Competition Club", "activities-panel")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
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
                    <a href="#investing-basics" onClick={(e) => handleActivityLinkClick(e, "Investing Basics", "finance-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💰 Finance: Investing Basics</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#advanced-savings" onClick={(e) => handleActivityLinkClick(e, "Wealth Accrual", "finance-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💰 Finance: Wealth Accrual</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#financial-planning" onClick={(e) => handleActivityLinkClick(e, "Portfolio Planning", "finance-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💰 Finance: Portfolio Planning</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#tax-strategies" onClick={(e) => handleActivityLinkClick(e, "Tax Optimization", "finance-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💰 Finance: Tax Optimization</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#career" onClick={(e) => handleActivityLinkClick(e, "Career Pathways", "finance-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💼 Career Pathways</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#entrepreneurship" onClick={(e) => handleActivityLinkClick(e, "Business Incubator", "products-module")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>💼 Business Incubator</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#life-skills" onClick={(e) => handleActivityLinkClick(e, "Life Skills Hub", "activities-panel")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
                      <span>🌱 Life Skills Hub</span>
                      <ChevronRight className="h-4.5 w-4.5 text-slate-500" />
                    </a>
                    <a href="#community-building" onClick={(e) => handleActivityLinkClick(e, "Community Building", "activities-panel")} className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors flex items-center justify-between text-xs text-slate-200">
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
