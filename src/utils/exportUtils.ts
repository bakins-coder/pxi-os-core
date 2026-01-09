import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Invoice, Contact, Employee, BookkeepingEntry, CateringEvent, PortionMonitor } from '../types';
import { useDataStore } from '../store/useDataStore';

/**
 * Generate PDF for a single invoice
 */
export const generateInvoicePDF = (invoice: Invoice, contact?: Contact, organizationName: string = 'Paradigm-Xi') => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(organizationName, 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', 160, 20);

    // Invoice details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #${invoice.number}`, 20, 40);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${invoice.date}`, 20, 50);
    doc.text(`Due Date: ${invoice.dueDate}`, 20, 57);
    doc.text(`Status: ${invoice.status}`, 20, 64);

    // Customer details
    if (contact) {
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 20, 80);
        doc.setFont('helvetica', 'normal');
        doc.text(contact.name, 20, 87);
        if (contact.email) doc.text(contact.email, 20, 94);
        if (contact.phone) doc.text(contact.phone, 20, 101);
    }

    // Line items table
    const tableData = invoice.lines.map(line => [
        line.description,
        line.quantity.toString(),
        `₦${(line.unitPriceCents / 100).toLocaleString()}`,
        `₦${(line.quantity * line.unitPriceCents / 100).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: 115,
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const subtotal = invoice.totalCents / 100;
    const paid = invoice.paidAmountCents / 100;
    const balance = subtotal - paid;

    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 130, finalY);
    doc.text(`₦${subtotal.toLocaleString()}`, 170, finalY, { align: 'right' });

    doc.text('Amount Paid:', 130, finalY + 7);
    doc.text(`₦${paid.toLocaleString()}`, 170, finalY + 7, { align: 'right' });

    doc.setFontSize(12);
    doc.text('Balance Due:', 130, finalY + 17);
    doc.text(`₦${balance.toLocaleString()}`, 170, finalY + 17, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', 105, finalY + 35, { align: 'center' });

    // Save
    doc.save(`Invoice-${invoice.number}.pdf`);
};

/**
 * Export financial data to Excel
 */
export const exportFinancialDataToExcel = (
    invoices: Invoice[],
    bookkeeping: BookkeepingEntry[],
    filename: string = 'financial-report.xlsx'
) => {
    const wb = XLSX.utils.book_new();

    // Invoices sheet
    const invoicesData = invoices.map(inv => ({
        'Invoice #': inv.number,
        'Date': inv.date,
        'Due Date': inv.dueDate,
        'Type': inv.type,
        'Status': inv.status,
        'Total (₦)': inv.totalCents / 100,
        'Paid (₦)': inv.paidAmountCents / 100,
        'Balance (₦)': (inv.totalCents - inv.paidAmountCents) / 100,
    }));
    const invoicesWS = XLSX.utils.json_to_sheet(invoicesData);
    XLSX.utils.book_append_sheet(wb, invoicesWS, 'Invoices');

    // Bookkeeping sheet
    const bookkeepingData = bookkeeping.map(entry => ({
        'Date': entry.date,
        'Type': entry.type,
        'Category': entry.category,
        'Description': entry.description,
        'Amount (₦)': entry.amountCents / 100,
        'Reference': entry.referenceId || '',
    }));
    const bookkeepingWS = XLSX.utils.json_to_sheet(bookkeepingData);
    XLSX.utils.book_append_sheet(wb, bookkeepingWS, 'Bookkeeping');

    // Generate file
    XLSX.writeFile(wb, filename);
};

/**
 * Export employee data to Excel
 */
export const exportEmployeesToExcel = (employees: Employee[], filename: string = 'employees.xlsx') => {
    const data = employees.map(emp => ({
        'ID': emp.id,
        'First Name': emp.firstName,
        'Last Name': emp.lastName,
        'Email': emp.email,
        'Phone': emp.phoneNumber || '',
        'Role': emp.role,
        'Status': emp.status,
        'Date of Employment': emp.dateOfEmployment,
        'Salary (₦)': emp.salaryCents / 100,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, filename);
};

/**
 * Export contacts to Excel
 */
export const exportContactsToExcel = (contacts: Contact[], filename: string = 'contacts.xlsx') => {
    const data = contacts.map(contact => ({
        'Name': contact.name,
        'Type': contact.type,
        'Email': contact.email || '',
        'Phone': contact.phone || '',
        'Industry': contact.industry || '',
        'Sentiment Score': contact.sentimentScore,
        'Job Title': contact.jobTitle || '',
        'Address': contact.address || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
    XLSX.writeFile(wb, filename);
};

/**
 * Export comprehensive report with multiple sheets
 */
export const exportComprehensiveReport = (data: {
    invoices: Invoice[];
    bookkeeping: BookkeepingEntry[];
    employees: Employee[];
    contacts: Contact[];
}) => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Paradigm-Xi Platform Report'],
        ['Generated:', new Date().toLocaleString()],
        [''],
        ['Metric', 'Value'],
        ['Total Invoices', data.invoices.length],
        ['Total Revenue (₦)', data.invoices.reduce((sum, inv) => sum + inv.totalCents, 0) / 100],
        ['Total Employees', data.employees.length],
        ['Total Contacts', data.contacts.length],
        ['Bookkeeping Entries', data.bookkeeping.length],
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // Add other sheets
    const invoicesWS = XLSX.utils.json_to_sheet(data.invoices.map(inv => ({
        'Invoice #': inv.number,
        'Date': inv.date,
        'Type': inv.type,
        'Status': inv.status,
        'Total (₦)': inv.totalCents / 100,
    })));
    XLSX.utils.book_append_sheet(wb, invoicesWS, 'Invoices');

    const employeesWS = XLSX.utils.json_to_sheet(data.employees.map(emp => ({
        'Name': `${emp.firstName} ${emp.lastName}`,
        'Role': emp.role,
        'Status': emp.status,
        'Salary (₦)': emp.salaryCents / 100,
    })));
    XLSX.utils.book_append_sheet(wb, employeesWS, 'Employees');

    const contactsWS = XLSX.utils.json_to_sheet(data.contacts.map(c => ({
        'Name': c.name,
        'Type': c.type,
        'Email': c.email,
        'Phone': c.phone,
    })));
    XLSX.utils.book_append_sheet(wb, contactsWS, 'Contacts');

    XLSX.writeFile(wb, `Paradigm-Xi-Report-${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Generate PDF Handover Report for Catering Event
 */
export const generateHandoverReport = (event: CateringEvent, monitor: PortionMonitor) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- HEADER ---
    doc.setFillColor(63, 81, 181); // Indigo
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Service Handover Report', 14, 18);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Event: ${event.customerName} | Date: ${event.eventDate}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

    // --- METRICS ---
    doc.setTextColor(0, 0, 0);
    const totalGuests = monitor.tables.reduce((sum, t) => sum + t.assignedGuests, 0);
    const servedGuests = monitor.tables.reduce((sum, t) => t.status === 'Served' ? sum + t.assignedGuests : sum, 0);
    const serviceRate = totalGuests > 0 ? Math.round((servedGuests / totalGuests) * 100) : 0;

    autoTable(doc, {
        startY: 50,
        head: [['Total Guests Expected', 'Guests Served', 'Service Completion Rate', 'Total Tables']],
        body: [[
            event.guestCount.toString(),
            servedGuests.toString(),
            `${serviceRate}%`,
            monitor.tables.length.toString()
        ]],
        theme: 'plain',
        headStyles: { fontSize: 10, textColor: 100 },
        bodyStyles: { fontSize: 14, fontStyle: 'bold' }
    });

    // --- LEFTOVER LOG ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Leftover / Handover Log', 14, finalY);

    const leftoverData = monitor.leftovers.length > 0 ? monitor.leftovers.map(l => [
        l.name,
        l.quantity.toString(),
        l.reason,
        new Date(l.loggedAt).toLocaleTimeString()
    ]) : [['No leftovers recorded', '-', '-', '-']];

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Item Name', 'Quantity', 'Reason / Note', 'Time Logged']],
        body: leftoverData,
        theme: 'striped',
        headStyles: { fillColor: [234, 179, 8], textColor: 0 }, // Yellow/Orange header
    });

    // --- TABLE SERVICE DETAILS ---
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Table Service Details', 14, currentY);

    // Get waiter names map
    const store = useDataStore.getState();
    const getWaiterName = (id?: string) => {
        if (!id) return 'Unassigned';
        const w = store.employees.find(e => e.id === id);
        return w ? `${w.firstName} ${w.lastName}` : 'Unknown';
    };

    const tableData = monitor.tables.map(t => [
        t.name,
        t.status,
        t.assignedGuests.toString(),
        getWaiterName(t.assignedWaiterId),
        t.servedItems.length > 0 ? `${t.servedItems.length} items served` : '-'
    ]);

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Table Name', 'Status', 'Guests', 'Served By (Waiter)', 'Details']],
        body: tableData,
    });

    // --- EVIDENCE PHOTOS ---
    currentY = (doc as any).lastAutoTable.finalY + 15;
    if (monitor.handoverEvidence.length > 0) {
        // Create a new page if not enough space
        if (currentY > 200) {
            doc.addPage();
            currentY = 20;
        }

        doc.text('Handover Evidence', 14, currentY);
        currentY += 10;

        monitor.handoverEvidence.forEach((ev, idx) => {
            if (currentY + 60 > 280) {
                doc.addPage();
                currentY = 20;
            }
            try {
                // Add image (assuming standard aspect ratio for simplicity, scaling to width 80)
                doc.addImage(ev.url, 'JPEG', 14, currentY, 80, 60);
                doc.setFontSize(10);
                doc.text(`Note: ${ev.note}`, 100, currentY + 10);
                doc.text(`Time: ${new Date(ev.timestamp).toLocaleString()}`, 100, currentY + 18);
                currentY += 70;
            } catch (e) {
                doc.text(`[Error loading image ${idx + 1}]`, 14, currentY);
                currentY += 10;
            }
        });
    }

    // --- SIGNATURES ---
    if (currentY + 50 > 280) { // Check for space for signatures
        doc.addPage();
        currentY = 20;
    } else {
        currentY += 20;
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);

    // Host Signature Line
    doc.line(20, currentY + 30, 90, currentY + 30);
    doc.setFontSize(11);
    doc.text('Host Representative Signature', 20, currentY + 40);
    doc.text('Date: ________________', 20, currentY + 50);

    // Supervisor Signature Line
    doc.line(120, currentY + 30, 190, currentY + 30);
    doc.text('Event Supervisor Signature', 120, currentY + 40);
    doc.text('Date: ________________', 120, currentY + 50);

    doc.save(`Handover_Report_${event.customerName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
