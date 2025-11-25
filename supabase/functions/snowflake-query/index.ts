import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
};

// Base64URL encode (without padding)
function base64UrlEncode(data: string | Uint8Array): string {
  let binary = "";
  if (typeof data === "string") {
    binary = data;
  } else {
    for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Create JWT for Snowflake SQL API using KEYPAIR_JWT
async function createJWT(
  account: string,
  user: string,
  privateKeyDer: Uint8Array,
  publicKeyFingerprint: string,
): Promise<string> {
  const accountUpper = account.toUpperCase();
  const userUpper = user.toUpperCase();
  const qualifiedUsername = `${accountUpper}.${userUpper}`;

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyDer, // use the Uint8Array directly
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: `${qualifiedUsername}.${publicKeyFingerprint}`,
    sub: qualifiedUsername,
    iat: now,
    exp: now + 3600,
  };

  const message = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(message));
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${message}.${encodedSignature}`;
}

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
    const user = Deno.env.get("SF_USER");
    const role = Deno.env.get("SF_ROLE") ?? undefined;
    const warehouse = Deno.env.get("SF_WAREHOUSE") ?? undefined;
    const database = Deno.env.get("SF_DATABASE") ?? undefined;
    const schema = Deno.env.get("SF_SCHEMA") ?? undefined;

    // PRIVATE_KEY_PATH is optional; default to "./rsa_key.der" next to this file
    const privateKeyPathEnv = Deno.env.get("PRIVATE_KEY_PATH")?.trim();
    const keyUrl = new URL(privateKeyPathEnv ?? "./rsa_key.der", import.meta.url);

    const publicKeyFingerprint = Deno.env.get("SNOWFLAKE_PUBLIC_KEY_FP")?.trim();

    if (!account || !user) {
      return new Response(
        JSON.stringify({
          error: "Snowflake credentials not configured (need SF_ACCOUNT and SF_USER).",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!publicKeyFingerprint) {
      return new Response(
        JSON.stringify({
          error: "SNOWFLAKE_PUBLIC_KEY_FP is not set. Configure it with the fingerprint from DESCRIBE USER.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 🔑 Read private key file as raw DER bytes (relative to this module)
    let privateKeyDer: Uint8Array;
    try {
      console.log("[Key Debug] Reading private key from URL:", keyUrl.toString());
      privateKeyDer = await Deno.readFile(keyUrl);
      console.log("[Key Debug] Private key DER length:", privateKeyDer.length);
    } catch (e) {
      console.error("[Key Debug] Failed to read private key file:", e);
      return new Response(
        JSON.stringify({
          error: `Failed to read private key file at '${keyUrl.toString()}'. Ensure rsa_key.der is in the same folder as index.ts or PRIVATE_KEY_PATH points to a valid file.`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      "[Snowflake Auth] Building JWT with account:",
      account,
      "user:",
      user,
      "fingerprint:",
      publicKeyFingerprint,
    );

    const jwtToken = await createJWT(account, user, privateKeyDer, publicKeyFingerprint);

    console.log(
      "[Snowflake Auth] JWT created successfully, issuer will be:",
      `${account.toUpperCase()}.${user.toUpperCase()}.${publicKeyFingerprint}`,
    );

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
        console.error(
          "JWT_TOKEN_INVALID: likely fingerprint/account/user mismatch or wrong key for this Snowflake user. Check DESCRIBE USER and SNOWFLAKE_PUBLIC_KEY_FP.",
        );
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

    // Poll if needed
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
