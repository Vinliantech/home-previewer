import { z } from "zod";
import { createEdgeFn, invokeEdgeFunction } from "@/integrations/supabase/edge";

export const YOUTH_NETWORK_INTERESTS = [
  "Real Estate Sales",
  "Property Investment",
  "Digital Marketing",
  "Affiliate Marketing",
  "Entrepreneurship",
  "Career Development",
  "Networking",
  "Other",
] as const;

export const YOUTH_NETWORK_GENDERS = ["Male", "Female", "Prefer not to say"] as const;
export const YOUTH_NETWORK_EVENT_KEY = "youth-network-workshop-2.0";
export const YOUTH_NETWORK_EVENT_NAME = "Kay-Steph Youth Network Workshop 2.0";

const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  location: z.string().trim().min(2, "Enter your city or state").max(120),
  gender: z.enum(YOUTH_NETWORK_GENDERS),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  email: z.string().trim().email("Enter a valid email address").max(160),
  whatsapp: z.string().trim().max(30).optional(),
  occupation: z.string().trim().max(120).optional(),
  interest: z.enum(YOUTH_NETWORK_INTERESTS),
  expectation: z.string().trim().max(2000).optional(),
  consentGiven: z.boolean().refine(Boolean, "Please accept the consent statement."),
  company: z.string().max(0).optional(),
});

export type YouthNetworkRegistrationInput = z.infer<typeof registrationSchema>;
type RegistrationResult = {
  ok: true;
  reference: string;
  email: string;
  alreadyRegistered: boolean;
  confirmationSent?: boolean;
};

export async function registerYouthNetwork(input: unknown): Promise<RegistrationResult> {
  return invokeEdgeFunction<RegistrationResult>(
    "public-workflows",
    "youth_register",
    registrationSchema.parse(input),
  );
}

export const submitYouthNetworkRegistration = createEdgeFn<
  YouthNetworkRegistrationInput,
  RegistrationResult
>("public-workflows", "youth_register", (input) => registrationSchema.parse(input));
