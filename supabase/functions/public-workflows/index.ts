import { z } from "npm:zod@3.24.2";
import {
  HttpError,
  enforceRateLimit,
  runJsonEndpoint,
  serviceClient,
  type JsonRecord,
} from "../_shared/platform.ts";
import { captureLead } from "../_shared/crm.ts";
import {
  brevoConfig,
  sendBrevoAdminNotification,
  sendBrevoConfirmation,
  upsertBrevoContact,
} from "../_shared/brevo.ts";

const investmentTypes = [
  "full_purchase",
  "group_purchase",
  "fractional",
  "tokenized",
  "land_purchase",
  "residential_property",
  "commercial_property",
  "rental_income",
  "not_decided",
] as const;

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? "Invalid request.");
  }
  return result.data;
}

const enquirySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(24),
  subject: z.enum([
    "buy_property",
    "invest",
    "site_inspection",
    "existing_investment",
    "partnership",
    "other",
  ]),
  propertyInterest: z.string().trim().max(160).optional(),
  budget: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10).max(2000),
  consentGiven: z.boolean().refine(Boolean),
  company: z.string().max(0).optional(),
});

const groupBuySchema = z.object({
  requestType: z.enum(["start_private_group", "join_open_pool"]),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(24),
  targetProperty: z.string().trim().min(2).max(160),
  groupName: z.string().trim().max(120).optional(),
  expectedMembers: z.string().trim().max(40).optional(),
  contributionPerMember: z.string().trim().max(60).optional(),
  timeline: z.string().trim().max(60).optional(),
  intendedContribution: z.string().trim().max(60).optional(),
  message: z.string().trim().max(2000).optional(),
  company: z.string().max(0).optional(),
});

const eventRegistrationSchema = z.object({
  eventId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(30),
  whatsappNumber: z.string().trim().max(30).optional(),
  location: z.string().trim().max(120).optional(),
  countryOfResidence: z.string().trim().max(100),
  propertyInterest: z.string().trim().max(160).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  investmentType: z.enum(investmentTypes),
  heardAbout: z.string().trim().max(100).optional(),
  preferredContactMethod: z.enum(["whatsapp", "phone", "email"]),
  consentGiven: z.boolean().refine(Boolean),
  company: z.string().max(0).optional(),
});

const youthSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(120),
  gender: z.enum(["Male", "Female", "Prefer not to say"]),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160),
  whatsapp: z.string().trim().max(30).optional(),
  occupation: z.string().trim().max(120).optional(),
  interest: z.enum([
    "Real Estate Sales",
    "Property Investment",
    "Digital Marketing",
    "Affiliate Marketing",
    "Entrepreneurship",
    "Career Development",
    "Networking",
    "Other",
  ]),
  expectation: z.string().trim().max(2000).optional(),
  consentGiven: z.boolean().refine(Boolean),
  company: z.string().max(0).optional(),
});

const newsletterSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  interests: z.array(z.string().trim().max(100)).min(1).max(20),
  consentGiven: z.boolean().refine(Boolean),
  sourcePostSlug: z.string().trim().max(140).optional(),
  sourceCategorySlug: z.string().trim().max(140).optional(),
  campaignSource: z.string().trim().max(140).optional(),
  company: z.string().max(0).optional(),
});

const engagementSchema = z.object({
  postSlug: z.string().trim().max(140),
  eventType: z.enum([
    "view",
    "read_progress",
    "video_play",
    "social_share",
    "report_download",
    "investment_pack_request",
    "consultation_booking",
    "event_registration",
    "property_enquiry",
    "cta_click",
  ]),
  visitorId: z.string().max(160).optional(),
  sessionId: z.string().max(160).optional(),
  isUnique: z.boolean().default(false),
  sourceUrl: z.string().max(2000).optional(),
  referrer: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).default({}),
});

const commentSchema = z.object({
  postSlug: z.string().trim().max(140),
  authorName: z.string().trim().min(2).max(120),
  authorEmail: z.string().trim().email().max(180),
  body: z.string().trim().min(2).max(5000),
  consentGiven: z.boolean().refine(Boolean),
  company: z.string().max(0).optional(),
});

Deno.serve((request) =>
  runJsonEndpoint(request, "public-workflows", async (body) => {
    const action = String(body.action ?? "");
    const input = body.input;
    const admin = serviceClient();
    enforceRateLimit(request, `public:${action}`, action === "engagement" ? 120 : 12, 10 * 60_000);

    if (action === "enquiry") {
      const data = parse(enquirySchema, input);
      if (data.company) return { ok: true };
      const source =
        data.subject === "invest"
          ? "website_investment_form"
          : ["buy_property", "site_inspection"].includes(data.subject)
            ? "website_property_enquiry"
            : "website_contact_form";
      const budgets: Record<string, [number | null, number | null]> = {
        "Below ₦50M": [null, 50_000_000],
        "₦50M – ₦100M": [50_000_000, 100_000_000],
        "₦100M – ₦250M": [100_000_000, 250_000_000],
        "₦250M – ₦500M": [250_000_000, 500_000_000],
        "Above ₦500M": [500_000_000, null],
      };
      const [budgetMin, budgetMax] = budgets[data.budget ?? ""] ?? [null, null];
      const result = await captureLead(admin, {
        source,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        propertyName: data.propertyInterest,
        budgetMin,
        budgetMax,
        investmentType:
          data.subject === "invest"
            ? "fractional"
            : ["buy_property", "site_inspection"].includes(data.subject)
              ? "full_purchase"
              : "not_decided",
        message: data.message,
        consentGiven: true,
        rawPayload: { subject: data.subject, budget: data.budget ?? null },
        acknowledgement: {
          investmentLabel:
            data.subject === "invest" ? "fractional or group property investment" : null,
        },
      });
      return { ok: true, ...result };
    }

    if (action === "group_buy") {
      const data = parse(groupBuySchema, input);
      if (data.company) return { ok: true };
      const founder = data.requestType === "start_private_group";
      const message = [
        founder
          ? `GROUP BUY — start a private group${data.groupName ? ` (${data.groupName})` : ""}.`
          : "GROUP BUY — join an open pool.",
        data.expectedMembers && `Expected members: ${data.expectedMembers}.`,
        data.contributionPerMember && `Contribution per member: ${data.contributionPerMember}.`,
        data.timeline && `Timeline: ${data.timeline}.`,
        data.intendedContribution && `Intended contribution: ${data.intendedContribution}.`,
        data.message,
      ]
        .filter(Boolean)
        .join(" ");
      const result = await captureLead(admin, {
        source: "website_investment_form",
        sourceDetail: founder
          ? "Group buy — start a private group"
          : "Group buy — join an open pool",
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        propertyName: data.targetProperty,
        investmentType: "group_purchase",
        message,
        rawPayload: data,
        interestMetadata: { request_type: data.requestType },
        acknowledgement: { investmentLabel: "a group property purchase" },
      });
      return { ok: true, leadId: result.leadId };
    }

    if (action === "event_get") {
      const data = parse(z.object({ eventId: z.string().uuid() }), input);
      const { data: event, error } = await admin
        .from("crm_events")
        .select(
          "id, name, event_type, property_name, starts_at, ends_at, venue, meeting_url, capacity, description, status",
        )
        .eq("id", data.eventId)
        .eq("status", "published")
        .maybeSingle();
      if (error || !event) throw new HttpError(404, "This event is not available.");
      const { count } = await admin
        .from("event_registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .neq("status", "cancelled");
      return { event, registrations: count ?? 0 };
    }

    if (action === "event_register") {
      const data = parse(eventRegistrationSchema, input);
      if (data.company) return { ok: true };
      const { data: event } = await admin
        .from("crm_events")
        .select("id, name, event_type, property_name, status, capacity")
        .eq("id", data.eventId)
        .eq("status", "published")
        .maybeSingle();
      if (!event) throw new HttpError(409, "This event is not accepting registrations.");
      if (event.capacity) {
        const { count } = await admin
          .from("event_registrations")
          .select("id", { count: "exact", head: true })
          .eq("event_id", event.id)
          .neq("status", "cancelled");
        if ((count ?? 0) >= event.capacity) throw new HttpError(409, "This event is full.");
      }
      const now = new Date().toISOString();
      const capture = await captureLead(admin, {
        source: event.event_type === "workshop" ? "workshop_registration" : "event_registration",
        sourceReference: event.id,
        sourceDetail: event.name,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber || data.phone,
        location: data.location,
        countryOfResidence: data.countryOfResidence,
        propertyName: data.propertyInterest || event.property_name,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        investmentType: data.investmentType,
        preferredContactMethod: data.preferredContactMethod,
        consentGiven: true,
        interestMetadata: { event_name: event.name, heard_about: data.heardAbout ?? null },
        acknowledgement: { eventName: event.name },
      });
      const { error } = await admin.from("event_registrations").upsert(
        {
          event_id: event.id,
          lead_id: capture.leadId,
          status: "registered",
          preferred_contact_method: data.preferredContactMethod,
          consent_given: true,
          consent_at: now,
          notes: data.heardAbout ? `Source: ${data.heardAbout}` : null,
        },
        { onConflict: "event_id,lead_id" },
      );
      if (error) throw new Error(error.message);
      return { ok: true, leadId: capture.leadId, merged: capture.merged, eventName: event.name };
    }

    if (action === "youth_register") {
      const data = parse(youthSchema, input);
      if (data.company) {
        return { ok: true, reference: "KSYN-00000", email: data.email, alreadyRegistered: false };
      }
      const eventKey = "youth-network-workshop-2.0";
      const eventName = "Kay-Steph Youth Network Workshop 2.0";
      const { data: existing } = await admin
        .from("workshop_registrations")
        .select("reference")
        .eq("event_key", eventKey)
        .ilike("email", data.email.toLowerCase())
        .maybeSingle();
      if (existing) {
        return {
          ok: true,
          reference: existing.reference,
          email: data.email,
          alreadyRegistered: true,
        };
      }
      const now = new Date().toISOString();
      const { data: registration, error } = await admin
        .from("workshop_registrations")
        .insert({
          event_key: eventKey,
          event_name: eventName,
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp || null,
          location: data.location,
          gender: data.gender,
          occupation: data.occupation || null,
          interest: data.interest,
          expectation: data.expectation || null,
          consent_given: true,
          consent_at: now,
        })
        .select("id, reference")
        .single();
      if (error || !registration) throw new Error(error?.message ?? "Registration failed.");
      let leadId: string | null = null;
      try {
        const capture = await captureLead(admin, {
          source: "workshop_registration",
          sourceReference: registration.reference,
          sourceDetail: eventName,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          whatsappNumber: data.whatsapp || data.phone,
          location: data.location,
          investmentType: data.interest === "Property Investment" ? "fractional" : "not_decided",
          preferredContactMethod: data.whatsapp ? "whatsapp" : "phone",
          message: data.expectation,
          consentGiven: true,
          rawPayload: { ...data, registration_reference: registration.reference },
          suppressAcknowledgement: true,
        });
        leadId = capture.leadId;
      } catch (captureError) {
        console.error("[youth-register] CRM capture failed", captureError);
      }
      const firstName = data.fullName.split(/\s+/)[0] || data.fullName;
      const contact = {
        email: data.email,
        firstName,
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        location: data.location,
        gender: data.gender,
        occupation: data.occupation || null,
        interest: data.interest,
        eventName,
        reference: registration.reference,
      };
      const config = await brevoConfig(admin);
      const errors: string[] = [];
      let contactStatus = "failed";
      let confirmationStatus = "failed";
      let adminStatus = "failed";
      if ("error" in config) {
        errors.push(config.error);
      } else {
        const [contactResult, confirmation, notification] = await Promise.all([
          upsertBrevoContact(config.config, contact),
          sendBrevoConfirmation(config.config, contact),
          sendBrevoAdminNotification(config.config, contact, data.expectation || null),
        ]);
        if (contactResult.ok) contactStatus = "synced";
        else errors.push(contactResult.error);
        if (confirmation.ok) confirmationStatus = "sent";
        else errors.push(confirmation.error);
        if (notification.ok) adminStatus = "sent";
        else errors.push(notification.error);
      }
      await admin
        .from("workshop_registrations")
        .update({
          lead_id: leadId,
          brevo_contact_status: contactStatus,
          confirmation_email_status: confirmationStatus,
          admin_email_status: adminStatus,
          last_error: errors.length ? errors.join(" | ").slice(0, 2000) : null,
          last_attempt_at: now,
        })
        .eq("id", registration.id);
      return {
        ok: true,
        reference: registration.reference,
        email: data.email,
        alreadyRegistered: false,
        confirmationSent: confirmationStatus === "sent",
      };
    }

    if (action === "newsletter") {
      const data = parse(newsletterSchema, input);
      if (data.company) return { ok: true };
      const normalizedEmail = data.email.toLowerCase();
      const [{ data: post }, { data: category }] = await Promise.all([
        data.sourcePostSlug
          ? admin
              .from("blog_posts")
              .select("id, title, primary_category_id")
              .eq("slug", data.sourcePostSlug)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        data.sourceCategorySlug
          ? admin
              .from("blog_categories")
              .select("id, name")
              .eq("slug", data.sourceCategorySlug)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      const capture = await captureLead(admin, {
        source: "website_contact_form",
        sourceReference: post?.id ?? category?.id ?? null,
        sourceDetail: post?.title
          ? `Blog newsletter: ${post.title}`
          : category?.name
            ? `Blog category newsletter: ${category.name}`
            : "Blog newsletter",
        fullName: data.fullName,
        email: normalizedEmail,
        investmentType: "not_decided",
        preferredContactMethod: "email",
        message: `Newsletter interests: ${data.interests.join(", ")}`,
        consentGiven: true,
        interestMetadata: {
          blog_post_id: post?.id ?? null,
          blog_category_id: category?.id ?? post?.primary_category_id ?? null,
          campaign_source: data.campaignSource ?? "organic_blog",
          newsletter_interests: data.interests,
        },
      });
      const { data: existing } = await admin
        .from("newsletter_subscribers")
        .select("id, interests")
        .ilike("email", normalizedEmail)
        .maybeSingle();
      const values = {
        full_name: data.fullName,
        interests: Array.from(new Set([...(existing?.interests ?? []), ...data.interests])),
        consent_given: true,
        consent_at: new Date().toISOString(),
        consent_source: "blog",
        source_post_id: post?.id ?? null,
        source_category_id: category?.id ?? post?.primary_category_id ?? null,
        campaign_source: data.campaignSource ?? "organic_blog",
        lead_id: capture.leadId,
        status: "active",
        unsubscribed_at: null,
      };
      if (existing) {
        await admin.from("newsletter_subscribers").update(values).eq("id", existing.id);
      } else {
        await admin.from("newsletter_subscribers").insert({ ...values, email: normalizedEmail });
      }
      return { ok: true, merged: capture.merged };
    }

    if (action === "engagement") {
      const data = parse(engagementSchema, input);
      const { data: post } = await admin
        .from("blog_posts")
        .select("id, primary_category_id, video_play_count, social_share_count")
        .eq("slug", data.postSlug)
        .eq("status", "published")
        .maybeSingle();
      if (!post) return { ok: false };
      await admin.from("blog_engagement_events").insert({
        post_id: post.id,
        category_id: post.primary_category_id,
        event_type: data.eventType,
        visitor_id: data.visitorId || null,
        session_id: data.sessionId || null,
        source_url: data.sourceUrl || null,
        referrer: data.referrer || null,
        metadata: data.metadata,
      });
      if (data.eventType === "view") {
        await admin.rpc("increment_blog_post_view", {
          _post_id: post.id,
          _unique: data.isUnique,
        });
      } else if (data.eventType === "video_play") {
        await admin
          .from("blog_posts")
          .update({ video_play_count: Number(post.video_play_count ?? 0) + 1 })
          .eq("id", post.id);
      } else if (data.eventType === "social_share") {
        await admin
          .from("blog_posts")
          .update({ social_share_count: Number(post.social_share_count ?? 0) + 1 })
          .eq("id", post.id);
      }
      return { ok: true };
    }

    if (action === "comment") {
      const data = parse(commentSchema, input);
      if (data.company) return { ok: true };
      const { data: post } = await admin
        .from("blog_posts")
        .select("id, comments_enabled")
        .eq("slug", data.postSlug)
        .eq("status", "published")
        .maybeSingle();
      if (!post?.comments_enabled) throw new HttpError(409, "Comments are not enabled.");
      const { error } = await admin.from("blog_comments").insert({
        post_id: post.id,
        author_name: data.authorName,
        author_email: data.authorEmail.toLowerCase(),
        body: data.body,
        status: "pending",
        consent_given: true,
      });
      if (error) throw new Error(error.message);
      return { ok: true };
    }

    throw new HttpError(404, "Unknown workflow action.");
  }),
);
