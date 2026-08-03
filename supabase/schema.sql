-- Projet Supabase "willy-snack" (region eu-west-3)
-- Ce projet n'utilise pas la CLI/migrations Supabase : ce fichier documente
-- le schema tel qu'il a ete reellement execute via l'outil MCP Supabase.
-- Voir docs/superpowers/plans/2026-08-03-admin-menu.md (Task 1) et la revue
-- finale de branche (durcissement RLS post-revue, meme jour).

-- IMPORTANT (verifie et corrige suite a la revue finale) :
-- l'auto-inscription (signup) doit rester desactivee sur ce projet
-- (Authentication > Providers > Email > "Allow new users to sign up" = off).
-- Sans ca, n'importe qui pourrait creer un compte "authenticated" et
-- profiter des policies d'ecriture ci-dessous.

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

-- Ecritures restreintes au seul compte admin (defense en profondeur : reste
-- correct meme si l'auto-inscription etait un jour reactivee par erreur).
-- UID du compte admin (admin@willysnack.internal) : ee65a682-fe0e-4c1e-90ef-1a8774c383fc

create policy "menu_items_admin_insert"
  on public.menu_items for insert
  to authenticated
  with check (auth.uid() = 'ee65a682-fe0e-4c1e-90ef-1a8774c383fc'::uuid);

create policy "menu_items_admin_update"
  on public.menu_items for update
  to authenticated
  using (auth.uid() = 'ee65a682-fe0e-4c1e-90ef-1a8774c383fc'::uuid)
  with check (auth.uid() = 'ee65a682-fe0e-4c1e-90ef-1a8774c383fc'::uuid);

create policy "menu_items_admin_delete"
  on public.menu_items for delete
  to authenticated
  using (auth.uid() = 'ee65a682-fe0e-4c1e-90ef-1a8774c383fc'::uuid);

-- Bucket de stockage des photos de plats
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('plats', 'plats', true, 3145728, array['image/jpeg'])
on conflict (id) do nothing;

-- Pas de policy SELECT sur storage.objects : le bucket est deja "public",
-- donc la lecture des fichiers via l'URL /storage/v1/object/public/...
-- (utilisee par getPublicUrl()) ne passe pas par les RLS. Une policy SELECT
-- ne servirait qu'a autoriser le listing/enumeration du bucket via l'API
-- cliente (storage.list()), jamais utilise par ce site.

create policy "plats_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'plats' and auth.uid() = 'ee65a682-fe0e-4c1e-90ef-1a8774c383fc'::uuid);

create policy "plats_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'plats' and auth.uid() = 'ee65a682-fe0e-4c1e-90ef-1a8774c383fc'::uuid);

create policy "plats_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'plats' and auth.uid() = 'ee65a682-fe0e-4c1e-90ef-1a8774c383fc'::uuid);

-- Seed : les 9 plats de depart (anciennement dans data/menu.js, supprime
-- a la Task 10 une fois la migration vers Supabase terminee)
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
