import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    const AZURE_CLIENT_ID = Deno.env.get("AZURE_CLIENT_ID");
    const AZURE_TENANT_ID = Deno.env.get("AZURE_TENANT_ID");
    const AZURE_CLIENT_SECRET = Deno.env.get("AZURE_CLIENT_SECRET");

    if (!AZURE_CLIENT_ID || !AZURE_TENANT_ID || !AZURE_CLIENT_SECRET) {
      throw new Error("Azure credentials not configured");
    }

    const origin = req.headers.get("origin") || req.headers.get("referer")?.split("/").slice(0, 3).join("/");
    const redirectUri = `https://onboarding-road-tool.lovable.app/auth/callback`;

    // Generate authorization URL (for login - GET request without body)
    if (req.method === "GET" || (req.method === "POST" && !(await req.clone().text()))) {
      const authUrl =
        `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?` +
        `client_id=${AZURE_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_mode=query&` +
        `scope=${encodeURIComponent("openid profile email User.Read")}`;

      console.log(`[azure-sso] Generated auth URL for redirect: ${redirectUri}`);

      return new Response(JSON.stringify({ authUrl }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Exchange code for token (for callback - POST request with body)
    if (req.method === "POST") {
      const body = await req.json();
      const { code } = body;

      console.log(`[azure-sso] Exchanging code for token`);

      const tokenResponse = await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: AZURE_CLIENT_ID,
          client_secret: AZURE_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(`[azure-sso] Token exchange failed:`, errorText);
        throw new Error("Failed to exchange code for token");
      }

      const tokens = await tokenResponse.json();

      // Get user info from Microsoft Graph
      const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error(`[azure-sso] User info fetch failed:`, errorText);
        throw new Error("Failed to fetch user info");
      }

      const user = await userResponse.json();

      console.log(`[azure-sso] Successfully authenticated user: ${user.mail || user.userPrincipalName}`);

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            email: user.mail || user.userPrincipalName,
            name: user.displayName,
          },
          accessToken: tokens.access_token,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[azure-sso] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
