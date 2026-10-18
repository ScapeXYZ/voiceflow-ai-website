# Verification and handoff

Verified locally on 2026-10-18, branch `feat/polished-demo`. Nothing pushed or deployed.

## Demo text contrast revision

- Audited all seven Remotion scenes. The existing 70-second frame was readable, but the closing scene's opacity animation faded its headline and body almost entirely out by the last frame. Headlines also depended on inherited color.
- Set explicit white headlines and light-blue body, labels, branding, and footer text. Full-opacity contrast against the brightest navy (`#193e72`) is 10.64:1 for headlines, 9.02:1 for body text, 7.46:1 for accents, and 7.27:1 for footer text. Closing copy stays at full opacity from 65 seconds through the final frame; other scene transitions and all seven scene timings are preserved.
- Styled optional native captions white on a dark navy backing. All seven VTT cues retain their original timing, cover 0–75 seconds without gaps, and match the scene boundaries. Chromium checks passed immediately before and after every boundary (14 seeks).
- Re-rendered MP4 and poster: H.264, 1920×1080, 30 fps, 2,250 frames, exactly 75 seconds, no audio, **1,927,217 bytes (1.93 MB / 1.84 MiB)**. Full-file FFmpeg decode passed.
- Reviewed encoded-video screenshots at 3, 13, 24, 35, 46, 58, and 70 seconds plus the final frame. Opening, middle, and closing evidence: `artifacts/video-3s.jpg`, `artifacts/video-46s.jpg`, `artifacts/video-final-frame.jpg`. Captioned player screenshots use `artifacts/captioned-video-*s.png`; all seven scenes and the final frame were captured. Artifacts remain local and ignored by Git.
- `npm run lint`, `npm run build`, and `npm test` passed, including a final desktop/tablet/mobile run against the rebuilt production output. No browser errors.
- Changes committed locally only; no push or deployment authorized.

## Changed files

- `index.html`, `styles.css`, `app.js`: preserve the static stack and original core content/contact; refine layout, copy, accessibility, responsive navigation, FAQ, sample email and transparent email-draft form.
- `favicon.svg`, `robots.txt`, `sitemap.xml`: site identity and crawler metadata. Open Graph metadata is in `index.html`.
- `public/demo/voiceflow-ai-demo.mp4`, `poster.jpg`, `captions.vtt`, `transcript.txt`: complete video player deliverables.
- `video/Root.jsx`, `video/assets/website.webm`, `video/assets/website.jpg`: reproducible Remotion composition and fictional/local-only website capture assets.
- `scripts/build.mjs`, `serve.mjs`, `lint.mjs`, `capture.mjs`, `render.mjs`: minimal static build/preview and video tooling.
- `tests/ui.mjs`: browser behavior and playback regression suite.
- `package.json`, `package-lock.json`, `.gitignore`, `vercel.json`, `README.md`, `QA.md`: development dependencies, output exclusions, explicit static output configuration, and operational documentation.

## Original baseline results (before contrast revision)

- `npm run lint`: passed JavaScript syntax, unique ID and local-anchor checks.
- `npm run build`: passed; static deployment output in ignored `dist/`.
- `npm test`: passed against the production build at desktop 1440×1000, tablet 768×1024, mobile 390×844.
- Navigation clicks (including mobile menu), required/whitespace/email/phone validation, encoded mailto draft, failure recovery, FAQ disclosure, and absence of horizontal overflow passed.
- Real HTML5 video metadata/loading/playback passed at all three sizes. No browser page or console errors during the suite.
- FFprobe: H.264, 1920×1080, 30/1 fps, 2,250 frames, exactly 75 seconds, 1,910,646 bytes (1.91 MB / 1.82 MiB). No audio track.
- FFmpeg full-file decode: passed. MP4 `moov` atom precedes `mdat` for progressive playback.
- Screenshots reviewed: `artifacts/desktop.png`, `tablet.png`, `mobile.png`; viewport captures also available as `*-hero.png`. These local artifacts are intentionally ignored by Git.
- Video review frames: `artifacts/video-13s.jpg`, `video-33s.jpg`, `video-46s.jpg`, `video-58s.jpg`, `video-70s.jpg`.
- Dependency installation reported zero known vulnerabilities.

## Limits

The form requires a configured email app and the visitor must send the draft. It does not submit, store or guarantee email delivery. No backend credentials were present or added. Existing Retell/Worker/Apps Script services were not changed or independently exercised. The video is captioned and silent; conversation/email scenes are fictional reenactments. Testing used local Chromium, not physical devices or Safari/Firefox. Vercel remote settings and production behavior remain unverified until an approved release. No live phone answering, booking confirmation, dispatch or customer results are claimed.

## Exact preview and release commands

See `README.md` for prerequisites, video reproduction, and release assumptions.

```sh
npm ci
npx playwright install chromium
npm run lint
npm run build
npm run preview
# In another terminal:
npm test
```

Open http://127.0.0.1:4173.

Only after owner approval (push may trigger a Vercel preview):

```sh
git push -u origin feat/polished-demo
```

Only after preview review and production-release approval:

```sh
git switch main
git pull --ff-only origin main
git merge --ff-only feat/polished-demo
git push origin main
```

## Automatic demo form integration (2026-10-18)

- Added a separate Vercel `/api/demo-request` handler; no Retell webhook or call-notification code changed.
- `npm run lint`, `npm run build`, and `npm test` passed locally. Browser checks cover desktop/tablet/mobile, validation, submission loading/success, failure email draft, navigation, layout, and video playback. Mocked backend tests cover validation, exact origin, JSON enforcement, honeypot, shared rate limit, stable request identity, upstream/storage failures, Apps Script authentication, duplicate suppression, and ambiguous-send retry blocking.
- Browser requests and Google/Redis responses were mocked; no credentials were supplied and no real Gmail delivery was tested. Deployment integration remains unverified.
- Owner configuration and end-to-end verification are documented in `docs/demo-request-setup.md`. No push or deployment was performed.
