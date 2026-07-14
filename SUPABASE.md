# La Beta · Configuración de Supabase

La app guarda **usuarios, betas, comentarios y recomendaciones** en Supabase.
Todo arranca de cero: no hay datos inventados.

## Ya está configurado

- **Proyecto**: `glbiuucfcxbnlomcoevz.supabase.co`
- **Tablas**: creadas con [supabase/setup.sql](supabase/setup.sql)
- **Confirmación de email**: desactivada (entramos con usuario, no con correo)
- **Anon key**: en `.env.local` (este archivo NO se sube a git)

## Cómo funciona el registro

- El usuario elige **usuario + contraseña** (mínimo 6 caracteres).
- Internamente se crea un email sintético `usuario@escaladores.labeta.app`
  para Supabase Auth, pero el escalador nunca lo ve.
- La sesión queda guardada: no hay que volver a entrar cada vez.
- **Cerrar sesión**: botón "Salir" en el Perfil.

## Sistema de puntos y ranking

- **150 pts** por cada beta publicada
- **25 pts** por cada recomendación recibida
- El ranking del gym se calcula en vivo y ordena a todos los escaladores.

## Si algún día cambias de proyecto Supabase

1. Corre `supabase/setup.sql` en el **SQL Editor** del nuevo proyecto.
2. En **Authentication → Sign In / Providers → Email**, apaga **"Confirm email"**.
3. Copia la nueva **anon key** (Project Settings → API Keys) a `.env.local`.
4. Actualiza `VITE_SUPABASE_URL` en `.env.local`.
5. Reinicia el servidor (`npm run dev`).

## Seguridad

- La **anon key** es pública por diseño (va en el navegador). Los datos los
  protegen las políticas RLS del SQL: cualquiera puede leer, pero solo puedes
  crear/editar/borrar lo tuyo.
- Nunca subas la **service_role key** al frontend ni a git.
