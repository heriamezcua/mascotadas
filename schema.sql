-- Ejecutar una vez en el editor SQL de Supabase.
-- Toda la lectura y escritura pasa por el servidor: RLS activa y sin políticas bloquea el acceso directo.

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer text,
  stripe_suscripcion text,
  plan text check (plan in ('prueba', 'basico', 'premium')),
  periodo_inicio timestamptz,
  prueba_usada boolean not null default false,
  creado timestamptz not null default now()
);

create table public.historias (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  modo text not null,
  paginas jsonb not null,
  mascota jsonb not null,
  creado timestamptz not null default now()
);

create index historias_usuario_creado on public.historias (usuario, creado desc);

alter table public.perfiles enable row level security;
alter table public.historias enable row level security;

insert into storage.buckets (id, name, public) values ('audio', 'audio', false);

-- Solo el servidor accede a las tablas.
grant all on public.perfiles, public.historias to service_role;
