# Catering Event Workflow: End-to-End Guide

This guide outlines the complete operational lifecycle of a catering event within PXI OS, mapping each stage to the responsible roles and system actions.

---

## Stage 1: Order Initiation & Menu Quotation
**Objective**: Transform a client inquiry into a formal quote.

| Role | Action | System Output |
| :--- | :--- | :--- |
| **Sales / Event Manager** | Select menu from `OrderBrochure`, set guest count, and event date. | New `CateringEvent` (Draft) & `Invoice` (Pro-forma) |
| **Sales** | Review and customize the Pro-forma Invoice for the client. | [proforma_preview.html](file:///c:/Users/akinb/pxi-os-core/proforma_preview.html) |

---

## Stage 2: Contract Confirmation
**Objective**: Secure the booking and initiate planning.

| Role | Action | System Output |
| :--- | :--- | :--- |
| **Sales / Finance** | Client confirms; finalize the Pro-forma Invoice. | Invoice status transitions to `Unpaid` |
| **Event Manager** | Review the generated **Project Hub** tasks for the event. | Automated tasks: "Procurement", "Mise en Place", etc. |

---

## Stage 3: Procurement & Resource Planning
**Objective**: Calculate exact resource needs and procure missing items.

| Role | Action | System Output |
| :--- | :--- | :--- |
| **Head Chef** | Use the `ProcurementWizard` to scale recipes to the guest count. | Bill of Quantities (BOQ) |
| **Procurement Officer** | Generate `Requisitions` for ingredients and external rentals. | Pending Requisitions & Purchase Orders |
| **Finance Manager** | Approve requisitions to release funds for purchase. | Paid Requisitions / Updated Stock Levels |

---

## Stage 4: Logistics & Asset Dispatch
**Objective**: Mobilize equipment and materials to the venue.

| Role | Action | System Output |
| :--- | :--- | :--- |
| **Stock Keeper** | Checkout items using the `AssetDispatchModal`. | Hardware Checklist updated (Qty Out) |
| **Logistics Manager** | Assign a **Driver** and vehicle to the event. | Logistics status: "In Transit" |

---

## Stage 5: Execution (Cooking & Service)
**Objective**: Real-time service delivery and monitoring.

| Role | Action | System Output |
| :--- | :--- | :--- |
| **Kitchen Manager** | Oversee "Mise en Place" and "Live Cooking". | Status: "Serving" |
| **Waiters / Supervisor**| Monitor table service via the `PortionMonitor`. | Real-time Table Serving Status |
| **Banquet Manager** | Ensure guest satisfaction and handle on-site requests. | Event Readiness Score updates |

---

## Stage 6: Recovery & Event Closure
**Objective**: Venue clear-out and return to base.

| Role | Action | System Output |
| :--- | :--- | :--- |
| **Logistics officer** | Scan/Log items returned vs issued in `LogisticsReturnModal`. | Loss/Breakage Report |
| **Event Coordinator** | Complete the **Handover Report** with the venue/host. | Digitally Signed Handover Evidence |

---

## Stage 7: Financial Reconciliation & Review
**Objective**: Final billing and performance audit.

| Role | Action | System Output |
| :--- | :--- | :--- |
| **Finance Officer** | Match final payments; reconcile asset loss costs. | Invoice status: `Paid` |
| **CEO / Admin** | Review event profitability and "Readiness Score" performance. | Event status: `Completed` & `Archived` |

---
> [!NOTE]
> Most transitions (e.g., transition from Pro-forma to Unpaid) trigger a background **Cloud Sync** to ensure data is updated across all connected devices in real-time.
