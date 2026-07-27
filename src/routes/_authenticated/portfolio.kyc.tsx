import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BadgeCheck, FileUp, Landmark, ShieldCheck, Users } from "lucide-react";
import { getMyKyc, submitKyc } from "@/lib/invest.functions";
import { KYC_STATUS_LABEL } from "@/lib/invest";
import { DashCard, PageHeader, StatusBadge } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/portfolio/kyc")({
  component: Kyc,
});

type KycFormState = {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  nationality: string;
  dob: string;
  id_type: string;
  id_number: string;
  next_of_kin: { name: string; phone: string; relationship: string };
  bank_details: {
    bank_name: string;
    account_name: string;
    account_number: string;
  };
};

const EMPTY_FORM: KycFormState = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  country: "Nigeria",
  nationality: "Nigerian",
  dob: "",
  id_type: "National ID (NIN)",
  id_number: "",
  next_of_kin: { name: "", phone: "", relationship: "" },
  bank_details: { bank_name: "", account_name: "", account_number: "" },
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ID_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const PHOTO_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function asObject(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function validateFile(file: File, allowedTypes: string[], label: string) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `${label} must be a JPG, PNG${label === "Identity document" ? ", or PDF" : ", or WebP"}.`,
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${label} must be 5 MB or smaller.`);
  }
}

function storagePath(userId: string, kind: "id" | "photo", file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${userId}/${kind}-${Date.now()}-${safeName}`;
}

function Kyc() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["kyc"], queryFn: () => getMyKyc() });
  const kyc = data?.kyc;
  const [form, setForm] = useState<KycFormState>(EMPTY_FORM);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const mutation = useMutation({ mutationFn: submitKyc });

  useEffect(() => {
    if (!kyc) return;
    const nextOfKin = asObject(kyc.next_of_kin);
    const bankDetails = asObject(kyc.bank_details);
    setForm({
      full_name: kyc.full_name ?? "",
      email: kyc.email ?? "",
      phone: kyc.phone ?? "",
      address: kyc.address ?? "",
      country: kyc.country ?? "Nigeria",
      nationality: kyc.nationality ?? "Nigerian",
      dob: kyc.dob ?? "",
      id_type: kyc.id_type ?? "National ID (NIN)",
      id_number: kyc.id_number ?? "",
      next_of_kin: {
        name: asText(nextOfKin.name),
        phone: asText(nextOfKin.phone),
        relationship: asText(nextOfKin.relationship),
      },
      bank_details: {
        bank_name: asText(bankDetails.bank_name),
        account_name: asText(bankDetails.account_name),
        account_number: asText(bankDetails.account_number),
      },
    });
  }, [kyc]);

  async function submit() {
    setBusy(true);
    try {
      if (!form.dob) throw new Error("Date of birth is required.");
      if (!idFile && !kyc?.id_doc_url) throw new Error("Identity document is required.");
      if (!photoFile && !kyc?.photo_url) throw new Error("Passport photograph is required.");

      if (idFile) validateFile(idFile, ID_FILE_TYPES, "Identity document");
      if (photoFile) validateFile(photoFile, PHOTO_FILE_TYPES, "Passport photograph");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error("Your session has expired. Please sign in again.");

      let idDocUrl = kyc?.id_doc_url ?? null;
      let photoUrl = kyc?.photo_url ?? null;

      if (idFile) {
        const path = storagePath(authData.user.id, "id", idFile);
        const { error } = await supabase.storage.from("investor-kyc").upload(path, idFile);
        if (error) throw error;
        idDocUrl = path;
      }

      if (photoFile) {
        const path = storagePath(authData.user.id, "photo", photoFile);
        const { error } = await supabase.storage.from("investor-kyc").upload(path, photoFile);
        if (error) throw error;
        photoUrl = path;
      }

      await mutation.mutateAsync({
        data: { ...form, id_doc_url: idDocUrl, photo_url: photoUrl },
      });
      toast.success("KYC submitted for review.");
      setIdFile(null);
      setPhotoFile(null);
      await queryClient.invalidateQueries({ queryKey: ["kyc"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "KYC submission failed.");
    } finally {
      setBusy(false);
    }
  }

  const status = kyc?.kyc_status ?? "not_submitted";

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC verification"
        description="Identity checks protect every owner on the platform. Verified details unlock investing, withdrawals and transfers."
      />

      {/* Status card */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              status === "verified"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {status === "verified" ? (
              <BadgeCheck className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-navy">{KYC_STATUS_LABEL[status] ?? status}</div>
            <div className="text-xs text-slate-500">
              {status === "verified"
                ? "Your identity is verified. Updating details sends your profile back for review."
                : status === "pending"
                  ? "Our compliance team typically reviews submissions within one business day."
                  : "Complete every section below, then submit for verification."}
            </div>
            {kyc?.kyc_notes && (
              <div className="mt-1 text-xs font-medium text-amber-700">Note: {kyc.kyc_notes}</div>
            )}
          </div>
        </div>
        <StatusBadge status={status} label={KYC_STATUS_LABEL[status] ?? status} />
      </div>

      {/* Personal details */}
      <DashCard title="Personal details" description="Exactly as they appear on your ID">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *" htmlFor="kyc-name">
            <Input
              id="kyc-name"
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
            />
          </Field>
          <Field label="Email *" htmlFor="kyc-email">
            <Input
              id="kyc-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field label="Phone *" htmlFor="kyc-phone">
            <Input
              id="kyc-phone"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </Field>
          <Field label="Date of birth *" htmlFor="kyc-dob">
            <Input
              id="kyc-dob"
              type="date"
              value={form.dob}
              onChange={(event) => setForm({ ...form, dob: event.target.value })}
            />
          </Field>
          <Field label="Residential address *" htmlFor="kyc-address" className="sm:col-span-2">
            <Textarea
              id="kyc-address"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </Field>
          <Field label="Country *" htmlFor="kyc-country">
            <Input
              id="kyc-country"
              value={form.country}
              onChange={(event) => setForm({ ...form, country: event.target.value })}
            />
          </Field>
          <Field label="Nationality *" htmlFor="kyc-nationality">
            <Input
              id="kyc-nationality"
              value={form.nationality}
              onChange={(event) => setForm({ ...form, nationality: event.target.value })}
            />
          </Field>
        </div>
      </DashCard>

      {/* Identity documents */}
      <DashCard
        title="Identity documents"
        description="Government-issued ID and a recent photograph"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ID type *" htmlFor="kyc-id-type">
            <Input
              id="kyc-id-type"
              value={form.id_type}
              onChange={(event) => setForm({ ...form, id_type: event.target.value })}
            />
          </Field>
          <Field label="ID number *" htmlFor="kyc-id-number">
            <Input
              id="kyc-id-number"
              value={form.id_number}
              onChange={(event) => setForm({ ...form, id_number: event.target.value })}
            />
          </Field>
          <Field label="Identity document *" htmlFor="kyc-id-file">
            <Input
              id="kyc-id-file"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(event) => setIdFile(event.target.files?.[0] ?? null)}
            />
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <FileUp className="h-3.5 w-3.5" />
              {kyc?.id_doc_url
                ? "Document on file. Upload only to replace it."
                : "JPG, PNG, or PDF. Maximum 5 MB."}
            </p>
          </Field>
          <Field label="Passport photograph *" htmlFor="kyc-photo-file">
            <Input
              id="kyc-photo-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
            />
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <FileUp className="h-3.5 w-3.5" />
              {kyc?.photo_url
                ? "Photograph on file. Upload only to replace it."
                : "JPG, PNG, or WebP. Maximum 5 MB."}
            </p>
          </Field>
        </div>
      </DashCard>

      {/* Next of kin */}
      <DashCard title="Next of kin" description="Contacted only where legally required">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Full name" htmlFor="kin-name">
            <Input
              id="kin-name"
              value={form.next_of_kin.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  next_of_kin: { ...form.next_of_kin, name: event.target.value },
                })
              }
            />
          </Field>
          <Field label="Phone" htmlFor="kin-phone">
            <Input
              id="kin-phone"
              value={form.next_of_kin.phone}
              onChange={(event) =>
                setForm({
                  ...form,
                  next_of_kin: { ...form.next_of_kin, phone: event.target.value },
                })
              }
            />
          </Field>
          <Field label="Relationship" htmlFor="kin-rel">
            <Input
              id="kin-rel"
              value={form.next_of_kin.relationship}
              onChange={(event) =>
                setForm({
                  ...form,
                  next_of_kin: { ...form.next_of_kin, relationship: event.target.value },
                })
              }
            />
          </Field>
        </div>
      </DashCard>

      {/* Settlement account */}
      <DashCard
        title="Settlement account"
        description="Distributions and withdrawals are paid to this account — it must be in your own name"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bank name" htmlFor="bank-name">
            <Input
              id="bank-name"
              value={form.bank_details.bank_name}
              onChange={(event) =>
                setForm({
                  ...form,
                  bank_details: { ...form.bank_details, bank_name: event.target.value },
                })
              }
            />
          </Field>
          <Field label="Account name" htmlFor="bank-acct-name">
            <Input
              id="bank-acct-name"
              value={form.bank_details.account_name}
              onChange={(event) =>
                setForm({
                  ...form,
                  bank_details: { ...form.bank_details, account_name: event.target.value },
                })
              }
            />
          </Field>
          <Field label="Account number" htmlFor="bank-acct-no">
            <Input
              id="bank-acct-no"
              inputMode="numeric"
              value={form.bank_details.account_number}
              onChange={(event) =>
                setForm({
                  ...form,
                  bank_details: { ...form.bank_details, account_number: event.target.value },
                })
              }
            />
          </Field>
        </div>
      </DashCard>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          onClick={submit}
          disabled={busy}
          className="bg-navy px-8 font-bold text-white hover:bg-navy/90"
        >
          {busy ? "Submitting…" : kyc ? "Update KYC submission" : "Submit for verification"}
        </Button>
        {kyc?.kyc_status === "verified" && (
          <p className="text-xs text-amber-700">
            Updating verified details sends this profile back for compliance review.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            text: "KYC documents are stored in protected storage, visible only to authorised compliance staff.",
          },
          {
            icon: Users,
            text: "Verification ensures you co-own with identified, verified people — never anonymous money.",
          },
          {
            icon: Landmark,
            text: "A verified settlement account protects your distributions from misdirection.",
          },
        ].map((item) => (
          <div
            key={item.text}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 shadow-sm"
          >
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </Label>
      {children}
    </div>
  );
}
