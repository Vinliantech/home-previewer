import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PoolDetailResult, PoolListResult } from "@/lib/pools";
// Pool tables are new; the generated Database types may not include them yet,
// so these handlers use loosely-typed queries via the `sb` alias.

type AnyClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

/** List the pools the signed-in user founded or joined, with progress summaries. */
export const getMyPools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as AnyClient;

    const { data: memberships } = await sb
      .from("pool_members")
      .select("pool_id, is_founder, status, committed_amount")
      .eq("user_id", context.userId);

    const founded = await sb.from("group_pools").select("*").eq("created_by", context.userId);

    const memberPoolIds: string[] = (memberships ?? []).map((m: { pool_id: string }) => m.pool_id);
    const joined =
      memberPoolIds.length > 0
        ? await sb.from("group_pools").select("*").in("id", memberPoolIds)
        : { data: [] };

    // Merge + dedupe
    const byId = new Map<string, Record<string, unknown>>();
    for (const p of founded.data ?? []) byId.set(p.id as string, p);
    for (const p of joined.data ?? []) byId.set(p.id as string, p);
    const pools = [...byId.values()];

    const ids = pools.map((p) => p.id as string);
    let summaries: Record<string, unknown>[] = [];
    if (ids.length) {
      const { data } = await sb.rpc("get_pool_summaries", { _pool_ids: ids });
      summaries = data ?? [];
    }
    const summaryById = new Map(summaries.map((s) => [s.pool_id as string, s]));

    return {
      pools: pools.map((p) => ({
        ...p,
        summary: summaryById.get(p.id as string) ?? {
          committed: 0,
          approved: 0,
          members: 0,
          approved_members: 0,
        },
        my_membership:
          (memberships ?? []).find((m: { pool_id: string }) => m.pool_id === p.id) ?? null,
      })),
    } as PoolListResult;
  });

/** Open pools any verified investor can join. */
export const listOpenPools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as AnyClient;
    const { data: pools } = await sb
      .from("group_pools")
      .select("*")
      .eq("visibility", "open")
      .in("status", ["open", "threshold_met"])
      .order("created_at", { ascending: false });

    const ids = (pools ?? []).map((p: { id: string }) => p.id);
    let summaries: Record<string, unknown>[] = [];
    if (ids.length) {
      const { data } = await sb.rpc("get_pool_summaries", { _pool_ids: ids });
      summaries = data ?? [];
    }
    const summaryById = new Map(summaries.map((s) => [s.pool_id as string, s]));
    return {
      pools: (pools ?? []).map((p: { id: string }) => ({
        ...p,
        summary: summaryById.get(p.id) ?? {
          committed: 0,
          approved: 0,
          members: 0,
          approved_members: 0,
        },
      })),
    } as PoolListResult;
  });

/** One pool with its members (RLS shows members to co-members and the founder). */
export const getPoolDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ pool_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as AnyClient;
    const { data: pool, error } = await sb
      .from("group_pools")
      .select("*")
      .eq("id", data.pool_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!pool) throw new Error("Pool not found");

    const { data: members } = await sb
      .from("pool_members")
      .select("*")
      .eq("pool_id", data.pool_id)
      .order("is_founder", { ascending: false })
      .order("created_at", { ascending: true });

    const { data: summaryRows } = await sb.rpc("get_pool_summaries", {
      _pool_ids: [data.pool_id],
    });

    return {
      pool,
      members: members ?? [],
      summary: (summaryRows ?? [])[0] ?? {
        committed: 0,
        approved: 0,
        members: 0,
        approved_members: 0,
      },
      is_founder: pool.created_by === context.userId,
    } as PoolDetailResult;
  });

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  property_id: z.string().uuid().nullable().optional(),
  property_name: z.string().trim().max(160).optional(),
  visibility: z.enum(["private", "open"]),
  target_amount: z.number().positive(),
  min_contribution: z.number().min(0).optional(),
  member_cap: z.number().int().positive().nullable().optional(),
  closing_date: z.string().nullable().optional(),
  description: z.string().trim().max(2000).optional(),
  founder_commitment: z.number().min(0).optional(),
});

export const createPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => createSchema.parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as AnyClient;
    const { data: id, error } = await sb.rpc("create_group_pool", {
      _name: data.name,
      _property_id: data.property_id ?? null,
      _property_name: data.property_name ?? null,
      _visibility: data.visibility,
      _target_amount: data.target_amount,
      _min_contribution: data.min_contribution ?? 0,
      _member_cap: data.member_cap ?? null,
      _closing_date: data.closing_date ?? null,
      _description: data.description ?? null,
      _founder_commitment: data.founder_commitment ?? 0,
    });
    if (error) throw new Error(error.message);
    return { id: id as string };
  });

export const joinPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ pool_id: z.string().uuid(), amount: z.number().positive() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as AnyClient;
    const { error } = await sb.rpc("join_group_pool", {
      _pool_id: data.pool_id,
      _amount: data.amount,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const invitePoolMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ pool_id: z.string().uuid(), email: z.string().email() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as AnyClient;
    const { error } = await sb.rpc("invite_pool_member", {
      _pool_id: data.pool_id,
      _email: data.email,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ===================== Admin =====================

export const adminListPools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase as unknown as AnyClient;
    const { data: pools } = await sb
      .from("group_pools")
      .select("*")
      .order("created_at", { ascending: false });
    const ids = (pools ?? []).map((p: { id: string }) => p.id);
    let summaries: Record<string, unknown>[] = [];
    if (ids.length) {
      const { data } = await sb.rpc("get_pool_summaries", { _pool_ids: ids });
      summaries = data ?? [];
    }
    const summaryById = new Map(summaries.map((s) => [s.pool_id as string, s]));
    return {
      pools: (pools ?? []).map((p: { id: string }) => ({
        ...p,
        summary: summaryById.get(p.id) ?? {
          committed: 0,
          approved: 0,
          members: 0,
          approved_members: 0,
        },
      })),
    } as PoolListResult;
  });

export const adminReviewPool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        pool_id: z.string().uuid(),
        approve: z.boolean(),
        notes: z.string().max(500).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as AnyClient;
    const { error } = await sb.rpc("admin_review_pool", {
      _pool_id: data.pool_id,
      _approve: data.approve,
      _notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
