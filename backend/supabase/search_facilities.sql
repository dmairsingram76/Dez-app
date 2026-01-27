create or replace function search_facilities(
  user_lat double precision,
  user_lng double precision,
  activities text[],
  radius_meters int default 5000
)
returns table (
  id uuid,
  name text,
  activity_types text[],
  distance_meters int
)
language sql
stable
as $$
  select
    f.id,
    f.name,
    f.activity_types,
    st_distance(
      f.location,
      st_makepoint(user_lng, user_lat)::geography
    )::int as distance_meters
  from facilities f
  where
    (activities is null or f.activity_types && activities)
    and st_dwithin(
      f.location,
      st_makepoint(user_lng, user_lat)::geography,
      radius_meters
    )
  order by distance_meters
  limit 50;
$$;
