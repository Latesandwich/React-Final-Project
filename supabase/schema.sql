-- CinemaGo only. Run in the separate Sandwich project SQL editor.
begin;
create table if not exists public.movies (id text primary key, payload jsonb not null);
create table if not exists public.showtimes (id text primary key, movie_id text references public.movies(id), payload jsonb not null);
create table if not exists public.users (id text primary key, email text unique not null check(email=lower(email)), name text not null, password text not null);
create table if not exists public.sessions (token_hash text primary key, user_id text not null references public.users(id), expires_at bigint not null);
create index if not exists sessions_user on public.sessions(user_id);
create table if not exists public.bookings (id text primary key, user_id text not null references public.users(id), showtime_id text not null references public.showtimes(id), payload jsonb not null, created_at timestamptz not null default now());
create index if not exists bookings_user on public.bookings(user_id);
create index if not exists bookings_showtime on public.bookings(showtime_id);
create table if not exists public.booked_seats (showtime_id text references public.showtimes(id), seat_id text, booking_id text not null references public.bookings(id), primary key(showtime_id,seat_id));
create index if not exists booked_seats_booking on public.booked_seats(booking_id);
alter table public.movies enable row level security;
alter table public.showtimes enable row level security;
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.bookings enable row level security;
alter table public.booked_seats enable row level security;
revoke all on public.movies,public.showtimes,public.users,public.sessions,public.bookings,public.booked_seats from anon,authenticated;
grant select,insert,update,delete on public.movies,public.showtimes,public.users,public.sessions,public.bookings,public.booked_seats to service_role;

-- CHECK 08: service-role only; user authorization stays in server actions.
-- SECURITY INVOKER avoids privilege escalation. Each RPC is one transaction.
create or replace function public.cinemago_backend(operation text, args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare result jsonb; screening jsonb; film jsonb; selected jsonb; seat jsonb;
  ids text[]; booking_id text; total integer; discount integer;
begin
  case operation
  when 'catalogue' then
    select jsonb_build_object(
      'movies',coalesce((select jsonb_agg(payload order by id) from movies),'[]'::jsonb),
      'showtimes',coalesce((select jsonb_agg(s.payload || jsonb_build_object('seats',
        (select jsonb_agg(x || jsonb_build_object('isBooked',coalesce((x->>'isBooked')::boolean,false) or exists(
          select 1 from booked_seats b where b.showtime_id=s.id and b.seat_id=x->>'id')))
         from jsonb_array_elements(s.payload->'seats') x))) from showtimes s),'[]'::jsonb)
    ) into result;
  when 'insert_user' then
    insert into users values(args->>'id',lower(trim(args->>'email')),args->>'name',args->>'password');
    result:='null'::jsonb;
  when 'user_by_email' then
    select to_jsonb(u) into result from users u where email=lower(trim(args->>'email'));
  when 'create_session' then
    delete from sessions where expires_at <= extract(epoch from now())*1000;
    insert into sessions values(args->>'hash',args->>'userId',(args->>'expires')::bigint);
    result:='null'::jsonb;
  when 'read_session' then
    select jsonb_build_object('id',u.id,'name',u.name,'email',u.email) into result from users u
    join sessions s on u.id=s.user_id where s.token_hash=args->>'hash' and s.expires_at>extract(epoch from now())*1000;
  when 'delete_session' then
    delete from sessions where token_hash=args->>'hash'; result:='null'::jsonb;
  when 'booking' then
    select payload into result from bookings where id=args->>'id' and user_id=args->>'userId';
  when 'bookings' then
    select coalesce(jsonb_agg(payload order by created_at desc),'[]'::jsonb) into result from bookings where user_id=args->>'userId';
  when 'reserve' then
    if jsonb_typeof(args->'seats') is distinct from 'array' then raise exception 'กรุณาเลือกที่นั่ง'; end if;
    select array_agg(x->>'id') into ids from jsonb_array_elements(args->'seats') x;
    if coalesce(cardinality(ids),0) not between 1 and 8 or array_position(ids,null) is not null
      or cardinality(ids)<>(select count(distinct x) from unnest(ids) x) then
      raise exception 'กรุณาเลือกที่นั่งที่ถูกต้องและไม่ซ้ำกัน'; end if;
    -- Serialize bookings for this screening, then validate against stored prices/seats.
    select payload into screening from showtimes where id=args->>'showtimeId' for update;
    if screening is null then raise exception 'ไม่พบรอบฉาย'; end if;
    select payload into film from movies where id=screening->>'movieId';
    select jsonb_agg(x-'isBooked'),sum((x->>'price')::integer) into selected,total
      from jsonb_array_elements(screening->'seats') x where x->>'id'=any(ids)
      and not coalesce((x->>'isBooked')::boolean,false)
      and not exists(select 1 from booked_seats b where b.showtime_id=args->>'showtimeId' and b.seat_id=x->>'id');
    if jsonb_array_length(coalesce(selected,'[]'::jsonb))<>cardinality(ids) then
      raise exception 'ที่นั่งถูกจองแล้ว กรุณาเลือกที่นั่งใหม่'; end if;
    discount:=case when upper(trim(args->>'promoCode')) in ('CINEMA50','FRAME50') then 50 else 0 end;
    booking_id:='BK-'||gen_random_uuid()::text;
    result:=jsonb_build_object('id',booking_id,'userId',args->>'userId',
      'userName',args->>'customerName','userEmail',args->>'customerEmail','userPhone',args->>'customerPhone',
      'showtimeId',args->>'showtimeId','movie',film,'hallName',screening#>>'{hall,name}',
      'hallType',screening#>>'{hall,type}','dateTime',screening->>'dateTime','audio',screening->>'audio',
      'seats',selected,'totalPrice',greatest(0,total-discount),'paymentMethod',args->>'paymentMethod',
      'paymentStatus','pending','bookedAt',now());
    insert into bookings(id,user_id,showtime_id,payload) values(booking_id,args->>'userId',args->>'showtimeId',result);
    foreach seat in array array(select value from jsonb_array_elements(selected)) loop
      insert into booked_seats values(args->>'showtimeId',seat->>'id',booking_id);
    end loop;
  else raise exception 'Unknown operation';
  end case;
  return coalesce(result,'null'::jsonb);
end $$;
revoke all on function public.cinemago_backend(text,jsonb) from public,anon,authenticated;
grant execute on function public.cinemago_backend(text,jsonb) to service_role;
commit;
