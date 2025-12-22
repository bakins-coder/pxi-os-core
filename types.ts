
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

export type InteractionChannel = 'Voice' | 'WhatsApp' | 'SMS' | 'Email' | 'WebChat' | 'USSD' | 'Telegram';

export interface AIPolicyRule {
  id: string;
  action: string;
  condition: string;
  requiresApproval: boolean;
  status: 'Active' | 'Inactive';
}

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
export type AppModule = 'CRM' | 'Inventory' | 'Catering' | 'Finance' | 'Automation' | 'ContactCenter' | 'TeamChat' | 'Reports' | 'HR' | 'Projects' | 'Agents';
export type CompanySize = 'Micro (1-10)' | 'Small (11-50)' | 'Medium (51-250)' | 'Large (250+)';

export interface AIAgent {
  id: string;
  name: string;
  title: string;
  industry: OrganizationType;
  objective: 'Community Update' | 'Lead Reactivation' | 'Speed to Lead' | 'Appointment Setting';
  voice: {
    name: string;
    accent: string;
    traits: string[];
    speed: number; // 0.5 to 2.0
  };
  telephony: {
    phoneNumber: string;
    areaCode: string;
    liveTransferNumber: string;
    callbackEnabled: boolean;
  };
  intelligence: {
    kycQuestions: string[];
    guardrails: string[];
    script: string;
  };
  pipelineStageId: string;
  status: 'Deployed' | 'Training' | 'Idle';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  companyId: string;
  status?: 'Active' | 'On Leave' | 'Terminated';
  groups?: string[];
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
  dependencies?: string[];
}

export interface Project {
  id: string;
  name: string;
  clientContactId: string;
  status: 'Planning' | 'Active' | 'Delayed' | 'Completed' | 'Archived';
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  tasks: ProjectTask[];
  aiAlerts: ProjectAIAlert[];
}

export interface ProjectAIAlert {
  id: string;
  timestamp: string;
  type: 'Info' | 'Warning' | 'Critical';
  message: string;
  actionTaken: string;
  channelUsed: InteractionChannel[];
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  contactId: string;
  subject: string;
  description: string;
  status: 'Open' | 'Resolved' | 'Pending' | 'Escalated';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  progress: number;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  name: string;
}

export interface QualityScorecard {
  id: string;
  interactionId: string;
  agentId: string;
  timestamp: string;
  scores: { communication: number; problemSolving: number; policyAdherence: number; resolutionEffectiveness: number };
  totalScore: number;
  aiFeedback: string;
  sentimentScore: number;
  escalated: boolean;
  escalationChannel?: string;
}

export interface Contact { 
  id: string; 
  name: string; 
  type: 'Company' | 'Individual';
  companyId: string; 
  email: string; 
  phone: string; 
  sentimentScore: number; 
  source?: string;
  industry?: string;
  registrationNumber?: string;
  contactPerson?: string;
  jobTitle?: string;
  address?: string;
  tags?: string[];
}

export interface Task { id: string; title: string; description: string; assigneeId: string; contactId?: string; dueDate: string; status: 'Pending' | 'In Progress' | 'Completed'; priority: 'Low' | 'Medium' | 'High'; createdDate?: string; }

export interface Integration {
  id: string;
  name: string;
  provider: string;
  category: string;
  status: 'Connected' | 'Disconnected';
  lastSync?: string;
}

export interface ApiKey {
  label: string;
  key: string;
}

export interface OrganizationSettings { 
  id: string; 
  name: string; 
  type: OrganizationType; 
  currency: string; 
  setupComplete: boolean; 
  enabledModules: AppModule[]; 
  agentMode: AIAgentMode; 
  brandColor?: string;
  logo?: string;
  contactPerson?: {
    name: string;
    email: string;
    jobTitle: string;
  };
  address?: string;
  contactPhone?: string;
  size?: CompanySize;
  integrations: Integration[];
  apiKeys: ApiKey[];
}

export enum EmployeeStatus {
  ACTIVE = 'Active',
  PROBATION = 'Probation',
  LEFT = 'Left'
}

export interface PerformanceRecord {
  id: string;
  date: string;
  score: number;
  notes: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  departmentId: string;
  salary: number;
  avatar: string;
  status: EmployeeStatus;
  performanceRecords: PerformanceRecord[];
  leaveBalance: { annual: number; sick: number; casual: number };
  onHealthScheme: boolean;
  address?: string;
  phone?: string;
  nextOfKin?: string;
  taxRecords?: string;
  notes?: string;
  salaryBandId?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface SalaryBand {
  id: string;
  label: string;
  min: number;
  max: number;
  departmentId: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ExternalStaff {
  id: string;
  name: string;
}

export enum InvoiceStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  OVERDUE = 'Overdue'
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number: string;
  companyId: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  total: number;
  paidAmount: number;
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

export interface Requisition {
  id: string;
  type: 'Purchase' | 'Release' | 'Rental' | 'Hiring';
  category: 'Food' | 'Hardware' | 'Service';
  itemId?: string;
  itemName: string;
  quantity: number;
  supplierId?: string;
  pricePerUnit: number;
  totalAmount: number;
  eventId?: string;
  requestorId: string;
  status: 'Pending' | 'Approved' | 'Paid';
}

export interface BookkeepingEntry {
  id: string;
  date: string;
  type: 'Inflow' | 'Outflow';
  category: string;
  description: string;
  amount: number;
  referenceId?: string;
}

export type DealStage = 'Lead' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface DealItem {
  inventoryItemId: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: DealStage;
  contactId: string;
  companyId: string;
  expectedCloseDate: string;
  items: DealItem[];
  activityLogs?: { date: string; description: string }[];
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  status: 'Active' | 'Inactive';
  lastRun?: string;
  logs: string[];
  agentName: string;
  agentRole: string;
}

export type MarketingChannel = 'Blog' | 'Twitter' | 'LinkedIn' | 'Newsletter' | 'Instagram';

export interface MarketingPost {
  id: string;
  type: MarketingChannel;
  title: string;
  content: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  scheduledDate: string;
  generatedByAI: boolean;
  engagement?: { views: number; interactions: number };
}

export interface SocialInteraction {
  id: string;
  platform: MarketingChannel;
  user: string;
  handle: string;
  timestamp: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  content: string;
  aiAnalysis: string;
  suggestedResponse: string;
  status: 'New' | 'Actioned' | 'Dismissed';
}

export interface RecipeComponent {
  ingredientId: string;
  quantity: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentCost: number;
  category: string;
  lastUpdated: string;
  costPrice: number;
}

export interface HardwareItem {
  id: string;
  name: string;
  category: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice?: number;
  recipe?: RecipeComponent[];
  image?: string;
  portionSize?: string;
  isMenuItem?: boolean;
}

export interface InventoryMovement {
  id: string;
  date: string;
  itemId: string;
  quantity: number;
  type: 'In' | 'Out';
  reason: string;
}

export interface EventTask {
  id: string;
  phase: string;
  name: string;
  ownerRole: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface CateringEvent {
  id: string;
  customerName: string;
  eventDate: string;
  guestCount: number;
  status: 'Draft' | 'Confirmed';
  banquetDetails?: any;
  readinessScore?: number;
  tasks?: EventTask[];
  financials?: {
    revenue: number;
    directCosts: { food: number; labour: number; energy: number; carriage: number };
    indirectCosts: { admin: number; marketing: number; waiters: number; logistics: number };
    netProfitMargin: number;
  };
  items: DealItem[];
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

export interface PayrollItem {
  id: string;
  employeeId: string;
  employeeName: string;
  gross: number;
  basic: number;
  housing: number;
  transport: number;
  pensionEmployee: number;
  pensionEmployer: number;
  tax: number;
  nhf: number;
  net: number;
  anomalies: string[];
}
