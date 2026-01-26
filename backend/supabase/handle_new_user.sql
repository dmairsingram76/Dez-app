create function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure handle_new_user();
