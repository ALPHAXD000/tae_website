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
    ├── Lyrics/             # Lyric files and source documents
    ├── audio/              # Put your real audio files here (.mp3, .wav, .ogg)
    └── images/
        ├── brand/          # TAE & ALPHA logos/emblems
        ├── covers/         # Release cover artwork
        └── visuals/        # Music video / edit / artwork frames
```

## Current Audio Catalog

The release cards are connected to these local audio and cover files:

| Track | Duration | Audio | Cover | Lyrics |
|---|---|---|---|---|
| WITHOUT YOU | 4:39 | `assets/audio/WITHOUT_YOU.wav` | `assets/images/covers/Without You.jpg` | `assets/Lyrics/Without You.txt` |
| Turn Around | 4:12 | `assets/audio/Turn_Around.wav` | `assets/images/covers/Turn Around.jpg` | `assets/Lyrics/Turn Around.txt` |
| Forsaken | 2:59 | `assets/audio/Forsaken.wav` | `assets/images/covers/Forsaken-square.jpg` | `assets/Lyrics/Forsaken.txt` |
| Temptation | 4:03 | `assets/audio/Temptation.wav` | `assets/images/covers/Temptation.jpg` | `assets/Lyrics/Temptation.txt` |
| Trust | 3:50 | `assets/audio/Trust.wav` | `assets/images/covers/TRUST.jpg` | `assets/Lyrics/Trust.txt` |
| Birthday | 4:15 | `assets/audio/BIRTHDAY.wav` | `assets/images/covers/Birthday-square.jpg` | `assets/Lyrics/Birthday.txt` |
| Voices | 3:13 | `assets/audio/VOICES.wav` | `assets/images/covers/Voices.avif` | `assets/Lyrics/Voices.txt` |
| Evermore | 3:12 | `assets/audio/Evermore.wav` | `assets/images/covers/Evermore.jpg` | `assets/Lyrics/Evermore.txt` |

The player visualizer reads the playing track's frequency spectrum through the Web Audio API.
The Forsaken cover is trimmed to a square while preserving the figure; the Turn Around cover is
center-cropped to a square for consistent release artwork.
Lyric files in `assets/Lyrics/` are loaded by the player. Timestamped files use
`[MM:SS.xx] lyric line` format and follow playback; files without timestamps are shown as full
lyrics. Turn Around keeps its existing synced lyrics from `js/data.js` because its text file is
empty.
When supported by the browser, the player publishes the current track title, artist, and cover
art through the Media Session API so lock-screen and system media controls can show the song
instead of the website title. The system play, pause, previous, and next controls are connected
to the player when the browser supports those actions. Background playback availability depends
on the browser and operating system.

## How to Add or Replace Tracks & Artwork

1. Put audio files in `assets/audio/` and cover images in `assets/images/covers/`.
2. Open `js/data.js` and add or edit an item in `RELEASES`, setting its `title`, `audioUrl`, and `coverUrl`.
3. Use paths relative to `index.html`; encode spaces in paths as `%20` (for example, `assets/images/covers/My%20Cover.jpg`).
4. Open `index.html` with **Live Server** in VS Code. The browser may not load audio reliably when opening the HTML directly as a `file://` URL.

## Support TAE Payments

The Support TAE section uses a Flutterwave Payment Link for one-time contributions. Checkout is hosted by Flutterwave; the site does not handle payment details. Create a one-time payment link in your Flutterwave dashboard, then paste its public HTTPS URL into `SUPPORT_PAYMENT_LINK` in `js/data.js`. Until the link is configured, the support button remains disabled.

## Inquiry Form Delivery

The contact form submits to Formspree using the URL configured in `INQUIRY_FORM_ENDPOINT` in
`js/data.js`. In Formspree, set and verify the inbox that should receive submissions. If you replace
the Formspree form, update the endpoint URL there. If the endpoint is left blank, the contact form
displays a setup message and does not claim that submissions were sent.
