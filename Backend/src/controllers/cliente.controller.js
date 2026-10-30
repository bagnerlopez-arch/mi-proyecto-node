import { pool } from '../config/db.js';
import { negocio } from '../config/negocio.js';


// ======================================================
// OBTENER USUARIOS
// ======================================================

export async function obtenerUsuarios(req, res) {

    try {

        const resultado = await pool.query(`
            SELECT
                u.usuario_id AS id,
                u.usuario,
                u.nombre,
                u.email AS correo,
                INITCAP(r.nombre) AS rol,
                INITCAP(u.estado::text) AS estado,
                COALESCE(
                    TO_CHAR(u.ultimo_acceso, 'DD/MM/YYYY HH24:MI'),
                    'Nunca'
                ) AS acceso,
                UPPER(LEFT(COALESCE(u.nombre, u.usuario), 1)) AS inicial,
                CASE
                    WHEN LOWER(r.nombre) = 'administrador' THEN 'azul'
                    WHEN LOWER(r.nombre) = 'bodeguero' THEN 'morado'
                    ELSE 'verde'
                END AS color
            FROM usuario u
            INNER JOIN rol r
                ON r.rol_id = u.rol_id
            ORDER BY u.usuario_id ASC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(
            'Error al consultar usuarios:',
            error
        );

        res.status(500).json({
            error:
                'No fue posible consultar los usuarios.'
        });

    }

}


// ======================================================
// CREAR USUARIO
// ======================================================

export async function crearUsuario(req, res) {

    const {
        usuario,
        nombre,
        correo,
        password,
        rol,
        estado = 'ACTIVO'
    } = req.body;

    if (!usuario || !nombre || !correo || !password || !rol) {
        return res.status(400).json({
            error: 'Completa todos los campos obligatorios.'
        });
    }

    if (typeof rol !== 'string' || !['administrador', 'bodeguero', 'vendedor'].includes(rol.trim().toLowerCase())) {
        return res.status(400).json({
            error: 'El rol debe ser Administrador, Bodeguero o Vendedor.'
        });
    }

    try {

        const resultado = await pool.query(`
            INSERT INTO usuario (
                rol_id,
                nombre,
                usuario,
                email,
                password_hash,
                estado,
                creado_en,
                actualizado_en
            )
            SELECT
                r.rol_id,
                $2,
                $1,
                $3,
                crypt($4, gen_salt('bf')),
                UPPER($6)::estado_usuario_enum,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            FROM rol r
            WHERE LOWER(r.nombre) = LOWER($5)
            RETURNING usuario_id AS id, usuario, nombre, email AS correo,
                INITCAP($5) AS rol, INITCAP(estado::text) AS estado,
                'Nunca' AS acceso,
                UPPER(LEFT(COALESCE(nombre, usuario), 1)) AS inicial,
                CASE WHEN LOWER($5) = 'administrador' THEN 'azul'
                    WHEN LOWER($5) = 'bodeguero' THEN 'morado'
                    ELSE 'verde' END AS color
        `, [usuario.trim(), nombre.trim(), correo.trim(), password, rol, estado]);

        if (resultado.rowCount === 0) {
            return res.status(400).json({
                error: 'El rol seleccionado no existe.'
            });
        }

                    const ubicacion = 'BODEGA'; // Default location
        res.status(201).json(resultado.rows[0]);

    } catch (error) {

        console.error('Error al crear usuario:', error);

        res.status(error.code === '23505' ? 409 : 500).json({
            error: error.code === '23505'
                ? 'El usuario o correo ya está registrado.'
                : 'No fue posible crear el usuario.'
        });

    }

}


// ======================================================
// INICIAR SESIÓN
// ======================================================

export async function autenticarUsuario(req, res) {

    const { usuario, password } = req.body;

    if (!usuario?.trim() || !password) {
        return res.status(400).json({
            error: 'Ingresa tu usuario y contraseña.'
        });
    }

    try {

        const resultado = await pool.query(`
            SELECT
                u.usuario_id AS id,
                u.usuario,
                u.nombre,
                u.email AS correo,
                UPPER(r.nombre) AS rol
            FROM usuario u
            INNER JOIN rol r
                ON r.rol_id = u.rol_id
            WHERE LOWER(BTRIM(u.usuario)) = LOWER(BTRIM($1))
              AND u.estado::text = 'ACTIVO'
              AND u.password_hash = crypt($2, u.password_hash)
        `, [usuario, password]);

        if (resultado.rowCount === 0) {
            return res.status(401).json({
                error: 'Usuario o contraseña incorrectos.'
            });
        }

        const usuarioAutenticado = resultado.rows[0];

        await pool.query(`
            UPDATE usuario
            SET ultimo_acceso = CURRENT_TIMESTAMP
            WHERE usuario_id = $1
        `, [usuarioAutenticado.id]);

        res.json({
            usuario: usuarioAutenticado
        });

    } catch (error) {

        console.error('Error al iniciar sesión:', error);

        res.status(500).json({
            error: 'No fue posible iniciar sesión.'
        });

    }

}


// ======================================================
// EDITAR USUARIO
// ======================================================

export async function editarUsuario(req, res) {

    const { id } = req.params;
    const {
        usuario,
        nombre,
        correo,
        password,
        rol,
        estado
    } = req.body;

    if (!usuario || !nombre || !correo || !rol || !estado) {
        return res.status(400).json({
            error: 'Completa todos los campos obligatorios.'
        });
    }

    if (typeof rol !== 'string' || !['administrador', 'bodeguero', 'vendedor'].includes(rol.trim().toLowerCase())) {
        return res.status(400).json({
            error: 'El rol debe ser Administrador, Bodeguero o Vendedor.'
        });
    }

    try {

        const resultado = await pool.query(`
            UPDATE usuario u
            SET
                rol_id = COALESCE(
                    (
                        SELECT r.rol_id
                        FROM rol r
                        WHERE LOWER(r.nombre) = LOWER($5)
                    ),
                    u.rol_id
                ),
                nombre = $2,
                usuario = $1,
                email = $3,
                password_hash = CASE
                    WHEN NULLIF($4, '') IS NULL THEN u.password_hash
                    ELSE crypt($4, gen_salt('bf'))
                END,
                estado = UPPER($6)::estado_usuario_enum,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE u.usuario_id = $7
            RETURNING u.usuario_id AS id, u.usuario, u.nombre,
                u.email AS correo, INITCAP($5) AS rol,
                INITCAP(u.estado::text) AS estado,
                COALESCE(TO_CHAR(u.ultimo_acceso, 'DD/MM/YYYY HH24:MI'), 'Nunca') AS acceso,
                UPPER(LEFT(COALESCE(u.nombre, u.usuario), 1)) AS inicial,
                CASE WHEN LOWER($5) = 'administrador' THEN 'azul'
                    WHEN LOWER($5) = 'bodeguero' THEN 'morado'
                    ELSE 'verde' END AS color
        `, [usuario.trim(), nombre.trim(), correo.trim(), password || '', rol, estado, id]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                error: 'El usuario no existe.'
            });

                        const inventario = await pool.query(`
                            INSERT INTO inventario_ubicacion (
                                producto_id,
                                ubicacion_id,
                                stock_actual,
                                stock_reservado
                            )
                            SELECT
                                $1,
                                ubicacion_id,
                                0,
                                0
                            FROM ubicacion
                            WHERE tipo = $2
                              AND activo = true
                            LIMIT 1
                            RETURNING producto_id
                        `, [resultado.rows[0].producto_id, String(ubicacion).toUpperCase()]);

                        if (inventario.rowCount === 0) {
                            return res.status(400).json({
                                error: 'No existe una ubicación activa de tipo Bodega o Tienda.'
                            });
                        }
        }

        res.json(resultado.rows[0]);

    } catch (error) {

        console.error('Error al editar usuario:', error);

        res.status(error.code === '23505' ? 409 : 500).json({
            error: error.code === '23505'
                ? 'El usuario o correo ya está registrado.'
                : 'No fue posible editar el usuario.'
        });

    }

}


// ======================================================
// ELIMINAR USUARIO
// ======================================================

export async function eliminarUsuario(req, res) {

    try {

        const resultado = await pool.query(
            'DELETE FROM usuario WHERE usuario_id = $1 RETURNING usuario_id',
            [req.params.id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                error: 'El usuario no existe.'
            });
        }

        res.status(204).send();

    } catch (error) {

        console.error('Error al eliminar usuario:', error);

        res.status(500).json({
            error: 'No fue posible eliminar el usuario.'
        });

    }

}


// ======================================================
// OBTENER CATEGORÍAS
// ======================================================

export async function obtenerCategorias(req, res) {

    try {

        const resultado = await pool.query(`
            SELECT
                categoria_id,
                nombre,
                descripcion
            FROM categoria
            ORDER BY nombre ASC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(
            'Error al consultar categorías:',
            error
        );

        res.status(500).json({
            error:
                'No fue posible consultar las categorías.'
        });

    }

}


// ======================================================
// OBTENER CATÁLOGO
// ======================================================

export async function obtenerProductos(req, res) {

    try {

        const buscar =
            String(req.query.buscar || '')
                .trim();

        const incluirInactivos =
            String(req.query.todos || '').toLowerCase() === 'true';

        let categoria = null;

        if (req.query.categoria) {

            categoria =
                Number(req.query.categoria);

            if (
                !Number.isInteger(categoria) ||
                categoria <= 0
            ) {

                return res.status(400).json({
                    error:
                        'La categoría indicada no es válida.'
                });

            }

        }


        const consulta = `
            SELECT
                p.producto_id,
                p.nombre,
                p.estado,
                p.descripcion,
                p.imagen_url,
                p.ancho_pulgadas,
                p.largo_pulgadas,
                p.calibre_milipulgadas,
                p.divisiones,
                p.numero_talla,
                p.forma,
                p.material,
                p.color,
                p.volumen_oz,
                COALESCE(
                    NULLIF(to_jsonb(p)->>'precio_venta', '')::numeric,
                    precio.precio_venta,
                    0
                ) AS precio_venta,
                COALESCE(p.precio_mayorista, 0) AS precio_mayorista,

                c.categoria_id,
                c.nombre AS categoria,

                um.nombre AS unidad_medida,
                um.simbolo AS unidad_simbolo,

                COALESCE((
                    SELECT SUM(iu.stock_actual - iu.stock_reservado)
                    FROM inventario_ubicacion iu
                    INNER JOIN ubicacion u
                        ON u.ubicacion_id = iu.ubicacion_id
                    WHERE iu.producto_id = p.producto_id
                      AND u.tipo::text = 'BODEGA'
                      AND u.activo = true
                ), 0) AS bodega_stock,

                                COALESCE((
                                        SELECT iu.stock_minimo
                                        FROM inventario_ubicacion iu
                                        INNER JOIN ubicacion u
                                                ON u.ubicacion_id = iu.ubicacion_id
                                        WHERE iu.producto_id = p.producto_id
                                            AND u.tipo::text = 'BODEGA'
                                            AND u.activo = true
                                        LIMIT 1
                                ), 0) AS bodega_minimo,

                                COALESCE((
                                        SELECT iu.stock_maximo
                                        FROM inventario_ubicacion iu
                                        INNER JOIN ubicacion u
                                                ON u.ubicacion_id = iu.ubicacion_id
                                        WHERE iu.producto_id = p.producto_id
                                            AND u.tipo::text = 'BODEGA'
                                            AND u.activo = true
                                        LIMIT 1
                                ), 0) AS bodega_maximo,

                EXISTS (
                    SELECT 1
                    FROM inventario_ubicacion iu
                    INNER JOIN ubicacion u
                        ON u.ubicacion_id = iu.ubicacion_id
                    WHERE iu.producto_id = p.producto_id
                      AND u.tipo::text = 'BODEGA'
                      AND u.activo = true
                ) AS bodega_asignado,

                COALESCE((
                    SELECT SUM(iu.stock_actual - iu.stock_reservado)
                    FROM inventario_ubicacion iu
                    INNER JOIN ubicacion u
                        ON u.ubicacion_id = iu.ubicacion_id
                    WHERE iu.producto_id = p.producto_id
                      AND u.tipo::text = 'TIENDA'
                      AND u.activo = true
                ), 0) AS tienda_stock,

                                COALESCE((
                                        SELECT iu.stock_minimo
                                        FROM inventario_ubicacion iu
                                        INNER JOIN ubicacion u
                                                ON u.ubicacion_id = iu.ubicacion_id
                                        WHERE iu.producto_id = p.producto_id
                                            AND u.tipo::text = 'TIENDA'
                                            AND u.activo = true
                                        LIMIT 1
                                ), 0) AS tienda_minimo,

                                COALESCE((
                                        SELECT iu.stock_maximo
                                        FROM inventario_ubicacion iu
                                        INNER JOIN ubicacion u
                                                ON u.ubicacion_id = iu.ubicacion_id
                                        WHERE iu.producto_id = p.producto_id
                                            AND u.tipo::text = 'TIENDA'
                                            AND u.activo = true
                                        LIMIT 1
                                ), 0) AS tienda_maximo,

                EXISTS (
                    SELECT 1
                    FROM inventario_ubicacion iu
                    INNER JOIN ubicacion u
                        ON u.ubicacion_id = iu.ubicacion_id
                    WHERE iu.producto_id = p.producto_id
                      AND u.tipo::text = 'TIENDA'
                      AND u.activo = true
                ) AS tienda_asignado,

                CASE

                    WHEN EXISTS (
                        SELECT 1

                        FROM inventario_ubicacion iu

                        INNER JOIN ubicacion u
                            ON u.ubicacion_id =
                               iu.ubicacion_id

                        WHERE
                            iu.producto_id =
                                p.producto_id

                            AND u.tipo = 'TIENDA'

                            AND u.activo = true

                            AND (
                                iu.stock_actual -
                                iu.stock_reservado
                            ) > 0
                    )

                    THEN 'TIENDA'


                    WHEN EXISTS (
                        SELECT 1

                        FROM inventario_ubicacion iu

                        INNER JOIN ubicacion u
                            ON u.ubicacion_id =
                               iu.ubicacion_id

                        WHERE
                            iu.producto_id =
                                p.producto_id

                            AND u.tipo = 'BODEGA'

                            AND u.activo = true

                            AND (
                                iu.stock_actual -
                                iu.stock_reservado
                            ) > 0
                    )

                    THEN 'BODEGA'


                    ELSE 'AGOTADO'

                END AS disponibilidad


            FROM producto p


            INNER JOIN categoria c
                ON c.categoria_id =
                   p.categoria_id


            INNER JOIN unidad_medida um
                ON um.unidad_id =
                   p.unidad_medida_id


            LEFT JOIN LATERAL (

                SELECT
                    pp.precio_venta

                FROM precio_producto pp

                INNER JOIN tipo_cliente tc
                    ON tc.tipo_cliente_id =
                       pp.tipo_cliente_id

                WHERE
                    pp.producto_id =
                        p.producto_id

                    AND pp.activo = true

                    AND tc.activo = true

                ORDER BY

                    CASE
                        WHEN UPPER(tc.nombre) = 'MINORISTA'
                        THEN 0
                        ELSE 1
                    END,

                    pp.cantidad_minima ASC

                LIMIT 1

            ) precio ON true


            WHERE

                ($3 = true OR p.estado = 'ACTIVO')

                AND (

                    $1 = ''

                    OR p.nombre
                        ILIKE '%' || $1 || '%'

                    OR c.nombre
                        ILIKE '%' || $1 || '%'

                )

                AND (

                    $2::int IS NULL

                    OR p.categoria_id = $2

                )

            ORDER BY
                p.nombre ASC
        `;


        const resultado =
            await pool.query(
                consulta,
                [
                    buscar,
                    categoria,
                    incluirInactivos
                ]
            );


        res.json(
            resultado.rows
        );


    } catch (error) {

        console.error(
            'Error consultando catálogo:',
            error
        );


        res.status(500).json({
            error:
                'No fue posible consultar el catálogo.'
        });

    }

}


// ======================================================
// OBTENER UN PRODUCTO
// ======================================================

export async function obtenerProductoPorId(
    req,
    res
) {

    try {

        const productoId =
            Number(req.params.id);


        if (
            !Number.isInteger(productoId) ||
            productoId <= 0
        ) {

            return res.status(400).json({
                error:
                    'El identificador del producto no es válido.'
            });

        }


        const resultado =
            await pool.query(`

                SELECT
                    p.producto_id,
                    p.nombre,
                    p.descripcion,
                    p.imagen_url,
                    p.ancho_pulgadas,
                    p.largo_pulgadas,
                    p.calibre_milipulgadas,
                    p.divisiones,
                    p.numero_talla,
                    p.forma,
                    p.color,
                    p.volumen_oz,
                    p.material,

                    c.nombre
                        AS categoria,

                    um.nombre
                        AS unidad_medida

                FROM producto p

                INNER JOIN categoria c
                    ON c.categoria_id =
                       p.categoria_id

                INNER JOIN unidad_medida um
                    ON um.unidad_id =
                       p.unidad_medida_id

                WHERE
                    p.producto_id = $1

                    AND
                    p.estado = 'ACTIVO'

            `, [productoId]);


        if (
            resultado.rowCount === 0
        ) {

            return res.status(404).json({
                error:
                    'Producto no encontrado.'
            });

        }


        res.json(
            resultado.rows[0]
        );


    } catch (error) {

        console.error(
            'Error consultando producto:',
            error
        );


        res.status(500).json({
            error:
                'No fue posible consultar el producto.'
        });

    }

}


// ======================================================
// INFORMACIÓN DEL NEGOCIO
// ======================================================

export function obtenerInformacionNegocio(
    req,
    res
) {

    res.json(negocio);

}


// ======================================================
// CREAR PRODUCTO
// ======================================================

export async function crearProducto(req, res) {

    const {
        categoria_id,
        unidad_medida_id,
        nombre,
        descripcion,
        imagen_url,
        ancho_pulgadas,
        largo_pulgadas,
        calibre_milipulgadas,
        divisiones,
        numero_talla,
        forma,
        color,
        volumen_oz,
        material,
        precio_costo,
        precio_mayorista = 0,
        ubicacion = 'BODEGA',
        stock_actual = 0,
        stock_minimo = 0,
        stock_maximo = 0,
        estado = 'ACTIVO'
    } = req.body;

    if (
        !categoria_id
        || !unidad_medida_id
        || !nombre
        || precio_costo === undefined
        || precio_costo === null
        || Number(precio_costo) < 0
        || !Number.isFinite(Number(precio_mayorista))
        || Number(precio_mayorista) < 0
    ) {
        return res.status(400).json({
            error: 'Completa los campos obligatorios del producto.'
        });
    }

    if (!['BODEGA', 'TIENDA'].includes(String(ubicacion).toUpperCase())) {
        return res.status(400).json({
            error: 'La ubicación seleccionada no es válida.'
        });
    }

    if (
        imagen_url
        && (
            !String(imagen_url).startsWith('data:image/')
            || String(imagen_url).length > 3 * 1024 * 1024
        )
    ) {
        return res.status(400).json({
            error: 'La imagen debe ser JPG, PNG o WEBP y no superar 2 MB.'
        });
    }

    try {

        const resultado = await pool.query(`
            INSERT INTO producto (
                categoria_id,
                unidad_medida_id,
                nombre,
                descripcion,
                imagen_url,
                ancho_pulgadas,
                largo_pulgadas,
                calibre_milipulgadas,
                divisiones,
                numero_talla,
                forma,
                color,
                volumen_oz,
                material,
                precio_venta,
                precio_mayorista,
                estado
            )
                        SELECT
                                c.categoria_id,
                                um.unidad_id,
                                $3, $4, $5, $6, $7, $8,
                                $9, $10, $11, $12, $13, $14, $15, $16,
                                UPPER($17)::estado_producto_enum
            FROM categoria c
            CROSS JOIN unidad_medida um
            WHERE (
                regexp_replace(
                    LOWER(TRIM(c.nombre)),
                    '[^a-z0-9]', '', 'g'
                ) = regexp_replace(
                    LOWER(TRIM($1)),
                    '[^a-z0-9]', '', 'g'
                )
                OR (
                    LOWER(TRIM($1)) = 'bolsas y empaques'
                    AND LOWER(TRIM(c.nombre)) = 'bolsas'
                )
            )
            AND (
                regexp_replace(
                    LOWER(TRIM(um.nombre)),
                    's$', ''
                ) = regexp_replace(
                    LOWER(TRIM($2)),
                    's$', ''
                )
                OR LOWER(COALESCE(um.simbolo, '')) = LOWER(TRIM($2))
            )
            RETURNING producto_id, nombre, estado, precio_venta, precio_mayorista
        `, [
            categoria_id,
            unidad_medida_id,
            nombre.trim(),
            descripcion || null,
            imagen_url || null,
            ancho_pulgadas ?? null,
            largo_pulgadas ?? null,
            calibre_milipulgadas ?? null,
            divisiones ?? null,
            numero_talla || null,
            forma || null,
            color || null,
            volumen_oz ?? null,
            material || null,
            Number(precio_costo),
            Number(precio_mayorista),
            estado
        ]);

        if (resultado.rowCount === 0) {
            return res.status(400).json({
                error: 'La categoría o unidad seleccionada no existe en la base de datos.'
            });
        }

        const inventario = await pool.query(`
            INSERT INTO inventario_ubicacion (
                producto_id,
                ubicacion_id,
                stock_actual,
                stock_reservado,
                stock_minimo,
                stock_maximo
            )
            SELECT
                $1,
                ubicacion_id,
                $3,
                0,
                $4,
                $5
            FROM ubicacion
            WHERE tipo::text = $2
              AND activo = true
            LIMIT 1
            RETURNING producto_id
        `, [
            resultado.rows[0].producto_id,
            String(ubicacion).toUpperCase(),
            stock_actual,
            stock_minimo,
            stock_maximo
        ]);

        if (inventario.rowCount === 0) {
            return res.status(400).json({
                error: 'No existe una ubicación activa de tipo Bodega o Tienda.'
            });
        }

        res.status(201).json(resultado.rows[0]);

    } catch (error) {

        console.error('Error al crear producto:', error);

        res.status(error.code === '23505' ? 409 : 500).json({
            error: error.code === '23505'
                ? 'El producto ya está registrado.'
                : `No fue posible guardar el producto: ${error.message}`
        });

    }

}


// ======================================================
// CREAR SOLICITUD DE COMPRA
// ======================================================

export async function crearPedido(req, res) {

    const {
        cliente,
        entrega,
        pago,
        items
    } = req.body;

    if (!cliente?.nombre?.trim() || !cliente?.telefono?.trim()) {
        return res.status(400).json({
            error: 'El nombre y teléfono del cliente son obligatorios.'
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: 'El carrito no contiene productos.'
        });
    }

    if (!['TIENDA', 'ENVIO'].includes(entrega?.tipo)) {
        return res.status(400).json({
            error: 'El tipo de entrega no es válido.'
        });
    }

    if (!['EFECTIVO', 'TRANSFERENCIA'].includes(pago?.tipo)) {
        return res.status(400).json({
            error: 'La forma de pago no es válida.'
        });
    }

    if (entrega.tipo === 'ENVIO' && (
        !entrega.departamento?.trim()
        || !entrega.municipio?.trim()
        || !entrega.direccion?.trim()
        || !entrega.destinatarioNombre?.trim()
        || !entrega.destinatarioTelefono?.trim()
    )) {
        return res.status(400).json({
            error: 'Completa los datos obligatorios del envío.'
        });
    }

    if (pago.tipo === 'TRANSFERENCIA' && (
        !pago.banco?.trim()
        || !pago.referencia?.trim()
        || pago.monto === undefined
        || !Number.isFinite(Number(pago.monto))
        || Number(pago.monto) < 0
        || !pago.fecha
        || !pago.comprobante
    )) {
        return res.status(400).json({
            error: 'Completa los datos y comprobante de la transferencia.'
        });
    }

    const conexion = await pool.connect();

    try {

        await conexion.query('BEGIN');

        const ids = items.map(item => Number(item.producto_id));

        if (ids.some(id => !Number.isInteger(id) || id <= 0)) {
            throw new Error('El carrito contiene un producto inválido.');
        }

        const productos = await conexion.query(`
            SELECT producto_id, nombre, precio_venta, precio_mayorista
            FROM producto
            WHERE producto_id = ANY($1::bigint[])
              AND estado = 'ACTIVO'
            FOR SHARE
        `, [ids]);

        if (productos.rowCount !== ids.length) {
            throw new Error('Uno o más productos ya no están disponibles.');
        }

        const productosPorId = new Map(
            productos.rows.map(producto => [
                Number(producto.producto_id),
                producto
            ])
        );

        const detalles = [];
        let subtotal = 0;

        for (const item of items) {
            const productoId = Number(item.producto_id);
            const cantidad = Number(item.cantidad);
            const producto = productosPorId.get(productoId);

            if (!Number.isInteger(cantidad) || cantidad < 1 || !producto) {
                throw new Error('La cantidad de un producto no es válida.');
            }

            const precioMayorista = Number(producto.precio_mayorista || 0);
            const precioMayoristaAplicado = cantidad > 10 && precioMayorista > 0;
            const precioUnitario = precioMayoristaAplicado
                ? precioMayorista
                : Number(producto.precio_venta);
            const subtotalItem = precioUnitario * cantidad;

            const stock = await conexion.query(`
                SELECT iu.ubicacion_id, iu.stock_actual, iu.stock_reservado
                FROM inventario_ubicacion iu
                INNER JOIN ubicacion u ON u.ubicacion_id = iu.ubicacion_id
                WHERE iu.producto_id = $1
                  AND u.activo = true
                  AND iu.stock_actual - iu.stock_reservado >= $2
                ORDER BY CASE WHEN u.tipo::text = 'TIENDA' THEN 0 ELSE 1 END
                LIMIT 1
                FOR UPDATE OF iu
            `, [productoId, cantidad]);

            if (stock.rowCount === 0) {
                throw new Error(`No hay stock suficiente para ${producto.nombre}.`);
            }

            await conexion.query(`
                UPDATE inventario_ubicacion
                SET stock_reservado = stock_reservado + $1
                                WHERE producto_id = $2
                                    AND ubicacion_id = $3
                        `, [cantidad, productoId, stock.rows[0].ubicacion_id]);

            detalles.push({
                productoId,
                cantidad,
                precioUnitario,
                precioMayoristaAplicado,
                subtotal: subtotalItem
            });

            subtotal += subtotalItem;
        }

        const costoEnvio = entrega.tipo === 'ENVIO'
            ? Number(process.env.COSTO_ENVIO || 35)
            : 0;
        const total = subtotal + costoEnvio;

        const validacion = await conexion.query(`
            WITH reloj AS (
                SELECT
                    CURRENT_TIMESTAMP AS ahora,
                    CURRENT_TIMESTAMP AT TIME ZONE 'America/Guatemala' AS local
            )
            SELECT CASE
                WHEN $1 <> 'TRANSFERENCIA' THEN NULL
                WHEN EXTRACT(ISODOW FROM local) BETWEEN 1 AND 5
                     AND local::time >= TIME '08:00'
                     AND local::time < TIME '18:00'
                    THEN ahora
                WHEN EXTRACT(ISODOW FROM local) = 6
                     AND local::time >= TIME '08:00'
                     AND local::time < TIME '18:00'
                    THEN ahora
                WHEN EXTRACT(ISODOW FROM local) BETWEEN 1 AND 5
                     AND local::time < TIME '08:00'
                    THEN (date_trunc('day', local) + INTERVAL '8 hours') AT TIME ZONE 'America/Guatemala'
                WHEN EXTRACT(ISODOW FROM local) BETWEEN 1 AND 5
                    THEN (date_trunc('day', local) + INTERVAL '1 day 8 hours') AT TIME ZONE 'America/Guatemala'
                WHEN EXTRACT(ISODOW FROM local) = 6
                    THEN (date_trunc('day', local) + INTERVAL '2 days 8 hours') AT TIME ZONE 'America/Guatemala'
                ELSE (date_trunc('day', local) + INTERVAL '1 day 8 hours') AT TIME ZONE 'America/Guatemala'
            END AS validacion_desde
            FROM reloj
        `, [pago.tipo]);

        const numero = await conexion.query(`
            SELECT CONCAT(
                'PED-',
                TO_CHAR(CURRENT_DATE, 'YYYY'),
                '-',
                LPAD(nextval('pedido_numero_seq')::text, 6, '0')
            ) AS numero_pedido
        `);

        const pedido = await conexion.query(`
            INSERT INTO pedido (
                numero_pedido,
                cliente_nombre,
                cliente_telefono,
                cliente_correo,
                cliente_nit,
                observaciones,
                tipo_entrega,
                tipo_pago,
                subtotal,
                costo_envio,
                total,
                estado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'SOLICITUD_RECIBIDA')
            RETURNING pedido_id, numero_pedido, estado
        `, [
            numero.rows[0].numero_pedido,
            cliente.nombre.trim(),
            cliente.telefono.trim(),
            cliente.correo?.trim() || null,
            cliente.nit?.trim() || null,
            cliente.observaciones?.trim() || null,
            entrega.tipo,
            pago.tipo,
            subtotal,
            costoEnvio,
            total
        ]);

        for (const detalle of detalles) {
            await conexion.query(`
                INSERT INTO detalle_pedido (
                    pedido_id,
                    producto_id,
                    cantidad,
                    precio_unitario,
                    subtotal
                )
                VALUES ($1, $2, $3, $4, $5)
            `, [
                pedido.rows[0].pedido_id,
                detalle.productoId,
                detalle.cantidad,
                detalle.precioUnitario,
                detalle.subtotal
            ]);
        }

        await conexion.query(`
            INSERT INTO entrega_pedido (
                pedido_id,
                departamento,
                municipio,
                direccion_exacta,
                referencia,
                destinatario_nombre,
                destinatario_telefono,
                observaciones
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            pedido.rows[0].pedido_id,
            entrega.departamento?.trim() || null,
            entrega.municipio?.trim() || null,
            entrega.direccion?.trim() || null,
            entrega.referencia?.trim() || null,
            entrega.destinatarioNombre?.trim() || cliente.nombre.trim(),
            entrega.destinatarioTelefono?.trim() || cliente.telefono.trim(),
            entrega.observaciones?.trim() || null
        ]);

        await conexion.query(`
            INSERT INTO pago_pedido (
                pedido_id,
                tipo_pago,
                estado,
                validacion_desde,
                banco,
                numero_referencia,
                monto_transferido,
                fecha_transferencia,
                comprobante
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            pedido.rows[0].pedido_id,
            pago.tipo,
            pago.tipo === 'TRANSFERENCIA' ? 'PAGO_EN_REVISION' : 'PENDIENTE',
            validacion.rows[0].validacion_desde,
            pago.banco?.trim() || null,
            pago.referencia?.trim() || null,
            pago.monto === undefined ? null : Number(pago.monto),
            pago.fecha || null,
            pago.comprobante || null
        ]);

        await conexion.query('COMMIT');

        res.status(201).json({
            pedido: pedido.rows[0],
            estadoPago: pago.tipo === 'TRANSFERENCIA'
                ? 'PAGO_EN_REVISION'
                : 'PENDIENTE',
            validacionDesde: validacion.rows[0].validacion_desde,
            subtotal,
            costoEnvio,
            total,
            detalles
        });

    } catch (error) {

        await conexion.query('ROLLBACK');

        console.error('Error al crear pedido:', error);

        res.status(400).json({
            error: error.message || 'No fue posible registrar la solicitud de compra.'
        });

    } finally {

        conexion.release();

    }

}


// ======================================================
// ACTUALIZAR ESTADO DEL PEDIDO
// ======================================================

export async function actualizarEstadoPedido(req, res) {

    const pedidoId = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        return res.status(400).json({
            error: 'El identificador del pedido no es válido.'
        });
    }

    if (!['CONFIRMADO', 'CANCELADO'].includes(estado)) {
        return res.status(400).json({
            error: 'El estado solicitado no es válido.'
        });
    }

    const conexion = await pool.connect();

    try {

        await conexion.query('BEGIN');

        const pedido = await conexion.query(`
            SELECT pedido_id, estado
            FROM pedido
            WHERE pedido_id = $1
            FOR UPDATE
        `, [pedidoId]);

        if (pedido.rowCount === 0) {
            throw new Error('El pedido no existe.');
        }

        if (pedido.rows[0].estado !== 'SOLICITUD_RECIBIDA') {
            throw new Error('El pedido ya fue procesado.');
        }

        const detalles = await conexion.query(`
            SELECT producto_id, cantidad
            FROM detalle_pedido
            WHERE pedido_id = $1
        `, [pedidoId]);

        for (const detalle of detalles.rows) {
            const inventario = await conexion.query(`
                SELECT ubicacion_id
                FROM inventario_ubicacion
                WHERE producto_id = $1
                  AND stock_reservado >= $2
                ORDER BY ubicacion_id
                LIMIT 1
                FOR UPDATE
            `, [detalle.producto_id, detalle.cantidad]);

            if (inventario.rowCount === 0) {
                throw new Error('No se encontró la reserva de inventario del pedido.');
            }

            const vendido = estado === 'CONFIRMADO'
                ? ', stock_actual = stock_actual - $1'
                : '';

            await conexion.query(`
                UPDATE inventario_ubicacion
                SET stock_reservado = stock_reservado - $1${vendido}
                WHERE producto_id = $2
                  AND ubicacion_id = $3
            `, [
                detalle.cantidad,
                detalle.producto_id,
                inventario.rows[0].ubicacion_id
            ]);
        }

        await conexion.query(
            'UPDATE pedido SET estado = $1 WHERE pedido_id = $2',
            [estado, pedidoId]
        );

        await conexion.query('COMMIT');

        res.json({
            pedidoId,
            estado
        });

    } catch (error) {

        await conexion.query('ROLLBACK');

        res.status(400).json({
            error: error.message || 'No fue posible actualizar el pedido.'
        });

    } finally {

        conexion.release();

    }

}


// ======================================================
// EDITAR PRODUCTO
// ======================================================

export async function editarProducto(req, res) {

    const productoId = Number(req.params.id);
    const {
        nombre,
        descripcion,
        imagen_url,
        calibre_milipulgadas,
        divisiones,
        numero_talla,
        forma,
        color,
        volumen_oz,
        material,
        precio_venta,
        precio_mayorista = 0,
        estado = 'ACTIVO'
    } = req.body;

    if (!Number.isInteger(productoId) || productoId <= 0) {
        return res.status(400).json({
            error: 'El identificador del producto no es válido.'
        });
    }

    if (!nombre?.trim() || precio_venta === undefined || !Number.isFinite(Number(precio_mayorista)) || Number(precio_mayorista) < 0) {
        return res.status(400).json({
            error: 'Nombre y precio de venta son obligatorios.'
        });
    }

    try {

        const resultado = await pool.query(`
            UPDATE producto
            SET
                nombre = $1,
                descripcion = $2,
                imagen_url = $3,
                calibre_milipulgadas = $4,
                divisiones = $5,
                numero_talla = $6,
                forma = $7,
                color = $8,
                volumen_oz = $9,
                material = $10,
                precio_venta = $11,
                precio_mayorista = $12,
                estado = UPPER($13)::estado_producto_enum
            WHERE producto_id = $14
            RETURNING producto_id, nombre, estado, precio_venta, precio_mayorista
        `, [
            nombre.trim(),
            descripcion || null,
            imagen_url || null,
            calibre_milipulgadas ?? null,
            divisiones ?? null,
            numero_talla || null,
            forma || null,
            color || null,
            volumen_oz ?? null,
            material || null,
            Number(precio_venta),
            Number(precio_mayorista),
            estado,
            productoId
        ]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                error: 'El producto no existe.'
            });
        }

        res.json(resultado.rows[0]);

    } catch (error) {

        console.error('Error al editar producto:', error);

        res.status(error.code === '23505' ? 409 : 500).json({
            error: error.code === '23505'
                ? 'El producto ya está registrado.'
                : 'No fue posible editar el producto.'
        });

    }

}


// ======================================================
// OBTENER UNIDADES DE MEDIDA
// ======================================================

export async function obtenerUnidades(req, res) {

    try {

        const resultado = await pool.query(`
            SELECT
                unidad_id,
                nombre,
                simbolo
            FROM unidad_medida
            ORDER BY nombre ASC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error('Error al consultar unidades:', error);

        res.status(500).json({
            error: 'No fue posible consultar las unidades de medida.'
        });

    }

}


// ======================================================
// RESUMEN DE REPORTES
// ======================================================

export async function obtenerReportes(req, res) {

    try {

        const inventario = await pool.query(`
            SELECT
                p.producto_id,
                p.nombre,
                c.nombre AS categoria,
                COALESCE(SUM(iu.stock_actual - iu.stock_reservado), 0) AS stock_disponible,
                COALESCE(MAX(iu.stock_minimo), 0) AS stock_minimo,
                COALESCE(MAX(iu.stock_maximo), 0) AS stock_maximo
            FROM producto p
            INNER JOIN categoria c
                ON c.categoria_id = p.categoria_id
            LEFT JOIN inventario_ubicacion iu
                ON iu.producto_id = p.producto_id
            WHERE p.estado = 'ACTIVO'
            GROUP BY p.producto_id, p.nombre, c.nombre
            ORDER BY p.nombre ASC
        `);

        const bajos = inventario.rows.filter(
            producto => Number(producto.stock_disponible) < 10
        );

        res.json({
            ventas: {
                dia: 0,
                semana: 0,
                mes: 0,
                ano: 0,
                transacciones: 0
            },
            inventario: inventario.rows,
            resumenInventario: {
                disponibles: inventario.rows.filter(
                    producto => Number(producto.stock_disponible) > 0
                ).length,
                agotados: inventario.rows.filter(
                    producto => Number(producto.stock_disponible) === 0
                ).length,
                stockMaximo: inventario.rows.filter(
                    producto => Number(producto.stock_maximo) > 0
                        && Number(producto.stock_disponible) >= Number(producto.stock_maximo)
                ).length,
                alertas: bajos
            }
        });

    } catch (error) {

        console.error('Error al consultar reportes:', error);

        res.status(500).json({
            error: 'No fue posible consultar los reportes.'
        });

    }

}


// ======================================================
// ELIMINAR PRODUCTO
// ======================================================

export async function eliminarProducto(req, res) {

    const productoId = Number(req.params.id);
    const { usuario, password } = req.body;

    if (!Number.isInteger(productoId) || productoId <= 0) {
        return res.status(400).json({
            error: 'El identificador del producto no es válido.'
        });
    }

    if (!usuario?.trim() || !password) {
        return res.status(400).json({
            error: 'Ingresa el usuario y la contraseña del administrador.'
        });
    }

    try {

        const administrador = await pool.query(`
            SELECT u.usuario_id
            FROM usuario u
            INNER JOIN rol r ON r.rol_id = u.rol_id
            WHERE LOWER(u.usuario) = LOWER($1)
              AND LOWER(r.nombre) = 'administrador'
              AND u.estado::text = 'ACTIVO'
              AND u.password_hash = crypt($2, u.password_hash)
        `, [usuario.trim(), password]);

        if (administrador.rowCount === 0) {
            return res.status(401).json({
                error: 'Las credenciales del administrador no son válidas.'
            });
        }

        const conexion = await pool.connect();

        try {

            await conexion.query('BEGIN');

            const pedido = await conexion.query(`
                SELECT 1
                FROM detalle_pedido
                WHERE producto_id = $1
                LIMIT 1
            `, [productoId]);

            if (pedido.rowCount > 0) {
                await conexion.query('ROLLBACK');

                return res.status(409).json({
                    error: 'No se puede eliminar un producto que aparece en pedidos registrados.'
                });
            }

            await conexion.query(`
                DELETE FROM precio_producto
                WHERE producto_id = $1
            `, [productoId]);

            await conexion.query(`
                DELETE FROM inventario_ubicacion
                WHERE producto_id = $1
            `, [productoId]);

            const resultado = await conexion.query(`
                DELETE FROM producto
                WHERE producto_id = $1
                RETURNING producto_id
            `, [productoId]);

            if (resultado.rowCount === 0) {
                await conexion.query('ROLLBACK');

                return res.status(404).json({
                    error: 'El producto no existe.'
                });
            }

            await conexion.query('COMMIT');

            res.json({
                producto_id: resultado.rows[0].producto_id,
                mensaje: 'Producto eliminado correctamente.'
            });

        } catch (errorEliminacion) {

            await conexion.query('ROLLBACK');
            throw errorEliminacion;

        } finally {

            conexion.release();

        }

    } catch (error) {

        console.error('Error al eliminar producto:', error);

        res.status(500).json({
            error: 'No fue posible eliminar el producto.'
        });

    }

}


// ======================================================
// SOLICITUDES A BODEGA
// ======================================================

export async function crearSolicitudBodega(req, res) {

    const {
        productos,
        ubicacion = 'Negocio Local',
        prioridad = 'Media',
        solicitante = 'Vendedor',
        notas = ''
    } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({
            error: 'La solicitud debe contener al menos un producto.'
        });
    }

    if (productos.some(item => (
        !Number.isInteger(Number(item.producto_id))
        || Number(item.producto_id) <= 0
        || !Number.isInteger(Number(item.cantidad))
        || Number(item.cantidad) < 1
    ))) {
        return res.status(400).json({
            error: 'Los productos o cantidades de la solicitud no son válidos.'
        });
    }

    try {

        const ids = [...new Set(productos.map(item => Number(item.producto_id)))];
        const cantidadesSolicitadas = new Map();
        for (const item of productos) {
            const productoId = Number(item.producto_id);
            cantidadesSolicitadas.set(
                productoId,
                (cantidadesSolicitadas.get(productoId) || 0) + Number(item.cantidad)
            );
        }

        const disponibles = await pool.query(`
            SELECT p.producto_id, p.nombre,
                COALESCE(SUM(iu.stock_actual - iu.stock_reservado), 0) AS stock_bodega
            FROM producto p
            INNER JOIN inventario_ubicacion iu ON iu.producto_id = p.producto_id
            INNER JOIN ubicacion u ON u.ubicacion_id = iu.ubicacion_id
            WHERE p.producto_id = ANY($1::bigint[])
              AND p.estado = 'ACTIVO'
              AND u.tipo::text = 'BODEGA'
              AND u.activo = true
            GROUP BY p.producto_id, p.nombre
        `, [ids]);

        const productosPorId = new Map(
            disponibles.rows.map(item => [Number(item.producto_id), item])
        );

        for (const [productoId, cantidad] of cantidadesSolicitadas) {
            const producto = productosPorId.get(productoId);
            if (!producto || Number(producto.stock_bodega) < cantidad) {
                return res.status(409).json({
                    error: `No hay stock suficiente en bodega para ${producto?.nombre || 'uno de los productos'}.`
                });
            }
        }

        const numero = await pool.query(`
            SELECT CONCAT('SOL-', LPAD(nextval('solicitud_bodega_numero_seq')::text, 4, '0')) AS numero
        `);
        const productosConNombre = productos.map(item => ({
            producto_id: Number(item.producto_id),
            producto: productosPorId.get(Number(item.producto_id)).nombre,
            cantidad: Number(item.cantidad)
        }));

        const resultado = await pool.query(`
            INSERT INTO solicitud_bodega (
                numero_solicitud, productos, ubicacion_destino,
                prioridad, solicitante, notas
            )
            VALUES ($1, $2::jsonb, $3, $4, $5, $6)
            RETURNING solicitud_id, numero_solicitud, productos,
                ubicacion_destino, prioridad, estado, solicitante,
                notas, enviado, aceptado, creado_en
        `, [
            numero.rows[0].numero,
            JSON.stringify(productosConNombre),
            ubicacion,
            prioridad,
            solicitante,
            notas || null
        ]);

        res.status(201).json(resultado.rows[0]);

    } catch (error) {

        console.error('Error al crear solicitud a bodega:', error);
        res.status(500).json({
            error: 'No fue posible enviar la solicitud a bodega.'
        });

    }

}


export async function obtenerSolicitudesBodega(req, res) {

    try {
        const resultado = await pool.query(`
            SELECT solicitud_id, numero_solicitud, productos,
                ubicacion_destino, prioridad, estado, solicitante,
                notas, enviado, aceptado, creado_en
            FROM solicitud_bodega
            ORDER BY creado_en DESC
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al consultar solicitudes a bodega:', error);
        res.status(500).json({ error: 'No fue posible consultar las solicitudes.' });
    }

}


export async function actualizarAceptacionSolicitudBodega(req, res) {

    const { numero } = req.params;
    const { aceptado } = req.body;

    if (typeof aceptado !== 'boolean') {
        return res.status(400).json({
            error: 'Indica si el ticket fue aceptado.'
        });
    }

    try {
        const resultado = await pool.query(`
            UPDATE solicitud_bodega
            SET aceptado = $2,
                estado = CASE
                    WHEN $2 THEN 'En preparación'
                    WHEN estado = 'En preparación' THEN 'Pendiente'
                    ELSE estado
                END
            WHERE numero_solicitud = $1
            RETURNING solicitud_id, numero_solicitud, enviado, aceptado, estado
        `, [numero, aceptado]);

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                error: 'No se encontró el ticket de solicitud.'
            });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al actualizar aceptación de solicitud:', error);
        res.status(500).json({
            error: 'No fue posible actualizar la aceptación del ticket.'
        });
    }

}

// ======================================================
// REGISTRAR VENTA DE MOSTRADOR
// ======================================================

export async function registrarVentaMostrador(req, res) {
    const { items, dinero_recibido: dineroRecibido, usuario: usuarioVendedor } = req.body;
    const vendedor = String(usuarioVendedor || '').trim();
    const recibido = Number(dineroRecibido);

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Agrega productos antes de realizar la venta.' });
    }
    if (!Number.isFinite(recibido) || recibido < 0) {
        return res.status(400).json({ error: 'El dinero recibido no es válido.' });
    }
    if (!vendedor || vendedor.length > 80) {
        return res.status(400).json({ error: 'No se pudo identificar al vendedor.' });
    }

    const cantidadesPorProducto = new Map();
    for (const item of items) {
        const productoId = Number(item.producto_id);
        const cantidad = Number(item.cantidad);
        if (!Number.isInteger(productoId) || productoId <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
            return res.status(400).json({ error: 'Hay productos o cantidades no válidas en la venta.' });
        }
        cantidadesPorProducto.set(productoId, (cantidadesPorProducto.get(productoId) || 0) + cantidad);
    }

    const conexion = await pool.connect();
    try {
        await conexion.query('BEGIN');
        await conexion.query('SELECT pg_advisory_xact_lock(72931, 1)');

        let rol = await conexion.query("SELECT rol_id FROM rol WHERE nombre = 'Vendedor'");
        if (rol.rowCount === 0) {
            rol = await conexion.query("INSERT INTO rol (nombre, descripcion) VALUES ('Vendedor', 'Ventas de mostrador') RETURNING rol_id");
        }

        let vendedorDb = await conexion.query(
            'SELECT usuario_id FROM usuario WHERE usuario = $1 FOR UPDATE',
            [vendedor]
        );
        if (vendedorDb.rowCount === 0) {
            if (vendedor !== 'vendedor1') {
                throw new Error(`El usuario ${vendedor} no está registrado para ventas.`);
            }
            vendedorDb = await conexion.query(`
                INSERT INTO usuario (rol_id, nombre, usuario, password_hash, estado)
                VALUES ($1, 'Vendedor de mostrador', $2, '!USUARIO_POS_SIN_ACCESO!', 'ACTIVO')
                RETURNING usuario_id
            `, [rol.rows[0].rol_id, vendedor]);
        }

        let tipoCliente = await conexion.query(
            "SELECT tipo_cliente_id FROM tipo_cliente WHERE nombre = 'Consumidor final' FOR UPDATE"
        );
        if (tipoCliente.rowCount === 0) {
            tipoCliente = await conexion.query(`
                INSERT INTO tipo_cliente (nombre, descripcion, descuento_porcentaje)
                VALUES ('Consumidor final', 'Cliente de venta de mostrador', 0)
                RETURNING tipo_cliente_id
            `);
        }

        let cliente = await conexion.query(
            "SELECT cliente_id, activo FROM cliente WHERE nit_rut = 'CF' ORDER BY cliente_id LIMIT 1 FOR UPDATE"
        );
        if (cliente.rowCount === 0) {
            cliente = await conexion.query(`
                INSERT INTO cliente (tipo_cliente_id, nombre, nit_rut, activo)
                VALUES ($1, 'Consumidor Final', 'CF', true)
                RETURNING cliente_id
            `, [tipoCliente.rows[0].tipo_cliente_id]);
        } else if (!cliente.rows[0].activo) {
            await conexion.query('UPDATE cliente SET activo = true WHERE cliente_id = $1', [cliente.rows[0].cliente_id]);
        }
        const clienteId = cliente.rows[0].cliente_id;

        const ubicacion = await conexion.query(`
            SELECT ubicacion_id
            FROM ubicacion
            WHERE tipo::text = 'TIENDA' AND activo = true
            ORDER BY ubicacion_id
            LIMIT 1
            FOR SHARE
        `);
        if (ubicacion.rowCount === 0) {
            throw new Error('No hay una tienda activa para registrar la venta.');
        }
        const ubicacionId = ubicacion.rows[0].ubicacion_id;
        const ids = [...cantidadesPorProducto.keys()];
        const productos = await conexion.query(`
            SELECT producto_id, nombre, precio_venta, precio_mayorista
            FROM producto
            WHERE producto_id = ANY($1::integer[]) AND estado = 'ACTIVO'
            ORDER BY producto_id
            FOR SHARE
        `, [ids]);
        if (productos.rowCount !== ids.length) {
            throw new Error('Uno o más productos ya no están disponibles.');
        }

        const detalles = [];
        let totalCentavos = 0;
        for (const producto of productos.rows) {
            const productoId = Number(producto.producto_id);
            const cantidad = cantidadesPorProducto.get(productoId);
            const inventario = await conexion.query(`
                SELECT inventario_id, stock_actual, stock_reservado
                FROM inventario_ubicacion
                WHERE producto_id = $1 AND ubicacion_id = $2
                FOR UPDATE
            `, [productoId, ubicacionId]);
            if (inventario.rowCount === 0
                || Number(inventario.rows[0].stock_actual) - Number(inventario.rows[0].stock_reservado) < cantidad) {
                throw new Error(`No hay existencias suficientes en tienda para ${producto.nombre}.`);
            }

            const precioMayorista = Number(producto.precio_mayorista || 0);
            const precioUnitario = cantidad > 10 && precioMayorista > 0
                ? precioMayorista
                : Number(producto.precio_venta);
            const subtotalCentavos = Math.round(precioUnitario * 100) * cantidad;
            totalCentavos += subtotalCentavos;
            detalles.push({
                productoId,
                nombre: producto.nombre,
                cantidad,
                precioUnitario,
                subtotal: subtotalCentavos / 100,
                inventarioId: inventario.rows[0].inventario_id,
                stockAnterior: Number(inventario.rows[0].stock_actual)
            });
        }

        const recibidoCentavos = Math.round(recibido * 100);
        if (recibidoCentavos < totalCentavos) {
            throw new Error(`El pago es insuficiente. Falta Q ${((totalCentavos - recibidoCentavos) / 100).toFixed(2)}.`);
        }
        const totalVenta = totalCentavos / 100;
        const cambio = (recibidoCentavos - totalCentavos) / 100;
        const venta = await conexion.query(`
            INSERT INTO venta (
                cliente_id, usuario_id, ubicacion_id, subtotal, descuento,
                impuesto, total, tipo_pago, estado, observaciones
            )
            VALUES ($1, $2, $3, $4, 0, 0, $4, 'EFECTIVO', 'COMPLETADA', $5)
            RETURNING venta_id, fecha_venta
        `, [
            clienteId,
            vendedorDb.rows[0].usuario_id,
            ubicacionId,
            totalVenta,
            `Efectivo recibido Q ${ (recibidoCentavos / 100).toFixed(2) }; cambio Q ${cambio.toFixed(2)}.`
        ]);
        const ventaId = venta.rows[0].venta_id;

        for (const detalle of detalles) {
            await conexion.query(`
                INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal, vendedor)
                VALUES ($1, $2, $3, $4, 0, $5, $6)
            `, [ventaId, detalle.productoId, detalle.cantidad, detalle.precioUnitario, detalle.subtotal, vendedor]);

            const stockNuevo = detalle.stockAnterior - detalle.cantidad;
            await conexion.query(`
                UPDATE inventario_ubicacion
                SET stock_actual = stock_actual - $1, ultima_actualizacion = CURRENT_TIMESTAMP
                WHERE inventario_id = $2
            `, [detalle.cantidad, detalle.inventarioId]);

            await conexion.query(`
                INSERT INTO movimiento_inventario (
                    producto_id, ubicacion_id, usuario_id, tipo_movimiento,
                    cantidad, stock_anterior, stock_nuevo, referencia_tipo,
                    referencia_id, observaciones
                )
                VALUES ($1, $2, $3, 'VENTA', $4, $5, $6, 'VENTA', $7, $8)
            `, [
                detalle.productoId,
                ubicacionId,
                vendedorDb.rows[0].usuario_id,
                detalle.cantidad,
                detalle.stockAnterior,
                stockNuevo,
                ventaId,
                `Salida por venta de mostrador ${ventaId}`
            ]);
        }

        await conexion.query('COMMIT');
        res.status(201).json({
            venta_id: ventaId,
            fecha_venta: venta.rows[0].fecha_venta,
            total: totalVenta,
            dinero_recibido: recibidoCentavos / 100,
            cambio,
            detalles: detalles.map(({ inventarioId, stockAnterior, ...detalle }) => detalle)
        });
    } catch (error) {
        await conexion.query('ROLLBACK');
        console.error('Error al registrar venta de mostrador:', error);
        res.status(400).json({ error: error.message || 'No fue posible registrar la venta.' });
    } finally {
        conexion.release();
    }
}
// ======================================================
// CONSULTAR HISTORIAL DE VENTAS
// ======================================================

export async function obtenerVentas(req, res) {
    try {
        const resultado = await pool.query(`
            SELECT
                v.venta_id,
                v.fecha_venta,
                v.subtotal,
                v.descuento,
                v.impuesto,
                v.total,
                v.tipo_pago::text AS tipo_pago,
                v.estado::text AS estado,
                c.nombre AS cliente,
                c.telefono,
                COALESCE(NULLIF(MIN(dv.vendedor), ''), u.usuario, u.nombre, 'No registrado') AS vendedor,
                COUNT(dv.detalle_venta_id)::integer AS lineas,
                COALESCE(SUM(dv.cantidad), 0) AS unidades,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'producto', p.nombre,
                            'cantidad', dv.cantidad,
                            'precio_unitario', dv.precio_unitario,
                            'descuento', dv.descuento,
                            'subtotal', dv.subtotal
                        ) ORDER BY dv.detalle_venta_id
                    ) FILTER (WHERE dv.detalle_venta_id IS NOT NULL),
                    '[]'::json
                ) AS detalles
            FROM venta v
            LEFT JOIN cliente c ON c.cliente_id = v.cliente_id
            LEFT JOIN usuario u ON u.usuario_id = v.usuario_id
            LEFT JOIN detalle_venta dv ON dv.venta_id = v.venta_id
            LEFT JOIN producto p ON p.producto_id = dv.producto_id
            GROUP BY
                v.venta_id, v.fecha_venta, v.subtotal, v.descuento,
                v.impuesto, v.total, v.tipo_pago, v.estado,
                c.nombre, c.telefono, u.usuario, u.nombre
            ORDER BY v.fecha_venta DESC, v.venta_id DESC
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al consultar el historial de ventas:', error);
        res.status(500).json({ error: 'No fue posible cargar el historial de ventas.' });
    }
}
