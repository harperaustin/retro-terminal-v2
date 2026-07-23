# Personal Site

A dependency-free personal site for Harper Austin. The default page is a
macOS-inspired terminal with a light default and persistent theme selection, typed profile
content, traffic-light window controls, and an interactive command prompt.
Typing `/` opens a keyboard-navigable command palette with descriptions.
`/theme` opens a nested `light`, `dark`, and `system` selector. Other commands
expose the profile links and About output; `/fun` drops the modern terminal
completely away, pauses for one second, and then brings the embedded GIF-covered
retro title card down from above. The two
fixed stages can only be switched through `/fun` and **Back to homepage**;
returning to the modern terminal is immediate.

## Run locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Run `/fun` to open the retro terminal, or
visit <http://localhost:8000/retro.html> directly.

## Customize

Edit the modern page in `index.html` and `modern.css`. The retro page lives in
`retro.html` and uses `styles.css`; both pages share `script.js`. The email
shortcut currently opens a new email with no recipient so a public address is
not exposed.
