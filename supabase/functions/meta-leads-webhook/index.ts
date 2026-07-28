import { captureLead, recordCaptureFailure } from "../_shared/crm.ts";
import { parseMetaLead, type MetaLeadPayload } from "../_shared/meta.ts";
import { enforceRateLimit, serviceClient } from "../_shared/platform.ts";

type WebhookBody = {
  entry?: Array<{
    id: string;
    changes?: Array<{
      field: string;
      value: {
        leadgen_id: string;
        page_id: string;
        form_id: string;
        ad_id?: string;
      };
    }>;
  }>;
};

function equalText(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  );
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  try {
    enforceRateLimit(request, "meta-webhook", 600, 10 * 60_000);
    const url = new URL(request.url);
    if (request.method === "GET") {
      const expected = Deno.env.get("META_WEBHOOK_VERIFY_TOKEN") ?? "";
      const supplied = url.searchParams.get("hub.verify_token") ?? "";
      const challenge = url.searchParams.get("hub.challenge");
      if (
        url.searchParams.get("hub.mode") === "subscribe" &&
        expected &&
        equalText(expected, supplied) &&
        challenge
      ) {
        return new Response(challenge, { status: 200 });
      }
      return new Response("forbidden", { status: 403 });
    }
    if (request.method !== "POST") return new Response("method not allowed", { status: 405 });

    const appSecret = Deno.env.get("META_APP_SECRET")?.trim();
    const pageAccessToken = Deno.env.get("META_PAGE_ACCESS_TOKEN")?.trim();
    const graphVersion = Deno.env.get("META_GRAPH_API_VERSION")?.trim();
    if (!appSecret || !pageAccessToken || !graphVersion) {
      return new Response("misconfigured", { status: 500 });
    }

    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 1_000_000) {
      return new Response("payload too large", { status: 413 });
    }
    const expectedSignature = `sha256=${await hmacHex(appSecret, raw)}`;
    const suppliedSignature = request.headers.get("x-hub-signature-256") ?? "";
    if (!equalText(expectedSignature, suppliedSignature)) {
      return new Response("invalid signature", { status: 401 });
    }

    let body: WebhookBody;
    try {
      body = JSON.parse(raw) as WebhookBody;
    } catch {
      return new Response("invalid payload", { status: 400 });
    }

    const admin = serviceClient();
    const configuredPageId = Deno.env.get("META_PAGE_ID")?.trim();
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen") continue;
        const value = change.value;
        if (configuredPageId && value.page_id !== configuredPageId) continue;
        const fields =
          "field_data,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,form_id,created_time";
        const graphUrl = new URL(
          `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(value.leadgen_id)}`,
        );
        graphUrl.searchParams.set("access_token", pageAccessToken);
        graphUrl.searchParams.set("fields", fields);
        const response = await fetch(graphUrl, { signal: AbortSignal.timeout(10_000) });
        if (!response.ok) {
          console.error(
            JSON.stringify({
              event: "meta-lead-fetch-failed",
              requestId,
              status: response.status,
              leadgenId: value.leadgen_id,
            }),
          );
          continue;
        }
        const lead = (await response.json()) as MetaLeadPayload;
        const captureInput = parseMetaLead(lead, {
          leadgenId: value.leadgen_id,
          pageId: value.page_id,
          formId: value.form_id,
          adId: value.ad_id,
        });
        try {
          await captureLead(admin, captureInput);
        } catch (error) {
          await recordCaptureFailure(admin, captureInput, error);
          console.error(
            JSON.stringify({
              event: "meta-lead-capture-failed",
              requestId,
              leadgenId: value.leadgen_id,
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      }
    }
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "meta-webhook-failed",
        requestId,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return new Response("temporary failure", { status: 503 });
  }
});
