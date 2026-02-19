import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Invoice, Contact, Employee, BookkeepingEntry, CateringEvent, PortionMonitor, InvoiceStatus } from '../types';
import { useDataStore } from '../store/useDataStore';

// Helper to convert URL to Base64
const getBase64FromUrl = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
        });
    } catch (e) {
        console.error("Failed to load image", url, e);
        return "";
    }
};

/**
 * Generate PDF for a single invoice
 */
export const generateInvoicePDF = async (
    invoice: Invoice,
    contact?: Contact,
    settings: any = {},
    options: { save?: boolean, returnDoc?: boolean } = { save: true }
) => {
    const doc = new jsPDF();

    // FORCE ORANGE if brand color is arguably "Xquisite Green" or just default
    // We want to ensure Xquisite always outputs Orange for this invoice style
    let brandColor = settings.brandColor;
    if (!brandColor || brandColor === '#00D084' || brandColor === '#00ff9d' || settings.name?.includes('Xquisite')) {
        brandColor = '#F47C20'; // Force Xquisite Orange
    }

    const orgName = settings.name || 'Xquisite Celebrations Ltd';
    const isProforma = invoice.status === InvoiceStatus.PROFORMA;

    // ---------------------------------------------------------
    // 1. Header & Brand Bar
    // ---------------------------------------------------------

    // Logo Logic: Try settings.logo first, then try to fetch local file if Xquisite
    let logoData = settings.logo;
    if (!logoData && (settings.name?.includes('Xquisite') || orgName.includes('Xquisite'))) {
        // Attempt to load the file from public/assets
        logoData = await getBase64FromUrl('/xquisite-logo-full.png');
    }

    // Logo (Left)
    if (logoData) {
        try {
            // Using a wider logo area based on screenshot
            doc.addImage(logoData, 'PNG', 15, 10, 50, 25);
        } catch (e) {
            console.error("Error adding logo to PDF", e);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(brandColor);
            doc.text(orgName.split(' ')[0], 15, 30);
        }
    } else {
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(brandColor);
        doc.text(orgName.split(' ')[0], 15, 30);
    }

    // Company Name (Right)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(orgName, 195, 25, { align: 'right' });

    // Orange Line Separator
    doc.setDrawColor(brandColor);
    doc.setLineWidth(1.5);
    doc.line(15, 45, 195, 45);

    // ---------------------------------------------------------
    // 2. Bill To & Invoice Info (Row under separator)
    // ---------------------------------------------------------
    const infoY = 60;

    // Left Side: Bill To
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150); // Light Gray Label
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 15, infoY);

    doc.setFontSize(14); // Larger Customer Name
    doc.setTextColor(0, 0, 0); // Black Name
    doc.text(contact?.name || 'Valued Customer', 15, infoY + 8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    let addrY = infoY + 14;
    if (contact?.address) {
        const custAddrLines = doc.splitTextToSize(contact.address || 'Address on file', 80);
        doc.text(custAddrLines, 15, addrY);
    } else {
        doc.text('Address on file', 15, addrY);
    }

    // Right Side: Invoice Stamp & Details
    // Stamp (Orange Outline)
    doc.setDrawColor(brandColor); // Orange Border
    doc.setLineWidth(0.8);
    doc.roundedRect(145, infoY - 8, 50, 14, 1, 1, 'S');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandColor); // Orange Text
    doc.text(isProforma ? 'PRO-FORMA' : 'INVOICE', 170, infoY + 1, { align: 'center' });

    // Details Grid (Aligned Right)
    const labelX = 160;
    const valueX = 195;
    let detailY = infoY + 14;

    const addDetail = (label: string, value: string) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100); // Gray Label
        doc.text(label, labelX, detailY, { align: 'right' });

        doc.setTextColor(0, 0, 0); // Black Value
        doc.text(value, valueX, detailY, { align: 'right' });
        detailY += 6;
    };

    addDetail('Invoice Number:', invoice.number);
    addDetail('Invoice Date:', new Date(invoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
    addDetail('Payment Due:', new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));


    // ---------------------------------------------------------
    // 3. Line Items Table
    // ---------------------------------------------------------
    const tableStartY = 100;

    const tableData = invoice.lines.map(line => {
        const price = line.manualPriceCents !== undefined ? line.manualPriceCents : line.unitPriceCents;
        return [
            line.description,
            line.quantity.toString(),
            `N${(price / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
            `N${(line.quantity * price / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
        ];
    });

    autoTable(doc, {
        startY: tableStartY,
        head: [['Items', 'Qty', 'Price', 'Amount']],
        body: tableData,
        theme: 'plain',
        headStyles: {
            fillColor: [250, 250, 250], // Very light bg
            textColor: [80, 80, 80],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 8,
        },
        bodyStyles: {
            cellPadding: 8,
            textColor: [50, 50, 50],
            fontSize: 9,
            lineColor: [240, 240, 240],
            lineWidth: 0.1, // Subtle borders
        },
        columnStyles: {
            0: { cellWidth: 95 },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' }
        }
    });

    // ---------------------------------------------------------
    // 4. Calculations & Summary
    // ---------------------------------------------------------
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    let currentY = finalY;

    // Calculate Subtotal First
    const effectiveSubtotal = invoice.lines.reduce((acc, l) => {
        const price = l.manualPriceCents !== undefined ? l.manualPriceCents : l.unitPriceCents;
        return acc + (l.quantity * price);
    }, 0);

    let subtotalCents = invoice.subtotalCents !== undefined ? invoice.subtotalCents : effectiveSubtotal;
    let scCents = invoice.serviceChargeCents;
    let vatCents = invoice.vatCents;

    // FORCE 0% CHECK
    // If we are overriding for Xquisite / Cuisine transparency:
    if (orgName.includes('Xquisite') || settings.name?.includes('Xquisite')) {
        scCents = 0;
        vatCents = 0;
    } else {
        // Default fallbacks if undefined
        if (scCents === undefined) scCents = 0;
        if (vatCents === undefined) vatCents = 0;
    }

    // Recalculate Total based on the (possibly overridden) values
    const totalCents = subtotalCents + scCents + vatCents;

    const subtotalRef = subtotalCents / 100;
    const scRef = scCents / 100;
    const vatRef = vatCents / 100;
    const totalRef = totalCents / 100;

    // Summary Rows (Right Aligned)
    const addSummaryRow = (label: string, value: string) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text(label, 140, currentY); // Label Col

        doc.setTextColor(50, 50, 50);
        doc.text(value, 195, currentY, { align: 'right' }); // Value Col
        currentY += 8;
    };

    // PRINT SUMMARY (CLEAN - No Duplicates)
    addSummaryRow('SUBTOTAL', `N${subtotalRef.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);

    // Display 0% lines explicitly as requested previously, or real values if they exist (and weren't overridden)
    if (scRef > 0) {
        addSummaryRow('SERVICE CHARGE (15%)', `N${scRef.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
    } else {
        addSummaryRow('SERVICE CHARGE (0%)', `N0.00`);
    }

    if (vatRef > 0) {
        addSummaryRow('VAT (7.5%)', `N${vatRef.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
    } else {
        addSummaryRow('VAT (0%)', `N0.00`);
    }

    currentY += 5;

    // Total Box
    doc.setFillColor(248, 248, 248); // Box BG
    doc.roundedRect(135, currentY, 65, 25, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('TOTAL AMOUNT DUE', 167.5, currentY + 8, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`N${totalRef.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`, 167.5, currentY + 18, { align: 'center' });

    const boxBottomY = currentY + 30;

    // ---------------------------------------------------------
    // 5. Footer: Bank Details (Left) & Terms
    // ---------------------------------------------------------

    let leftColY = finalY; // Return to top of summary section for left col

    // Header
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Payment Information', 15, leftColY);
    leftColY += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const payText = `Thank you for your patronage. Please make all payment transfers to:\nXQUISITE CELEBRATIONS LIMITED`;
    doc.text(payText, 15, leftColY);
    leftColY += 12;

    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details:', 15, leftColY);
    leftColY += 6;

    // Bank Grid (2x2)
    const banks = [
        { name: "Xquisite Cuisine", bank: "GT Bank", acc: "0210736266" },
        { name: "Xquisite Celebrations", bank: "GT Bank", acc: "0396426845" },
        { name: "Xquisite Celebrations", bank: "Zenith Bank", acc: "1010951007" },
        { name: "Xquisite Cuisine", bank: "First Bank", acc: "2022655945" }
    ];

    const startX = 15;
    const boxW = 55;
    const boxH = 14;
    const gap = 3;

    banks.forEach((b, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);

        const x = startX + (col * (boxW + gap));
        const y = leftColY + (row * (boxH + gap));

        // Box
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(252, 252, 252);
        doc.roundedRect(x, y, boxW, boxH, 1, 1, 'FD');

        // Text
        doc.setFontSize(7);
        doc.setTextColor(50, 50, 50); // Dark Gray Title
        doc.setFont('helvetica', 'bold');
        doc.text(b.name.toUpperCase(), x + 3, y + 4);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100); // Light Gray Label
        doc.text(b.bank, x + 3, y + 10);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30); // Dark Value
        doc.text(b.acc, x + boxW - 3, y + 10, { align: 'right' });
    });

    // Move logic cursor down
    const bankBottomY = leftColY + (2 * (boxH + gap));
    let bottomY = Math.max(bankBottomY, boxBottomY) + 15;

    // Terms & Conditions
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Terms and Conditions:', 15, bottomY);
    bottomY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const terms = 'Initial deposit of 70% is to be paid before the event and balance payable immediately after the event. Cancellation of order will result to only a 70% refund of initial deposit made.';
    const termsLines = doc.splitTextToSize(terms, 180);
    doc.text(termsLines, 15, bottomY);
    bottomY += (termsLines.length * 4) + 4;

    // Disclaimer
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Disclaimer:', 15, bottomY);
    bottomY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const disclaimer = 'In the event of cancellation of order, it should be communicated to our contact person 48 hours before the event. Failure to do so will mean that initial deposit made has been forfeited.';
    const disLines = doc.splitTextToSize(disclaimer, 180);
    doc.text(disLines, 15, bottomY);

    // Orange Footer Bar
    doc.setFillColor(brandColor);
    doc.rect(0, 280, 210, 17, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold italic');
    doc.setTextColor(255, 255, 255);
    doc.text('Bon Apetit. We look forward to serving you again soon.', 105, 291, { align: 'center' });

    if (options.save) {
        doc.save(`Invoice-${invoice.number}.pdf`);
    }

    // Return promise if doc requested (though jsPDF is sync, we are async wrapper now)
    return options.returnDoc ? doc : null;
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
    const servedGuests = monitor.tables.reduce((sum, t) => {
        const tableServedCount = t.seats?.filter((s: any) => s.servingCount > 0).length || 0;
        return sum + tableServedCount;
    }, 0);
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

    // --- RECONCILIATION & VARIANCE ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Reconciliation Summary', 14, finalY);

    // Calculate Variance
    const varianceData = event.items.map(initialItem => {
        const servedCount = monitor.tables.reduce((acc, t) => {
            return acc + (t.servedItems?.find(i => i.itemId === initialItem.inventoryItemId)?.quantity || 0);
        }, 0);
        // Correctly sum seat-level servings for accuracy
        const seatServedCount = monitor.tables.reduce((acc, t) => {
            return acc + (t.seats?.reduce((sAcc: number, s: any) => {
                const seatItemQty = s.servedItems?.filter((si: any) => si.itemId === initialItem.inventoryItemId).reduce((q: number, i: any) => q + i.quantity, 0) || 0;
                return sAcc + seatItemQty;
            }, 0) || 0);
        }, 0);

        const leftoverCount = monitor.leftovers.filter(l => l.itemId === initialItem.inventoryItemId).reduce((sum, l) => sum + l.quantity, 0);
        const variance = initialItem.quantity - seatServedCount - leftoverCount;

        return {
            name: initialItem.name,
            stocked: initialItem.quantity,
            served: seatServedCount,
            leftover: leftoverCount,
            variance: variance,
            status: variance === 0 ? 'Balanced' : variance > 0 ? 'Missing / Unaccounted' : 'Surplus / Data Error'
        };
    });

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Item Name', 'Stock Loaded', 'Served (Consumed)', 'Logged Leftover', 'Variance', 'Status']],
        body: varianceData.map(v => [
            v.name,
            v.stocked,
            v.served,
            v.leftover,
            v.variance > 0 ? `-${v.variance}` : `+${Math.abs(v.variance)}`,
            v.status
        ]),
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181], textColor: 255 },
        columnStyles: {
            4: { fontStyle: 'bold', textColor: [220, 38, 38] }, // Red for variance column usually
            5: { fontStyle: 'italic' }
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
                const varianceVal = parseInt(data.cell.raw as string);
                if (varianceVal === 0) data.cell.styles.textColor = [22, 163, 74]; // Green
                else data.cell.styles.textColor = [220, 38, 38]; // Red
            }
        }
    });

    // --- LEFTOVER LOG ---
    const leftoverY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Leftover / Handover Log', 14, leftoverY);

    const leftoverData = monitor.leftovers.length > 0 ? monitor.leftovers.map(l => [
        l.name,
        l.quantity.toString(),
        l.reason,
        new Date(l.loggedAt).toLocaleTimeString()
    ]) : [['No leftovers recorded', '-', '-', '-']];

    autoTable(doc, {
        startY: leftoverY + 5,
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
        return w ? `${w.firstName} ${w.lastName}` : id;
    };

    const tableData = monitor.tables.map(t => {
        const totalServings = t.seats?.reduce((sum: number, s: any) => sum + s.servingCount, 0) || 0;

        // Detailed Seat Summary embedded in row
        // Format: "Seat 1: 2x Item A, 1x Item B"
        const seatDetails = t.seats
            ?.filter((s: any) => s.servingCount > 0)
            .sort((a: any, b: any) => a.number - b.number)
            .map((s: any) => {
                // Get item details
                const items = s.servedItems?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
                return `Seat ${s.number}: ${items || (s.servingCount + ' servings')}`;
            })
            .join('\n');

        const detailsStr = [
            t.servedItems.length > 0 ? `${t.servedItems.length} unique items` : '',
            seatDetails ? `\n[Seat Breakdown]\n${seatDetails}` : ''
        ].filter(Boolean).join('\n');

        return [
            t.name,
            t.assignedGuests.toString(),
            totalServings.toString(),
            getWaiterName(t.assignedWaiterId),
            detailsStr || '-'
        ];
    });

    autoTable(doc, {
        startY: currentY + 5,
        head: [['Table Name', 'Guests', 'Total Servings', 'Served By', 'Details (Seat Activity)']],
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

    // Output as Blob URL and Open in New Window (Preview)
    // Only if returnDoc is not true (handle separately), this function is for Handover only
    // It seems generateHandoverReport hasn't been modified to accept returnDoc, so leaving it.
    // However, the original code had `doc.output('blob')` and `window.open`.
    // We should keep it.

    // Note: generateHandoverReport is not async here, it uses the doc.output('blob') directly. 
    // This function doesn't seem to be used in the current context of failure, but included in file.

    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');

    // cleanup
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
};
