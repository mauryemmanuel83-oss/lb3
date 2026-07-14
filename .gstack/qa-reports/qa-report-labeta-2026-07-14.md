# Reporte QA · La Beta · 2026-07-14

**Objetivo probado:** app local (localhost:3000) con Supabase real conectado.
**Score de salud: 98/100** · 0 errores de consola · 0 bugs de código.

## Resumen

| Área | Resultado |
|------|-----------|
| Registro (usuario + contraseña) | ✅ Funciona |
| Validación contraseña corta | ✅ Muestra error en rojo |
| Login credenciales incorrectas | ✅ "Usuario o contraseña incorrectos" |
| Crear beta boulder (grados V) | ✅ Verificado sesión previa |
| Crear beta deportiva (grados 5a-8a) | ✅ Solo grados franceses, publica en Supabase |
| Editor: lápiz, undo/redo, texto | ✅ Funciona |
| Explorar + filtros por muro | ✅ Funciona |
| Comentar | ✅ Persiste en Supabase |
| Recomendar / quitar recomendación | ✅ Toggle correcto |
| Borrar beta propia | ✅ Borra + cascada de comentarios |
| Perfil / stats reales | ✅ Todo en 0 para usuario nuevo |
| Ranking del gym | ✅ Carga en vivo |
| Cerrar sesión + re-login | ✅ Verificado |
| Responsive desktop 1280px | ✅ Sin scroll horizontal, nav correcta |
| Consola | ✅ 0 errores en todo el flujo |

## Bugs encontrados

Ninguno de código. Dos "falsas alarmas" durante la prueba resultaron ser
comportamiento correcto (mediciones del DOM antes de que React re-renderizara).

## Acción pendiente (no es bug, es limpieza previa al lanzamiento)

**Cuentas de prueba en la base de datos real.** El ranking mostrará estas
cuentas de prueba a los usuarios reales:
- `maury`, `Maury1`, `lena`, `qa_972106`

Deben borrarse desde el dashboard de Supabase antes del lanzamiento:
**Authentication → Users → seleccionar cada una → Delete user.**
Al borrar el usuario se borran en cascada sus betas y comentarios.
(No se pueden borrar desde la app porque la anon key no tiene ese permiso, por
diseño de seguridad.)

## Estado de datos al terminar el QA

0 betas · 0 comentarios · 0 recomendaciones (limpio para usuarios reales,
salvo las 4 cuentas de prueba de arriba).
