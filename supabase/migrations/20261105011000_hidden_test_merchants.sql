-- Training businesses may sign in and scan, but never appear in customer offers.
alter table public.merchants add column is_test boolean not null default false;
