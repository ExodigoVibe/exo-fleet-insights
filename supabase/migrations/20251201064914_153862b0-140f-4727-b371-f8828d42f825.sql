
-- Add full_name column to user_roles table
ALTER TABLE user_roles ADD COLUMN full_name text;

-- Populate existing records with full_name from profiles
UPDATE user_roles
SET full_name = profiles.full_name
FROM profiles
WHERE user_roles.user_id = profiles.id;

-- Update the handle_new_user function to also set full_name in user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign default employee role to new user with email and full_name
  INSERT INTO public.user_roles (user_id, role, email, full_name)
  VALUES (
    NEW.id, 
    'employee'::app_role, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  RETURN NEW;
END;
$$;
