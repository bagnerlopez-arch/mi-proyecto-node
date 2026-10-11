-- Inserta 5 productos de bolsa por tamaño en libras.
-- Ajusta el nombre de la categoría y de la unidad si en tu base de datos no son exactamente:
--   categoria.nombre = 'Bolsas'
--   unidad_medida.nombre = 'Libras' o unidad_medida.simbolo = 'lb'

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
LIMIT 1;

-- Verificación rápida:
-- SELECT producto_id, sku, nombre, peso_lbs, numero_talla, estado
-- FROM producto
-- WHERE sku IN ('BOL-001','BOL-002','BOL-003','BOL-005','BOL-010');


-- Habilitar pgcrypto para cifrar la contraseña
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- Crear usuario Administrador de prueba
INSERT INTO usuario (
    rol_id,
    nombre,
    usuario,
    email,
    password_hash,
    estado,
    ultimo_acceso,
    creado_en,
    actualizado_en
)
SELECT
    r.rol_id,
    'Administrador',
    'admin',
    'admin@sancristobal.com',
    crypt(
        'admin123',
        gen_salt('bf')
    ),
    'ACTIVO'::estado_usuario_enum,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM rol r
WHERE LOWER(r.nombre) = 'administrador'
AND NOT EXISTS (
    SELECT 1
    FROM usuario u
     WHERE u.usuario = 'admin'
         OR u.email = 'admin@sancristobal.com'
)
RETURNING
    usuario_id,
    rol_id,
    nombre,
    usuario,
    email,
    estado;