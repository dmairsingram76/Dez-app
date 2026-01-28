create or replace view analytics_events_daily as
select
  date_trunc('day', created_at) as day,
  count(*) as total_events,
  count(distinct coalesce(user_id, anonymous_id)) as active_users
from events
where deleted_at is null
group by 1
order by 1 desc;
