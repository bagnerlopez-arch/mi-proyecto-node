-- Inserta 5 productos de vasos por tamaño en onzas.
-- Ajusta el nombre de la categoría y de la unidad si en tu base no son exactamente:
--   categoria.nombre = 'Vasos'
--   unidad_medida.nombre = 'Onzas' o unidad_medida.simbolo = 'oz'

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
LIMIT 1;

-- Verificación rápida:
-- SELECT producto_id, sku, nombre, volumen_oz, numero_talla, estado
-- FROM producto
-- WHERE sku IN ('VAS-008','VAS-010','VAS-012','VAS-014','VAS-016');
