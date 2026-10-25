-- Rode isto uma vez no Supabase: SQL Editor → New query → cole tudo → Run.
-- Troque o código de convite na última seção antes de rodar.

-- Perfis: um por usuário, com o plano semanal guardado como JSON
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  plan jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Treinos registrados
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  date date not null default current_date,
  title text not null,
  exercises jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now()
);
create index workouts_user_date on public.workouts (user_id, date desc);
create index workouts_date on public.workouts (date desc, created_at desc);

-- Todo mundo logado vê tudo; cada um só mexe no que é seu
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;

create policy "ver perfis" on public.profiles for select to authenticated using (true);
create policy "editar meu perfil" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "ver treinos" on public.workouts for select to authenticated using (true);
create policy "criar meus treinos" on public.workouts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "editar meus treinos" on public.workouts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "apagar meus treinos" on public.workouts for delete to authenticated
  using (user_id = (select auth.uid()));

-- Código de convite: fica num schema que a API não expõe
create schema if not exists private;
create table private.settings (invite_code text not null);
insert into private.settings values ('TROQUE-ESTE-CODIGO');

-- Ao criar conta: confere o convite e cria o perfil
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'invite', '') is distinct from
     (select invite_code from private.settings limit 1) then
    raise exception 'invalid invite code';
  end if;
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
