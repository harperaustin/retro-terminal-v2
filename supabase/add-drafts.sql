alter table public.blog_posts
add column if not exists is_draft boolean not null default false;

drop policy if exists "Published posts are public" on public.blog_posts;

create policy "Published posts are public"
on public.blog_posts for select
using (
  (not is_draft and published_at <= now())
  or exists (
    select 1 from public.blog_authors
    where blog_authors.user_id = auth.uid()
  )
);
