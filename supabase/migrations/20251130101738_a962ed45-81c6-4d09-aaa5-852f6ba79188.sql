-- Update the app_role enum to match the required roles
-- First, drop dependent objects, then recreate them

-- Drop existing policies that reference the function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Drop the function that depends on the enum
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Temporarily disable RLS to allow updates
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Convert column to text temporarily
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;

-- Drop and recreate the enum with new values
DROP TYPE IF EXISTS public.app_role CASCADE;

CREATE TYPE public.app_role AS ENUM ('admin', 'coordinator', 'employee');

-- Convert column back to enum
ALTER TABLE public.user_roles ALTER COLUMN role TYPE app_role USING role::app_role;

-- Recreate the has_role function with updated enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));