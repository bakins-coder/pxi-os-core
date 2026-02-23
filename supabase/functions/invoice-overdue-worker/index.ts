import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SENDER_EMAIL = "akinbee@gmail.com";
const ADDITIONAL_RECIPIENT = "akinbee@gmail.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
    try {
        // 1. Calculate the threshold date (3 days ago)
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - 3);
        const thresholdDateString = thresholdDate.toISOString().split('T')[0];

        // 2. Query overdue invoices
        const { data: overdueInvoices, error: invoiceError } = await supabase
            .from("invoices")
            .select(`
        id,
        number,
        total_cents,
        due_date,
        status,
        contacts ( name )
      `)
            .neq("status", "PAID")
            .lt("due_date", thresholdDateString);

        if (invoiceError) throw invoiceError;

        if (!overdueInvoices || overdueInvoices.length === 0) {
            return new Response(JSON.stringify({ message: "No overdue invoices found." }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // 3. Get staff emails (Admin, Finance, CEO)
        const { data: staffProfiles, error: profileError } = await supabase
            .from("profiles")
            .select("email")
            .in("role", ["ADMIN", "FINANCE", "CEO"]);

        if (profileError) throw profileError;

        const staffEmails = staffProfiles?.map(p => p.email).filter(Boolean) || [];
        const recipients = Array.from(new Set([...staffEmails, ADDITIONAL_RECIPIENT])) as string[];

        if (recipients.length === 0) {
            return new Response(JSON.stringify({ message: "No recipients found." }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // 4. Prepare email content
        const invoiceListHtml = overdueInvoices.map(inv => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">#${inv.number}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${inv.contacts?.name || 'Unknown'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">₦${(inv.total_cents / 100).toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${inv.due_date}</td>
      </tr>
    `).join("");

        const emailHtml = `
      <h1>Overdue Invoices Alert</h1>
      <p>The following invoices have been outstanding for more than 3 days:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Invoice #</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Customer</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Amount</th>
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Due Date</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceListHtml}
        </tbody>
      </table>
      <p>Please follow up with the respective customers.</p>
    `;

        // 5. Send email via Resend
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: `Invoice Alert <${SENDER_EMAIL}>`,
                to: recipients,
                subject: `ACTION REQUIRED: ${overdueInvoices.length} Overdue Invoices`,
                html: emailHtml,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
        }

        return new Response(JSON.stringify({ message: "Notifications sent successfully.", count: overdueInvoices.length }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
