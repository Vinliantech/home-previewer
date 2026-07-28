import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Clock3,
  Headset,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { DashCard, PageHeader } from "@/components/portfolio/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitEnquiry } from "@/lib/enquiry.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  ADDRESS_LINES,
  EMAIL,
  OFFICE_HOURS,
  PHONE_1,
  PHONE_1_DISPLAY,
  PHONE_2,
  PHONE_2_DISPLAY,
  WHATSAPP_URL,
} from "@/lib/properties";

export const Route = createFileRoute("/_authenticated/portfolio/support")({
  component: SupportPage,
});

const TOPIC_OPTIONS = [
  { value: "existing_investment", label: "My investment or portfolio" },
  { value: "buy_property", label: "Buying another property" },
  { value: "invest", label: "Making a new contribution" },
  { value: "site_inspection", label: "Booking a site inspection" },
  { value: "other", label: "Something else" },
] as const;

const FAQ_SHORTCUTS = [
  "How do withdrawals work and how long do they take?",
  "When are rental distributions paid?",
  "How do I resell my tokens or interest?",
  "How is my ownership documented and verified?",
];

function SupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Real people, one business-day response on written enquiries."
      />

      {/* Contact channels */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChannelCard
          icon={MessageCircle}
          title="WhatsApp"
          body="Fastest channel during office hours."
          action={
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-gold"
            >
              Message {PHONE_1_DISPLAY} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          }
        />
        <ChannelCard
          icon={Phone}
          title="Call us"
          body="Speak directly with the client desk."
          action={
            <div className="space-y-0.5 text-sm font-bold text-navy">
              <a href={`tel:${PHONE_1}`} className="block hover:text-gold">
                {PHONE_1_DISPLAY}
              </a>
              <a href={`tel:${PHONE_2}`} className="block hover:text-gold">
                {PHONE_2_DISPLAY}
              </a>
            </div>
          }
        />
        <ChannelCard
          icon={Mail}
          title="Email"
          body="For documents and formal requests."
          action={
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-gold"
            >
              {EMAIL} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          }
        />
        <ChannelCard
          icon={MapPin}
          title="Visit the office"
          body={ADDRESS_LINES.join(" ")}
          action={
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock3 className="h-3.5 w-3.5 text-gold" />
              {OFFICE_HOURS[0].days}: {OFFICE_HOURS[0].hours}
            </div>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Enquiry form */}
        <DashCard
          title="Send an enquiry"
          description="Goes straight to the client team with your account email attached"
        >
          <SupportForm />
        </DashCard>

        {/* FAQ shortcuts */}
        <DashCard title="Common questions" description="Answered in detail in our FAQ">
          <ul className="space-y-3">
            {FAQ_SHORTCUTS.map((q) => (
              <li key={q}>
                <Link
                  to="/faq"
                  className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition-colors hover:border-gold hover:text-navy"
                >
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {q}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to="/faq"
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-navy hover:text-gold"
          >
            Browse the full FAQ <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </DashCard>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm">
        <Headset className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p>
          <b className="text-navy">Our promise:</b> written enquiries receive a response within one
          business day. Urgent payment or security issues? Call {PHONE_1_DISPLAY} during office
          hours and say “urgent” — the desk prioritises those calls.
        </p>
      </div>
    </div>
  );
}

function ChannelCard({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Phone;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 text-navy">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-bold text-navy">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-5 text-slate-500">{body}</p>
      <div className="mt-3">{action}</div>
    </div>
  );
}

function SupportForm() {
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic) {
      toast.error("Choose a topic for your enquiry.");
      return;
    }
    setBusy(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      await submitEnquiry({
        data: {
          fullName:
            ((user?.user_metadata?.full_name as string) || user?.email?.split("@")[0]) ?? "Client",
          email: user?.email ?? "",
          phone: phone || "0000000",
          subject: topic as (typeof TOPIC_OPTIONS)[number]["value"],
          message: `[Client portal support] ${message}`,
          consentGiven: true,
        },
      });
      toast.success("Enquiry sent. We respond within one business day.");
      setTopic("");
      setMessage("");
      setPhone("");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Could not send your enquiry — please use WhatsApp instead.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Topic</Label>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger aria-label="Enquiry topic">
              <SelectValue placeholder="What is this about?" />
            </SelectTrigger>
            <SelectContent>
              {TOPIC_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="support-phone">Phone (optional)</Label>
          <Input
            id="support-phone"
            type="tel"
            placeholder="Best number to reach you"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="support-message">Your message</Label>
        <Textarea
          id="support-message"
          required
          minLength={10}
          rows={5}
          placeholder="Describe your question or issue — include property names or references where relevant."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        disabled={busy}
        className="bg-navy px-8 font-bold text-white hover:bg-navy/90"
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" /> Send enquiry
          </>
        )}
      </Button>
    </form>
  );
}
