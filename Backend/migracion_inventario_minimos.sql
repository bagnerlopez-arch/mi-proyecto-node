-- Agrega los límites de inventario por ubicación.
-- Ejecutar una sola vez en PostgreSQL.

ALTER TABLE inventario_ubicacion
    ADD COLUMN IF NOT EXISTS stock_minimo numeric(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stock_maximo numeric(12, 2) NOT NULL DEFAULT 0;