# Edge Function secrets

Private credentials belong in Supabase Edge Function secrets, never in the
static HostAfrica build or a `VITE_` variable.

Supabase automatically injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY`. Do not set or copy those into `.env.example`.

Required production secrets:

| Secret                       | Used by                                                    |
| ---------------------------- | ---------------------------------------------------------- |
| `SITE_URL`                   | Auth invite/recovery redirect URLs                         |
| `ALLOWED_ORIGINS`            | Comma-separated browser origins accepted by Edge Functions |
| `RESEND_API_KEY`             | Transactional CRM, invite, and reset email                 |
| `CRM_EMAIL_FROM`             | Verified Resend sender                                     |
| `BREVO_API_KEY`              | Workshop contacts and confirmation email                   |
| `BREVO_LIST_ID`              | Default Brevo contact list                                 |
| `BREVO_TEMPLATE_ID`          | Workshop confirmation template                             |
| `BREVO_SENDER_NAME`          | Brevo sender display name                                  |
| `BREVO_SENDER_EMAIL`         | Verified Brevo sender                                      |
| `KAYSTEPH_ADMIN_EMAIL`       | Internal workshop registration recipient                   |
| `META_APP_SECRET`            | Meta webhook HMAC validation                               |
| `META_WEBHOOK_VERIFY_TOKEN`  | Meta webhook subscription verification                     |
| `META_PAGE_ACCESS_TOKEN`     | Meta lead/campaign reads                                   |
| `META_PAGE_ID`               | Allowed Meta page                                          |
| `META_AD_ACCOUNT_ID`         | Campaign insight sync                                      |
| `META_GRAPH_API_VERSION`     | Pinned Meta Graph version, for example `v23.0`             |
| `WHATSAPP_ACCESS_TOKEN`      | WhatsApp Business Cloud API                                |
| `WHATSAPP_PHONE_NUMBER_ID`   | WhatsApp sender phone-number ID                            |
| `WHATSAPP_GRAPH_API_VERSION` | Pinned WhatsApp Graph version                              |

Prepare a local file outside Git, for example `/tmp/kaysteph-edge-secrets.env`,
using `NAME=value` lines. Then, during the approved production cutover:

```bash
npx supabase@latest secrets set \
  --env-file /tmp/kaysteph-edge-secrets.env \
  --project-ref ufhwetpowavyryiortlm
```

The Brevo panel can still rotate a key into the RLS-isolated
`integration_secrets` compatibility store. Production should use
`BREVO_API_KEY` as the canonical value; the database value is checked first so
existing rotation workflows continue to work.

Never print secret values in deployment logs. The Edge Functions log only
request IDs, action names, statuses, provider response codes, and sanitized
error messages.
