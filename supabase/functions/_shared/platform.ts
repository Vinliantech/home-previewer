import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export type JsonRecord = Record<string, unknown>;

const rateWindows = new Map<string, { count: number; resetAt: number }>();

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function configuredOrigins(): Set<string> {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const siteUrl = Deno.env.get("SITE_URL")?.trim();
  if (siteUrl) configured.push(siteUrl);
  configured.push(
    "https://kaystephgroup.com",
    "https://www.kaystephgroup.com",
    "http://localhost:5173",
  );
  return new Set(configured.map((value) => value.replace(/\/$/, "")));
}

export function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info, x-request-id",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  if (origin && configuredOrigins().has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

export function assertAllowedOrigin(request: Request): void {
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  if (origin && !configuredOrigins().has(origin)) {
    throw new HttpError(403, "This origin is not allowed.");
  }
}

export function preflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  try {
    assertAllowedOrigin(request);
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  } catch {
    return new Response(null, { status: 403 });
  }
}

export function jsonResponse(request: Request, status: number, body: JsonRecord): Response {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

export async function readJson(request: Request, maximumBytes = 64_000): Promise<JsonRecord> {
  const announcedLength = Number(request.headers.get("content-length") ?? 0);
  if (announcedLength > maximumBytes) {
    throw new HttpError(413, "The request is too large.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maximumBytes) {
    throw new HttpError(413, "The request is too large.");
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    return parsed as JsonRecord;
  } catch {
    throw new HttpError(400, "The request body must be valid JSON.");
  }
}

function requestIdentity(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Best-effort burst protection within an Edge isolate. Supabase/API gateway
 * rate limits remain the durable cross-isolate layer.
 */
export function enforceRateLimit(
  request: Request,
  scope: string,
  maximum: number,
  windowMs: number,
): void {
  const now = Date.now();
  const key = `${scope}:${requestIdentity(request)}`;
  const existing = rateWindows.get(key);
  if (!existing || existing.resetAt <= now) {
    rateWindows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  existing.count += 1;
  if (existing.count > maximum) {
    throw new HttpError(429, "Too many requests. Please wait and try again.");
  }
  if (rateWindows.size > 2_000) {
    for (const [candidate, window] of rateWindows) {
      if (window.resetAt <= now) rateWindows.delete(candidate);
    }
  }
}

function requiredSecret(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing Edge Function secret: ${name}`);
  return value;
}

export function serviceClient(): SupabaseClient {
  return createClient(requiredSecret("SUPABASE_URL"), requiredSecret("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function requestClient(request: Request): SupabaseClient {
  const authorization = request.headers.get("authorization") ?? "";
  return createClient(requiredSecret("SUPABASE_URL"), requiredSecret("SUPABASE_ANON_KEY"), {
    global: { headers: authorization ? { Authorization: authorization } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(request: Request): Promise<{
  user: User;
  client: SupabaseClient;
}> {
  const client = requestClient(request);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new HttpError(401, "Sign in is required.");
  return { user: data.user, client };
}

export async function requireRoles(
  request: Request,
  allowedRoles: readonly string[],
): Promise<{ user: User; client: SupabaseClient; admin: SupabaseClient }> {
  const auth = await requireUser(request);
  const { data, error } = await auth.client
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id);
  if (error) throw new HttpError(403, "Your permissions could not be verified.");
  const roles = (data ?? []).map((row) => String(row.role));
  if (!roles.some((role) => allowedRoles.includes(role))) {
    throw new HttpError(403, "You do not have permission to perform this action.");
  }
  return { ...auth, admin: serviceClient(), roles };
}

export async function runJsonEndpoint(
  request: Request,
  label: string,
  handler: (body: JsonRecord, requestId: string) => Promise<unknown>,
): Promise<Response> {
  const options = preflight(request);
  if (options) return options;
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  try {
    assertAllowedOrigin(request);
    if (request.method !== "POST") throw new HttpError(405, "Method not allowed.");
    const body = await readJson(request);
    const data = await handler(body, requestId);
    console.info(
      JSON.stringify({
        level: "info",
        event: label,
        requestId,
        status: "ok",
        durationMs: Date.now() - startedAt,
      }),
    );
    return jsonResponse(request, 200, { data, requestId });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const safeMessage =
      error instanceof HttpError
        ? error.message
        : "The secure service could not complete this request.";
    console.error(
      JSON.stringify({
        level: "error",
        event: label,
        requestId,
        status,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return jsonResponse(request, status, { error: safeMessage, requestId });
  }
}
