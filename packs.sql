-- Packs de historias y planes anuales. Ejecutar una vez en el editor SQL de Supabase (se puede repetir sin problema).

-- Historias de pack que le quedan a cada cuenta y hasta cuándo valen (12 meses desde la última compra).
alter table public.perfiles add column if not exists historias_extra integer not null default 0 check (historias_extra >= 0);
alter table public.perfiles add column if not exists extra_caducan timestamptz;
-- Si la suscripción es anual (para mostrar el precio y qué cambios de plan se pueden hacer).
alter table public.perfiles add column if not exists anual boolean not null default false;

-- Las historias pagadas con un pack no cuentan para el límite del plan.
alter table public.historias add column if not exists de_pack boolean not null default false;

-- Cada pago de un pack, una sola vez: el id es la sesión de pago de Stripe.
create table if not exists public.compras (
  id text primary key,
  usuario uuid not null references auth.users (id) on delete cascade,
  historias integer not null check (historias > 0),
  importe integer not null, -- En céntimos, IVA incluido.
  creado timestamptz not null default now()
);
alter table public.compras enable row level security;
grant all on public.compras to service_role;

-- Suma un pack. Devuelve false si esa compra ya estaba sumada (Stripe puede avisar dos veces).
-- Si el saldo anterior ya había caducado, empieza de cero.
create or replace function public.sumar_pack(p_compra text, p_usuario uuid, p_historias integer, p_importe integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into compras (id, usuario, historias, importe) values (p_compra, p_usuario, p_historias, p_importe);
  insert into perfiles (id, historias_extra, extra_caducan) values (p_usuario, p_historias, now() + interval '12 months')
  on conflict (id) do update set
    historias_extra = (case when perfiles.extra_caducan > now() then perfiles.historias_extra else 0 end) + excluded.historias_extra,
    extra_caducan = excluded.extra_caducan;
  return true;
exception when unique_violation then
  return false;
end $$;

-- Gasta una historia de pack de una vez, para que dos peticiones a la vez no gasten la misma.
create or replace function public.gastar_extra(p_usuario uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update perfiles set historias_extra = historias_extra - 1
  where id = p_usuario and historias_extra > 0 and extra_caducan > now();
  return found;
end $$;

-- Devuelve la historia si no se pudo crear.
create or replace function public.devolver_extra(p_usuario uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update perfiles set historias_extra = historias_extra + 1 where id = p_usuario;
end $$;

-- Solo el servidor puede usarlas: sin esto, cualquiera con la clave pública podría sumarse historias.
revoke all on function public.sumar_pack(text, uuid, integer, integer), public.gastar_extra(uuid), public.devolver_extra(uuid)
  from public, anon, authenticated;
grant execute on function public.sumar_pack(text, uuid, integer, integer), public.gastar_extra(uuid), public.devolver_extra(uuid)
  to service_role;
