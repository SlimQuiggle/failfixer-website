# FailFixer Marketing Website

Static marketing website for FailFixer — the desktop tool that recovers failed 3D prints with two modes: Resume In-Air and Restart from Build Plate.

## Project Structure

```
failfixer-website/
├── index.html          # Home / landing page
├── faq.html            # Frequently asked questions
├── terms.html          # Terms of Service
├── privacy.html        # Privacy Policy
├── README.md           # This file
├── serve.bat           # Local dev server (Windows)
└── assets/
    ├── css/
    │   └── styles.css  # All styles
    ├── js/
    │   ├── config.js   # Gumroad URL config (edit this)
    │   └── main.js     # CTA wiring, nav, FAQ accordion
    └── img/
        └── logo.png    # FailFixer logo
```

## Configuration

### Setting the Gumroad Purchase Link

Edit `assets/js/config.js` and set your Gumroad product URL:

```js
window.FAILFIXER_GUMROAD_URL = 'https://yourname.gumroad.com/l/failfixer';
```

If the URL is empty (`''`), all "Buy" buttons will show a tooltip saying "Purchase link coming soon!" and clicking them shows a toast notification.

## Local Development

### Option 1: Python (recommended)

```bash
cd failfixer-website
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080)

### Option 2: Windows batch file

Double-click `serve.bat` or run:

```cmd
serve.bat
```

### Option 3: Node.js

```bash
npx serve .
```

## Deployment

This is a static site — no build step required. Deploy to any static host:

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd failfixer-website
vercel
```

### Cloudflare Pages

1. Push to a Git repository
2. Connect the repo in Cloudflare Pages dashboard
3. Set build command to (none) and output directory to `/`

### Netlify

```bash
# Drag and drop the folder in Netlify dashboard
# Or use CLI:
npx netlify-cli deploy --dir=.
```

### GitHub Pages

Push to a repo and enable Pages in Settings → Pages → Source: root of main branch.

## Tech Stack

- Pure HTML/CSS/JS (no frameworks, no build tools)
- Inter font from Google Fonts
- Mobile-responsive design
- Dark theme with FailFixer red branding
- ~30KB total (excluding logo image)

## License

All rights reserved. This website is part of the FailFixer product.
