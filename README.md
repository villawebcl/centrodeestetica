# centrodeestetica

## Variables de entorno

```env
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
```

`SUPABASE_SERVICE_ROLE_KEY` se usa solo en endpoints server-side del admin. No debe exponerse en el frontend ni llevar el prefijo `PUBLIC_`.
`ADMIN_SESSION_SECRET` debe ser un valor largo y aleatorio; permite firmar la cookie de sesión del admin.
`ADMIN_PASSWORD` es solo un fallback inicial si no existe `password_hash` en Supabase. Debe tener al menos 8 caracteres con mayúscula, minúscula, número y símbolo; las contraseñas débiles no son aceptadas.

Después de aplicar `supabase_schema.sql`, las reservas públicas se crean con la función `crear_reserva_publica`, la disponibilidad se consulta con `get_booked_slots` y el rate limit usa `api_rate_limits` mediante `consume_rate_limit`.

## Calidad y CI

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

El workflow `.github/workflows/ci.yml` ejecuta typecheck, lint, tests unitarios/integración y build en cada push a `main` y pull request. Los e2e de Playwright quedan activos en CI cuando existen los secretos de Supabase necesarios.
