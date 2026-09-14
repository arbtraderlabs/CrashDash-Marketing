# CrashDash Marketing

Public-facing marketing and private-beta landing site for **CrashDash**.

This repository is a **standalone static website**. It is deliberately minimal and
contains no application logic.

---

## What this is

A single-page static site that explains, in public terms:

- what CrashDash is
- who it is for
- its public product philosophy
- how to request private-beta access

It renders with **no backend, no build step and no third-party network calls**.

## What this repository must never contain

This site is a marketing front end. The CrashDash engine is a separate, private
system, and nothing here may reveal how it works.

Do **not** add:

- signal-generation, scanning or scoring logic
- market-data ingestion, event-processing or pipeline code
- server, cron or deployment scripts from any private system
- databases, fixtures containing real data, logs or debug dumps
- credentials, tokens, `.env` files or keys of any kind
- internal hostnames, IP addresses, filesystem paths or repository names
- architecture, topology or provider documentation

The `README` and any comment in this repository is public. Write accordingly.

---

## Structure

```text
/
  index.html              the entire site (one page, anchor navigation)
  README.md               this file
  .gitignore              hygiene rules
  .nojekyll               tells GitHub Pages to serve the tree verbatim
  robots.txt              crawler policy
  assets/
    css/styles.css        all styling
    js/config.js          the one place you set the beta link and video URL
    js/main.js            small progressive-enhancement script
    images/logo.svg       brand mark
    images/favicon.svg    favicon
    images/og-card.svg    social preview artwork
```

No framework is used, and none is required. That is intentional: it keeps the
repository reviewable by anyone and guarantees the site cannot drift into
depending on private systems.

---

## Setup before deploying

There is **one** required edit, and three optional ones.

### 1. Set the beta request link

Open `assets/js/config.js` and set:

```js
betaRequestUrl: "",   // <- paste your Google Form (or equivalent) URL here
```

While this value is empty, every "Request beta access" button stays on-page and
routes the visitor to the *Private beta* section instead of leaving the site — so
the page never ships a dead or broken link.

Once set, the buttons open that URL in a new tab. Nothing else needs changing.

### 2. Optional: introduction video

Open `assets/js/config.js` and set:

```js
videoUrl: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
```

While this value is empty, the *Why CrashDash?* section renders a finished
placeholder: a styled play panel plus a caption, and **no iframe**. Nothing
third-party is requested, so the section can never appear broken.

Once set, the section becomes a click-to-load facade. The embed is only created
after a visitor presses play — the page still makes no third-party request on
load, and the video does not autoplay.

### 3. Optional: contact email

The site deliberately ships **no** contact address. If you want a `mailto:`
fallback in the *Private beta* section of `index.html`, add one that you are happy
to publish — and only a real one. Never commit a placeholder address.

### 4. Optional: custom domain / canonical URL

If you serve the site from a custom domain, add it to the `<link rel="canonical">`
and `og:url` tags in `index.html`, and add a `CNAME` file at the repository root
containing only the domain.

### 5. Optional: social preview image

`assets/images/og-card.svg` is the editable artwork for link previews. Export it to
a **1200×630 PNG** and commit that file, then uncomment the `og:image` and
`twitter:card` tags marked in `index.html`.

SVG is not rendered by the major social platforms, so the tags are deliberately
left out until a PNG exists — the site ships nothing broken.

---

## Local preview

Any static file server works. For example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

This is a local convenience only — the published site never contacts a backend.

## Deployment

GitHub Pages serves the repository root directly. No build, no actions, no
secrets. Because the site is plain HTML/CSS/JS, every file in the published
tree is exactly the file in Git — there is no generated output to review.

---

## Security posture

A Content-Security-Policy meta tag in `index.html` enforces the boundary:

- `default-src 'self'` — no third-party origins
- `connect-src 'none'` — the page cannot call any API
- `form-action 'none'` — no form can post anywhere
- `base-uri 'none'`, `object-src 'none'`
- `frame-src` — limited to YouTube, and only so the optional video facade can
  build an embed *after* a visitor clicks play

There are no analytics, no trackers, no fonts or scripts loaded from a CDN, and
no source maps.

### The single third-party exception

The only third-party capability in the site is the optional introduction video,
and it is deliberately built as a **click-to-load facade**. On page load the
section renders local markup and requests nothing external; the embed is created
only after a visitor presses play, and it never autoplays.

With `videoUrl` left empty — the shipped default — the page makes **no
third-party request at all**.

### Acceptance test

Before any change is merged, assume a stranger clones this repository and reads
every file, including page source and developer tools.

> **Can they learn anything useful about how the private CrashDash system
> operates?**

The answer must be **no**. They should learn only what CrashDash is, who it is
for, its public branding and philosophy, and how to request beta access.

If the answer is anything else, fix the repository before merging.
