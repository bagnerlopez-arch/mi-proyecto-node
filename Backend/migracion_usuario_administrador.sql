-- Crea o actualiza la cuenta usada por el login y por la eliminacion protegida.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE usuario
SET
        usuario = 'admin',
        email = 'admin@sancristobal.com',
        password_hash = crypt('admin123', gen_salt('bf')),
        estado = 'ACTIVO'::estado_usuario_enum,
        actualizado_en = CURRENT_TIMESTAMP
WHERE LOWER(usuario) = 'admin_prueba'
    AND NOT EXISTS (
            SELECT 1
            FROM usuario existente
            WHERE LOWER(existente.usuario) = 'admin'
    );

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
    crypt('admin123', gen_salt('bf')),
    'ACTIVO'::estado_usuario_enum,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM rol r
WHERE LOWER(r.nombre) = 'administrador'
  AND NOT EXISTS (
      SELECT 1
      FROM usuario u
        WHERE LOWER(u.usuario) = 'admin'
            OR LOWER(u.email) = 'admin@sancristobal.com'
  );

UPDATE usuario u
SET
    password_hash = crypt('admin123', gen_salt('bf')),
    estado = 'ACTIVO'::estado_usuario_enum,
    rol_id = r.rol_id,
    actualizado_en = CURRENT_TIMESTAMP
FROM rol r
WHERE LOWER(r.nombre) = 'administrador'
    AND LOWER(u.usuario) = 'admin';

SELECT
    u.usuario,
    u.estado,
    r.nombre AS rol
FROM usuario u
INNER JOIN rol r ON r.rol_id = u.rol_id
WHERE LOWER(u.usuario) = 'admin';
