-- Crea las ubicaciones usadas por el inventario.
-- Puede ejecutarse varias veces sin duplicar registros.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM ubicacion u
        WHERE u.tipo::text = 'BODEGA'
    ) THEN
        INSERT INTO ubicacion (nombre, tipo, activo)
        VALUES ('Bodega Central', 'BODEGA', true);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM ubicacion u
        WHERE u.tipo::text = 'TIENDA'
    ) THEN
        INSERT INTO ubicacion (nombre, tipo, activo)
        VALUES ('Tienda / Punto de venta', 'TIENDA', true);
    END IF;
END $$;

-- Verificacion:
-- SELECT ubicacion_id, nombre, tipo, activo
-- FROM ubicacion
-- ORDER BY tipo;






-- Estructura para solicitudes de compra del catálogo.
-- Ejecutar una sola vez sobre la base de datos existente.

CREATE SEQUENCE IF NOT EXISTS pedido_numero_seq START 1;

CREATE TABLE IF NOT EXISTS pedido (
    pedido_id bigserial PRIMARY KEY,
    numero_pedido varchar(30) NOT NULL UNIQUE,
    cliente_nombre varchar(160) NOT NULL,
    cliente_telefono varchar(40) NOT NULL,
    cliente_correo varchar(160),
    cliente_nit varchar(40),
    observaciones text,
    tipo_entrega varchar(20) NOT NULL CHECK (tipo_entrega IN ('TIENDA', 'ENVIO')),
    tipo_pago varchar(30) NOT NULL CHECK (tipo_pago IN ('EFECTIVO', 'TRANSFERENCIA')),
    subtotal numeric(12, 2) NOT NULL CHECK (subtotal >= 0),
    costo_envio numeric(12, 2) NOT NULL DEFAULT 0 CHECK (costo_envio >= 0),
    total numeric(12, 2) NOT NULL CHECK (total >= 0),
    estado varchar(30) NOT NULL DEFAULT 'SOLICITUD_RECIBIDA',
    creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
    detalle_pedido_id bigserial PRIMARY KEY,
    pedido_id bigint NOT NULL REFERENCES pedido(pedido_id) ON DELETE CASCADE,
    producto_id integer NOT NULL REFERENCES producto(producto_id),
    cantidad numeric(12, 2) NOT NULL CHECK (cantidad > 0),
    precio_unitario numeric(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal numeric(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS entrega_pedido (
    entrega_pedido_id bigserial PRIMARY KEY,
    pedido_id bigint NOT NULL UNIQUE REFERENCES pedido(pedido_id) ON DELETE CASCADE,
    departamento varchar(100),
    municipio varchar(100),
    direccion_exacta text,
    referencia text,
    destinatario_nombre varchar(160),
    destinatario_telefono varchar(40),
    observaciones text
);

CREATE TABLE IF NOT EXISTS pago_pedido (
    pago_pedido_id bigserial PRIMARY KEY,
    pedido_id bigint NOT NULL UNIQUE REFERENCES pedido(pedido_id) ON DELETE CASCADE,
    tipo_pago varchar(30) NOT NULL CHECK (tipo_pago IN ('EFECTIVO', 'TRANSFERENCIA')),
    estado varchar(30) NOT NULL DEFAULT 'PAGO_EN_REVISION',
    validacion_desde timestamptz,
    banco varchar(120),
    numero_referencia varchar(120),
    monto_transferido numeric(12, 2),
    fecha_transferencia date,
    comprobante text
);

ALTER TABLE pago_pedido
    ADD COLUMN IF NOT EXISTS validacion_desde timestamptz;

CREATE INDEX IF NOT EXISTS detalle_pedido_producto_idx
    ON detalle_pedido(producto_id);

CREATE INDEX IF NOT EXISTS pedido_estado_idx
    ON pedido(estado);
