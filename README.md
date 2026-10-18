# VoiceFlow AI

Static SaaS landing page for the existing plumbing receptionist demonstration. Production uses plain HTML, CSS, and JavaScript; React and Remotion are development tools for the video only. No Retell, Cloudflare Worker, or Google Apps Script integration code was changed.

## Preview and checks

Requires Node 22+, npm, and a Playwright Chromium browser.

```sh
npm ci
npx playwright install chromium
npm run lint
npm run build
npm run preview
```

Open http://127.0.0.1:4173. In a second terminal run `npm test`. Tests use that URL and work against the development or production server. `npm run dev` previews source directly. The server binds only to localhost and supports MP4 byte ranges.

Tests check desktop (1440×1000), tablet (768×1024), mobile (390×844), navigation, empty/whitespace/email/phone validation, draft content, error recovery, FAQs, horizontal overflow, browser errors, video metadata, and playback. Screenshots are written to ignored `artifacts/`. Lint checks JavaScript syntax, unique HTML IDs and local anchors; it is a small project-specific check, not a full CSS/accessibility audit.

## Contact form

No submission credentials or backend are present in this repository. The form validates input locally, prepares an encoded `mailto:` draft to the original contact (tishola396@gmail.com), and lets the visitor open and send it. Nothing is stored or sent by the website. An installed/configured email application is needed; a direct email address is always visible. Loading, ready, and error states explicitly describe draft preparation. Because no submission endpoint was added, there is no server-side endpoint requiring rate limiting. A future backend must add validation, spam safeguards and server-side secrets before changing this messaging.

## Demo video

`public/demo/voiceflow-ai-demo.mp4`: 75 seconds, 1920×1080, 30 fps, H.264, captioned visuals, intentionally no audio. No paid APIs or voiceover. Conversation and email scenes are labeled reenactment/illustrative output and use fictional data, including a reserved 555 callback number. Only the local candidate website was captured; no account dashboards, emails, or integration endpoints appear.

To reproduce (start `npm run dev` first):

```sh
npm run video:capture
npm run video:render
npm run build
```

The tracked `video/assets/website.webm` is the short Playwright capture used by Remotion. The video source is `video/Root.jsx`; rendering uses the installed Playwright browser. `public/demo/` also includes a poster, WebVTT captions, and plain-text transcript. The optimized MP4 is small enough for normal Git and Vercel static hosting. The player uses `preload="none"`, controls and a transcript/download fallback. No external upload is needed.

## Release — only after owner approval

No push or deployment was performed. `vercel.json` explicitly builds to `dist` while retaining the existing static stack. The original repository had only `index.html`, with no tracked deployment configuration. The current remote Vercel project settings and integrations were not modified.

After approval, push the review branch:

```sh
git push -u origin feat/polished-demo
```

If the existing Vercel Git integration has preview deployments enabled, that push can publish a preview. Review it before merging. To release to the existing production branch after review/approval:

```sh
git switch main
git pull --ff-only origin main
git merge --ff-only feat/polished-demo
git push origin main
```

These commands assume `main` has not diverged and the existing Vercel project deploys from `main`. If either assumption fails, stop and review repository/project settings. Do not create a new Vercel project. Live phone answering, confirmed booking, dispatch, and production reliability are outside the current demonstration and have not been tested here.

No website assets load from a CDN. Runtime assets are served locally; npm dependencies are development-only. Reduced-motion preferences disable smooth scrolling. Email drafts are encoded locally, and editing the form hides an obsolete draft link.
