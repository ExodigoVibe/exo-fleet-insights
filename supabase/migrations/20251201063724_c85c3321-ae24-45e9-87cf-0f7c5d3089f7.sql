
-- Drop foreign key constraints to allow manual user creation during development
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Insert your profile
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'ortal.spitzer-hanoch@exodigo.ai',
  'ortal spitzer hanoch',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = now();

-- Insert admin role
INSERT INTO user_roles (user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;
