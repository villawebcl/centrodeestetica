-- Eliminar duplicados de profesionales (por nombre)
DELETE FROM profesionales
WHERE id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY lower(trim(nombre)) ORDER BY activo DESC, id ASC) AS rn
    FROM profesionales
  ) sub
  WHERE rn > 1
);

-- Eliminar duplicados de promociones (por nombre)
DELETE FROM promociones
WHERE id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY lower(trim(nombre)) ORDER BY activo DESC, id ASC) AS rn
    FROM promociones
  ) sub
  WHERE rn > 1
);
