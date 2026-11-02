-- Base de datos propia del panel (Neon cartera-panel). Solo guarda el estado del panel; nunca datos de las apps.
create table if not exists tareas_estado (
  id text primary key,
  hecho boolean not null default false,
  actualizado timestamptz not null default now()
);
create table if not exists piezas_estado (
  id text primary key,
  publicado boolean not null default false,
  actualizado timestamptz not null default now()
);
create table if not exists correos_envios (
  clave text primary key,            -- id de la pieza + destinatario
  pieza text not null,
  para text not null,
  estado text not null check (estado in ('enviando', 'enviado', 'error', 'simulado')),
  resend_id text,
  error text,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create table if not exists registro (
  id bigserial primary key,
  en timestamptz not null default now(),
  accion text not null,
  detalle jsonb not null default '{}'::jsonb
);
create index if not exists registro_en on registro (en desc);
