# Lyrics

Add lyric files to this folder and set the file's path as `lyricsUrl` in its release entry in
`js/data.js`.

For synchronized lyrics, use one timestamped line per entry:

```text
[00:12.50] Lyric line
```

The player reads the timestamps as minutes and seconds and follows playback. Files without
timestamps are shown as full lyrics. An empty file leaves any existing lyrics in `js/data.js`
in place.
