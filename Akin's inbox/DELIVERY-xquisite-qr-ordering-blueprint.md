# 📦 DELIVERY: Xquisite Live Event QR Seat Ordering System Architecture (Banquet Orders Only)

> [!IMPORTANT]
> **Status**: SCOPED TO BANQUET ORDERS SECTION ONLY  
> **Prepared by**: Prof (Personal Assistant Orchestrator) with Nexus, Nova, Apex, & Vault  
> **Target System**: Paradigm OS Core — Xquisite Celebrations Workspace (`FulfillmentHub`)  
> **Target Section**: **Banquet Orders Section Only** (`orderType === 'Banquet'`)  
> **Timestamp**: 2026-09-23  

---

## 🎯 Executive Overview

To transform event operations for **Xquisite Celebrations**, we are introducing **Guest-Self Ordering via Seat QR Codes**, specifically scoped **for the Banquet Orders section for now**. 

For any **Banquet Order** (e.g. Banquet Catering Events), guests at their tables simply scan a stylized QR card. The menu presented to guests is **strictly locked to what the host contracted and paid for** for that specific Banquet event (`event.items` / `invoice.lines`). Guests select their preferred choices, and orders instantly stream to the **Banquet Fulfillment KDS Terminal** in `FulfillmentHub` with the exact **Table Number** and **Seat ID**.

---

## 🛠️ Step-by-Step Architecture & How It Works

```
  +--------------------------------+      Scans QR Code      +--------------------------------+
  |  Banquet Table QR Stand /      | ----------------------> | Guest Mobile Web App           |
  |  Seat Card (Table 4)           |                         | (No Download / No Login Req.)  |
  +--------------------------------+                         +--------------------------------+
                                                                             |
                                                                             | Loads Banquet Menu (Paid Items Only)
                                                                             v
  +--------------------------------------------------+        +-------------------------------+
  | FulfillmentHub — Banquet Live KDS / Waiter Board | <----- | Supabase Real-Time Broadcast  |
  | (Waiters see Table 4, Seat B Banquet Order)      |        | (Event-Scoped Security Token) |
  +--------------------------------------------------+        +-------------------------------+
```

### 1. Banquet Event Setup & QR Generator (Apex & Nexus)
- **Scope Lock**: Feature controls appear **exclusively on Banquet Orders** (`orderType === 'Banquet'`) inside `FulfillmentHub.tsx`.
- **Table/Seat Configuration**: Event Manager configures table counts (e.g., 25 tables, 10 seats/table).
- **One-Click Banquet QR Export**: Click **"Generate Banquet QR Package"** to download formatted printable table/seat QR cards.

### 2. Host-Paid Banquet Menu Scoping (Nexus & Nova)
- **Strict Menu Filtering**: When `/event/:eventId/order` initializes for a Banquet event, it queries `event.items` (the agreed banquet package).
- **Zero Catalog Leakage**: Only dishes and drinks paid for by the host appear on the guest menu (e.g., 2 main dish choices, 3 drink choices, 1 dessert choice).

### 3. Frictionless Guest Experience — Zero App Download (Nova)
- **Instant Camera Scan**: Guest scans QR card with phone camera.
- **Pre-filled Context**: *"Welcome to the Johnson Banquet! You are seated at Table 4, Seat B."*
- **One-Tap Order Confirmation**: Guest picks choices, adds notes (e.g. *"No Pepper"*), and places order with live status updates (`Received` ➔ `Preparing` ➔ `En Route`).

### 4. Banquet Waiter & Kitchen Dispatch Board (Nexus & Nova)
- **Live Terminal in FulfillmentHub Banquet Section**: Real-time chime alert and flashing order card whenever a guest orders.
- **Waiter Claim & Delivery**: Waiter taps *"Claim Order"*, serves Table 4 / Seat B, and marks as *"Delivered"*.

---

## 📋 Recommended Implementation Phases

| Phase | Milestone | Primary Specialist | Deliverable |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Banquet Model & Paid Menu Scoper** | Nexus & Apex | Scope lock to `orderType === 'Banquet'`, `getBanquetGuestMenu()`, & Printable QR Card Exporter |
| **Phase 2** | **Banquet Guest Web Portal** | Nova | Standalone `/event/:id/order` page displaying paid Banquet menu items |
| **Phase 3** | **FulfillmentHub Banquet KDS** | Nova & Nexus | Live Banquet order queue tab in `FulfillmentHub` with chime notifications |
| **Phase 4** | **Field Testing & Security Audit** | Vault & Apex | Security hardening & Banquet event time-fencing |

---
*Delivered to Akin's Inbox by Prof.*
