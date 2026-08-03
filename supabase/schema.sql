-- Projet Supabase "willy-snack" (region eu-west-3)
-- Ce projet n'utilise pas la CLI/migrations Supabase : ce fichier documente
-- le schema tel qu'il a ete reellement execute via l'outil MCP Supabase.
-- Voir docs/superpowers/plans/2026-08-03-admin-menu.md (Task 1).

-- Table des plats
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  categorie text not null,
  nom text not null,
  prix text not null,
  description text not null default '',
  photo_url text not null default '',
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

create policy "menu_items_public_read"
  on public.menu_items for select
  to anon, authenticated
  using (true);

create policy "menu_items_auth_insert"
  on public.menu_items for insert
  to authenticated
  with check (true);

create policy "menu_items_auth_update"
  on public.menu_items for update
  to authenticated
  using (true)
  with check (true);

create policy "menu_items_auth_delete"
  on public.menu_items for delete
  to authenticated
  using (true);

-- Bucket de stockage des photos de plats
insert into storage.buckets (id, name, public)
values ('plats', 'plats', true)
on conflict (id) do nothing;

create policy "plats_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'plats');

create policy "plats_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'plats');

create policy "plats_auth_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'plats');

create policy "plats_auth_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'plats');

-- Seed : les 9 plats deja presents dans data/menu.js
insert into public.menu_items (categorie, nom, prix, description, ordre) values
  ('Burgers', 'Classic Snack', '6,50 €', 'Steak haché, cheddar, salade, tomate, oignon, sauce burger', 1),
  ('Burgers', 'Willy Double', '8,90 €', 'Double steak, double cheddar, bacon, sauce barbecue', 2),
  ('Kebabs / Tacos', 'Kebab poulet', '6,00 €', 'Viande de poulet, crudités, sauce blanche ou algérienne', 1),
  ('Kebabs / Tacos', 'Tacos M', '7,50 €', '1 viande au choix, frites, fromage fondu, sauce au choix', 2),
  ('Sandwichs / Paninis', 'Panini poulet curry', '5,50 €', 'Poulet, sauce curry, emmental, crudités', 1),
  ('Accompagnements', 'Frites', '3,00 €', '', 1),
  ('Accompagnements', 'Nuggets (6 pièces)', '4,00 €', '', 2),
  ('Boissons', 'Canette 33cl', '1,80 €', '', 1),
  ('Desserts', 'Tiramisu maison', '3,50 €', '', 1);
