# ferrovial-austin
Ferrovial Austin — Leading in the Age of Digital Disruption

One presentation, both sessions in order: Session I (9:30–11:00) then Session II (11:30–13:30).
Open `index.html`. Arrow keys, space or click to advance (left 20% of the screen goes back), `f` for full screen.
`index.html#N` jumps to slide N. `s1.html` redirects to `index.html`.
Homework: `ficha-proceso.html` is a two-page A4 process sheet to print and fill in by hand (use the Print / Save as PDF button).

Presentation design and controls are in `stage.css` and `stage.js`. All visuals and libraries are local; no font, animation or analytics services are required.

- `G`: chapter navigator, with a field to jump to any slide.
- `B` or `.`: black screen; press again or Escape to return.
- `M`: turn motion off or on. The system's reduced-motion preference is respected on load; without motion or WebGL, the time journey uses a still-image sequence.
- `?`: keyboard shortcuts. Move the pointer or use Tab to reveal the controls.
- `Home` / `End`: first / last slide. `F` toggles full screen.

Reveals remain manual and retain their state when revisiting a slide. On a narrow screen, long slides scroll vertically. For a local rehearsal including the 3D journey, serve this folder with `python3 -m http.server 8765` and open `http://localhost:8765/`.
