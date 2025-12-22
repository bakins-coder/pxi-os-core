
import { 
  Role, User, AIAgentMode, AIPolicyRule, AgenticLog, OrganizationSettings, AppModule, Ticket,
  Employee, EmployeeStatus, Department, SalaryBand, LeaveRequest, Invoice, InvoiceStatus,
  Supplier, Requisition, BookkeepingEntry, Deal, Ingredient, HardwareItem, InventoryMovement,
  InventoryItem, CateringEvent, EventTask, Workflow, MarketingPost, SocialInteraction, Task,
  Integration, Contact, Project, ProjectTask, ProjectAIAlert, AIAgent
} from '../types';

export interface BankTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  category: string;
  date: string;
}

class MockDB {
  private listeners: (() => void)[] = [];

  organizationSettings: OrganizationSettings = {
    id: 'org-pxi-core',
    name: 'PXI Unified Operations',
    type: 'Catering',
    currency: 'NGN',
    setupComplete: true,
    enabledModules: ['CRM', 'Finance', 'Automation', 'ContactCenter', 'TeamChat', 'Reports', 'Projects', 'Agents'],
    agentMode: AIAgentMode.AI_AGENTIC,
    integrations: [
      { id: 'int1', name: 'Gmail', provider: 'Gmail', category: 'Email', status: 'Disconnected' },
      { id: 'int5', name: 'Slack', provider: 'Slack', category: 'Communication', status: 'Disconnected' },
      { id: 'int4', name: 'Stripe', provider: 'Stripe', category: 'Payments', status: 'Disconnected' },
      { id: 'int3', name: 'Google Calendar', provider: 'Google Calendar', category: 'Calendar', status: 'Connected' }
    ],
    apiKeys: []
  };

  policyRules: AIPolicyRule[] = [
    { id: 'pol-1', action: 'Refund Processing', condition: 'Amount < 5000 NGN', requiresApproval: false, status: 'Active' },
    { id: 'pol-2', action: 'Account Closure', condition: 'All scenarios', requiresApproval: true, status: 'Active' },
  ];

  agenticLogs: AgenticLog[] = [];

  teamMembers: User[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@unified.app', role: Role.ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', companyId: 'org-pxi-core', status: 'Active' },
    { id: 'u2', name: 'Sarah Manager', email: 'sarah@unified.app', role: Role.MANAGER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', companyId: 'org-pxi-core', status: 'Active' },
    { id: 'u3', name: 'Kyle Logistics', email: 'kyle@unified.app', role: Role.LOGISTICS, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kyle', companyId: 'org-pxi-core', status: 'Active' }
  ];
  
  currentUser: User | null = null;
  tickets: Ticket[] = [];
  tasks: Task[] = [];
  invoices: Invoice[] = [];
  employees: Employee[] = [];
  departments: Department[] = [{ id: 'd1', name: 'Operations' }, { id: 'd2', name: 'Finance' }];
  salaryBands: SalaryBand[] = [];
  leaveRequests: LeaveRequest[] = [];
  cateringEvents: CateringEvent[] = [];
  bookkeeping: BookkeepingEntry[] = [];
  requisitions: Requisition[] = [];
  deals: Deal[] = [];
  suppliers: Supplier[] = [];
  marketingPosts: MarketingPost[] = [];
  socialInteractions: SocialInteraction[] = [];
  workflows: Workflow[] = [];
  inventory: InventoryItem[] = [];
  ingredients: Ingredient[] = [];
  stockMovements: InventoryMovement[] = [];
  hardwareInventory: HardwareItem[] = [];
  organizations: OrganizationSettings[] = [];
  channelLogs: any[] = [];
  companies: any[] = [];
  contacts: Contact[] = [
    { id: 'c1', name: 'Chevron Nigeria', type: 'Company', companyId: 'org-pxi-core', email: 'procurement@chevron.com', phone: '+234 1 900 1000', sentimentScore: 0.9, industry: 'Oil & Gas', registrationNumber: 'RC-123456', contactPerson: 'Alhaji Musa' }
  ];

  projects: Project[] = [];

  aiAgents: AIAgent[] = [
    {
      id: 'ag-1',
      name: 'Agent Phoenix',
      title: 'Inside Sales Specialist',
      industry: 'Catering',
      objective: 'Speed to Lead',
      voice: { name: 'Kore', accent: 'British', traits: ['Assertive', 'Fast'], speed: 1.2 },
      telephony: { phoneNumber: '+234 803 111 2222', areaCode: '0803', liveTransferNumber: '+234 800 HUMAN', callbackEnabled: true },
      intelligence: {
        kycQuestions: ['What is the event date?', 'Budget range?', 'Number of guests?'],
        guardrails: ['Do not offer discounts over 10%', 'Escalate if client gets angry'],
        script: 'Hi, this is Agent Phoenix from Xquisite Catering. I saw your inquiry...'
      },
      pipelineStageId: 'New Lead',
      status: 'Deployed'
    }
  ];

  constructor() {
    this.load();
    if (!this.currentUser) this.currentUser = this.teamMembers[0];
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  notify() {
    this.listeners.forEach(l => l());
    this.save();
  }

  load() {
    try {
      const saved = localStorage.getItem('unified_pxi_db_v1');
      if (saved) Object.assign(this, JSON.parse(saved));
    } catch (e) {}
  }

  save() {
    localStorage.setItem('unified_pxi_db_v1', JSON.stringify(this));
  }

  // --- Agent Methods ---
  addAIAgent(agent: Partial<AIAgent>) {
    const newAgent = {
      id: `ag-${Date.now()}`,
      status: 'Training',
      ...agent
    } as AIAgent;
    this.aiAgents.unshift(newAgent);
    this.notify();
    return newAgent;
  }

  updateAIAgent(id: string, updates: Partial<AIAgent>) {
    const idx = this.aiAgents.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.aiAgents[idx] = { ...this.aiAgents[idx], ...updates };
      this.notify();
    }
  }

  // (Existing methods retained...)
  addProject(project: Partial<Project>) {
    const newProject = { id: `proj-${Date.now()}`, status: 'Planning', progress: 0, tasks: [], aiAlerts: [], ...project } as Project;
    this.projects.unshift(newProject);
    this.notify();
    return newProject;
  }

  updateProjectTask(projectId: string, taskId: string, updates: Partial<ProjectTask>) {
    const proj = this.projects.find(p => p.id === projectId);
    if (proj) {
      const taskIdx = proj.tasks.findIndex(t => t.id === taskId);
      if (taskIdx !== -1) {
        proj.tasks[taskIdx] = { ...proj.tasks[taskIdx], ...updates };
        const doneCount = proj.tasks.filter(t => t.status === 'Done').length;
        proj.progress = Math.round((doneCount / proj.tasks.length) * 100);
        this.notify();
      }
    }
  }

  addProjectAIAlert(projectId: string, alert: Partial<ProjectAIAlert>) {
    const proj = this.projects.find(p => p.id === projectId);
    if (proj) { proj.aiAlerts.unshift({ id: `alert-${Date.now()}`, timestamp: new Date().toISOString(), ...alert } as ProjectAIAlert); this.notify(); }
  }

  setAgentMode(mode: AIAgentMode) { this.organizationSettings.agentMode = mode; this.notify(); }
  async login(email: string) { const user = this.teamMembers.find(u => u.email === email) || this.teamMembers[0]; this.currentUser = user; this.notify(); }
  logout() { this.currentUser = null; this.notify(); }
  switchRole(role: Role) { if (this.currentUser) this.currentUser.role = role; this.notify(); }
  getFinancialSummary() { return { revenue: 15000000, cash: 10000000, receivables: 5000000 }; }
  getNPS() { return 85; }
  getAgentPerformance() { return []; }
  getTeamMembers() { return this.teamMembers; }
  getDeals() { return this.deals; }
  getCustomerBalance() { return 0; }
  getCustomerTransactions() { return []; }
  createNewTicket(subject: string, desc: string, atts: any[]) { this.tickets.push({ id: `t${Date.now()}`, ticketNumber: `T-${Math.floor(Math.random()*1000)}`, subject, description: desc, status: 'Open', priority: 'Medium', progress: 0, attachments: atts, contactId: this.currentUser?.id || '' }); this.notify(); }
  addTask(task: Partial<Task>) { const newTask = { ...task, id: `task-${Date.now()}`, status: 'Pending', createdDate: new Date().toISOString() } as Task; this.tasks.push(newTask); this.notify(); }
  addContact(contact: Partial<Contact>) { const newContact = { ...contact, id: `con-${Date.now()}`, sentimentScore: 0.5, companyId: this.organizationSettings.id } as Contact; this.contacts.unshift(newContact); this.notify(); return newContact; }
  addContactsBulk(contacts: Partial<Contact>[]) { contacts.forEach((c, idx) => { this.contacts.unshift({ ...c, id: `con-bulk-${Date.now()}-${idx}`, sentimentScore: 0.5, companyId: this.organizationSettings.id } as Contact); }); this.notify(); }
  deleteContact(id: string) { this.contacts = this.contacts.filter(c => c.id !== id); this.notify(); }
  recordPayment(id: string, amount: number) { const inv = this.invoices.find(i => i.id === id); if (inv) { inv.paidAmount += amount; if (inv.paidAmount >= inv.total) inv.status = InvoiceStatus.PAID; this.notify(); } }
  submitRequisition(r: any) { this.requisitions.unshift({ id: `req-${Date.now()}`, status: 'Pending', ...r }); this.notify(); }
  approveRequisition(id: string, aid: string) { const req = this.requisitions.find(r => r.id === id); if (req) { req.status = 'Approved'; this.notify(); } }
  addEmployee(e: any) { this.employees.push({ id: `emp-${Date.now()}`, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.firstName}`, performanceRecords: [], ...e }); this.notify(); }
  addEmployeesBulk(staff: any[]) { staff.forEach((e, idx) => { this.employees.push({ id: `emp-bulk-${Date.now()}-${idx}`, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.firstName || 'Staff'}`, performanceRecords: [], leaveBalance: { annual: 20, sick: 10, casual: 5 }, onHealthScheme: true, status: EmployeeStatus.ACTIVE, ...e } as Employee); }); this.notify(); }
  updateEmployee(id: string, u: any) { const idx = this.employees.findIndex(e => e.id === id); if (idx !== -1) { this.employees[idx] = { ...this.employees[idx], ...u }; this.notify(); } }
  addMarketingPost(p: any) { const newPost = { id: `post-${Date.now()}`, ...p }; this.marketingPosts.push(newPost); this.notify(); return newPost; }
  updateSocialInteraction(id: string, u: any) { const idx = this.socialInteractions.findIndex(i => i.id === id); if (idx !== -1) { this.socialInteractions[idx] = { ...this.socialInteractions[idx], ...u }; this.notify(); } }
  addDepartment(n: string) { this.departments.push({ id: `d-${Date.now()}`, name: n }); this.notify(); }
  addSalaryBand(b: any) { this.salaryBands.push({ id: `sb-${Date.now()}`, ...b }); this.notify(); }
  toggleIntegration(id: string) { const int = this.organizationSettings.integrations.find(i => i.id === id); if (int) { int.status = int.status === 'Connected' ? 'Disconnected' : 'Connected'; this.notify(); } }
  generateApiKey(label: string) { this.organizationSettings.apiKeys.push({ label, key: `ukey_${Math.random().toString(36).slice(2)}` }); this.notify(); }
  deleteApiKey(key: string) { this.organizationSettings.apiKeys = this.organizationSettings.apiKeys.filter(k => k.key !== key); this.notify(); }
  toggleModule(module: AppModule, status: boolean) { if (status) { if (!this.organizationSettings.enabledModules.includes(module)) this.organizationSettings.enabledModules.push(module); } else { this.organizationSettings.enabledModules = this.organizationSettings.enabledModules.filter(m => m !== module); } this.notify(); }
  completeSetup(details: any, invites: any[]) { this.organizationSettings = { ...this.organizationSettings, ...details, setupComplete: true }; this.notify(); }
  signup(org: string, name: string, email: string) { this.organizationSettings.name = org; this.notify(); }
  inviteUser(email: string, role: Role) { this.teamMembers.push({ id: `u-${Date.now()}`, name: email.split('@')[0], email, role, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`, companyId: 'org-pxi-core' }); this.notify(); }
  updateUserRole(id: string, role: Role) { const u = this.teamMembers.find(t => t.id === id); if (u) { u.role = role; this.notify(); } }
  addBookkeeping(e: any) { this.bookkeeping.unshift({ id: `bk-${Date.now()}`, date: new Date().toISOString(), ...e }); this.notify(); }
  confirmCateringEvent(e: any) { const ev = this.cateringEvents.find(v => v.id === e.id); if (ev) { ev.status = 'Confirmed'; this.notify(); } }
  updateEventTaskStatus(id: string, s: any) { this.cateringEvents.forEach(ev => { const t = ev.tasks?.find(tk => tk.id === id); if (t) t.status = s; }); this.notify(); }
  addIngredient(i: any) { this.ingredients.push({ id: `ing-${Date.now()}`, ...i }); this.notify(); }
  createBanquetDeal(f: any, i: any) { const ev = { id: `ev-${Date.now()}`, customerName: f.contactPerson, eventDate: f.eventDate, status: 'Confirmed', items: i } as any; this.cateringEvents.push(ev); this.notify(); return ev; }
  saveMeeting(m: any) { this.notify(); }
}

export const db = new MockDB();
