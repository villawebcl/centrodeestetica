-- Corrección de FAQs: eliminar duplicados y actualizar redacción
-- Ejecutar esto en el SQL Editor de Supabase

-- 1. Eliminar duplicados (conservar solo uno por pregunta)
DELETE FROM faqs
WHERE id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY lower(trim(pregunta)) ORDER BY orden, id) AS rn
    FROM faqs
  ) sub
  WHERE rn > 1
);

-- 2. Resetear y poblar con datos corregidos
DELETE FROM faqs;

INSERT INTO faqs (pregunta, respuesta, orden) VALUES
  ('¿Cómo sé qué tratamiento elegir?', 'Puedes comenzar con una evaluación estética gratuita. Revisamos tu objetivo, tipo de piel y rutina para recomendarte la opción más segura y adecuada para ti.', 1),
  ('¿La evaluación tiene costo?', 'La evaluación inicial es sin costo cuando agendas tu primera visita en el centro.', 2),
  ('¿Qué cuidados debo tener después de una limpieza facial?', 'Recomendamos evitar el sol directo, exfoliantes fuertes y maquillaje pesado durante las primeras 24 horas. Te entregaremos indicaciones específicas según tu tipo de piel.', 3),
  ('¿Puedo reagendar mi hora?', 'Sí, con gusto. Solo te pedimos avisar con al menos 24 horas de anticipación para liberar el horario y ofrecerte una nueva alternativa.', 4),
  ('¿Atienden a personas con piel sensible?', 'Sí, pero siempre evaluamos antes. Adaptamos los productos, la intensidad y la frecuencia según tu tolerancia y antecedentes.', 5),
  ('¿Qué medios de pago aceptan?', 'Aceptamos transferencia bancaria, débito y crédito. Algunos planes pueden solicitar un abono previo para confirmar la reserva.', 6),
  ('¿Cuánto dura cada sesión?', 'Depende del tratamiento. Las sesiones van desde 30 minutos hasta 90 minutos aproximadamente. Puedes ver la duración de cada servicio en nuestra sección de tratamientos.', 7),
  ('¿Necesito llevar algo a mi primera visita?', 'Solo trae tu confianza. Si tienes algún tratamiento previo o alergias, avísanos con anticipación para preparar todo.', 8);
