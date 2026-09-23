# Team Inbox: Xquisite Live Event QR Seat Ordering Architecture (Banquet Orders Only)

**Task ID**: `XQ-QR-SEAT-ORDER-001`  
**Priority**: High  
**Stakeholder**: Prof (Orchestrator)  
**Target Workspace**: Xquisite Celebrations (Paradigm OS Core)  
**Module Scope**: **Banquet Orders Section Only** (`orderType === 'Banquet'`)

---

## ⚠️ Core Scope & Requirement Directives
1. **Banquet Orders Only**: This QR guest seat ordering feature is enabled **EXCLUSIVELY for Banquet Orders** (`orderType === 'Banquet'`) in `FulfillmentHub`. Cuisine, Bakery, and Standard retail orders will not show QR event controls.
2. **Client-Paid Event Menu Scoping**: The guest web menu MUST strictly filter and display ONLY the specific dishes, beverages, and items contracted and paid for by the host for that specific Banquet event (`event.items` / `invoice.lines`). Guests MUST NOT see the full global catalog.

---

## Task Directives by Specialist

### 1. Nexus (Systems Architect & Life Ops Lead)
- **Objective**: Design Data Schema & Real-Time Sync Engine for Banquet Event Seat Ordering.
- **Key Requirements**:
  1. **Banquet Event Guard**: Restrict QR code generation & session token minting strictly to events where `event.orderType === 'Banquet'`.
  2. **Banquet Menu Scoping API**: Implement `getBanquetGuestMenu(eventId)` that queries `cateringEvents` + `invoices` to extract only paid line items for the banquet event.
  3. **Event Seat Mapping**: Extend `CateringEvent` model to support `TableConfig` (Table 1..N, Seats A..H).
  4. **Live Banquet Ticket Routing Engine**: Instant order dispatch to Waiter/Kitchen KDS view filtered by `eventId` and flagged as `Banquet Guest Order`.
- **Deliverable**: Data model specification & API contract for real-time WebSocket / Supabase Broadcast channels.

### 2. Nova (Web Visualization Specialist)
- **Objective**: Design the Guest Mobile-Web Menu & Ordering UX + Waiter Live Terminal for Banquet Orders.
- **Key Requirements**:
  1. **Banquet QR Action Button in FulfillmentHub**: Add "Generate Banquet QR Cards" button exclusively to Banquet Event cards in `FulfillmentHub.tsx`.
  2. **Instant Banquet Web Portal (`/event/:eventId/order?table=5&seat=B`)**: Ultra-fast loading, mobile-first design with high-end typography and dark/light ambient aesthetic.
  3. **Host-Curated Banquet Menu View**:
     - Displays ONLY the items host paid for in the Banquet order.
     - Visual category grouping (Mains, Drinks, Desserts) for the event's specific selection.
     - Custom preference options per item (e.g. "No Pepper", "Extra Ice").
  4. **Live Banquet Waiter Board**: Live order stream in `FulfillmentHub` Banquet section for waiters to claim orders and track table delivery status.
- **Deliverable**: UI Component Blueprint & Interaction Wireframe for Guest Menu & Banquet Order Terminal.

### 3. Apex (Mobile & Field Ops Specialist)
- **Objective**: QR Code Batch Generator & Mobile Camera Scanner Integration for Banquet Events.
- **Key Requirements**:
  1. **Printable Banquet QR Package**: Generate branded PDF/PNG table cards for Banquet events.
  2. **Native Mobile Camera Scanner**: Deep-link guest camera scans directly into the Banquet guest web ordering flow.
- **Deliverable**: Printable QR card generator utility specification.

### 4. Vault (DevOps & Security Lead)
- **Objective**: Guest Security & Banquet Event Fencing.
- **Key Requirements**:
  1. **Banquet Event Fencing**: QR links active strictly while Banquet Event status is `In-Progress`.
  2. **Rate Limiting & Anti-Spam**: Prevent guest order spamming per seat token.
- **Deliverable**: Security protocol document.

---
*Status: Updated by Prof following Akin's instruction to scope strictly to Banquet Orders.*
