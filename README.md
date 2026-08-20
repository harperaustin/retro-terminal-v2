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

The **Blog** tab reads published posts from Supabase. The unlisted `/author`
terminal command opens the author login; after login, the Blog tab shows a `+`
button for publishing posts.

The post editor supports section headings, subheadings, JavaScript and Python
fenced code blocks, Markdown-style tables, named links, and native expandable
sections through formatting buttons above the post body. Authors can edit or
delete a post from its full-post view.
Posts can also be saved as private drafts; Supabase row-level security only
returns drafts to an authorized author.
The Blog index is shareable at `/#blog`, and opening a post creates a durable
`/#blog/POST_ID` URL with a one-click copy control.

## Configure the blog

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. In Supabase Authentication, create the email/password user that will author
   posts. Copy that user's UUID from the Users screen, then run:

   ```sql
   insert into public.blog_authors (user_id) values ('YOUR-USER-UUID');
   ```

3. Copy the project URL and anon/public key into `site-config.js`. The anon key
   is designed to be public; never put a service-role key in this repository.
4. Add `https://harperaust.in` as an allowed site URL in Supabase Authentication.

For an existing blog database created before draft support, run
`supabase/add-drafts.sql` once in the Supabase SQL editor.

Row-level security allows everyone to read published posts but only users
listed in `blog_authors` to create, edit, or delete them.

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
