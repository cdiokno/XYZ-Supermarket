update app_private.accounts
set
  password_hash = extensions.crypt('admin', extensions.gen_salt('bf')),
  updated_at = now()
where username = 'admin';
