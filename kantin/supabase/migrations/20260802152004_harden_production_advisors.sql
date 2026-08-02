-- Price history is internal trigger data. Keep an explicit deny policy so the
-- table remains inaccessible through the Data API while still protected by RLS.
create policy price_history_authenticated_deny_policy
on public.product_price_history
for select
to authenticated
using (false);

-- Cover foreign keys used by audit and maintenance operations.
create index profiles_created_by_idx
  on public.profiles (created_by);

create index categories_created_by_idx
  on public.categories (created_by);
create index categories_updated_by_idx
  on public.categories (updated_by);

create index products_created_by_idx
  on public.products (created_by);
create index products_updated_by_idx
  on public.products (updated_by);

create index product_price_history_changed_by_idx
  on public.product_price_history (changed_by);

create index consumption_updated_by_idx
  on public.consumption_entries (updated_by);
create index consumption_cancelled_by_idx
  on public.consumption_entries (cancelled_by);
