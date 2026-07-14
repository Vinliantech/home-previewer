import { createServerFn } from "@tanstack/react-start";

export type OpenProperty = {
  id: string;
  name: string;
  location?: string | null;
  initial_value: number | string;
  images?: string[] | null;
  status: string;
  min_investment?: number | string | null;
  expected_rental_yield?: number | string | null;
  expected_appreciation?: number | string | null;
};


export type FundingSummary = {
  approved: number;
  pending: number;
  investors: number;
};

export type OpenPropertiesResult = {
  properties: OpenProperty[];
  funding: Record<string, FundingSummary>;
};

export const listOpenProperties = createServerFn({ method: "GET" }).handler(
  async (): Promise<OpenPropertiesResult> => {
    // Live listing backend not wired yet — return empty so the education
    // content on /invest still renders.
    return { properties: [], funding: {} };
  },
);
