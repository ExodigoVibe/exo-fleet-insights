
-- Update the handle_new_user function to also create a default employee role
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
  
  -- Assign default employee role to new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee'::app_role);
  
  RETURN NEW;
END;
$$;
