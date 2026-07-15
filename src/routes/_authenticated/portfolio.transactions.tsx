import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowDownToLine, Receipt, Search } from "lucide-react";
import { getMyTransactions } from "@/lib/invest.functions";
import { fmtNGN } from "@/lib/invest";
import { DashCard, EmptyState, fmtDate, PageHeader } from "@/components/portfolio/kit";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/portfolio/transactions")({
  component: Txns,
});

/* eslint-disable @typescript-eslint/no-explicit-any */

function Txns() {
  const { data } = useQuery({ queryKey: ["txns"], queryFn: () => getMyTransactions() });
  const rows = useMemo(() => (data?.transactions ?? []) as any[], [data]);
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  const types = useMemo(() => Array.from(new Set(rows.map((r) => String(r.type)))).sort(), [rows]);

  const filtered = rows.filter((r) => {
    if (type !== "all" && r.type !== type) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const haystack =
        `${r.type} ${r.reference ?? ""} ${r.tokenized_properties?.name ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="A full record of every movement on your account."
        actions={
          <Link
            to="/portfolio/statements"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-navy hover:border-navy"
          >
            <ArrowDownToLine className="h-4 w-4" /> Download statement
          </Link>
        }
      />

      <DashCard noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search reference, property or type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              aria-label="Search transactions"
            />
          </div>
          <div className="sm:w-52">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger aria-label="Filter by type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={rows.length === 0 ? "No transactions yet" : "Nothing matches your filters"}
            body={
              rows.length === 0
                ? "Contributions, distributions and withdrawals will appear here."
                : "Try a different search term or type."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-slate-500">
                    {fmtDate(r.created_at)}
                  </TableCell>
                  <TableCell className="font-medium capitalize text-navy">
                    {String(r.type).replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {r.tokenized_properties?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{r.reference ?? "—"}</TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums ${
                      Number(r.amount) < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {fmtNGN(r.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DashCard>
    </div>
  );
}
