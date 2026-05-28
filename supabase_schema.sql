-- ==========================================
-- SUPABASE SCHEMA, RLS POLICIES & INITIAL DATA
-- Proyecto: Villaweb Beauty Platform
-- ==========================================

-- 1. ESTRUCTURA (Tablas)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Configuración General
CREATE TABLE IF NOT EXISTS configuracion (
  id integer PRIMARY KEY DEFAULT 1,
  nombre_negocio text,
  tagline text,
  descripcion text,
  direccion text,
  horarios text,
  email text,
  telefono text,
  whatsapp_number text,
  color_primario text DEFAULT '#000000',
  color_secundario text DEFAULT '#ffffff',
  horario_slots text[] DEFAULT ARRAY['10:00', '11:30', '13:00', '15:30', '17:00', '18:30'],
  password_hash text,
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE configuracion
ADD COLUMN IF NOT EXISTS horario_slots text[] DEFAULT ARRAY['10:00', '11:30', '13:00', '15:30', '17:00', '18:30'];

ALTER TABLE configuracion
ADD COLUMN IF NOT EXISTS password_hash text;

CREATE TABLE IF NOT EXISTS contacto_leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  telefono text,
  email text,
  servicio text,
  mensaje text NOT NULL,
  origen text DEFAULT 'contacto',
  estado text DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'contactado', 'cerrado')),
  creado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT contacto_leads_nombre_len CHECK (char_length(nombre) BETWEEN 1 AND 90),
  CONSTRAINT contacto_leads_contacto_check CHECK (
    coalesce(nullif(trim(telefono), ''), nullif(trim(email), '')) IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor text NOT NULL DEFAULT 'admin',
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  creado_en timestamp with time zone DEFAULT now()
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-assets', 'admin-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Tabla de Servicios
CREATE TABLE IF NOT EXISTS servicios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  categoria text,
  duracion text,
  precio text,
  descripcion text,
  imagen_url text,
  activo boolean DEFAULT true,
  orden integer DEFAULT 0
);

ALTER TABLE servicios
ADD COLUMN IF NOT EXISTS imagen_url text;

-- Tabla de Profesionales
CREATE TABLE IF NOT EXISTS profesionales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  rol text,
  especialidad text,
  bio text,
  foto_url text,
  activo boolean DEFAULT true
);

ALTER TABLE profesionales
ADD COLUMN IF NOT EXISTS foto_url text;

-- Tabla de Promociones
CREATE TABLE IF NOT EXISTS promociones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  precio text,
  precio_antes text,
  tag text,
  descripcion text,
  incluye text[],
  activo boolean DEFAULT true
);

-- Tabla de Preguntas Frecuentes (FAQs)
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pregunta text NOT NULL,
  respuesta text NOT NULL,
  orden integer DEFAULT 0
);

-- Tabla de Reservas
CREATE TABLE IF NOT EXISTS reservas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_nombre text NOT NULL,
  cliente_telefono text NOT NULL,
  servicio_nombre text,
  profesional_nombre text,
  fecha date NOT NULL,
  hora time NOT NULL,
  notas text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
  creado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT reservas_nombre_len CHECK (char_length(cliente_nombre) BETWEEN 1 AND 90),
  CONSTRAINT reservas_telefono_len CHECK (char_length(cliente_telefono) BETWEEN 8 AND 30)
);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  reset_at timestamp with time zone NOT NULL
);

-- Limpia duplicados historicos antes de crear el indice unico.
WITH ranked_services AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY lower(trim(nombre))
      ORDER BY activo DESC, orden ASC, id ASC
    ) AS row_num
  FROM servicios
)
DELETE FROM servicios
USING ranked_services
WHERE servicios.id = ranked_services.id
  AND ranked_services.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS servicios_nombre_unique_idx ON servicios (lower(trim(nombre)));

CREATE UNIQUE INDEX IF NOT EXISTS reservas_slot_activo_unique_idx
ON reservas (fecha, hora, lower(trim(profesional_nombre)))
WHERE estado IN ('pendiente', 'confirmada');


-- 2. POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacto_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de LECTURA (SELECT) - Acceso público para la web
DROP POLICY IF EXISTS "Permitir lectura publica de servicios" ON servicios;
DROP POLICY IF EXISTS "Permitir lectura publica de profesionales" ON profesionales;
DROP POLICY IF EXISTS "Permitir lectura publica de promociones" ON promociones;
DROP POLICY IF EXISTS "Permitir lectura publica de servicios activos" ON servicios;
DROP POLICY IF EXISTS "Permitir lectura publica de profesionales activos" ON profesionales;
DROP POLICY IF EXISTS "Permitir lectura publica de promociones activas" ON promociones;
DROP POLICY IF EXISTS "Permitir insertar servicios admin" ON servicios;
DROP POLICY IF EXISTS "Permitir actualizar servicios admin" ON servicios;
DROP POLICY IF EXISTS "Permitir eliminar servicios admin" ON servicios;
DROP POLICY IF EXISTS "Permitir insertar reservas publicamente" ON reservas;
DROP POLICY IF EXISTS "Permitir lectura publica de reservas ocupadas" ON reservas;
DROP POLICY IF EXISTS "Permitir gestion total de reservas admin" ON reservas;
DROP POLICY IF EXISTS "Permitir insertar leads publicamente" ON contacto_leads;
DROP POLICY IF EXISTS "Permitir lectura publica de admin assets" ON storage.objects;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica de configuracion') THEN
        CREATE POLICY "Permitir lectura publica de configuracion" ON configuracion FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permitir lectura publica de faqs') THEN
        CREATE POLICY "Permitir lectura publica de faqs" ON faqs FOR SELECT USING (true);
    END IF;
END $$;

CREATE POLICY "Permitir lectura publica de servicios activos"
ON servicios FOR SELECT USING (activo = true);

CREATE POLICY "Permitir lectura publica de profesionales activos"
ON profesionales FOR SELECT USING (activo = true);

CREATE POLICY "Permitir lectura publica de promociones activas"
ON promociones FOR SELECT USING (activo = true);

-- La gestion administrativa de reservas/servicios debe hacerse desde endpoints server-side
-- usando SUPABASE_SERVICE_ROLE_KEY. No crear policies anon para SELECT/UPDATE/DELETE.

REVOKE ALL ON reservas FROM anon, authenticated;
REVOKE ALL ON api_rate_limits FROM anon, authenticated;
REVOKE ALL ON contacto_leads FROM anon, authenticated;
REVOKE ALL ON audit_logs FROM anon, authenticated;

GRANT INSERT ON contacto_leads TO anon, authenticated;

CREATE POLICY "Permitir insertar leads publicamente"
ON contacto_leads FOR INSERT
WITH CHECK (
  estado = 'nuevo'
  AND origen = 'contacto'
  AND char_length(nombre) BETWEEN 1 AND 90
  AND char_length(mensaje) BETWEEN 1 AND 900
);

CREATE POLICY "Permitir lectura publica de admin assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-assets');

CREATE OR REPLACE FUNCTION get_booked_slots(
  p_fecha date,
  p_profesional_nombre text
)
RETURNS TABLE (hora text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_char(r.hora, 'HH24:MI') AS hora
  FROM reservas r
  WHERE r.fecha = p_fecha
    AND lower(trim(r.profesional_nombre)) = lower(trim(p_profesional_nombre))
    AND r.estado IN ('pendiente', 'confirmada');
$$;

CREATE OR REPLACE FUNCTION crear_reserva_publica(
  p_cliente_nombre text,
  p_cliente_telefono text,
  p_servicio_nombre text,
  p_profesional_nombre text,
  p_fecha date,
  p_hora time,
  p_notas text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserva_id uuid;
BEGIN
  p_cliente_nombre := left(trim(coalesce(p_cliente_nombre, '')), 90);
  p_cliente_telefono := left(trim(coalesce(p_cliente_telefono, '')), 30);
  p_servicio_nombre := left(trim(coalesce(p_servicio_nombre, '')), 120);
  p_profesional_nombre := left(trim(coalesce(p_profesional_nombre, '')), 120);
  p_notas := left(trim(coalesce(p_notas, '')), 700);

  IF p_cliente_nombre = ''
    OR p_cliente_telefono !~ '^\+?[0-9\s()-]{8,20}$'
    OR p_servicio_nombre = ''
    OR p_profesional_nombre = ''
    OR p_fecha <= current_date
  THEN
    RAISE EXCEPTION 'invalid_booking_payload';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM servicios
    WHERE nombre = p_servicio_nombre AND activo = true
  ) OR NOT EXISTS (
    SELECT 1 FROM profesionales
    WHERE nombre = p_profesional_nombre AND activo = true
  ) THEN
    RAISE EXCEPTION 'service_or_professional_unavailable';
  END IF;

  IF EXISTS (
    SELECT 1 FROM reservas
    WHERE fecha = p_fecha
      AND hora = p_hora
      AND lower(trim(profesional_nombre)) = lower(trim(p_profesional_nombre))
      AND estado IN ('pendiente', 'confirmada')
  ) THEN
    RAISE EXCEPTION 'slot_unavailable';
  END IF;

  INSERT INTO reservas (
    cliente_nombre,
    cliente_telefono,
    servicio_nombre,
    profesional_nombre,
    fecha,
    hora,
    notas,
    estado
  )
  VALUES (
    p_cliente_nombre,
    p_cliente_telefono,
    p_servicio_nombre,
    p_profesional_nombre,
    p_fecha,
    p_hora,
    p_notas,
    'pendiente'
  )
  RETURNING id INTO v_reserva_id;

  RETURN v_reserva_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'slot_unavailable';
END;
$$;

CREATE OR REPLACE FUNCTION consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_ms integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamp with time zone := now();
  v_reset_at timestamp with time zone := now() + ((greatest(p_window_ms, 1)::double precision / 1000) * interval '1 second');
  v_count integer;
BEGIN
  IF p_key IS NULL OR p_key = '' OR p_limit < 1 THEN
    RETURN true;
  END IF;

  INSERT INTO api_rate_limits AS rl (key, count, reset_at)
  VALUES (p_key, 1, v_reset_at)
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN rl.reset_at <= v_now THEN 1
      ELSE rl.count + 1
    END,
    reset_at = CASE
      WHEN rl.reset_at <= v_now THEN v_reset_at
      ELSE rl.reset_at
    END
  RETURNING count INTO v_count;

  DELETE FROM api_rate_limits WHERE reset_at < v_now - interval '1 day';

  RETURN v_count > p_limit;
END;
$$;

REVOKE ALL ON FUNCTION get_booked_slots(date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION crear_reserva_publica(text, text, text, text, date, time, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION consume_rate_limit(text, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_booked_slots(date, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION crear_reserva_publica(text, text, text, text, date, time, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_rate_limit(text, integer, integer) TO service_role;


-- 3. DATOS INICIALES (Opcional, si ya los tienes puedes ignorar esta parte)
-- ==========================================

-- Configuración Inicial
INSERT INTO configuracion (id, nombre_negocio, tagline, descripcion, direccion, horarios, email, telefono, whatsapp_number)
VALUES (1, 'Lumina Estetica', 'Centro de estetica facial y corporal', 'Tratamientos esteticos personalizados en un espacio calido, profesional y pensado para que agendes sin complicaciones.', 'Av. Providencia 1234, Santiago', 'Lunes a sabado, 10:00 a 19:30', 'hola@luminaestetica.cl', '+56 9 8765 4321', '56987654321')
ON CONFLICT (id) DO UPDATE SET
  nombre_negocio = EXCLUDED.nombre_negocio,
  tagline = EXCLUDED.tagline,
  descripcion = EXCLUDED.descripcion;

-- Password temporal inicial: Cambia-EstaClave1!
-- Cambiarlo desde /admin/cuenta antes de producción.
UPDATE configuracion
SET password_hash = 'de3246c29be53e6dd0eef4ea72232376:17dae4fc647a356d2b58ea7b67dfebe3f53de172ffded31a7bb83b129254d36e'
WHERE id = 1
  AND password_hash IS NULL;

-- Puedes añadir más inserts aquí si lo necesitas.
