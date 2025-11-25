import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "SQL query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const account = Deno.env.get("SF_ACCOUNT");
    const role = Deno.env.get("SF_ROLE") ?? undefined;
    const warehouse = Deno.env.get("SF_WAREHOUSE") ?? undefined;
    const database = Deno.env.get("SF_DATABASE") ?? undefined;
    const schema = Deno.env.get("SF_SCHEMA") ?? undefined;

    // 🔑 Pre-signed JWT, created elsewhere using the private key
    const jwtToken = Deno.env.get("SNOWFLAKE_JWT")?.trim();

    if (!account || !jwtToken) {
      return new Response(
        JSON.stringify({
          error: "Snowflake credentials not configured (need SF_ACCOUNT and SNOWFLAKE_JWT).",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const snowflakeUrl = `https://${account}.snowflakecomputing.com/api/v2/statements`;

    const resp = await fetch(snowflakeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${jwtToken}`,
        "X-Snowflake-Authorization-Token-Type": "KEYPAIR_JWT",
      },
      body: JSON.stringify({
        statement: query,
        timeout: 60,
        database,
        schema,
        warehouse,
        role,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      if (errText.includes("JWT_TOKEN_INVALID")) {
        console.error("JWT invalid or expired – check the externally generated SNOWFLAKE_JWT.");
      }
      return new Response(
        JSON.stringify({
          error: `Snowflake API error: ${resp.status} - ${errText}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await resp.json();

    if (result.statementHandle && !result.data) {
      const pollUrl = `${snowflakeUrl}/${result.statementHandle}`;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pr = await fetch(pollUrl, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (pr.ok) {
          const prJson = await pr.json();
          if (prJson.data) {
            const metadata = prJson.resultSetMetaData?.rowType || [];
            const rows = prJson.data.map((row: any) => row);
            return new Response(
              JSON.stringify({
                columns: metadata,
                rows,
                rowCount: rows.length,
              }),
              {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }
        }
      }
      return new Response(JSON.stringify({ error: "Timed out waiting for Snowflake statement to complete." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metadata = result.resultSetMetaData?.rowType || [];
    const rows = result.data ? result.data.map((row: any) => row) : [];
    return new Response(JSON.stringify({ columns: metadata, rows, rowCount: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to execute query";
    console.error("Error in snowflake-query function:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
