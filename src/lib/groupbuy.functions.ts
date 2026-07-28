import { z } from "zod";
import { createEdgeFn } from "@/integrations/supabase/edge";

const groupBuySchema = z.object({
  requestType: z.enum(["start_private_group", "join_open_pool"]),
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(160),
  phone: z.string().trim().min(7, "Please enter a valid phone number").max(24),
  targetProperty: z.string().trim().min(2).max(160),
  groupName: z.string().trim().max(120).optional(),
  expectedMembers: z.string().trim().max(40).optional(),
  contributionPerMember: z.string().trim().max(60).optional(),
  timeline: z.string().trim().max(60).optional(),
  intendedContribution: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
  company: z.string().max(0).optional(),
});

export type GroupBuyInput = z.infer<typeof groupBuySchema>;

export const submitGroupBuyRequest = createEdgeFn<
  GroupBuyInput,
  { ok: true; leadId: string }
>("public-workflows", "group_buy", (input) => groupBuySchema.parse(input));
