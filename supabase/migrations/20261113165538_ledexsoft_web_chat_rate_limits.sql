create schema if not exists private;

create table if not exists private.ledexsoft_web_chat_admission (
  ip_hash text primary key check (ip_hash ~ '^[0-9a-f]{64}$'),
  minute_start timestamptz not null,
  minute_count integer not null default 0 check (minute_count >= 0),
  hour_start timestamptz not null,
  hour_count integer not null default 0 check (hour_count >= 0),
  active_request_id uuid,
  lease_expires_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  constraint ledexsoft_web_chat_lease_pair check (
    (active_request_id is null) = (lease_expires_at is null)
  )
);

create index if not exists ledexsoft_web_chat_admission_updated_at_idx
  on private.ledexsoft_web_chat_admission (updated_at);

alter table private.ledexsoft_web_chat_admission enable row level security;
revoke all on table private.ledexsoft_web_chat_admission from public, anon, authenticated;

create or replace function public.ledexsoft_web_chat_admission_acquire(
  p_ip_hash text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_minute timestamptz := pg_catalog.date_trunc('minute', v_now at time zone 'UTC') at time zone 'UTC';
  v_hour timestamptz := pg_catalog.date_trunc('hour', v_now at time zone 'UTC') at time zone 'UTC';
  v_row private.ledexsoft_web_chat_admission%rowtype;
  v_retry integer;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' or p_request_id is null then
    return pg_catalog.jsonb_build_object('status', 'invalid_request');
  end if;

  insert into private.ledexsoft_web_chat_admission (
    ip_hash, minute_start, minute_count, hour_start, hour_count, updated_at
  ) values (p_ip_hash, v_minute, 0, v_hour, 0, v_now)
  on conflict (ip_hash) do nothing;

  select * into v_row
  from private.ledexsoft_web_chat_admission
  where ip_hash = p_ip_hash
  for update;

  if v_row.minute_start <> v_minute then
    update private.ledexsoft_web_chat_admission
    set minute_start = v_minute,
        minute_count = 0,
        active_request_id = case when lease_expires_at > v_now then active_request_id else null end,
        lease_expires_at = case when lease_expires_at > v_now then lease_expires_at else null end,
        updated_at = v_now
    where ip_hash = p_ip_hash
    returning * into v_row;
  elsif v_row.active_request_id is not null and v_row.lease_expires_at <= v_now then
    update private.ledexsoft_web_chat_admission
    set active_request_id = null, lease_expires_at = null, updated_at = v_now
    where ip_hash = p_ip_hash
    returning * into v_row;
  end if;

  if v_row.hour_start <> v_hour then
    update private.ledexsoft_web_chat_admission
    set hour_start = v_hour, hour_count = 0, updated_at = v_now
    where ip_hash = p_ip_hash
    returning * into v_row;
  end if;

  if v_row.active_request_id is not null then
    return pg_catalog.jsonb_build_object(
      'status', 'in_flight',
      'retryAfterSeconds', greatest(1, ceil(extract(epoch from (v_row.lease_expires_at - v_now)))::integer)
    );
  end if;

  if v_row.minute_count >= 6 then
    v_retry := greatest(1, ceil(extract(epoch from ((v_minute + interval '1 minute') - v_now)))::integer);
    return pg_catalog.jsonb_build_object('status', 'rate_limited', 'retryAfterSeconds', v_retry);
  end if;

  if v_row.hour_count >= 30 then
    v_retry := greatest(1, ceil(extract(epoch from ((v_hour + interval '1 hour') - v_now)))::integer);
    return pg_catalog.jsonb_build_object('status', 'rate_limited', 'retryAfterSeconds', v_retry);
  end if;

  update private.ledexsoft_web_chat_admission
  set minute_count = minute_count + 1,
      hour_count = hour_count + 1,
      active_request_id = p_request_id,
      lease_expires_at = v_now + interval '90 seconds',
      updated_at = v_now
  where ip_hash = p_ip_hash
  returning * into v_row;

  delete from private.ledexsoft_web_chat_admission
  where updated_at < v_now - interval '48 hours';

  return pg_catalog.jsonb_build_object(
    'status', 'admitted',
    'minuteLimit', 6,
    'hourLimit', 30,
    'leaseExpiresAt', v_row.lease_expires_at
  );
end;
$function$;

create or replace function public.ledexsoft_web_chat_admission_release(
  p_ip_hash text,
  p_request_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' or p_request_id is null then
    return false;
  end if;

  update private.ledexsoft_web_chat_admission
  set active_request_id = null, lease_expires_at = null, updated_at = pg_catalog.clock_timestamp()
  where ip_hash = p_ip_hash and active_request_id = p_request_id;

  return found;
end;
$function$;

revoke all on function public.ledexsoft_web_chat_admission_acquire(text, uuid) from public, anon, authenticated;
revoke all on function public.ledexsoft_web_chat_admission_release(text, uuid) from public, anon, authenticated;
grant execute on function public.ledexsoft_web_chat_admission_acquire(text, uuid) to service_role;
grant execute on function public.ledexsoft_web_chat_admission_release(text, uuid) to service_role;
