# Personal Site

A dependency-free personal site for Harper Austin. The default page is a
macOS-inspired terminal that follows the system theme by default and persists
manual theme selections, with typed profile content, traffic-light window
controls, and an interactive command prompt.
Typing `/` opens a keyboard-navigable command palette with descriptions.
`/theme` opens a nested `light`, `dark`, and `system` selector, while `/jobs`
opens nested work-experience options. `/courses`, `/projects`, and `/outside`
show additional profile details. Other commands
expose the profile links and About output; `/fun` drops the modern terminal
completely away, pauses for one second, and then brings the embedded GIF-covered
retro title card down from above. The two
fixed stages can only be switched through `/fun` and **Back to homepage**;
the terminal's red close button triggers the same visual transition without
printing a command. Returning to the modern terminal is immediate.

## Run locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Run `/fun` to open the retro terminal, or
visit <http://localhost:8000/retro.html> directly.

## Customize

Edit the modern page in `index.html` and `modern.css`. The retro page lives in
`retro.html` and uses `styles.css`; both pages share `script.js`. Job content is
in `jobDefinitions`, coursework is in `courseSections`, and projects are in
`projectDefinitions` in `script.js`.
