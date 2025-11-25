import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode, encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
};
// Base64URL encode (without padding)
function base64UrlEncode(data) {
  let binary = "";
  if (typeof data === "string") {
    binary = data;
  } else {
    for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
// Compute SHA-256 digest and return standard Base64 (not URL-safe)
async function sha256Base64(bytes) {
  const hashBuf = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  const hash = new Uint8Array(hashBuf);
  let binary = "";
  for (let i = 0; i < hash.length; i++) binary += String.fromCharCode(hash[i]);
  return base64Encode(binary);
}
// Create JWT for Snowflake SQL API using KEYPAIR_JWT
async function createJWT(account, user, privateKeyDer, publicKeyFingerprint) {
  const accountUpper = account.toUpperCase();
  const userUpper = user.toUpperCase();
  const qualifiedUsername = `${accountUpper}.${userUpper}`;
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    new Uint8Array(privateKeyDer),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
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
// Extract public key from private key and compute fingerprint
async function extractPublicKeyAndComputeFingerprint(privateKeyDer) {
  console.log("[Fingerprint] Starting public key extraction from private key");
  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    true,
    ["sign"],
  );
  console.log("[Fingerprint] Private key imported successfully");
  // Export as JWK to access the public key components
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  console.log("[Fingerprint] Exported to JWK, modulus length:", jwk.n?.length);
  // Re-import as public key and export in SPKI format
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
      alg: "RS256",
      key_ops: ["verify"],
    },
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    true,
    ["verify"],
  );
  console.log("[Fingerprint] Public key re-imported successfully");
  const publicKeySpki = await crypto.subtle.exportKey("spki", publicKey);
  console.log("[Fingerprint] Public key SPKI length:", publicKeySpki.byteLength);
  const fpB64 = await sha256Base64(new Uint8Array(publicKeySpki));
  const fingerprint = `SHA256:${fpB64}`;
  console.log("[Fingerprint] Computed fingerprint:", fingerprint);
  return fingerprint;
}
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", {
      headers: corsHeaders,
    });
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({
          error: "SQL query is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }
    const account = Deno.env.get("SF_ACCOUNT");
    const user = Deno.env.get("SF_USER");
    const role = Deno.env.get("SF_ROLE") ?? undefined;
    const warehouse = Deno.env.get("SF_WAREHOUSE") ?? undefined;
    const database = Deno.env.get("SF_DATABASE") ?? undefined;
    const schema = Deno.env.get("SF_SCHEMA") ?? undefined;
    const privateKeyBase64 = (Deno.env.get("SNOWFLAKE_PRIVATE_KEY_BASE64") || Deno.env.get("PRIVATE_KEY_PATH"))?.trim();
    const configuredFingerprint = Deno.env.get("SNOWFLAKE_PUBLIC_KEY_FP")?.trim();
    if (!account || !user || !privateKeyBase64) {
      return new Response(
        JSON.stringify({
          error: "Snowflake credentials not configured (need SF_ACCOUNT, SF_USER, and PRIVATE_KEY_PATH).",
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
    // Decode private key (PKCS#8 DER, unencrypted)
    let privateKeyDer;
    try {
      privateKeyDer = base64Decode(privateKeyBase64.replace(/\s/g, ""));
    } catch {
      return new Response(
        JSON.stringify({
          error: "Failed to decode private key (must be base64 of PKCS#8 DER, unencrypted).",
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
    // Use configured fingerprint if available, otherwise compute it
    let publicKeyFingerprint;
    if (configuredFingerprint) {
      publicKeyFingerprint = configuredFingerprint;
      console.log("[Fingerprint] Using configured fingerprint from SNOWFLAKE_PUBLIC_KEY_FP:", publicKeyFingerprint);
    } else {
      publicKeyFingerprint = await extractPublicKeyAndComputeFingerprint(privateKeyDer);
      console.log("[Fingerprint] Computed fingerprint from private key:", publicKeyFingerprint);
    }
    // Build JWT (do NOT replace '-' with '_'; Snowflake expects hyphens preserved)
    console.log(
      "[Snowflake Auth] Building JWT with account:",
      account,
      "user:",
      user,
      "fingerprint length:",
      publicKeyFingerprint.length,
    );
    const jwtToken = await createJWT(account, user, privateKeyDer, publicKeyFingerprint);
    console.log(
      "[Snowflake Auth] JWT created successfully, issuer will be:",
      `${account.toUpperCase()}.${user.toUpperCase()}.${publicKeyFingerprint}`,
    );
    const snowflakeUrl = `https://${account}.snowflakecomputing.com/api/v2/statements`;
    // Connectivity check - verify Snowflake host is reachable
    try {
      const rootUrl = `https://${account}.snowflakecomputing.com/`;
      const headResp = await fetch(rootUrl, {
        method: "HEAD",
      });
      console.log("[Connectivity] Snowflake host reachable:", rootUrl, "status:", headResp.status);
    } catch (e) {
      console.error("[Connectivity] Failed to reach Snowflake host:", e instanceof Error ? e.message : e);
    }
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
        console.error("Likely fingerprint/account/user formatting issue in JWT. Check DESCRIBE USER.");
      }
      return new Response(
        JSON.stringify({
          error: `Snowflake API error: ${resp.status} - ${errText}`,
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
    const result = await resp.json();
    // Poll if needed
    if (result.statementHandle && !result.data) {
      const pollUrl = `${snowflakeUrl}/${result.statementHandle}`;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const pr = await fetch(pollUrl, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        if (pr.ok) {
          const prJson = await pr.json();
          if (prJson.data) {
            const metadata = prJson.resultSetMetaData?.rowType || [];
            const rows = prJson.data.map((row) => row);
            return new Response(
              JSON.stringify({
                columns: metadata,
                rows,
                rowCount: rows.length,
              }),
              {
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                },
              },
            );
          }
        }
      }
      return new Response(
        JSON.stringify({
          error: "Timed out waiting for Snowflake statement to complete.",
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
    const metadata = result.resultSetMetaData?.rowType || [];
    const rows = result.data ? result.data.map((row) => row) : [];
    return new Response(
      JSON.stringify({
        columns: metadata,
        rows,
        rowCount: rows.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to execute query";
    console.error("Error in snowflake-query function:", msg);
    return new Response(
      JSON.stringify({
        error: msg,
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
