# PXI-OS: The AI-Native Enterprise Operating System

## Executive Summary
PXI-OS is not just an ERP; it is an **Intelligent Operating System** designed for high-complexity service industries (Catering, Aviation, Logistics). Unlike traditional static software, PXI-OS integrates **Agentic AI** at its core to automate decision-making, ground financial data in real-time market realities, and unify operations from the warehouse floor to the executive dashboard.

## Core Architecture
*   **Cloud-First & Real-Time**: Built on **Supabase** (PostgreSQL), ensuring data availability, security (Row Level Security), and real-time synchronization across all devices.
*   **Offline-Ready**: Utilizes optimistic state management, allowing field operations (e.g., warehouse scans, event loggings) to safely continue without internet and sync automatically upon reconnection.
*   **Security-First**: Enterprise-grade Role-Based Access Control (RBAC) ensuring strict data segregation between departments (Finance, HR, Kitchen, Logistics).

## Key Modules & Capabilities

### 1. Inventory Intelligence Engine
Far beyond simple stock counting, this module acts as the "Brain" of physical assets.
*   **Dynamic Taxonomy**: Segments inventory into **Products** (Sales), **Ingredients** (Raw Materials), **Assets** (Reusable Hardware), and **Rentals**.
*   **Neural BoQ Analysis**: Automatically breaks down "Products" into their constituent components (Bill of Quantities) to calculate precise unit costs.
*   **AI Market Grounding**: Connects to external market data to validate if your internal costs match real-world prices, alerting you to inflation or supplier overcharging.
*   **Smart Document Capture**: Built-in OCR allows staff to scan handwritten lists, invoices, or receipts directly into digital ledgers.

### 2. Operational Finance & Cost Control
*   **Live Gross Margin Tracking**: Because inventory acts as the ledger, PXI-OS calculates exact Gross Margins on every event or sale in real-time based on the actual cost of ingredients/assets used.
*   **Requisition Workflows**: Strict "Request -> Approve -> Release" pipelines for Kitchen and Logistics to prevent pilferage.
*   **Automated Invoicing**: seamlessly converts operational events (like a Catering function) into generated invoices.

### 3. Human Capital & Performance Matrix
*   **Metric-Driven HR**: Employees are distinct "Nodes" with defined Roles, Salary Bands, and KPIs.
*   **360° Performance Reviews**: Digitized self-assessments and supervisor reviews that feed directly into the organization's talent matrix.
*   **Strict Mode**: Global switches to enforce or relax operational constraints (e.g., "No dispatch without approval").

### 4. Specialized Vertical: Event & Catering Management
*   **Event Lifecycle**: Manages the entire flow from "Draft Proposal" to "Execution" to "Reconciliation".
*   **Portion Monitor**: A dedicated tablet interface for Head Waiters to track food service per table, minimizing waste and ensuring guest satisfaction.
*   **Rental/Asset Ledgers**: Tracks every fork, spoon, or chair sent to an event, calculating "Event Liability" for broken or lost items.

## The "Agentic" Advantage
PXI-OS deploys **AI Agents**—autonomous software workers—that monitor specific domains:
*   **Asset Guardian**: Monitors rental return deadlines and flags overdue items.
*   **Procurement Bot**: Can analyze supplier trends.
*   **Chef Intelligence**: Suggests recipe adjustments based on stock levels.

## Technical Value Proposition
*   **Scalability**: Designed to handle multi-tenant organizations or massive single-entity operations.
*   **Speed**: Optimized React frontend ensures instant page loads and fluid animations.
*   **Integrity**: Database constraints and RLS policies ensure data is never corrupted, even in high-concurrency environments.

---
*Built for the future of operations.*
