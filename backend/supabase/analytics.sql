create or replace view analytics_events_daily as
select
  date_trunc('day', created_at) as day,
  count(*) as total_events,
  count(distinct coalesce(user_id, anonymous_id)) as active_users
from events
where deleted_at is null
group by 1
order by 1 desc;


create or replace view analytics_onboarding_funnel as
select
  count(distinct anonymous_id) filter (where event_name = 'questionnaire_started') as started,
  count(distinct anonymous_id) filter (where event_name = 'questionnaire_completed') as completed,
  count(distinct anonymous_id) filter (where event_name = 'recommendation_viewed') as viewed_recommendations
from events
where deleted_at is null;

create or replace view analytics_event_counts as
select
  event_name,
  count(*) as total,
  count(distinct coalesce(user_id, anonymous_id)) as unique_users
from events
where deleted_at is null
group by event_name
order by total desc;


create or replace view analytics_facility_clicks as
select
  metadata->>'facility_id' as facility_id,
  count(*) as clicks
from events
where event_name = 'facility_clicked'
  and deleted_at is null
group by facility_id
order by clicks desc;

create or replace view analytics_returning_users as
select
  anonymous_id,
  min(created_at) as first_seen,
  max(created_at) as last_seen,
  count(distinct date_trunc('day', created_at)) as active_days
from events
where deleted_at is null
group by anonymous_id
having max(created_at) - min(created_at) > interval '7 days';


create or replace view analytics_first_touch as
select
  anonymous_id,
  min(created_at) as first_seen,
  min(event_name) as first_event
from events
where deleted_at is null
group by anonymous_id;
