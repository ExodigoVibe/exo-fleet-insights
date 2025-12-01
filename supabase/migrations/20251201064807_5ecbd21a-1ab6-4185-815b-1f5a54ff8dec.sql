
-- Add email column to user_roles table
ALTER TABLE user_roles ADD COLUMN email text;

-- Populate existing records with email from profiles
UPDATE user_roles
SET email = profiles.email
FROM profiles
WHERE user_roles.user_id = profiles.id;

-- Update the handle_new_user function to also set email in user_roles
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
  
  -- Assign default employee role to new user with email
  INSERT INTO public.user_roles (user_id, role, email)
  VALUES (NEW.id, 'employee'::app_role, NEW.email);
  
  RETURN NEW;
END;
$$;
