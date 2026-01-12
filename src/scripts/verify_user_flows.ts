
import { useDataStore } from '../store/useDataStore.ts';
import { useSettingsStore } from '../store/useSettingsStore.ts';
import { useAuthStore } from '../store/useAuthStore.ts';


// Mock LocalStorage for Zustand persist middleware
const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: function (key: string) {
            return store[key] || null;
        },
        setItem: function (key: string, value: string) {
            store[key] = value.toString();
        },
        removeItem: function (key: string) {
            delete store[key];
        },
        clear: function () {
            store = {};
        }
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

// Mock DOM for document.documentElement.style (used in Settings)
Object.defineProperty(global, 'document', {
    value: {
        documentElement: {
            style: {
                setProperty: () => { }
            }
        }
    }
});

async function runUserTest() {
    console.log("🚀 Starting User Flow Verification Simulation...\n");

    // 1. User Login Simulation
    console.log("👤 Step 1: User Login");
    const authStore = useAuthStore.getState();
    const mockUser = { id: 'u1', name: 'Test User', email: 'test@user.com', role: 'admin' as any };
    authStore.setUser(mockUser);

    if (useAuthStore.getState().user?.email === 'test@user.com') {
        console.log("   ✅ Login successful: User session active.");
    } else {
        console.error("   ❌ Login failed.");
    }

    // 2. Inventory Management
    console.log("\n📦 Step 2: Inventory - Adding Item");
    const dataStore = useDataStore.getState();
    const initialInvCount = dataStore.inventory.length;

    const newItem = {
        name: "Test Jollof Pack",
        category: "Food",
        priceCents: 250000, // 2500.00
        stockQuantity: 50,
        unit: "pack",
        minStockLevel: 10,
        companyId: "org-test"
    };

    dataStore.addInventoryItem(newItem as any);

    const updatedInv = useDataStore.getState().inventory;
    const addedItem = updatedInv.find(i => i.name === "Test Jollof Pack");

    if (updatedInv.length === initialInvCount + 1 && addedItem) {
        console.log("   ✅ Item added successfully:", addedItem.name);
        console.log(`   ℹ️  ID generated: ${addedItem.id}`);
    } else {
        console.error("   ❌ Failed to add inventory item.");
    }

    // 3. Requisition/Costing Check
    console.log("\n💰 Step 3: Requisition - Approving Request");
    const reqCount = dataStore.requisitions.length;
    // Add a dummy requisition first manually/via action if exists, or use existing mock
    // Let's add one
    dataStore.addRequisition({
        itemName: "Tomato Paste",
        quantity: 10,
        category: "Food",
        type: "Purchase",
        pricePerUnitCents: 500,
        totalAmountCents: 5000,
        referenceId: "ref-1",
        notes: "Urgent"
    } as any);

    const newReq = useDataStore.getState().requisitions.find(r => r.itemName === "Tomato Paste");
    if (newReq) {
        console.log("   ✅ Requisition created:", newReq.id);

        // Approve it
        dataStore.approveRequisition(newReq.id);
        const approvedReq = useDataStore.getState().requisitions.find(r => r.id === newReq.id);

        if (approvedReq?.status === 'Approved') {
            console.log("   ✅ Requisition approved successfully.");
        } else {
            console.error(`   ❌ Requisition approval failed. Status: ${approvedReq?.status}`);
        }
    } else {
        console.error("   ❌ Failed to create requisition.");
    }

    // 4. CRM Flow
    console.log("\n🤝 Step 4: CRM - Adding Contact");
    const contactCount = dataStore.contacts.length;
    const contact = {
        name: "Simulated Client",
        email: "client@sim.com",
        phone: "0800000000",
        type: "Individual"
    };

    dataStore.addContact(contact as any);
    const newContact = useDataStore.getState().contacts.find(c => c.name === "Simulated Client");

    if (newContact) {
        console.log("   ✅ Contact added:", newContact.name);

        // Delete it
        dataStore.deleteContact(newContact.id);
        const deletedContact = useDataStore.getState().contacts.find(c => c.id === newContact.id);
        if (!deletedContact) {
            console.log("   ✅ Contact deleted successfully.");
        } else {
            console.error("   ❌ Contact deletion failed.");
        }
    } else {
        console.error("   ❌ Failed to add contact.");
    }

    // 5. Settings Flow
    console.log("\n⚙️  Step 5: Settings - Brand Color");
    const settingsStore = useSettingsStore.getState();
    const oldColor = settingsStore.settings.brandColor;
    const newColor = "#123456";

    settingsStore.setBrandColor(newColor);

    const currentSettings = useSettingsStore.getState().settings;
    if (currentSettings.brandColor === newColor) {
        console.log(`   ✅ Brand color updated: ${oldColor} -> ${newColor}`);
    } else {
        console.error("   ❌ Brand color update failed.");
    }

    // 6. Finance Flow
    console.log("\n💳 Step 6: Finance - Invoicing & Payments");
    const invoice = {
        id: 'inv-test-1',
        number: '1001',
        totalCents: 500000,
        paidAmountCents: 0,
        status: 'Unpaid' as any,
        companyId: 'org-test'
    };
    dataStore.addInvoice(invoice as any);

    dataStore.recordPayment('inv-test-1', 250000);
    let updatedInvoice = useDataStore.getState().invoices.find(i => i.id === 'inv-test-1');
    if (updatedInvoice?.paidAmountCents === 250000 && updatedInvoice?.status === 'Unpaid') {
        console.log("   ✅ Partial payment recorded correctly.");
    } else {
        console.error("   ❌ Partial payment failed.");
    }

    dataStore.recordPayment('inv-test-1', 250000);
    updatedInvoice = useDataStore.getState().invoices.find(i => i.id === 'inv-test-1');
    if (updatedInvoice?.status === 'Paid') {
        console.log("   ✅ Full payment recorded, status updated to Paid.");
    } else {
        console.error(`   ❌ Status update failed. Status: ${updatedInvoice?.status}`);
    }

    // 7. Accounting Flow
    console.log("\n📒 Step 7: Accounting - Ledger Entries");
    const ledgerEntry = {
        id: 'le-1',
        date: '2026-01-05',
        description: 'Office Supplies',
        category: 'Utilities',
        type: 'Outflow' as any,
        amountCents: 15000
    };
    dataStore.addBookkeepingEntry(ledgerEntry as any);
    const addedEntry = useDataStore.getState().bookkeeping.find(e => e.id === 'le-1');
    if (addedEntry) {
        console.log("   ✅ Ledger entry recorded successfully.");
    } else {
        console.error("   ❌ Failed to record ledger entry.");
    }

    console.log("\n🏁 Simulation Complete.");
}

runUserTest().catch(console.error);
