# Portfolio update

- Added **Byte**, an original cartoon robot rendered as a live 3D character in
  a right-side panel on the five main portfolio pages.
- Drag the character or use arrow keys to rotate it. **Wave** makes Byte greet
  the visitor, **Pause / Play** controls idle motion, and **Reset view** restores
  the initial pose. The model's accent colours follow the selected theme.
- The character panel collapses on smaller screens. Animations start paused
  when the device requests reduced motion, and rendering pauses offscreen or
  when the tab is hidden. A locally bundled poster provides a visual fallback.
- The 3D model and renderer are original, local code. No Sketchfab account,
  model download, extra CDN, or API key is needed. See `docs/3D-COMPANION.md`.
- Added **ASHA Care** to Project Worlds, with an original healthcare illustration,
  technology tags, project details, the ₹5,000 delivery, and the repository link
  already used in this portfolio's README.
- Added ASHA Care to the home-page project summary and project-page metadata.
- Added **Quiet Worlds**, a gentle original instrumental stored in
  `assets/audio/quiet-worlds.mp3`.
- Added an icon-only **play/stop music button beside the theme button** on all
  five portfolio pages. The contribution game has a floating music button too.
- Music starts at 22% volume and loops. When a browser requires interaction for
  audible playback, the first page click, Enter/Space press, or music-button click
  starts it. The button always lets visitors stop or restart playback.
- The playback position and stop preference are remembered while moving between
  pages in the same tab. A new browsing session defaults to music enabled.
- Updated the small-screen navbar spacing to keep the music and theme buttons
  alongside the five page links.

## Use the updated portfolio

1. Extract the ZIP and open `Portfolio-main/index.html` to preview it locally.
2. To update GitHub Pages, open your **Portfolio** repository and choose
   **Add file → Upload files**.
3. Upload the **contents inside Portfolio-main**, including the entire `assets`
   folder. Upload the files and folders themselves; do not upload the ZIP or add
   another enclosing `Portfolio-main` folder to the repository.
4. Commit the update to your publishing branch and let GitHub Pages rebuild.

If testing directly from local files, browser storage may be unavailable; use
GitHub Pages or a local HTTP server to test preference persistence between pages.
For replacing the song or adjusting volume, see `assets/audio/README.md`.
