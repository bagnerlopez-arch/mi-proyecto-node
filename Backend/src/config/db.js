import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Si PostgreSQL no responde,
    // mostrará error después de 5 segundos.
    connectionTimeoutMillis: 5000
});

pool.on('error', (error) => {
    console.error(
        '❌ Error inesperado en PostgreSQL:',
        error.message
    );
});

export async function comprobarConexion() {

    console.log('');
    console.log('Intentando conectar con PostgreSQL...');

    const resultado = await pool.query(`
        SELECT
            current_database() AS base_datos,
            current_user AS usuario,
            NOW() AS fecha_servidor
    `);

    console.log('');
    console.log('✅ PostgreSQL conectado correctamente');

    console.log(
        'Base de datos:',
        resultado.rows[0].base_datos
    );

    console.log(
        'Usuario:',
        resultado.rows[0].usuario
    );

    console.log(
        'Fecha servidor:',
        resultado.rows[0].fecha_servidor
    );

    await asegurarEsquemaPedidos();

}


async function asegurarEsquemaPedidos() {

    await pool.query(`
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

        CREATE SEQUENCE IF NOT EXISTS solicitud_bodega_numero_seq START 1;

        CREATE TABLE IF NOT EXISTS solicitud_bodega (
            solicitud_id bigserial PRIMARY KEY,
            numero_solicitud varchar(30) NOT NULL UNIQUE,
            productos jsonb NOT NULL,
            ubicacion_destino varchar(120) NOT NULL DEFAULT 'Negocio Local',
            prioridad varchar(20) NOT NULL DEFAULT 'Media',
            estado varchar(30) NOT NULL DEFAULT 'Pendiente',
            solicitante varchar(160) NOT NULL,
            notas text,
            enviado boolean NOT NULL DEFAULT true,
            aceptado boolean NOT NULL DEFAULT false,
            creado_en timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE solicitud_bodega
            ADD COLUMN IF NOT EXISTS enviado boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS aceptado boolean NOT NULL DEFAULT false;

        ALTER TABLE IF EXISTS detalle_venta
            ADD COLUMN IF NOT EXISTS vendedor varchar(160);

        CREATE INDEX IF NOT EXISTS solicitud_bodega_estado_idx
            ON solicitud_bodega(estado);

        ALTER TABLE pago_pedido
            ADD COLUMN IF NOT EXISTS validacion_desde timestamptz;

        CREATE INDEX IF NOT EXISTS detalle_pedido_producto_idx
            ON detalle_pedido(producto_id);

        CREATE INDEX IF NOT EXISTS pedido_estado_idx
            ON pedido(estado);

        ALTER TABLE producto
            ALTER COLUMN imagen_url TYPE text
            USING imagen_url::text;

        ALTER TABLE producto
            ADD COLUMN IF NOT EXISTS precio_mayorista numeric(12, 2) NOT NULL DEFAULT 0;
    `);

    console.log('Esquema de pedidos verificado correctamente.');
    console.log('Campo de imagen del producto verificado como TEXT.');

}