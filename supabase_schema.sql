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
  CONSTRAINT single_row CHECK (id = 1)
);

-- Tabla de Servicios
CREATE TABLE IF NOT EXISTS servicios (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  categoria text,
  duracion text,
  precio text,
  descripcion text,
  activo boolean DEFAULT true,
  orden integer DEFAULT 0
);

-- Tabla de Profesionales
CREATE TABLE IF NOT EXISTS profesionales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  rol text,
  especialidad text,
  bio text,
  activo boolean DEFAULT true
);

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


-- 2. POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Políticas de LECTURA (SELECT) - Acceso público para la web
DROP POLICY IF EXISTS "Permitir lectura publica de servicios" ON servicios;
DROP POLICY IF EXISTS "Permitir lectura publica de profesionales" ON profesionales;
DROP POLICY IF EXISTS "Permitir lectura publica de promociones" ON promociones;
DROP POLICY IF EXISTS "Permitir insertar servicios admin" ON servicios;
DROP POLICY IF EXISTS "Permitir actualizar servicios admin" ON servicios;
DROP POLICY IF EXISTS "Permitir eliminar servicios admin" ON servicios;
DROP POLICY IF EXISTS "Permitir insertar reservas publicamente" ON reservas;
DROP POLICY IF EXISTS "Permitir gestion total de reservas admin" ON reservas;

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

-- Política para Reservas
CREATE POLICY "Permitir insertar reservas publicamente"
ON reservas FOR INSERT
WITH CHECK (estado = 'pendiente');

-- La gestion administrativa de reservas/servicios debe hacerse desde endpoints server-side
-- usando SUPABASE_SERVICE_ROLE_KEY. No crear policies anon para SELECT/UPDATE/DELETE.


-- 3. DATOS INICIALES (Opcional, si ya los tienes puedes ignorar esta parte)
-- ==========================================

-- Configuración Inicial
INSERT INTO configuracion (id, nombre_negocio, tagline, descripcion, direccion, horarios, email, telefono, whatsapp_number)
VALUES (1, 'Lumina Estetica', 'Centro de estetica facial y corporal', 'Tratamientos esteticos personalizados en un espacio calido, profesional y pensado para que agendes sin complicaciones.', 'Av. Providencia 1234, Santiago', 'Lunes a sabado, 10:00 a 19:30', 'hola@luminaestetica.cl', '+56 9 8765 4321', '56987654321')
ON CONFLICT (id) DO UPDATE SET
  nombre_negocio = EXCLUDED.nombre_negocio,
  tagline = EXCLUDED.tagline,
  descripcion = EXCLUDED.descripcion;

-- Puedes añadir más inserts aquí si lo necesitas.
