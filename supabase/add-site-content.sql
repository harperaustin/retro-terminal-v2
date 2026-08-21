create table if not exists public.site_content (
  key text primary key,
  content text not null check (char_length(content) between 1 and 2000),
  updated_at timestamptz not null default now(),
  author_id uuid not null default auth.uid() references auth.users(id)
);

alter table public.site_content enable row level security;

drop policy if exists "Site content is public" on public.site_content;
create policy "Site content is public"
on public.site_content for select
using (true);

drop policy if exists "Authors can create site content" on public.site_content;
create policy "Authors can create site content"
on public.site_content for insert
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.blog_authors
    where blog_authors.user_id = auth.uid()
  )
);

drop policy if exists "Authors can update site content" on public.site_content;
create policy "Authors can update site content"
on public.site_content for update
using (
  author_id = auth.uid()
  and exists (
    select 1 from public.blog_authors
    where blog_authors.user_id = auth.uid()
  )
)
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.blog_authors
    where blog_authors.user_id = auth.uid()
  )
);
