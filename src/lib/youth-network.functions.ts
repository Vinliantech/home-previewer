import { createServerFn } from "@tanstack/react-start";
import {
  processYouthNetworkRegistration,
  youthNetworkRegistrationSchema,
  type YouthNetworkRegistrationInput,
} from "@/lib/youth-network.shared";

export {
  YOUTH_NETWORK_INTERESTS,
  YOUTH_NETWORK_GENDERS,
  YOUTH_NETWORK_EVENT_KEY,
  YOUTH_NETWORK_EVENT_NAME,
} from "@/lib/youth-network.constants";

export type { YouthNetworkRegistrationInput };

export const submitYouthNetworkRegistration = createServerFn({ method: "POST" })
  .validator((input: unknown) => youthNetworkRegistrationSchema.parse(input))
  .handler(async ({ data }) => processYouthNetworkRegistration(data));
