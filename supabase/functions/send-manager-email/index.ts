import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  managerEmail: string;
  managerName: string;
  employeeName: string;
  department: string;
  usageType: string;
  startDate: string;
  endDate?: string;
  purpose?: string;
  jobTitle?: string;
  phoneNumber?: string;
  employeeEmail?: string;
  appUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EmailRequest = await req.json();
    console.log("Sending email to manager:", data.managerEmail);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const usageTypeLabel = data.usageType === "permanent_driver" ? "Permanent Driver" : "Single Use";
    
    const emailHtml = `
      <h1>Vehicle Request Approval Needed</h1>
      <p>Dear ${data.managerName},</p>
      <p>A new vehicle request has been submitted and requires your approval.</p>
      
      <h2>Request Details:</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Employee Name:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.employeeName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Department:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.department}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Usage Type:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${usageTypeLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Start Date:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.startDate}</td>
        </tr>
        ${data.endDate ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">End Date:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.endDate}</td>
        </tr>
        ` : ''}
        ${data.jobTitle ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Job Title:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.jobTitle}</td>
        </tr>
        ` : ''}
        ${data.phoneNumber ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Phone:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.phoneNumber}</td>
        </tr>
        ` : ''}
        ${data.employeeEmail ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.employeeEmail}</td>
        </tr>
        ` : ''}
        ${data.purpose ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Purpose:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.purpose}</td>
        </tr>
        ` : ''}
      </table>
      
      <p style="margin-top: 20px;">
        <a href="${data.appUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Review & Approve Request
        </a>
      </p>
      
      <p style="margin-top: 20px; color: #666;">
        Please click the button above to review and approve or reject this request.
      </p>
      
      <p style="margin-top: 30px;">Best regards,<br>FleetFlow System</p>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "FleetFlow <onboarding@resend.dev>",
        to: [data.managerEmail],
        subject: `Vehicle Request Approval Needed - ${data.employeeName}`,
        html: emailHtml,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("Resend API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
