import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Group-buy intake (Phase 1).
 *
 * There is no self-serve pool engine yet: every request lands in the CRM
 * `leads` pipeline as a structured group-buy lead, and the team confirms
 * the group and opens the pool manually within one business day. When the
 * pool engine ships, this same shape becomes the pool-creation payload.
 */
const groupBuySchema = z.object({
  requestType: z.enum(["start_private_group", "join_open_pool"]),
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(160),
  phone: z.string().trim().min(7, "Please enter a valid phone number").max(24),
  targetProperty: z.string().trim().min(2).max(160),
  /** Start-a-group only */
  groupName: z.string().trim().max(120).optional(),
  expectedMembers: z.string().trim().max(40).optional(),
  contributionPerMember: z.string().trim().max(60).optional(),
  timeline: z.string().trim().max(60).optional(),
  /** Join-a-pool only */
  intendedContribution: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
  // Honeypot: hidden field real users never fill.
  company: z.string().max(0).optional(),
});

export type GroupBuyInput = z.infer<typeof groupBuySchema>;

export const submitGroupBuyRequest = createServerFn({ method: "POST" })
  .validator((input) => groupBuySchema.parse(input))
  .handler(async ({ data }) => {
    const FRIENDLY_ERROR =
      "We could not submit your request. Please try again or contact us on WhatsApp.";

    const isFounder = data.requestType === "start_private_group";

    try {
      const now = new Date().toISOString();
      const summary = [
        isFounder
          ? `GROUP BUY — wants to START a private group${data.groupName ? ` ("${data.groupName}")` : ""}.`
          : "GROUP BUY — wants to JOIN an open pool.",
        isFounder && data.expectedMembers ? `Expected members: ${data.expectedMembers}.` : null,
        isFounder && data.contributionPerMember
          ? `Contribution per member: ${data.contributionPerMember}.`
          : null,
        isFounder && data.timeline ? `Timeline: ${data.timeline}.` : null,
        !isFounder && data.intendedContribution
          ? `Intended contribution: ${data.intendedContribution}.`
          : null,
        data.message || null,
      ]
        .filter(Boolean)
        .join(" ");

      // Was a bare insert into leads, which skipped dedupe, adviser assignment
      // and the acknowledgement email. captureLead is the shared intake path.
      const { captureLead } = await import("@/lib/crm-capture.server");
      const result = await captureLead({
        source: "website_investment_form",
        sourceDetail: isFounder
          ? "Group buy — start a private group"
          : "Group buy — join an open pool",
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        propertyName: data.targetProperty,
        investmentType: "group_purchase",
        message: summary,
        capturedAt: now,
        rawPayload: {
          source: "website_group_buy_form",
          request_type: data.requestType,
          group_name: data.groupName ?? null,
          target_property: data.targetProperty,
          expected_members: data.expectedMembers ?? null,
          contribution_per_member: data.contributionPerMember ?? null,
          timeline: data.timeline ?? null,
          intended_contribution: data.intendedContribution ?? null,
          submitted_at: now,
        },
        interestMetadata: { request_type: data.requestType },
        acknowledgement: { investmentLabel: "a group property purchase" },
      });

      return { ok: true, leadId: result.leadId };
    } catch (error) {
      console.error("[group-buy] lead submission failed:", error);
      throw new Error(FRIENDLY_ERROR);
    }
  });
