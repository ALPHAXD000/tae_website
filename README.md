# The Alpha Effect (TAE) — Website Project

Organized starter structure for **The Alpha Effect (TAE)** by **ALPHA**.

## Folder Structure

```text
tae-website/
├── index.html              # Page layout & markup
├── css/
│   └── styles.css          # Theme styles, orbs, film grain & cards
├── js/
│   ├── data.js             # Releases, lyrics & visual items (edit this first)
│   ├── audio-engine.js     # Web Audio synth + real MP3/WAV player
│   └── app.js              # Rendering, filters, modal & player controls
└── assets/
    ├── audio/              # Put your real audio files here (.mp3, .wav, .ogg)
    └── images/
        ├── brand/          # TAE & ALPHA logos/emblems
        ├── covers/         # Release cover artwork
        └── visuals/        # Music video / edit / artwork frames
```

## Current Audio Catalog

The release cards are connected to these local audio and cover files:

| Track | Audio | Cover |
|---|---|---|
| WITHOUT YOU | `assets/audio/WITHOUT_YOU.wav` | `assets/images/covers/Without You.jpg` |
| Turn Around | `assets/audio/Turn_Around.wav` | `assets/images/covers/Turn Around.jpg` |
| Forsaken | `assets/audio/Forsaken.wav` | `assets/images/covers/Forsaken.webp` |
| Temptation | `assets/audio/Temptation.wav` | `assets/images/covers/Temptation.jpg` |
| Trust | `assets/audio/Trust.wav` | `assets/images/covers/TRUST.jpg` |
| Birthday | `assets/audio/BIRTHDAY.wav` | `assets/images/covers/Birthday.avif` |
| Voices | `assets/audio/VOICES.wav` | `assets/images/covers/Voices.avif` |

The player visualizer reads the playing track's frequency spectrum through the Web Audio API.
The Turn Around cover is center-cropped to a square for consistent release artwork.
Both releases have timestamped lyrics in `js/data.js`. Each line uses seconds from the start
of the audio, for example `{ time: 12.5, text: 'Lyric line' }`. Open **LYRICS** in the player
to see one lyric at a time follow playback. Timestamps are used for synchronization but are
not shown in the lyric display.

## How to Add or Replace Tracks & Artwork

1. Put audio files in `assets/audio/` and cover images in `assets/images/covers/`.
2. Open `js/data.js` and add or edit an item in `RELEASES`, setting its `title`, `audioUrl`, and `coverUrl`.
3. Use paths relative to `index.html`; encode spaces in paths as `%20` (for example, `assets/images/covers/My%20Cover.jpg`).
4. Open `index.html` with **Live Server** in VS Code. The browser may not load audio reliably when opening the HTML directly as a `file://` URL.

## Support TAE Payments

The Support TAE section uses a Flutterwave Payment Link for one-time contributions. Checkout is hosted by Flutterwave; the site does not handle payment details. Create a one-time payment link in your Flutterwave dashboard, then paste its public HTTPS URL into `SUPPORT_PAYMENT_LINK` in `js/data.js`. Until the link is configured, the support button remains disabled.
