
import { 
  Role, User, AIAgentMode, AIAgent, OrganizationSettings, ChartOfAccount, LedgerTransaction, 
  JournalEntry, BankStatementLine, ReserveRule, FixedAsset, Invoice, InvoiceStatus,
  CateringEvent, BankTransaction, Contact, Task, InventoryItem, Ingredient, 
  Employee, EmployeeStatus, Department, SalaryBand, BookkeepingEntry, Requisition,
  Deal, MarketingPost, SocialInteraction, Workflow, Project, Ticket, AgenticLog,
  InventoryMovement, Supplier, ProjectTask, ProjectAIAlert, EventTask, DealItem
} from '../types';
import { supabase, syncTableToCloud, pullCloudState } from './supabase';

class NexusStore {
  private listeners: (() => void)[] = [];
  public isSyncing: boolean = false;
  public lastCloudSync: string | null = null;
  public cloudEnabled: boolean = !!supabase;
  public isDemoMode: boolean = false;

  organizationSettings: OrganizationSettings = {
    id: 'org-1',
    name: 'Paradigm-Xi OS',
    type: 'General',
    currency: 'NGN',
    setupComplete: true,
    enabledModules: ['Accounting', 'CRM', 'Finance', 'Automation', 'Inventory', 'Reports'],
    agentMode: AIAgentMode.AI_AGENTIC,
    brandColor: '#00ff9d',
    firs_tin: '23456789-0001',
    annual_turnover_cents: 8500000000,
    integrations: [],
    apiKeys: [],
    size: 'Small (11-50)'
  };

  chartOfAccounts: ChartOfAccount[] = [
    { id: 'coa-1', code: '1000', name: 'Cash at Bank (NGN)', type: 'Asset', subtype: 'Current', balanceCents: 125000000, currency: 'NGN' },
    { id: 'coa-2', code: '1001', name: 'USD Reserve Account', type: 'Asset', subtype: 'Current', balanceCents: 50000000, currency: 'USD' },
    { id: 'coa-3', code: '1200', name: 'Accounts Receivable', type: 'Asset', subtype: 'Current', balanceCents: 45000000, currency: 'NGN' },
    { id: 'coa-4', code: '4000', name: 'Sales Revenue', type: 'Revenue', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-5', code: '5000', name: 'Operating Expenses', type: 'Expense', subtype: 'Operating', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-6', code: '2100', name: 'VAT Payable (7.5%)', type: 'Liability', subtype: 'Current', balanceCents: 0, currency: 'NGN' },
    { id: 'coa-7', code: '2200', name: 'WHT Payable', type: 'Liability', subtype: 'Current', balanceCents: 0, currency: 'NGN' },
  ];

  transactions: LedgerTransaction[] = [];
  bankStatementLines: BankStatementLine[] = [
    { id: 'bsl-1', date: '2024-11-20', description: 'Transfer from SHELL NIGERIA', amountCents: 500000000, type: 'Credit', isMatched: false, suggestedAccountId: 'coa-4' },
    { id: 'bsl-2', date: '2024-11-21', description: 'Uber * 1234 Trip', amountCents: 450000, type: 'Debit', isMatched: false, suggestedAccountId: 'coa-5' },
  ];

  reserveRules: ReserveRule[] = [
    { id: 'rr-1', name: 'Tax Reserve (FIRS)', targetPercentage: 7.5, sourceAccountId: 'coa-1', reserveAccountId: 'coa-6', isAutomated: true },
  ];

  fixedAssets: FixedAsset[] = [
    { id: 'fa-1', name: 'Delivery Van', purchaseDate: '2024-01-15', costCents: 1200000000, ntaClass: 'CLASS_3', accumulatedAllowanceCents: 0, status: 'Active' }
  ];

  invoices: Invoice[] = [
    { id: 'inv-1', number: '1001', companyId: 'c1', date: '2024-11-01', dueDate: '2024-11-15', status: InvoiceStatus.UNPAID, totalCents: 50000000, paidAmountCents: 0, lines: [] }
  ];

  teamMembers: User[] = [
    { id: 'u1', name: 'Admin', email: 'admin@paradigm-xi.com', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=XiAdmin', companyId: 'org-1' }
  ];

  currentUser: User | null = null;
  contacts: Contact[] = [];
  inventory: InventoryItem[] = [];
  ingredients: Ingredient[] = [];
  cateringEvents: CateringEvent[] = [];
  stockMovements: InventoryMovement[] = [];
  employees: Employee[] = [];
  departments: Department[] = [{ id: 'd1', name: 'Operations' }];
  salaryBands: SalaryBand[] = [];
  bookkeeping: BookkeepingEntry[] = [];
  requisitions: Requisition[] = [];
  deals: Deal[] = [];
  suppliers: Supplier[] = [];
  marketingPosts: MarketingPost[] = [];
  socialInteractions: SocialInteraction[] = [];
  workflows: Workflow[] = [];
  projects: Project[] = [];
  aiAgents: AIAgent[] = [];
  companies: any[] = [];
  tickets: Ticket[] = [];
  tasks: Task[] = [];
  channelLogs: any[] = [];
  bankTransactions: BankTransaction[] = [];
  agenticLogs: AgenticLog[] = [];

  constructor() {
    const hasData = this.load();
    if (!this.currentUser && !hasData) {
      this.currentUser = this.teamMembers[0];
    }
    if (this.cloudEnabled && !this.isDemoMode) {
      this.initCloudSync();
    }
  }

  /**
   * Performs an initial pull from the Cloud Nexus if live.
   */
  private async initCloudSync() {
    if (!supabase) return;
    this.isSyncing = true;
    try {
      // Pull critical reference data from Supabase
      const cloudOrgs = await pullCloudState('organizations');
      if (cloudOrgs && cloudOrgs.length > 0) {
        this.organizationSettings = cloudOrgs[0];
      }
      
      const cloudUsers = await pullCloudState('users');
      if (cloudUsers) this.teamMembers = cloudUsers;

      this.lastCloudSync = new Date().toISOString();
    } catch (e) {
      console.warn("Cloud connection limited. Using local neural cache.");
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  async enterSandbox() {
    this.isDemoMode = true;
    this.cloudEnabled = false; 
    
    this.organizationSettings = {
      ...this.organizationSettings,
      name: 'OmniCorp Simulations (Sandbox)',
      brandColor: '#8b5cf6'
    };

    this.currentUser = {
      id: 'demo-user',
      name: 'Guest Prospect',
      email: 'demo@paradigm-xi.com',
      role: Role.ADMIN,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
      companyId: 'sandbox-org'
    };

    this.contacts = [
      { id: 'dc1', name: 'Future Clients Ltd', type: 'Company', companyId: 's1', email: 'leads@future.com', phone: '0800-DEMO', sentimentScore: 0.9, industry: 'Technology' },
      { id: 'dc2', name: 'Global Catering Partners', type: 'Company', companyId: 's2', email: 'info@gcp.com', phone: '0811-DEMO', sentimentScore: 0.7, industry: 'Hospitality' }
    ];

    this.deals = [
      { id: 'dd1', name: 'Project Alpha Deployment', contactId: 'dc1', valueCents: 150000000, stage: 'Proposal', items: [], expectedCloseDate: '2025-03-01' }
    ];

    this.inventory = [
      { id: 'dp1', name: 'Neural Server Rack', category: 'Hardware', priceCents: 50000000, costPriceCents: 30000000, image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=800' }
    ];

    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  notify() {
    this.save();
    this.listeners.forEach(l => l());
  }

  load(): boolean {
    try {
      const saved = localStorage.getItem('nexus_os_db_v4');
      if (saved) {
        Object.assign(this, JSON.parse(saved));
        return true;
      }
    } catch (e) {
      console.error("Failed to load neural cache", e);
    }
    return false;
  }

  save() {
    const state = {
      organizationSettings: this.organizationSettings,
      chartOfAccounts: this.chartOfAccounts,
      transactions: this.transactions,
      bankStatementLines: this.bankStatementLines,
      reserveRules: this.reserveRules,
      fixedAssets: this.fixedAssets,
      invoices: this.invoices,
      teamMembers: this.teamMembers,
      currentUser: this.currentUser,
      contacts: this.contacts,
      inventory: this.inventory,
      ingredients: this.ingredients,
      cateringEvents: this.cateringEvents,
      stockMovements: this.stockMovements,
      employees: this.employees,
      departments: this.departments,
      salaryBands: this.salaryBands,
      bookkeeping: this.bookkeeping,
      requisitions: this.requisitions,
      deals: this.deals,
      suppliers: this.suppliers,
      marketingPosts: this.marketingPosts,
      socialInteractions: this.socialInteractions,
      workflows: this.workflows,
      projects: this.projects,
      aiAgents: this.aiAgents,
      companies: this.companies,
      tickets: this.tickets,
      tasks: this.tasks,
      channelLogs: this.channelLogs,
      bankTransactions: this.bankTransactions,
      agenticLogs: this.agenticLogs,
      cloudEnabled: this.cloudEnabled,
      isDemoMode: this.isDemoMode
    };
    localStorage.setItem('nexus_os_db_v4', JSON.stringify(state));

    if (this.cloudEnabled && !this.isDemoMode && supabase) {
      this.pushToCloud();
    }
  }

  async pushToCloud() {
    if (this.isSyncing || this.isDemoMode) return;
    this.isSyncing = true;
    try {
      await syncTableToCloud('organizations', [this.organizationSettings]);
      await syncTableToCloud('users', this.teamMembers);
      await syncTableToCloud('inventory', this.inventory);
      await syncTableToCloud('contacts', this.contacts);
      this.lastCloudSync = new Date().toISOString();
    } catch (e) {
      console.warn("Nexus Push Deferred: Cloud link throttled.");
    } finally {
      this.isSyncing = false;
      this.listeners.forEach(l => l());
    }
  }

  resetInstance() {
    localStorage.removeItem('nexus_os_db_v4');
    window.location.reload();
  }

  postDoubleEntry(tx: Partial<LedgerTransaction>) {
    const totalDebit = tx.entries?.reduce((sum, e) => sum + e.debitCents, 0) || 0;
    const totalCredit = tx.entries?.reduce((sum, e) => sum + e.creditCents, 0) || 0;
    if (totalDebit !== totalCredit) throw new Error("Ledger Unbalanced");

    const newTx: LedgerTransaction = {
      id: `tx-${Date.now()}`,
      date: tx.date || new Date().toISOString().split('T')[0],
      description: tx.description || 'Entry',
      status: 'Posted',
      source: tx.source || 'Manual',
      tenantId: this.organizationSettings.id,
      entries: (tx.entries || []).map(e => ({ ...e, id: `je-${Math.random()}`, transactionId: `tx-${Date.now()}` }))
    };
    this.transactions.unshift(newTx);
    this.notify();
    return newTx;
  }

  reconcileMatch(lineId: string, accountId: string) {
    const line = this.bankStatementLines.find(l => l.id === lineId);
    if (line) {
      this.postDoubleEntry({
        description: `Match: ${line.description}`,
        source: 'BankFeed',
        entries: [
          { accountId: 'coa-1', debitCents: line.type === 'Credit' ? line.amountCents : 0, creditCents: line.type === 'Debit' ? line.amountCents : 0, isReconciled: true, id: '', transactionId: '' },
          { accountId: accountId, debitCents: line.type === 'Debit' ? line.amountCents : 0, creditCents: line.type === 'Credit' ? line.amountCents : 0, isReconciled: true, id: '', transactionId: '' }
        ]
      });
      line.isMatched = true;
      this.notify();
    }
  }

  getNetBurnRate() { return 120000000; }
  getRunwayMonths() { return "12.4"; }
  
  async login(e: string) { 
    this.currentUser = this.teamMembers.find(m => m.email === e) || this.teamMembers[0]; 
    this.notify(); 
  }

  logout() { 
    this.currentUser = null; 
    this.notify(); 
  }

  async signup(repName: string, repEmail: string, role?: string) { 
    this.isDemoMode = false;
    this.organizationSettings = {
      id: `org-${Date.now()}`,
      name: 'Unified Entity',
      type: 'General',
      currency: 'NGN',
      setupComplete: false,
      enabledModules: [],
      agentMode: AIAgentMode.HYBRID,
      brandColor: '#4f46e5',
      integrations: [],
      apiKeys: []
    };
    
    this.cateringEvents = [];
    this.projects = [];
    this.aiAgents = [];
    this.deals = [];
    this.invoices = [];
    this.transactions = [];
    this.bookkeeping = [];
    
    this.currentUser = { 
      id: `u-${Date.now()}`, 
      name: repName, 
      email: repEmail, 
      role: (role as Role) || Role.ADMIN, 
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${repName}`, 
      companyId: this.organizationSettings.id 
    };
    this.teamMembers = [this.currentUser];
    
    if (this.cloudEnabled && supabase) {
      await this.pushToCloud();
    }
    
    this.notify(); 
  }

  addAIAgent(a: Partial<AIAgent>) { this.aiAgents.push({...a, id: `a${Date.now()}`, status: 'Deployed'} as AIAgent); this.notify(); }
  addProject(p: Partial<Project>) { this.projects.push({...p, id: `pr${Date.now()}`, tasks: [], aiAlerts: [], progress: 0, clientContactId: 'c1', status: 'Planning', startDate: new Date().toISOString(), endDate: new Date().toISOString(), budgetCents: 0} as Project); this.notify(); }
  addDepartment(n: string) { this.departments.push({ id: `d${Date.now()}`, name: n }); this.notify(); }
  addIngredient(i: Partial<Ingredient>) { this.ingredients.push({...i, id: `ing${Date.now()}`} as Ingredient); this.notify(); }
  addBookkeeping(b: Partial<BookkeepingEntry>) { this.bookkeeping.unshift({...b, id: `bk${Date.now()}`, date: new Date().toISOString()} as BookkeepingEntry); this.notify(); }
  addContact(c: Partial<Contact>) { this.contacts.unshift({...c, id: `con${Date.now()}`, sentimentScore: 0.8} as Contact); this.notify(); }
  addEmployeesBulk(e: any[]) { e.forEach(emp => this.employees.push({ ...emp, id: `e${Math.random()}`, status: EmployeeStatus.ACTIVE, leaveBalance: { annual: 20, sick: 10, casual: 5 }, onHealthScheme: true })); this.notify(); }
  addContactsBulk(c: any[]) { c.forEach(con => this.contacts.push({...con, id: `c${Math.random()}`, sentimentScore: 0.5})); this.notify(); }
  addMarketingPost(p: Partial<MarketingPost>) { const post = {...p, id: `mp${Date.now()}`} as MarketingPost; this.marketingPosts.push(post); this.notify(); return post; }
  updateSocialInteraction(id: string, u: Partial<SocialInteraction>) { const i = this.socialInteractions.find(s => s.id === id); if (i) Object.assign(i, u); this.notify(); }
  completeSetup(d: Partial<OrganizationSettings>, invites?: any[]) { Object.assign(this.organizationSettings, d, { setupComplete: true }); invites?.forEach(inv => this.inviteUser(inv.email, inv.role)); this.notify(); }
  inviteUser(e: string, r: Role) { this.teamMembers.push({ id: `u${Date.now()}`, name: e.split('@')[0], email: e, role: r, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${e}`, companyId: this.organizationSettings.id }); this.notify(); }
  toggleIntegration(i: string) { this.notify(); }
  toggleModule(m: string, s: boolean) { this.notify(); }
  recordPayment(i: string, aCents: number) { 
    const inv = this.invoices.find(v => v.id === i);
    if (inv) {
      inv.paidAmountCents += aCents;
      if (inv.paidAmountCents >= inv.totalCents) inv.status = InvoiceStatus.PAID;
      this.notify();
    }
  }
  submitRequisition(r: Partial<Requisition>) { this.requisitions.unshift({...r, id: `req${Date.now()}`, status: 'Pending'} as Requisition); this.notify(); }
  approveRequisition(id: string, approverId?: string) { const r = this.requisitions.find(v => v.id === id); if (r) { r.status = 'Approved'; this.notify(); } }
  updateAIAgent(id: string, u: Partial<AIAgent>) { const a = this.aiAgents.find(v => v.id === id); if (a) Object.assign(a, u); this.notify(); }
  updateProjectTask(pid: string, tid: string, u: Partial<ProjectTask>) { const p = this.projects.find(v => v.id === pid); if (p) { const t = p.tasks.find(v => v.id === tid); if (t) Object.assign(t, u); } this.notify(); }
  addProjectAIAlert(pid: string, a: Partial<ProjectAIAlert>) { const p = this.projects.find(v => v.id === pid); if (p) p.aiAlerts.unshift({...a, id: `al${Date.now()}`, timestamp: new Date().toISOString()} as ProjectAIAlert); this.notify(); }
  setAgentMode(m: AIAgentMode) { this.organizationSettings.agentMode = m; this.notify(); }
  getFinancialSummary() { return { revenue: 1500000000, cash: 1000000000, receivables: 500000000 }; }
  getNPS() { return 85; }
  getAgentPerformance() { return []; }
  getTeamMembers() { return this.teamMembers; }
  getDeals() { return this.deals; }
  getCustomerBalance() { return 250000000; }
  getCustomerTransactions() { return this.bankTransactions; }
  createNewTicket(s: string, d: string, a: any) { this.tickets.unshift({ id: `tk${Date.now()}`, ticketNumber: 'T-101', subject: s, description: d, status: 'Open', priority: 'Medium', progress: 0, attachments: a, contactId: this.currentUser?.id || 'u1', createdDate: new Date().toISOString() }); this.notify(); }
  addTask(t: Partial<Task>) { this.tasks.push({...t, id: `task${Date.now()}`, status: 'Todo'} as Task); this.notify(); }
  deleteContact(id: string) { this.contacts = this.contacts.filter(c => c.id !== id); this.notify(); }
  updateEmployee(id: string, u: Partial<Employee>) { const e = this.employees.find(v => v.id === id); if (e) Object.assign(e, u); this.notify(); }
  addSalaryBand(b: SalaryBand) { this.salaryBands.push({...b, id: `sb${Date.now()}`}); this.notify(); }
  generateApiKey(l: string) { this.notify(); }
  deleteApiKey(k: string) { this.notify(); }
  confirmCateringEvent(e: CateringEvent) { 
    const event = this.cateringEvents.find(v => v.id === e.id);
    if (event) {
      event.status = 'Confirmed';
      this.notify();
    }
  }
  updateEventTaskStatus(id: string, s: EventTask['status']) { this.cateringEvents.forEach(e => { const t = e.tasks?.find(v => v.id === id); if (t) t.status = s; }); this.notify(); }
  createBanquetDeal(f: any, i: DealItem[]) { 
    const event: CateringEvent = { 
      id: `ev${Date.now()}`, 
      customerName: f.contactPerson, 
      eventDate: f.eventDate, 
      groupCount: f.guestCount, 
      status: 'Confirmed', 
      items: i, 
      banquetDetails: f,
      readinessScore: 40,
      tasks: [
        { id: `t1${Date.now()}`, phase: 'Planning', name: 'Venue Handover', ownerRole: 'Logistics Manager', dueDate: f.eventDate, status: 'Pending' },
        { id: `t2${Date.now()}`, phase: 'Procurement', name: 'Material Sync', ownerRole: 'Procurement Officer', dueDate: f.eventDate, status: 'Pending' }
      ],
      financials: {
        revenueCents: i.reduce((s, it) => s + (it.priceCents * it.quantity), 0),
        directCosts: { foodCents: 40000000, labourCents: 15000000, energyCents: 2000000, carriageCents: 3000000 },
        indirectCosts: { adminCents: 5000000, marketingCents: 2000000, waitersCents: 8000000, logisticsCents: 10000000 },
        netProfitMargin: 25
      }
    } as any;
    this.cateringEvents.push(event);
    this.notify();
    return event;
  }
  saveMeeting(m: any) { this.notify(); }
}

export const nexusStore = new NexusStore();
