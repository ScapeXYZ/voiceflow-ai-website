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

## 503 investigation (local source audit)

Confirmed: the endpoint sends JSON `{secret,id,fields}` and requires JSON `{ok:true,id}` with the exact submitted ID. The standalone script implements that contract. HTTP success alone is insufficient. Every rejection and caught exception returns `{ok:false}` normally, so an execution marked Completed can still mean no email was attempted or accepted. The endpoint intentionally turns those responses, malformed JSON, HTTP failures and network timeouts into 503. No definite production root cause or request/response mismatch was established from the local source.

Redis is used only for rate limiting; duplicate receipts are in Apps Script Properties. A rate limit returns 429, while a Redis failure returns 503. Logs showing both external services for the same invocation place the failure after the Redis call. The endpoint already uses `redirect:'follow'`, as required for ContentService's redirect to `script.googleusercontent.com`. A redirect itself is expected; an access/login page or failed final response remains a possible cause. Do not log redirect URLs: they can contain one-time tokens.

Plausible causes to check manually (not confirmed): mismatched shared secrets; missing or invalid recipient; a URL pointing to the call-notification project or an older deployment version; missing MailApp authorization, quota or recipient errors; lock contention; pending receipts from an earlier ambiguous send; and a timeout or non-JSON response after execution. The script validates the same required fields and limits as Vercel; Vercel additionally trims fields and rejects control characters before forwarding. No validation discrepancy was found that would reject a normal Vercel submission. The script's 12,000-character envelope limit can also reject an unusually large configured secret; ordinary generated secrets fit comfortably.

Diagnostics added locally:

- Vercel failure logs contain only `event`, a fixed `stage`, the last HTTP `httpStatus` (null when no response arrived), and `redirected`. `redis_fetch` / `script_fetch` means no response was obtained; `*_json` means JSON decoding failed; `*_response` means HTTP or application-contract rejection. Status is the final response status after automatic redirects, not intermediate redirect codes. No upstream body, error text, URL, hash, IP, token, secret or customer field is logged.
- Apps Script logs contain only `event`, a fixed `stage`, and `ok`. Stages distinguish configuration, authentication, validation, lock, receipt lookup/reservation/confirmation, quota, sending, and sent/pending duplicates. They do not change the response contract or expose failure details to visitors.

Manual checks in the **separate demo project**, without changing credentials or clearing receipts:

1. Match the affected Vercel invocation's timestamp to a web-app `doPost` execution. Inspect its deployment/version and logs, not just Completed. The new stage logs will only exist after a separately authorized script update and deployment; existing executions cannot gain them retroactively.
2. Verify the configured `/exec` deployment belongs to this demo project, uses the intended source version, executes as the owner, and permits Anyone access. Confirm the owner's MailApp authorization and remaining quota. Do not run `doPost` directly in the editor as a delivery test: it has no event payload.
3. In Script Properties privately compare `DEMO_SCRIPT_SECRET` with the correct Vercel environment's secret, including whitespace, and verify `DEMO_NOTIFY_EMAIL` is the intended valid recipient. Never paste values into logs or reports.
4. Inspect existing `receipt:<id>` state and timestamps privately. `pending` blocks retries for seven days, including when sending threw before delivery; `sent` returns success without another email. Check the owner's sent mail and destination Inbox/Spam against the original request time. Do not delete or reset receipts during diagnosis.
5. Interpret `mail_send` with `ok:false` as a send exception; `receipt_confirm` failure as potentially already sent; `duplicate_pending` as a blocked ambiguous retry; `sent` as MailApp acceptance, not proof of delivery. For `script_json` inspect access/deployment settings; never copy raw responses or token-bearing redirect URLs into logs.

Local mocked tests cannot verify live credentials, deployed source, authorization or Gmail delivery. Retell and the separate call-notification script are outside this change.
