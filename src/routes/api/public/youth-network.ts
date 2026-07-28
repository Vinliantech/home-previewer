import { createFileRoute } from "@tanstack/react-router";
import {
  processYouthNetworkRegistration,
  youthNetworkRegistrationSchema,
} from "@/lib/youth-network.shared";

/**
 * Public registration endpoint for the standalone youth-network.html page
 * hosted on a subdomain. CORS-open on POST because it is called cross-origin
 * from that static page; the honeypot + rate of writes is the abuse guard.
 */

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

export const Route = createFileRoute("/api/public/youth-network")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const parsed = youthNetworkRegistrationSchema.safeParse(body);
          if (!parsed.success) {
            return Response.json(
              { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid submission" },
              { status: 400, headers: corsHeaders },
            );
          }
          const result = await processYouthNetworkRegistration(parsed.data);
          return Response.json(result, { headers: corsHeaders });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Registration failed";
          return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
        }
      },
    },
  },
});
