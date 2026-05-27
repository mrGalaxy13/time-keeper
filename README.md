# ⬡ TimeKeeper PWA

A minimalist, colorful time-block tracker for intentional daily planning.

## Features
- Set your day's start time
- Create color-coded time blocks (Travel, Eating, Reading, etc.)
- Tap a block to **start** the timer — it fades as time depletes
- Tap again to **pause** — resume anytime within the same day
- Warning alert when a block is exhausted
- Persists across browser refresh (localStorage)
- Fully **installable PWA** (works offline)
- Resets automatically on a new day

## How to Run

### Option 1 — Local server (recommended)
```bash
npx serve .
# or
python3 -m http.server 8080
```
Then open `http://localhost:8080`

### Option 2 — VSCode Live Server
Open the folder in VSCode and click **Go Live**.

### Install as PWA
1. Open in Chrome / Safari
2. Chrome: click ⋮ menu → "Install app"
3. Safari (iOS): tap Share → "Add to Home Screen"

## Folder Structure
```
timekeeper/
├── index.html          ← App shell & markup
├── manifest.json       ← PWA manifest
├── sw.js               ← Service worker (offline)
├── css/
│   └── style.css       ← All styles (dark, jewel-tone)
├── js/
│   ├── colors.js       ← Color palette & fade logic
│   ├── storage.js      ← localStorage persistence
│   └── app.js          ← All app logic
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Color Philosophy
Colors chosen based on cognitive science research:
- **Coral** (#FF6B6B) — energy, urgency
- **Teal** (#4ECDC4) — focus, calm  
- **Amber** (#FFD93D) — attention, optimism
- **Violet** (#A78BFA) — creativity, relaxation
- **Lime** (#6EE7B7) — freshness, growth
- And more — each with scientifically-tuned saturation/brightness
