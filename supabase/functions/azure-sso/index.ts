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
    const redirectUri = `https://exo-fleet-analytics.lovable.app/auth/callback`;

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
      const userEmail = user.mail || user.userPrincipalName;

      console.log(`[azure-sso] Successfully authenticated user: ${userEmail}`);

      // Import Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[azure-sso] Supabase credentials not configured");
        throw new Error("Supabase configuration missing");
      }

      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Check if auth user exists
      const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
      
      let authUser = authUsers?.users.find(u => u.email === userEmail);
      
      // Create auth user if doesn't exist
      if (!authUser) {
        const { data: newAuthUser, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
          email_confirm: true,
          user_metadata: {
            full_name: user.displayName,
            azure_id: user.id,
          }
        });

        if (authCreateError) {
          console.error("[azure-sso] Error creating auth user:", authCreateError);
          throw authCreateError;
        }

        authUser = newAuthUser.user;
        console.log(`[azure-sso] Created new auth user for: ${userEmail}`);
      }

      // Check if user exists in user_roles table
      const { data: existingRole, error: roleFetchError } = await supabaseAdmin
        .from("user_roles")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (roleFetchError && roleFetchError.code !== "PGRST116") {
        console.error("[azure-sso] Error fetching user role:", roleFetchError);
      }

      let userRole = "employee";

      // Use existing role from database if user exists
      if (existingRole) {
        userRole = existingRole.role;
      } else {
        // Create new role for new user
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({
            user_id: authUser.id,
            email: userEmail,
            full_name: user.displayName,
            role: userRole,
          });

        if (roleError) {
          console.error("[azure-sso] Error creating user role:", roleError);
        } else {
          console.log(`[azure-sso] Created new user role: ${userRole} for ${userEmail}`);
        }
      }

      // Generate a session for the user using admin API
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail,
      });

      if (sessionError) {
        console.error("[azure-sso] Error generating session:", sessionError);
        throw sessionError;
      }

      console.log(`[azure-sso] Successfully authenticated user: ${userEmail}`);

      return new Response(
        JSON.stringify({
          user: {
            id: authUser.id,
            email: userEmail,
            name: user.displayName,
            role: userRole,
          },
          accessToken: tokens.access_token,
          magicLinkUrl: sessionData.properties.action_link,
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
