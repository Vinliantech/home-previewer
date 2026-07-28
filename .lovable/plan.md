## What's already there

The Youth Network form already submits to Brevo end-to-end via `src/lib/brevo.server.ts`, called from `submitYouthNetworkRegistration` in `src/lib/youth-network.functions.ts`. On submit it:

1. Saves the registration to `workshop_registrations` (with a reference like `KSYN-…`)
2. Upserts the person as a Brevo contact (with name, phone, location, interest, etc.)
3. Sends a confirmation email to the registrant
4. Sends an admin notification email

So there's nothing to rebuild — the code already does exactly what you want. What's missing is **credentials**. The server currently has no `BREVO_API_KEY` configured, so all three Brevo calls silently fail and only the DB row + CRM lead get created.

Recommendation: don't paste the Brevo `xkeysib-…` key into chat. That key gives full access to your Brevo account; sharing it in a message is a leak. Rotate it in Brevo (SMTP & API → API Keys → regenerate) and then save the new one through the secure form.

## Plan

1. **Save the (rotated) Brevo API key securely** via `add_secret` → `BREVO_API_KEY`. This is the only strictly required value; contact sync + admin email work off it alone.
2. **Optional Brevo config** — only needed if you want the branded confirmation email and admin notice. Configure either through the CRM Settings → Integrations screen (already built, stores in DB) or as secrets:
   - `BREVO_SENDER_EMAIL` — verified sender on your domain (e.g. `hello@kaysteph.com`)
   - `BREVO_SENDER_NAME` — defaults to "Kay-Steph Group"
   - `BREVO_TEMPLATE_ID` — Brevo template ID for the confirmation email
   - `BREVO_LIST_ID` — Brevo list to add contacts to
   - `KAYSTEPH_ADMIN_EMAIL` — where the "new registration" notice goes
3. **Verify** with one test submission from `/events/youth-network`, then check `workshop_registrations` — `brevo_contact_status` should be `synced`, `confirmation_email_status` and `admin_email_status` should be `sent`.

## Questions

- Do you want to only sync contacts to Brevo (step 1 only), or also send the confirmation + admin emails (steps 1+2)?
- If emails: what verified sender email and admin recipient should I use, and do you already have a Brevo template ID for the confirmation, or should the code fall back to a plain HTML email?
