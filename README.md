# Send Love & Warmth — Personalized Birthday Gift Website

Create a beautiful animated birthday gift page for someone special, then share it with a link or QR code. When they open it, they get a full-screen scrolling celebration: greeting, your chosen photos with captions, birthday message, music, floating hearts, flower petals, balloons, and confetti.

**Live demo:** https://elhendawy-1.github.io/Surprise/

No frameworks, no build step, no server — just open `index.html` or host it on GitHub Pages.

---

## How it works

**Creating a gift (5 steps):**
1. **Who** — pick Mom, Dad, Sister, Brother, Aunt, Friend, or Other (type anyone, e.g. Grandma)
2. **Details** — name, date of birth (auto-calculates age + countdown), photos with captions
3. **Message** — auto-generated birthday text or write your own
4. **Theme** — 6 romantic palettes: Classic, Soft, Deep, Dark, Elegant, Warm
5. **Share** — shortened link + QR code to send

**Opening a gift:** the link carries everything in the URL itself, so the birthday person sees the animated scrolling page with photos, message, music, and celebration — on any device, no login needed.

---

## Photos — 3 ways to add them

| Method | Reliability | Notes |
|--------|-------------|-------|
| **Site gallery** (recommended) | Always works | Upload images to the `assets/photos/` folder in this repo, then tap *Choose from site gallery* — these links are short, so the QR code stays scannable |
| **Paste image link** | Works with direct links | Direct image URLs, Google Drive and Dropbox share links (auto-converted). A green check confirms the image loads |
| **Upload from device** | Best effort | Tries free image hosts; if blocked, the photo is packed into the link automatically (use the Copy button for packed links, QR may be too dense) |

Each photo gets its own caption, shown beneath it in a *Sweet Memories* lane right above the birthday message. All photos display 100% uncropped.

---

## Music

The gift plays background music after the recipient's first tap (browsers block autoplay). To change the song, replace `assets/music/song.mp3` with your own MP3 (keep the same name). Toggle it on/off in the customize form.

---

## Project structure

```
index.html                  Main page (creator flow + gift view)
css/
  styles.css                Layout and components
  themes.css                6 theme palettes (CSS variables)
  animations.css            Keyframes and scroll-reveal system
js/
  app.js                    Flow, forms, gallery picker, link generation
  generator.js              Birthday messages, greetings, age logic
  share.js                  Image upload, URL encode/decode, shortening, QR
  animations.js             Hearts, petals, balloons, confetti, bursts
assets/
  music/song.mp3            Background song (replace with your own)
  photos/                   Site-gallery photos (upload yours here)
```

---

## Deploy to GitHub Pages

**Option A — branch (simplest):** push this folder as the repo root → Settings → Pages → *Deploy from a branch* → `main` / `(root)`.

**Option B — Actions:** this repo includes `.github/workflows/pages.yml` → Settings → Pages → *GitHub Actions* instead.

Your site appears at `https://YOUR-USERNAME.github.io/REPO-NAME/`. Share links and QR codes adapt to whatever address the site runs on.

---

## Customize

- **Messages:** edit the templates, greetings, and sign-offs in `js/generator.js`
- **Gallery source:** change `siteGallery.repo` / `siteGallery.path` in `js/app.js` if you fork under a different name
- **Photo slots:** 5 slots, each with file upload, URL paste, gallery pick, and caption
- **Link payload:** gift data is Base64 JSON in the URL hash — no database involved

---

Made with love. Happy birthdays only.
