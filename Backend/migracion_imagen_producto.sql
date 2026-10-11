-- Permite guardar la imagen del producto como data URL.
-- Ejecutar una sola vez sobre la base de datos existente.

ALTER TABLE producto
    ALTER COLUMN imagen_url TYPE text
    USING imagen_url::text;
