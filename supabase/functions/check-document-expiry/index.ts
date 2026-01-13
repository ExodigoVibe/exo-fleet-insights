import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string[], subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Fleet Management <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting document expiry check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the date that is 1 month from now
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    const oneMonthFromNowStr = oneMonthFromNow.toISOString().split('T')[0];

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Checking for documents expiring between ${todayStr} and ${oneMonthFromNowStr}`);

    // Find documents that:
    // 1. Have email reminder enabled
    // 2. Haven't had a reminder sent yet
    // 3. Expire within the next month
    const { data: documents, error: fetchError } = await supabase
      .from("vehicle_information")
      .select("*")
      .eq("email_reminder_enabled", true)
      .eq("reminder_sent", false)
      .gte("expiry_date", todayStr)
      .lte("expiry_date", oneMonthFromNowStr);

    if (fetchError) {
      console.error("Error fetching documents:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${documents?.length || 0} documents needing reminders`);

    const emailsSent: string[] = [];
    const errors: string[] = [];

    // Get admin/coordinator emails to send reminders to
    const { data: adminUsers, error: usersError } = await supabase
      .from("user_roles")
      .select("email")
      .in("role", ["admin", "coordinator"])
      .not("email", "is", null);

    if (usersError) {
      console.error("Error fetching admin users:", usersError);
      throw usersError;
    }

    const adminEmails = adminUsers?.map(u => u.email).filter(Boolean) as string[];
    console.log(`Sending reminders to ${adminEmails.length} admin/coordinator users`);

    if (adminEmails.length === 0) {
      console.log("No admin/coordinator emails found, skipping email send");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No admin/coordinator emails configured",
          documentsChecked: documents?.length || 0,
          emailsSent: 0 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const doc of documents || []) {
      const documentTypeName = doc.document_type === 'license' ? 'Vehicle License' : 'Vehicle Insurance';
      const expiryDate = new Date(doc.expiry_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      try {
        const emailResponse = await sendEmail(
          adminEmails,
          `Vehicle Document Expiring Soon - ${doc.license_plate}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #e74c3c;">⚠️ Document Expiry Reminder</h1>
              <p>This is a reminder that the following vehicle document will expire soon:</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Vehicle:</strong> ${doc.license_plate}</p>
                <p><strong>Document Type:</strong> ${documentTypeName}</p>
                <p><strong>Expiry Date:</strong> ${expiryDate}</p>
              </div>
              
              <p>Please take action to renew this document before it expires.</p>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated reminder from your Fleet Management System.
              </p>
            </div>
          `
        );

        console.log(`Email sent for ${doc.license_plate} - ${doc.document_type}:`, emailResponse);
        emailsSent.push(`${doc.license_plate} - ${documentTypeName}`);

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from("vehicle_information")
          .update({ reminder_sent: true })
          .eq("id", doc.id);

        if (updateError) {
          console.error(`Error updating reminder_sent for ${doc.id}:`, updateError);
          errors.push(`Failed to update reminder status for ${doc.license_plate}`);
        }
      } catch (emailError: any) {
        console.error(`Error sending email for ${doc.license_plate}:`, emailError);
        errors.push(`Failed to send email for ${doc.license_plate}: ${emailError.message}`);
      }
    }

    console.log("Document expiry check completed");

    return new Response(
      JSON.stringify({
        success: true,
        documentsChecked: documents?.length || 0,
        emailsSent: emailsSent.length,
        emailDetails: emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in check-document-expiry function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
