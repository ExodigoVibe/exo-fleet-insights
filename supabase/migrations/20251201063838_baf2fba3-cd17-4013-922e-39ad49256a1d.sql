
-- Temporarily allow reading profiles and user_roles without authentication for development
-- (until Azure SSO is implemented)

-- Drop existing restrictive policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Drop existing restrictive policies on user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Create permissive read policies for development
CREATE POLICY "Allow read access to profiles during development"
ON profiles
FOR SELECT
USING (true);

CREATE POLICY "Allow read access to user_roles during development"
ON user_roles
FOR SELECT
USING (true);

-- Keep the admin write policy for user_roles
-- (will work once Azure SSO is implemented)
