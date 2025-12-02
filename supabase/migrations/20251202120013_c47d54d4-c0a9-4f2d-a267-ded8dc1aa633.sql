-- Temporarily disable RLS on event_reports and vehicle_requests for testing with basic auth
-- This allows testing without real Supabase authentication

ALTER TABLE public.event_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_requests DISABLE ROW LEVEL SECURITY;