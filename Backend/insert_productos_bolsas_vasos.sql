-- Inserta los productos solicitados: 5 bolsas y 5 vasos.
-- Si en tu base los nombres de categoría o unidad difieren, ajusta los textos en WHERE.

-- 1) BOLSAS
INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    peso_lbs,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'BOL-001',
    'Bolsa 1 lbs',
    'Bolsa plástica de 1 libra.',
    1,
    1,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Bolsas'
  AND (um.nombre ILIKE '%libra%' OR um.simbolo ILIKE 'lb%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Bolsa 1 lbs'
  )
LIMIT 1;

INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    peso_lbs,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'BOL-002',
    'Bolsa 2 lbs',
    'Bolsa plástica de 2 libras.',
    2,
    2,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Bolsas'
  AND (um.nombre ILIKE '%libra%' OR um.simbolo ILIKE 'lb%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Bolsa 2 lbs'
  )
LIMIT 1;

INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    peso_lbs,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'BOL-003',
    'Bolsa 3 lbs',
    'Bolsa plástica de 3 libras.',
    3,
    3,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Bolsas'
  AND (um.nombre ILIKE '%libra%' OR um.simbolo ILIKE 'lb%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Bolsa 3 lbs'
  )
LIMIT 1;

INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    peso_lbs,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'BOL-005',
    'Bolsa 5 lbs',
    'Bolsa plástica de 5 libras.',
    5,
    5,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Bolsas'
  AND (um.nombre ILIKE '%libra%' OR um.simbolo ILIKE 'lb%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Bolsa 5 lbs'
  )
LIMIT 1;

INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    peso_lbs,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'BOL-010',
    'Bolsa 10 lbs',
    'Bolsa plástica de 10 libras.',
    10,
    10,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Bolsas'
  AND (um.nombre ILIKE '%libra%' OR um.simbolo ILIKE 'lb%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Bolsa 10 lbs'
  )
LIMIT 1;

-- 2) VASOS
INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    volumen_oz,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'VAS-008',
    'Vaso 8 onz',
    'Vaso desechable de 8 onzas.',
    8,
    8,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Vasos'
  AND (um.nombre ILIKE '%onza%' OR um.simbolo ILIKE 'oz%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Vaso 8 onz'
  )
LIMIT 1;

INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    volumen_oz,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'VAS-010',
    'Vaso 10 onz',
    'Vaso desechable de 10 onzas.',
    10,
    10,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Vasos'
  AND (um.nombre ILIKE '%onza%' OR um.simbolo ILIKE 'oz%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Vaso 10 onz'
  )
LIMIT 1;

INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    volumen_oz,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'VAS-012',
    'Vaso 12 onz',
    'Vaso desechable de 12 onzas.',
    12,
    12,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Vasos'
  AND (um.nombre ILIKE '%onza%' OR um.simbolo ILIKE 'oz%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Vaso 12 onz'
  )
LIMIT 1;

INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    volumen_oz,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'VAS-014',
    'Vaso 14 onz',
    'Vaso desechable de 14 onzas.',
    14,
    14,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Vasos'
  AND (um.nombre ILIKE '%onza%' OR um.simbolo ILIKE 'oz%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Vaso 14 onz'
  )
LIMIT 1;

INSERT INTO producto (
    sku,
    nombre,
    descripcion,
    volumen_oz,
    numero_talla,
    categoria_id,
    unidad_medida_id,
    estado
)
SELECT
    'VAS-016',
    'Vaso 16 onz',
    'Vaso desechable de 16 onzas.',
    16,
    16,
    c.categoria_id,
    um.unidad_id,
    'ACTIVO'
FROM categoria c
CROSS JOIN unidad_medida um
WHERE c.nombre = 'Vasos'
  AND (um.nombre ILIKE '%onza%' OR um.simbolo ILIKE 'oz%')
  AND NOT EXISTS (
      SELECT 1 FROM producto p
      WHERE p.nombre = 'Vaso 16 onz'
  )
LIMIT 1;

-- Verificación rápida:
-- SELECT producto_id, sku, nombre, peso_lbs, volumen_oz, numero_talla, estado
-- FROM producto
-- WHERE nombre IN (
--   'Bolsa 1 lbs', 'Bolsa 2 lbs', 'Bolsa 3 lbs', 'Bolsa 5 lbs', 'Bolsa 10 lbs',
--   'Vaso 8 onz', 'Vaso 10 onz', 'Vaso 12 onz', 'Vaso 14 onz', 'Vaso 16 onz'
-- );
