import { z } from "npm:zod@3.24.2";
import {
  HttpError,
  enforceRateLimit,
  requireUser,
  runJsonEndpoint,
  serviceClient,
} from "../_shared/platform.ts";

const ALLOWED_BUCKETS = [
  "avatars",
  "client-documents",
  "content-private",
  "investor-kyc",
  "payment-evidence",
] as const;

Deno.serve((request) =>
  runJsonEndpoint(request, "signed-document-url", async (body) => {
    enforceRateLimit(request, "signed-document-url", 120, 10 * 60_000);
    if (body.action !== "create") throw new HttpError(404, "Unknown action.");
    const parsed = z
      .object({
        bucket: z.enum(ALLOWED_BUCKETS),
        path: z.string().trim().min(1).max(1000),
        expiresIn: z.number().int().min(30).max(31_536_000).default(60),
      })
      .safeParse(body.input);
    if (!parsed.success)
      throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input.");
    const { bucket, path } = parsed.data;
    if (path.includes("..") || path.startsWith("/")) throw new HttpError(400, "Invalid file path.");

    const { user, client } = await requireUser(request);
    const admin = serviceClient();
    const { data: roles } = await client.from("user_roles").select("role").eq("user_id", user.id);
    const isAdmin = (roles ?? []).some((row) =>
      ["super_admin", "admin", "crm_manager", "content_manager"].includes(String(row.role)),
    );

    let allowed = isAdmin;
    if (!allowed && bucket === "avatars") allowed = path.startsWith(`${user.id}/`);
    if (!allowed && ["investor-kyc", "payment-evidence"].includes(bucket)) {
      allowed = path.startsWith(`${user.id}/`);
    }
    if (!allowed && bucket === "content-private") {
      const { data } = await client.rpc("is_content_member", { _uid: user.id });
      allowed = Boolean(data);
    }
    if (!allowed && bucket === "client-documents") {
      const { data: byStoragePath } = await client
        .from("documents")
        .select("id")
        .eq("user_id", user.id)
        .eq("storage_path", path)
        .limit(1)
        .maybeSingle();
      if (byStoragePath) {
        allowed = true;
      } else {
        const { data: byFileUrl } = await client
          .from("documents")
          .select("id")
          .eq("user_id", user.id)
          .eq("file_url", path)
          .limit(1)
          .maybeSingle();
        allowed = Boolean(byFileUrl);
      }
    }
    if (!allowed) throw new HttpError(403, "You do not have access to this file.");

    const expiresIn =
      bucket === "avatars"
        ? Math.min(parsed.data.expiresIn, 31_536_000)
        : Math.min(parsed.data.expiresIn, 300);
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data) throw new HttpError(404, "The file could not be opened.");
    return { signedUrl: data.signedUrl, expiresIn };
  }),
);
