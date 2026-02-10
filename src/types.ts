export enum Role {
  SUPER_ADMIN = 'Super Admin',
  CEO = 'Chief Executive Officer',
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
  CHEF = 'Chef',
  COOK = 'Cook',
  KITCHEN_MANAGER = 'Kitchen Manager',
  PROCUREMENT = 'Procurement Officer',
  LOGISTICS = 'Logistics Manager',
  LOGISTICS_OFFICER = 'Logistics Officer',
  EVENT_MANAGER = 'Event Manager',
  EVENT_COORDINATOR = 'Event Coordinator',
  BANQUET_MANAGER = 'Banquet Manager',
  STOCK_KEEPER = 'Stock Keeper',
  SALES = 'Sales',
  DRIVER = 'Driver',
  HEAD_WAITER = 'Head Waiter',
  FINANCE_OFFICER = 'Finance Officer',
  CHAIRMAN = 'Chairman'
}

export enum AIAgentMode {
  HUMAN_FIRST = 'Human-First',
  AI_AGENTIC = 'AI-Agentic (Autonomous)',
  HYBRID = 'Hybrid-Assisted'
}

export type CateringPhase = 'Planning' | 'Procurement' | 'Execution' | 'PostEvent';

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum LeaveType {
  ANNUAL = 'Annual',
  CASUAL = 'Casual (Short)',
  SICK = 'Sick',
  MATERNITY = 'Maternity',
  PATERNITY = 'Paternity',
  COMPASSIONATE = 'Compassionate',
  UNPAID = 'Unpaid'
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  approvedBy?: string;
  calendarSynced?: boolean;
}

export interface SalaryRange {
  low: number;
  mid: number;
  high: number;
}

export interface DepartmentRole {
  title: string;
  band: number;
  salaryRange: SalaryRange;
  permissions?: string[];
}

export interface DepartmentMatrix {
  id: string;
  name: string;
  roles: DepartmentRole[];
}

export interface RecipeIngredient {
  name: string;
  qtyPerPortion: number;
  unit: string;
  priceSourceQuery: string;
  scaling_tiers?: Record<string, number>;
  subRecipeGroup?: string; // e.g. "Jollof Rice", "Special Fried Rice"
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  portions: number[];
  ingredients: RecipeIngredient[];
}

export interface Ingredient {
  id: string;
  companyId: string;
  name: string;
  unit: string;
  currentCostCents: number;
  marketPriceCents?: number;
  stockLevel: number;
  category: string;
  lastUpdated: string;
  priceSourceQuery?: string;
  marketInsight?: {
    marketPriceCents: number;
    groundedSummary: string;
    sources?: { title: string; uri: string }[];
  };
  image?: string;
}

export interface ItemCosting {
  inventoryItemId: string;
  name: string;
  totalIngredientCostCents: number;
  revenueCents: number;
  grossMarginCents: number;
  grossMarginPercentage: number;
  ingredientBreakdown: {
    name: string;
    qtyRequired: number;
    qtyPerPortion: number; // Added for transparency
    unit: string;
    unitCostCents: number;
    totalCostCents: number;
    scalingTierUsed?: string;
    subRecipeGroup?: string;
  }[];
}

export interface HardwareCheckoutRecord {
  inventoryItemId: string;
  itemName: string;
  qtyOut: number;
  qtyReturned: number;
  qtyBroken: number;
  qtyLost: number;
  reconciled: boolean;
}

export interface EventTask {
  id: string;
  phase: CateringPhase;
  name: string;
  ownerRole: Role;
  dueDate: string;
  dueTime: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Breached';
  escalated: boolean;
}

export interface BanquetDetails {
  location?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  eventType?: string;
  themeColor?: string;
  eventPlanner?: string;
  notes?: string;
  productionConfirmed?: boolean;
}

export interface DispatchedAsset {
  itemId: string;
  name: string;
  quantity: number;
  dispatchedAt: string;
}

export interface LogisticsReturn {
  itemId: string;
  name: string;
  dispatchedQty: number;
  returnedQty: number;
  missingQty: number;
  brokenQty: number;
  notes?: string;
}

export interface PortionMonitor {
  eventId: string;
  tables: ServingTable[];
  leftovers: { itemId: string; name: string; quantity: number; reason: string; loggedAt: string }[];
  handoverEvidence: { url: string; note: string; timestamp: string }[];
  handoverNotes?: string;
  handoverSignedBySupervisor?: string;
  handoverSignedByHost?: string;
  handoverDate?: string;
}

export interface CateringEvent {
  id: string;
  companyId: string;
  customerName: string;
  contactId?: string;
  eventDate: string;
  endDate?: string;
  location?: string;
  guestCount: number;
  status: 'Draft' | 'Confirmed' | 'In Transit' | 'Setting Up' | 'Serving' | 'Completed' | 'Archived';
  currentPhase: CateringPhase;
  readinessScore: number;
  items: DealItem[];
  orderType?: 'Banquet' | 'Cuisine';
  tasks: EventTask[];
  hardwareChecklist: HardwareCheckoutRecord[];
  dispatchedAssets?: DispatchedAsset[];
  logisticsReturns?: LogisticsReturn[];
  reconciliationStatus?: 'Pending' | 'Balanced' | 'Discrepancy' | 'Shortage';
  costingSheet?: {
    itemCostings: ItemCosting[];
    aggregateGrossMarginCents: number;
    aggregateGrossMarginPercentage: number;
    totalIndirectCostsCents: number;
    projectedNetMarginCents: number;
    projectedNetMarginPercentage: number;
  };
  financials: {
    revenueCents: number;
    directCosts: { foodCents: number; labourCents: number; energyCents: number; carriageCents: number };
    indirectCosts: { adminCents: number; marketingCents: number; waitersCents: number; logisticsCents: number };
    netProfitMargin: number;
    invoiceId?: string; // Link to the main sales invoice
  };
  banquetDetails?: BanquetDetails;
  portionMonitor?: PortionMonitor;
}

export interface Seat {
  id: string;
  number: number;
  servingCount: number;
  status: 'Empty' | 'Occupied';
  servedItems: { itemId: string; name: string; quantity: number }[];
}

export interface ServingTable {
  id: string;
  name: string;
  assignedGuests: number;
  assignedWaiterId?: string;
  status: 'Waiting' | 'Served' | 'Partially Served';
  servedItems: { itemId: string; name: string; quantity: number; servedAt: string }[];
  isLocked: boolean;
  seats: Seat[];
}

export interface PortionMonitor {
  eventId: string;
  tables: ServingTable[];
  leftovers: { itemId: string; name: string; quantity: number; reason: string; loggedAt: string }[];
  handoverEvidence: { url: string; note: string; timestamp: string }[];
  handoverNotes?: string;
  handoverSignedBySupervisor?: string;
  handoverSignedByHost?: string;
  handoverDate?: string;
}

// REFACTOR: New Taxonomy
export type InventoryType = 'product' | 'ingredient' | 'reusable' | 'rental' | 'asset' | 'fixture' | 'raw_material'; // Extended types

export interface InventoryItem {
  id: string;
  companyId: string;
  name: string;
  category: string;
  type: InventoryType;
  priceCents: number;
  costPriceCents?: number;
  image?: string;
  description?: string;
  recipeId?: string;
  stockQuantity: number;
  // Specific fields for different types
  unitId?: string;
  sku?: string;
  isActive?: boolean;
  supplierId?: string;
  replacementCostCents?: number;
  // Legacy Flags 
  isAsset?: boolean;
  isRental?: boolean;
  rentalVendor?: string;
}


export interface InteractionLog {
  id: string;
  contactId: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Note';
  summary: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt?: string;
  organizationId: string;
  type?: 'text' | 'image' | 'system';
  status?: 'sent' | 'delivered' | 'read';
}

export interface InventoryViewItem {
  organization_id: string;
  item_id: string;
  location_id: string;
  location_name: string;
  quantity_on_hand: number;
  total_quantity: number;
}

export interface MovementParams {
  orgId: string;
  itemId: string;
  delta: number;
  unitId: string;
  type: string;
  refType: string;
  refId: string;
  locationId: string;
  notes?: string;
  // Ingredient specific
  unitCostCents?: number;
  expiresAt?: string;
}

export type CustomerType = 'Individual' | 'Corporate';
export type ContactCategory = 'Customer' | 'Supplier' | 'Bank_Partner' | 'Vendor' | 'Employee';



export interface DocumentLink {
  name: string;
  url: string;
  date: string;
}

export interface Contact {
  id: string;
  name: string;
  category: ContactCategory; // New
  customerType?: CustomerType; // New
  // Legacy mapping
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
  preferences?: Record<string, any>;
  documentLinks?: DocumentLink[];
}
export interface DealItem { inventoryItemId: string; name: string; quantity: number; priceCents: number; costCents: number; }
export interface OrganizationSettings { id: string; name: string; type: string; currency: string; setupComplete: boolean; enabledModules: string[]; agentMode: AIAgentMode; brandColor: string; firs_tin?: string; annual_turnover_cents?: number; integrations: string[]; apiKeys: { label: string; key: string }[]; logo?: string; address?: string; contactPhone?: string; contactPerson?: { name: string; firstName?: string; middleName?: string; lastName?: string; title?: string; gender?: 'Male' | 'Female'; email: string; jobTitle: string }; size?: string; bankInfo?: { bankName: string; accountName: string; accountNumber: string; }; }
export interface User { id: string; name: string; email: string; role: Role; avatar: string; companyId?: string; isSuperAdmin?: boolean; permissionTags?: string[]; staffId?: string; }
export interface BookkeepingEntry { id: string; date: string; type: 'Inflow' | 'Outflow'; category: string; description: string; amountCents: number; referenceId?: string; contactId?: string; }

export interface Requisition {
  id: string;
  type: 'Purchase' | 'Release' | 'Rental' | 'Hiring' | 'Loan';
  category: 'Food' | 'Hardware' | 'Service' | 'Financial';
  itemName: string;
  ingredientId?: string;
  quantity: number;
  pricePerUnitCents: number;
  totalAmountCents: number;
  requestorId: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  referenceId?: string;
  notes?: string;
}

export interface RentalRecord {
  id: string;
  requisitionId: string;
  eventId: string;
  itemName: string;
  quantity: number;
  estimatedReplacementValueCents: number;
  rentalVendor: string;
  status: 'Issued' | 'Returned' | 'Damaged' | 'Lost';
  dateIssued: string;
  dateReturned?: string;
  notes?: string;
}

export interface Ticket { id: string; ticketNumber: string; contactId: string; subject: string; description: string; status: string; priority: string; progress: number; attachments: any[]; createdDate: string; }

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeRole?: Role;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Todo' | 'In Progress' | 'Review' | 'Done' | 'Pending' | 'Completed';
  projectId?: string;
  createdDate?: string;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  clientContactId: string;
  status: 'Planning' | 'Active' | 'Delayed' | 'Completed' | 'Archived';
  startDate: string;
  endDate: string;
  budgetCents: number;
  progress: number;
  tasks: Task[];
  aiAlerts: any[];
  referenceId?: string;
}

export interface AIAgent { id: string; companyId: string; name: string; title: string; industry: string; objective: string; voice: { name: string; accent: string; traits: string[]; speed: number; }; telephony: { phoneNumber: string; areaCode: string; liveTransferNumber: string; callbackEnabled: boolean; }; intelligence: { kycQuestions: string[]; guardrails: string[]; script: string; }; status: 'Deployed' | 'Training' | 'Idle'; }
export interface ConversationLog { id: string; timestamp: string; channel: string; customerName: string; intent: string; reasoning: string; actionTaken: string; policyApplied: string; outcome: 'Resolved' | 'Escalated' | 'Pending Approval'; language: string; }
export interface MarketingPost { id: string; companyId: string; type: string; title: string; content: string; status: string; scheduledDate: string; generatedByAI: boolean; }
export interface SocialInteraction { id: string; platform: string; user: string; handle: string; timestamp: string; sentiment: string; content: string; aiAnalysis: string; suggestedResponse: string; status: string; }
export interface SocialPost { id: string; platform: string; title: string; content: string; scheduledDate: string; status: string; generatedByAI: boolean; }
export interface Workflow { id: string; name: string; trigger: string; status: 'Active' | 'Inactive'; lastRun?: string; logs: string[]; agentName: string; agentRole: string; }
export interface BankTransaction { id: string; companyId: string; date: string; description: string; amountCents: number; type: string; category: string; contactId?: string; }
export interface ChartOfAccount { id: string; companyId: string; code: string; name: string; type: string; subtype: string; balanceCents: number; currency: 'NGN' | 'USD'; }
export interface BankStatementLine { id: string; date: string; description: string; amountCents: number; type: 'Credit' | 'Debit'; isMatched: boolean; suggestedAccountId?: string; }
export enum InvoiceStatus { PAID = 'Paid', UNPAID = 'Unpaid', OVERDUE = 'Overdue', PROFORMA = 'Pro-forma' }

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  manualPriceCents?: number; // Optional override for line-item discount
}

export interface Invoice {
  id: string;
  number: string;
  companyId: string;
  contactId?: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  type: 'Sales' | 'Purchase';
  lines: InvoiceLine[];
  totalCents: number;
  subtotalCents?: number;
  serviceChargeCents?: number;
  vatCents?: number;
  paidAmountCents: number;
  manualSetPriceCents?: number;
  discountCents?: number;
  standardTotalCents?: number;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  quantity: number;
  type: 'In' | 'Out' | 'Breakage' | 'Loss' | 'Return';
  date: string;
  referenceId: string;
  notes?: string;
}

export interface Supplier { id: string; companyId: string; name: string; email: string; phone: string; address: string; }
export interface PayrollItem { id: string; employeeId: string; employeeName: string; grossCents: number; basicCents: number; housingCents: number; transportCents: number; pensionEmployeeCents: number; pensionEmployerCents: number; taxCents: number; nhfCents: number; punishmentDeductionCents: number; netCents: number; anomalies: string[]; }
export interface Deal { id: string; companyId: string; name: string; contactId: string; valueCents: number; stage: string; items: DealItem[]; expectedCloseDate: string; }
export enum EmployeeStatus { ACTIVE = 'Active', INACTIVE = 'Inactive', TERMINATED = 'Terminated' }
export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  title?: string; // e.g. Mr, Mrs, Dr, Chief
  email: string;
  phoneNumber?: string;
  dob: string;
  gender: 'Male' | 'Female';
  address?: string;
  dateOfEmployment: string;
  role: Role;
  salaryCents: number;
  status: EmployeeStatus;
  kpis: string[];
  avatar: string;
  staffId?: string; // Unique Login Identifier (e.g. XQ-8821)
  idCardIssuedDate?: string;
  healthNotes?: string;
  userId?: string;
}

export interface JournalEntry {
  id: string;
  transactionId: string;
  accountId: string;
  debitCents: number;
  creditCents: number;
  description?: string;
  isReconciled?: boolean;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  status: 'Draft' | 'Posted' | 'Archived';
  source: 'Manual' | 'BankFeed' | 'System';
  tenantId: string;
  entries: JournalEntry[];
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
  ntaClass: string;
  accumulatedAllowanceCents: number;
  status: 'Active' | 'Disposed';
}

export interface Department {
  id: string;
  name: string;
}

export interface SalaryBand {
  id: string;
  level: number;
  minCents: number;
  maxCents: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export type OrganizationType = 'General' | 'Banking' | 'Catering' | 'Retail' | 'Logistics' | 'Aviation' | 'Oil & Gas';
export type CompanySize = 'Micro (1-10)' | 'Small (11-50)' | 'Medium (51-250)' | 'Large (250+)';
export type AppModule = 'Accounting' | 'CRM' | 'Finance' | 'Automation' | 'Inventory' | 'Reports' | 'Catering' | 'Logistics' | 'HR';
export type MarketingChannel = 'Blog' | 'Social' | 'Email' | 'Ads';

export interface AgenticLog {
  id: string;
  timestamp: string;
  agentName: string;
  action: string;
  details: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  confidence: number;
  outcome?: string;
  intent?: string;
  policyApplied?: string;
  reasoning?: string;
}

export interface PerformanceMetric {
  name: string;
  type: 'KPI' | 'KPA';
  description?: string;
  weight: number; // Percentage 0-100
  target: string;
  actual: string;
  employeeScore: number; // 0-4
  supervisorScore: number; // 0-4
  finalScore: number; // Calculated or Overridden
  comments: string;
  managerOverrideReason?: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  metrics: PerformanceMetric[];
  totalScore: number;
  status: 'Draft' | 'Employee_Review' | 'Supervisor_Review' | 'Finalized';
  submittedDate?: string;
  finalizedDate?: string;
}