
export enum Role {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  AGENT = 'Contact Center Agent',
  SUPERVISOR = 'Contact Center Supervisor',
  FINANCE = 'Finance',
  HR = 'HR',
  HR_MANAGER = 'HR Manager',
  EMPLOYEE = 'Employee',
  CUSTOMER = 'Customer',
  HEAD_CHEF = 'Head Chef',
  PROCUREMENT = 'Procurement Officer',
  LOGISTICS = 'Logistics Manager',
  EVENT_MANAGER = 'Event Manager',
  STOCK_KEEPER = 'Stock Keeper',
  SALES = 'Sales'
}

export enum AIAgentMode {
  HUMAN_FIRST = 'Human-First',
  AI_AGENTIC = 'AI-Agentic (Autonomous)',
  HYBRID = 'Hybrid-Assisted'
}

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export type AccountSubtype = 'Current' | 'Fixed' | 'Operating' | 'Other';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  balanceCents: number;
  currency: 'NGN' | 'USD';
  parentAccountId?: string;
}

export interface JournalEntry {
  id: string;
  transactionId: string;
  accountId: string;
  contactId?: string;
  debitCents: number;
  creditCents: number;
  memo?: string;
  isReconciled: boolean;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  referenceNumber?: string;
  status: 'Draft' | 'Posted' | 'Void';
  source: 'Manual' | 'BankFeed' | 'Invoice' | 'OCR';
  tenantId: string;
  entries: JournalEntry[];
}

export interface BankStatementLine {
  id: string;
  date: string;
  description: string;
  amountCents: number;
  type: 'Credit' | 'Debit';
  isMatched: boolean;
  suggestedAccountId?: string;
}

export interface ReserveRule {
  id: string;
  name: string;
  targetPercentage: number;
  sourceAccountId: string;
  reserveAccountId: string;
  isAutomated: boolean;
}

export interface FixedAsset {
  id: string;
  name: string;
  purchaseDate: string;
  costCents: number;
  ntaClass: 'CLASS_1' | 'CLASS_2' | 'CLASS_3';
  accumulatedAllowanceCents: number;
  status: 'Active' | 'Disposed';
}

export interface FIRSInvoice {
  irn?: string;
  qrCode?: string;
  tin: string;
  vatAmountCents: number;
  whtAmountCents: number;
  status: 'Pending' | 'Validated' | 'Failed';
}

export type InteractionChannel = 'Voice' | 'WhatsApp' | 'SMS' | 'Email' | 'WebChat' | 'USSD' | 'Telegram';

export interface AgenticLog {
  id: string;
  timestamp: string;
  channel: InteractionChannel;
  customerName: string;
  intent: string;
  reasoning: string;
  actionTaken: string;
  policyApplied: string;
  outcome: 'Resolved' | 'Escalated' | 'Pending Approval';
  language: string;
}

export type OrganizationType = 'Banking' | 'Catering' | 'Retail' | 'Service' | 'General' | 'Logistics' | 'Healthcare' | 'Education' | 'Manufacturing' | 'Marketing Agency' | 'SDR';
export type AppModule = 'CRM' | 'Inventory' | 'Catering' | 'Finance' | 'Automation' | 'ContactCenter' | 'TeamChat' | 'Reports' | 'HR' | 'Projects' | 'Agents' | 'Accounting';
export type CompanySize = 'Micro (1-10)' | 'Small (11-50)' | 'Medium (51-250)' | 'Large (250+)';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  companyId: string;
  status?: 'Active' | 'On Leave' | 'Terminated';
}

export interface Contact { 
  id: string; 
  name: string; 
  type: 'Company' | 'Individual';
  companyId: string; 
  email: string; 
  phone: string; 
  sentimentScore: number; 
  industry?: string;
  registrationNumber?: string;
  contactPerson?: string;
  address?: string;
  jobTitle?: string;
}

export interface Invoice { 
  id: string; 
  number: string; 
  companyId: string; 
  date: string; 
  dueDate: string; 
  status: InvoiceStatus; 
  lines: { id: string; description: string; quantity: number; unitPriceCents: number; }[]; 
  totalCents: number; 
  paidAmountCents: number; 
  firs_data?: FIRSInvoice; 
}

export enum InvoiceStatus { PAID = 'Paid', UNPAID = 'Unpaid', OVERDUE = 'Overdue' }

export interface Requisition { 
  id: string; 
  type: 'Purchase' | 'Release' | 'Rental' | 'Hiring'; 
  category: 'Food' | 'Hardware' | 'Service'; 
  itemName: string; 
  quantity: number; 
  pricePerUnitCents: number; 
  totalAmountCents: number; 
  requestorId: string; 
  status: 'Pending' | 'Approved' | 'Paid'; 
  itemId?: string;
  supplierId?: string;
  eventId?: string;
}

export interface InventoryItem { 
  id: string; 
  name: string; 
  category: string; 
  priceCents: number; 
  costPriceCents?: number; 
  image?: string; 
  portionSize?: string; 
  isMenuItem?: boolean; 
  recipe?: { ingredientId: string; quantity: number }[];
  marketInsight?: MarketInsight;
}

export interface MarketInsight {
  marketPriceCents: number;
  sources: { title: string; uri: string; price: number }[];
  trend: 'UP' | 'DOWN' | 'STABLE';
  reasoning: string;
  lastScoured: string;
}

export interface Ingredient { 
  id: string; 
  name: string; 
  unit: string; 
  currentCostCents: number; 
  category: string; 
  lastUpdated: string; 
  marketInsight?: MarketInsight;
}

export interface CateringEvent { 
  id: string; 
  customerName: string; 
  eventDate: string; 
  guestCount: number; 
  status: 'Draft' | 'Confirmed'; 
  readinessScore?: number; 
  tasks?: EventTask[]; 
  financials?: {
    revenueCents: number;
    directCosts: { foodCents: number; labourCents: number; energyCents: number; carriageCents: number };
    indirectCosts: { adminCents: number; marketingCents: number; waitersCents: number; logisticsCents: number };
    netProfitMargin: number;
  }; 
  items: DealItem[]; 
  banquetDetails?: any; 
}

export interface EventTask { 
  id: string; 
  phase: string; 
  name: string; 
  ownerRole: string; 
  dueDate: string; 
  status: 'Pending' | 'In Progress' | 'Completed'; 
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Todo' | 'In Progress' | 'Review' | 'Done' | 'Pending' | 'Completed';
  createdDate?: string;
}

export interface Project { 
  id: string; 
  name: string; 
  clientContactId: string; 
  status: 'Planning' | 'Active' | 'Delayed' | 'Completed' | 'Archived'; 
  startDate: string; 
  endDate: string; 
  budgetCents: number; 
  progress: number; 
  tasks: ProjectTask[]; 
  aiAlerts: ProjectAIAlert[]; 
}

export interface ProjectTask { 
  id: string; 
  projectId: string; 
  title: string; 
  description: string; 
  status: 'Todo' | 'In Progress' | 'Review' | 'Done'; 
  priority: 'Low' | 'Medium' | 'High' | 'Critical'; 
  assigneeId: string; 
  startDate: string; 
  endDate: string; 
}

export interface ProjectAIAlert {
  id: string;
  timestamp: string;
  type: 'Info' | 'Critical';
  message: string;
  actionTaken: string;
  channelUsed: InteractionChannel[];
}

export enum EmployeeStatus { ACTIVE = 'Active', PROBATION = 'Probation', LEFT = 'Left' }
export interface Employee {
  id: string; firstName: string; lastName: string; email: string; role: string; departmentId: string; salaryCents: number; avatar: string; status: EmployeeStatus;
  leaveBalance: { annual: number; sick: number; casual: number }; onHealthScheme: boolean;
}

export interface PayrollItem { id: string; employeeId: string; employeeName: string; grossCents: number; basicCents: number; housingCents: number; transportCents: number; pensionEmployeeCents: number; pensionEmployerCents: number; taxCents: number; nhfCents: number; netCents: number; anomalies: string[]; }

export type MarketingChannel = 'Blog' | 'Twitter' | 'LinkedIn' | 'Newsletter' | 'Instagram';
export interface MarketingPost { id: string; type: MarketingChannel; title: string; content: string; status: 'Draft' | 'Scheduled' | 'Published'; scheduledDate: string; generatedByAI: boolean; engagement?: { views: number; interactions: number }; }

export interface SocialInteraction { id: string; platform: MarketingChannel; user: string; handle: string; timestamp: string; sentiment: 'Positive' | 'Negative' | 'Neutral'; content: string; aiAnalysis: string; suggestedResponse: string; status: 'New' | 'Actioned' | 'Dismissed'; }

export interface BankTransaction { id: string; date: string; description: string; amountCents: number; type: 'Credit' | 'Debit'; category: string; }
export interface Ticket { id: string; ticketNumber: string; contactId: string; subject: string; description: string; status: string; priority: string; progress: number; attachments: any[]; createdDate: string; }
export interface Attachment { id: string; type: string; url: string; name: string; }
export type DealStage = 'Lead' | 'Proposal' | 'Negotiation' | 'Won';
export interface Deal { id: string; name: string; contactId: string; valueCents: number; stage: DealStage; items: DealItem[]; expectedCloseDate: string; }
export interface DealItem { inventoryItemId: string; name: string; quantity: number; priceCents: number; costCents: number; }
export interface Department { id: string; name: string; }
export interface SalaryBand { id: string; label: string; minCents: number; maxCents: number; departmentId: string; }
export interface Workflow { id: string; name: string; trigger: string; status: 'Active' | 'Inactive'; lastRun?: string; logs: string[]; agentName: string; agentRole: string; }

export interface AIAgent {
  id: string;
  name: string;
  title: string;
  industry: OrganizationType;
  objective: string;
  voice: { name: string; accent: string; traits: string[]; speed: number; };
  telephony: { phoneNumber: string; areaCode: string; liveTransferNumber: string; callbackEnabled: boolean; };
  intelligence: { kycQuestions: string[]; guardrails: string[]; script: string; };
  pipelineStageId: string;
  status: 'Deployed' | 'Training' | 'Idle';
}

export interface OrganizationSettings {
  id: string;
  name: string;
  type: OrganizationType;
  currency: string;
  setupComplete: boolean;
  enabledModules: AppModule[];
  agentMode: AIAgentMode;
  brandColor: string;
  firs_tin?: string;
  annual_turnover_cents?: number;
  integrations: string[];
  apiKeys: { label: string; key: string }[];
  logo?: string;
  address?: string;
  contactPhone?: string;
  contactPerson?: { name: string; email: string; jobTitle: string };
  size?: CompanySize;
}

export interface BookkeepingEntry {
  id: string;
  date: string;
  type: 'Inflow' | 'Outflow';
  category: string;
  description: string;
  amountCents: number;
  referenceId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'In' | 'Out';
  quantity: number;
  date: string;
  reference?: string;
}

export interface BanquetFormDetails {
  customerDetails: string;
  location: string;
  contactPerson: string;
  phone: string;
  occasion: string;
  colorTheme: string;
  eventDate: string;
  guestCount: number;
  selectedItems: { itemId: string; qty: number }[];
}

export interface Integration {
  id: string;
  name: string;
  icon: any;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'Annual' | 'Sick' | 'Casual';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
}
