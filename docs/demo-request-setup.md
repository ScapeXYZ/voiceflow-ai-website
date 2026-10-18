# Demo requests: manual configuration

Prepared locally only. No deployment or real Gmail delivery has been tested. Existing Retell webhook, Worker, and call-notification Apps Script must remain untouched.

## Owner actions required

1. Create a **new standalone** Google Apps Script project. Paste `docs/demo-request.gs` into its Code.gs.
2. Generate a random shared secret locally (for example `openssl rand -hex 32`). Do not commit it or paste it into browser code. In Apps Script Project Settings → Script Properties set `DEMO_SCRIPT_SECRET` to that value and `DEMO_NOTIFY_EMAIL` to your confirmed Gmail destination. Script Properties necessarily hold the receiving copy of the shared secret; the website's copy lives only in Vercel environment variables.
3. Deploy this new project as a web app, execute as yourself, access Anyone. Authorize sending email from this account. Copy its `/exec` URL. Workspace restrictions may prevent anonymous web apps; resolve those before proceeding. Use a new deployment version whenever the script changes.
4. Create a dedicated Upstash-compatible Redis REST database for shared rate limits (a Vercel Marketplace Redis integration is suitable). Keep its HTTPS REST URL and token private. In the **existing** Vercel website project set server-only variables:

   | Variable | Value |
   | --- | --- |
   | `DEMO_ALLOWED_ORIGIN` | `https://voiceflow-ai-website.vercel.app` (no trailing slash; exact origin) |
   | `DEMO_SCRIPT_URL` | New Apps Script `/exec` URL |
   | `DEMO_SCRIPT_SECRET` | Same random secret as Script Properties |
   | `DEMO_REDIS_URL` | Redis HTTPS REST endpoint |
   | `DEMO_REDIS_TOKEN` | Redis REST access token |

   Set values separately for each approved environment. For a preview, use its exact origin. Do not use public/frontend-prefixed variables. Missing or failing configuration fails closed with an email fallback. Do not change Retell variables or deployments.
5. After reviewing the local commit, explicitly authorize deployment separately. No push or deployment is included in this task.
6. On an approved deployment, submit a unique, non-sensitive demo request. Confirm the success message AND receipt in the intended Gmail inbox (also check Spam), fields, and reply-to. Submit the identical request again and confirm no second notification. Test invalid input, a filled honeypot, more than five attempts in ten minutes, and backend failure/fallback. Only then describe Gmail delivery as verified. Local tests mock external services and cannot establish delivery.

## Behavior and limits

The Vercel Node endpoint `/api/demo-request` accepts same-origin JSON POST only, caps body/field lengths, validates required fields/email/phone, rejects a honeypot, and enforces an atomic shared limit of five attempts per IP per ten minutes. IP addresses are HMAC hashed before Redis storage, with a ten-minute TTL. Trust the Vercel-controlled forwarding headers only when deployed directly on Vercel; review the trust boundary if adding an external proxy. JSON-only requests and an exact origin check block ordinary cross-site browser posts; bots can forge origins. The honeypot and rate limits reduce spam but cannot eliminate distributed abuse. Consider managed bot challenges/firewall rules if abuse warrants them.

Apps Script serializes sends with a script lock and stores content-hash receipts for seven days. Identical normalized requests are deduplicated across instances and retries; a changed message is a new request. Receipt cleanup occurs on subsequent authenticated requests. Submission content is sent as plain text to the configured recipient and is not saved in Redis or Script Properties. Gmail retains the notification under the account's retention policy. Avoid logging bodies, secrets or email addresses.

The receipt is reserved before sending. If sending or saving the sent state fails ambiguously, a `pending` receipt blocks retries for seven days and returns failure rather than risking duplicate email. An operator must inspect the inbox before clearing that specific `receipt:<id>` Script Property. Do not blindly clear pending records. Mail delivery and durable receipts cannot be made one atomic transaction; exactly-once delivery is not guaranteed. A success means MailApp accepted the send, not proof of inbox delivery. Quota exhaustion, timeouts, lock contention, and configuration failures show the fallback. Email fallback is manual and can duplicate an earlier ambiguous send; the UI warns visitors.

Apps Script quotas and Script Properties capacity bound throughput. Monitor quotas and pending receipts; this is intended for a low-volume demo form. The website uses a 22-second timeout and the endpoint a 15-second upstream timeout. User input is never HTML in the email. No attachment, arbitrary recipient, public upstream proxy, or live call is supported.

Local preview serves static assets only; `/api/demo-request` is provided by Vercel after an authorized deployment. Browser tests intercept requests, while endpoint and Apps Script tests use mocks.

References: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel request headers](https://vercel.com/docs/headers/request-headers), [Apps Script web apps](https://developers.google.com/apps-script/guides/web), [ContentService redirects](https://developers.google.com/apps-script/guides/content).
