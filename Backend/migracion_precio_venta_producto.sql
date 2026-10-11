-- Agrega el precio de venta directamente al producto.
-- Ejecutar una sola vez sobre la base de datos existente.

ALTER TABLE producto
    ADD COLUMN IF NOT EXISTS precio_venta numeric(12, 2) NOT NULL DEFAULT 0;

UPDATE producto p
SET precio_venta = precios.precio_venta
FROM (
    SELECT DISTINCT ON (pp.producto_id)
        pp.producto_id,
        pp.precio_venta
    FROM precio_producto pp
    LEFT JOIN tipo_cliente tc
        ON tc.tipo_cliente_id = pp.tipo_cliente_id
    WHERE pp.activo = true
    ORDER BY
        pp.producto_id,
        CASE
            WHEN LOWER(TRIM(tc.nombre)) = 'minorista' THEN 0
            ELSE 1
        END,
        pp.cantidad_minima ASC
) precios
WHERE p.producto_id = precios.producto_id;