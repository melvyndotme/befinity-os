-- Credentials are accessed only by an authenticated Edge Function using the
-- service role. RLS is defence in depth; no browser role receives a policy.
alter table private.tact_notes_google_credentials enable row level security;
