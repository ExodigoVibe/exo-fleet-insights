-- Remove RLS policies from vehicle_requests and event_reports tables
-- These will be re-implemented later with proper authentication

-- Drop all policies on vehicle_requests
DROP POLICY IF EXISTS "Authenticated users can view all vehicle requests" ON vehicle_requests;
DROP POLICY IF EXISTS "Admins can manage all vehicle requests" ON vehicle_requests;
DROP POLICY IF EXISTS "Admins can view all vehicle requests" ON vehicle_requests;
DROP POLICY IF EXISTS "Employees can create vehicle requests" ON vehicle_requests;

-- Drop all policies on event_reports
DROP POLICY IF EXISTS "Authenticated users can view all event reports" ON event_reports;
DROP POLICY IF EXISTS "Admins can manage all event reports" ON event_reports;
DROP POLICY IF EXISTS "Admins can view all event reports" ON event_reports;
DROP POLICY IF EXISTS "Employees can create event reports" ON event_reports;

-- Disable RLS on both tables temporarily
ALTER TABLE vehicle_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_reports DISABLE ROW LEVEL SECURITY;