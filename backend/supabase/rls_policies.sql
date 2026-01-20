-- ============================================================================
-- Dez Fitness Discovery App - Row Level Security Policies
-- ============================================================================
-- Security-first approach: Default deny, explicit allow
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is authenticated
alter table profiles enable row level security;
alter table questionnaire_responses enable row level security;
alter table recommendations enable row level security;
alter table events enable row level security;

create policy "Users can view own profile"
on profiles for select
using (auth.uid() = user_id);

create policy "Users can update own profile"
on profiles for update
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on profiles for insert
with check (auth.uid() = user_id);

create policy "Users manage own questionnaires"
on questionnaire_responses
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users view own recommendations"
on recommendations for select
using (auth.uid() = user_id);

create policy "Users insert own events"
on events for insert
with check (auth.uid() = user_id or auth.uid() is null);

alter table facilities enable row level security;

create policy "Public can view facilities"
on facilities for select
using (deleted_at is null);

