alter table public.photography_images
add column if not exists display_order integer not null default 2147483647;

alter table public.photography_images
add column if not exists is_hero boolean not null default false;

create or replace function public.update_photography_order(
  photo_ids bigint[],
  hero_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.blog_authors
    where blog_authors.user_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  if cardinality(photo_ids) is distinct from (
    select count(*)::integer from public.photography_images
  ) or exists (
    select 1 from public.photography_images
    where not (photography_images.id = any(photo_ids))
  ) then
    raise exception 'Photo order must include every photograph exactly once';
  end if;

  if hero_id is not null and not (hero_id = any(photo_ids)) then
    raise exception 'Hero photograph must be in the saved order';
  end if;

  update public.photography_images as photo
  set
    display_order = (ordering.position - 1)::integer,
    is_hero = coalesce(photo.id = hero_id, false)
  from unnest(photo_ids) with ordinality as ordering(photo_id, position)
  where photo.id = ordering.photo_id;
end;
$$;

revoke all on function public.update_photography_order(bigint[], bigint) from public;
grant execute on function public.update_photography_order(bigint[], bigint) to authenticated;
