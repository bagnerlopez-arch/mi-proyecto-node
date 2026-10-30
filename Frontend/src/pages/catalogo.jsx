import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';


// ============================================================
// CONFIGURACIÓN
// ============================================================

const API_PRODUCTOS = '/api/cliente/productos';
const API_PEDIDOS = '/api/cliente/pedidos';
const WHATSAPP_EMPRESA = '50231302535';
const COSTO_ENVIO_ESTIMADO = 35;
const CUENTAS_TRANSFERENCIA = {
    BANRURAL: '1234567890',
    'BANCO INDUSTRIAL': '0123456789'
};


const NOMBRES_CATEGORIA = {
    Platos: 'Platos Bandejas Y Contenedores',
    'Tazones y Contenedores': 'Platos Bandejas Y Contenedores',
    'Platos Bandejas Y Contenedores': 'Platos Bandejas Y Contenedores',

    Bolsas: 'Bolsas Color Y Transparente',
    'Bolsas y Empaques': 'Bolsas Color Y Transparente',
    'Bolsas Color Y Transparente': 'Bolsas Color Y Transparente',
    'Bolsas: color, transparente y cristal': 'Bolsas Color Y Transparente',

    Otros: 'Pita',
    Pita: 'Pita',
    'Nailo: delgado y grueso': 'Nailo',
    Nailo: 'Nailo',

    'Nailo vinil': 'Carpeta Y Vinil Para Mesa',
    'Nailo Vinil': 'Carpeta Y Vinil Para Mesa',
    'Carpeta Y Vinil Para Mesa': 'Carpeta Y Vinil Para Mesa',

    Vasos: 'Vasos',
    Banderas: 'Banderas',
    Globos: 'Globos'
};


const ORDEN_CATEGORIAS = [
    'Banderas',
    'Bolsas Color Y Transparente',
    'Carpeta Y Vinil Para Mesa',
    'Globos',
    'Nailo',
    'Pita',
    'Platos Bandejas Y Contenedores',
    'Vasos'
];


// ============================================================
// COMPONENTE
// ============================================================

function Catalogo() {

    // ========================================================
    // ESTADOS
    // ========================================================

    const [productos, setProductos] = useState([]);

    const [cargando, setCargando] = useState(true);

    const [error, setError] = useState('');

    const [busqueda, setBusqueda] = useState('');

    const [categoriaSeleccionada, setCategoriaSeleccionada] =
        useState('Todas');

    const [productoSeleccionado, setProductoSeleccionado] =
        useState(null);

    const [carrito, setCarrito] = useState([]);

    const [mostrarCarrito, setMostrarCarrito] =
        useState(false);

    const [tipoPago, setTipoPago] =
        useState('EFECTIVO');

    const [entrega, setEntrega] =
        useState('TIENDA');

    const [mensaje, setMensaje] =
        useState('');

    const [pasoCarrito, setPasoCarrito] =
        useState('carrito');

    const [datosCliente, setDatosCliente] =
        useState({
            nombre: '',
            telefono: '',
            correo: '',
            nit: '',
            observaciones: ''
        });

    const [datosEntrega, setDatosEntrega] =
        useState({
            departamento: '',
            municipio: '',
            direccion: '',
            referencia: '',
            destinatarioNombre: '',
            destinatarioTelefono: '',
            observaciones: ''
        });

    const [datosPago, setDatosPago] =
        useState({
            banco: 'BANRURAL',
            tipoCuenta: 'AHORRO',
            referencia: '',
            monto: '',
            fecha: '',
            comprobante: ''
        });

    const [enviandoPedido, setEnviandoPedido] =
        useState(false);


    // ========================================================
    // CARGAR PRODUCTOS
    // ========================================================

    useEffect(() => {

        const controlador =
            new AbortController();


        async function cargarProductos() {

            try {

                setCargando(true);

                setError('');


                const respuesta =
                    await fetch(
                        API_PRODUCTOS,
                        {
                            signal:
                                controlador.signal
                        }
                    );


                if (!respuesta.ok) {

                    throw new Error(
                        `Error ${respuesta.status}: no fue posible cargar los productos.`
                    );

                }


                const datos =
                    await respuesta.json();


                /*
                 * Permite que el backend responda:
                 *
                 * [ ...productos ]
                 *
                 * o:
                 *
                 * {
                 *     productos: [...]
                 * }
                 */

                const lista =
                    Array.isArray(datos)
                        ? datos
                        : datos.productos || [];


                setProductos(lista);


            } catch (err) {

                if (
                    err.name ===
                    'AbortError'
                ) {

                    return;

                }


                console.error(
                    'Error cargando productos:',
                    err
                );


                setError(
                    'No fue posible cargar el catálogo. Intenta nuevamente.'
                );


            } finally {

                setCargando(false);

            }

        }


        cargarProductos();


        return () => {

            controlador.abort();

        };

    }, []);


    // ========================================================
    // FUNCIONES AUXILIARES
    // ========================================================

    function obtenerCategoria(
        producto
    ) {

        return (
            NOMBRES_CATEGORIA[
                producto.categoria
            ]
            ||
            producto.categoria
            ||
            'Sin categoría'
        );

    }


    function obtenerPrecio(
        producto
    ) {

        const precio =
            producto.precio_venta
            ??
            producto.precio
            ??
            producto.precio_actual;


        if (
            precio === null
            ||
            precio === undefined
            ||
            precio === ''
        ) {

            return null;

        }


        const numero =
            Number(precio);


        return Number.isFinite(numero)
            ? numero
            : null;

    }


    function obtenerPrecioMayorista(producto) {
        const precio = Number(producto?.precio_mayorista);
        return Number.isFinite(precio) && precio > 0 ? precio : null;
    }
    function obtenerPrecioAplicado(producto, cantidad = 1) {
        const precioMayorista = obtenerPrecioMayorista(producto);
        return Number(cantidad) > 10 && precioMayorista !== null
            ? precioMayorista
            : (obtenerPrecio(producto) || 0);
    }
    function formatoPrecio(
        precio
    ) {

        if (
            precio === null
            ||
            precio === undefined
        ) {

            return 'Consultar precio';

        }


        return new Intl.NumberFormat(
            'es-GT',
            {
                style: 'currency',
                currency: 'GTQ',
                minimumFractionDigits: 2
            }
        ).format(
            Number(precio)
        );

    }


    function productoDisponible(
        producto
    ) {

        const disponibilidad =
            String(
                producto.disponibilidad
                || 'Disponible'
            )
                .toLowerCase();


        return !(
            disponibilidad.includes(
                'agotado'
            )
            ||
            disponibilidad.includes(
                'sin exist'
            )
        );

    }


    // ========================================================
    // FILTRAR PRODUCTOS
    // ========================================================

    const productosFiltrados =
        useMemo(
            () => {

                const texto =
                    busqueda
                        .trim()
                        .toLowerCase();


                return productos.filter(
                    producto => {

                        const categoria =
                            obtenerCategoria(
                                producto
                            );


                        const coincideCategoria =
                            categoriaSeleccionada ===
                                'Todas'
                            ||
                            categoria ===
                                categoriaSeleccionada;


                        const coincideBusqueda =
                            !texto
                            ||
                            producto.nombre
                                ?.toLowerCase()
                                .includes(texto)
                            ||
                            producto.sku
                                ?.toLowerCase()
                                .includes(texto)
                            ||
                            producto.descripcion
                                ?.toLowerCase()
                                .includes(texto)
                            ||
                            producto.categoria
                                ?.toLowerCase()
                                .includes(texto);


                        return (
                            coincideCategoria
                            &&
                            coincideBusqueda
                        );

                    }
                );

            },

            [
                productos,
                busqueda,
                categoriaSeleccionada
            ]
        );


    // ========================================================
    // AGRUPAR PRODUCTOS POR CATEGORÍA
    // ========================================================

    const productosPorCategoria =
        useMemo(
            () => {

                return productosFiltrados.reduce(
                    (
                        acumulador,
                        producto
                    ) => {

                        const categoria =
                            obtenerCategoria(
                                producto
                            );


                        if (
                            !acumulador[
                                categoria
                            ]
                        ) {

                            acumulador[
                                categoria
                            ] = [];

                        }


                        acumulador[
                            categoria
                        ].push(
                            producto
                        );


                        return acumulador;

                    },
                    {}
                );

            },

            [
                productosFiltrados
            ]
        );


    // ========================================================
    // CATEGORÍAS DISPONIBLES
    // ========================================================

    const categoriasDisponibles =
        useMemo(
            () => {

                const categorias =
                    [
                        ...new Set(
                            productos.map(
                                producto =>
                                    obtenerCategoria(
                                        producto
                                    )
                            )
                        )
                    ];


                return [

                    ...ORDEN_CATEGORIAS.filter(
                        categoria =>
                            categorias.includes(
                                categoria
                            )
                    ),

                    ...categorias.filter(
                        categoria =>
                            !ORDEN_CATEGORIAS.includes(
                                categoria
                            )
                    )

                ];

            },

            [
                productos
            ]
        );


    // ========================================================
    // CARRITO
    // ========================================================

    function agregarAlCarrito(
        producto
    ) {

        if (
            !productoDisponible(
                producto
            )
        ) {

            return;

        }


        setCarrito(
            carritoActual => {

                const existente =
                    carritoActual.find(
                        item =>
                            item.producto_id ===
                            producto.producto_id
                    );


                if (existente) {

                    return carritoActual.map(
                        item =>
                            item.producto_id ===
                            producto.producto_id

                                ? {
                                    ...item,

                                    cantidad:
                                        item.cantidad + 1
                                }

                                : item
                    );

                }


                return [

                    ...carritoActual,

                    {
                        ...producto,
                        cantidad: 1
                    }

                ];

            }
        );


        setProductoSeleccionado(
            null
        );


        setMostrarCarrito(
            true
        );

    }


    function cambiarCantidad(
        productoId,
        nuevaCantidad
    ) {

        if (
            nuevaCantidad < 1
        ) {

            return;

        }


        setCarrito(
            carritoActual =>
                carritoActual.map(
                    item =>
                        item.producto_id ===
                            productoId

                            ? {
                                ...item,

                                cantidad:
                                    nuevaCantidad
                            }

                            : item
                )
        );

    }


    function aumentarCantidad(
        productoId
    ) {

        setCarrito(
            carritoActual =>
                carritoActual.map(
                    item =>
                        item.producto_id ===
                            productoId

                            ? {
                                ...item,

                                cantidad:
                                    item.cantidad + 1
                            }

                            : item
                )
        );

    }


    function disminuirCantidad(
        productoId
    ) {

        setCarrito(
            carritoActual =>
                carritoActual.map(
                    item =>
                        item.producto_id ===
                            productoId

                            ? {
                                ...item,

                                cantidad:
                                    Math.max(
                                        1,
                                        item.cantidad - 1
                                    )
                            }

                            : item
                )
        );

    }


    function eliminarDelCarrito(
        productoId
    ) {

        setCarrito(
            carritoActual =>
                carritoActual.filter(
                    item =>
                        item.producto_id !==
                        productoId
                )
        );

    }


    function cambiarDatosCliente(evento) {

        const { name, value } = evento.target;

        setDatosCliente(actual => ({
            ...actual,
            [name]: value
        }));

    }


    function cambiarDatosEntrega(evento) {

        const { name, value } = evento.target;

        setDatosEntrega(actual => ({
            ...actual,
            [name]: value
        }));

    }


    function cambiarDatosPago(evento) {

        const { name, value } = evento.target;

        setDatosPago(actual => ({
            ...actual,
            [name]: value
        }));

    }


    function seleccionarComprobante(evento) {

        const archivo = evento.target.files?.[0];

        if (!archivo) {
            return;
        }

        const lector = new FileReader();

        lector.onload = () => {
            setDatosPago(actual => ({
                ...actual,
                comprobante: lector.result
            }));
        };

        lector.readAsDataURL(archivo);

    }


    // ========================================================
    // TOTALES
    // ========================================================

    const cantidadCarrito =
        useMemo(
            () => {

                return carrito.reduce(
                    (
                        total,
                        item
                    ) =>
                        total
                        +
                        item.cantidad,
                    0
                );

            },
            [
                carrito
            ]
        );


    const subtotalCarrito =
        useMemo(
            () => {

                return carrito.reduce(
                    (
                        total,
                        item
                    ) => {

                        const precio = obtenerPrecioAplicado(item, item.cantidad);


                        return (
                            total
                            +
                            (
                                precio
                                *
                                item.cantidad
                            )
                        );

                    },
                    0
                );

            },
            [
                carrito
            ]
        );


    const costoEnvio =
        entrega === 'ENVIO'
            ? COSTO_ENVIO_ESTIMADO
            : 0;


    const totalCarrito =
        subtotalCarrito + costoEnvio;


    // ========================================================
    // FINALIZAR PEDIDO
    // ========================================================

    function continuarCompra() {

        if (
            carrito.length === 0
        ) {

            return;

        }


        setMensaje('');
        setPasoCarrito('cliente');

    }


    function continuarDatosCliente(evento) {

        evento.preventDefault();
        setPasoCarrito('entrega');

    }


    function continuarEntrega(evento) {

        evento.preventDefault();

        if (entrega === 'ENVIO') {
            setPasoCarrito('pago');
            return;
        }

        setPasoCarrito('pago');

    }


    function continuarPago(evento) {

        evento.preventDefault();
        setPasoCarrito('revision');

    }


    async function confirmarSolicitud() {

        try {

            setEnviandoPedido(true);
            setMensaje('');

            const respuesta = await fetch(
                API_PEDIDOS,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cliente: datosCliente,
                        entrega: {
                            tipo: entrega,
                            ...datosEntrega
                        },
                        pago: {
                            tipo: tipoPago,
                            ...datosPago
                        },
                        items: carrito.map(item => ({
                            producto_id: item.producto_id,
                            cantidad: item.cantidad
                        }))
                    })
                }
            );

            const resultado = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                throw new Error(
                    resultado.error || 'No fue posible registrar el pedido.'
                );
            }

            const lineas = resultado.detalles
                .map(detalle => {
                    const item = carrito.find(
                        producto => producto.producto_id === detalle.productoId
                    );

                    const tipoPrecio = detalle.precioMayoristaAplicado ? 'Precio mayorista aplicado' : 'Precio unitario';
                    return `${item?.nombre || 'Producto'} x${detalle.cantidad}: ${formatoPrecio(detalle.subtotal)} (${tipoPrecio}: ${formatoPrecio(detalle.precioUnitario)} c/u)`;
                })
                .join('\n');

            const direccion = entrega === 'ENVIO'
                ? ` Dirección: ${datosEntrega.direccion}, ${datosEntrega.municipio}, ${datosEntrega.departamento}.`
                : '';

            const mensajeWhatsapp = [
                `Pedido ${resultado.pedido.numero_pedido}`,
                `Cliente: ${datosCliente.nombre}`,
                `Teléfono: ${datosCliente.telefono}`,
                `Productos:\n${lineas}`,
                `Subtotal: ${formatoPrecio(resultado.subtotal)}`,
                `Envío: ${formatoPrecio(resultado.costoEnvio)}`,
                `Total: ${formatoPrecio(resultado.total)}`,
                `Entrega: ${entrega === 'ENVIO' ? 'Solicitar envío' : 'Retiro en tienda'}.${direccion}`,
                `Pago: ${tipoPago}`,
                `Estado: ${resultado.pedido.estado}`
            ].join('\n');

            window.open(
                `https://wa.me/${WHATSAPP_EMPRESA}?text=${encodeURIComponent(mensajeWhatsapp)}`,
                '_blank',
                'noopener,noreferrer'
            );

            setMensaje(
                `Solicitud ${resultado.pedido.numero_pedido} registrada correctamente.`
            );
            setCarrito([]);
            setPasoCarrito('carrito');

        } catch (errorPedido) {

            setMensaje(errorPedido.message);

        } finally {

            setEnviandoPedido(false);

        }

    }


    // ========================================================
    // CSS
    // ========================================================

    const estilos = `

        * {
            box-sizing: border-box;
        }


        html {
            scroll-behavior: smooth;
        }


        body {
            margin: 0;

            font-family:
                Inter,
                Arial,
                Helvetica,
                sans-serif;

            color:
                #17233d;

            background:
                #f5f8fc;
        }


        button,
        input,
        select {
            font: inherit;
        }


        button {
            transition:
                transform .18s ease,
                box-shadow .18s ease,
                background .18s ease;
        }


        button:hover:not(:disabled) {
            transform:
                translateY(-1px);
        }


        /* ====================================================
           PÁGINA
        ==================================================== */

        .catalogo-page {
            min-height:
                100vh;

            background:
                linear-gradient(
                    180deg,
                    #f9fbfe 0%,
                    #f2f6fb 100%
                );
        }


        .catalogo-container {
            width:
                min(
                    1240px,
                    calc(
                        100% - 40px
                    )
                );

            margin:
                0 auto;
        }


        /* ====================================================
           HEADER
        ==================================================== */

        .catalogo-header {
            position:
                sticky;

            top: 0;

            z-index: 50;

            border-bottom:
                1px solid
                #dfe7f0;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .96
                );

            backdrop-filter:
                blur(12px);
        }


        .catalogo-header-inner {
            min-height:
                74px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap:
                25px;
        }


        .catalogo-brand {
            display:
                flex;

            align-items:
                center;

            gap:
                11px;

            color:
                #173f73;

            text-decoration:
                none;
        }


        .catalogo-brand-logo {
            width: 180px;
            height: 70px;
            display: block;
            flex: 0 0 auto;
            object-fit: contain;
            background: #ffffff;
            border-radius: 8px;
        }


        .catalogo-brand-text {
            display:
                flex;

            flex-direction:
                column;

            line-height:
                1.05;
        }


        .catalogo-brand-text strong {
            font-size:
                16px;

            letter-spacing:
                -.2px;
        }


        .catalogo-brand-text small {
            margin-top:
                4px;

            color:
                #71809a;

            font-size: 14px;
        }


        .catalogo-header-actions {
            display:
                flex;

            align-items:
                center;

            gap:
                10px;
        }


        .inicio-link {
            padding:
                10px 13px;

            border-radius:
                7px;

            color:
                #355b87;

            text-decoration:
                none;

            font-size: 14px;

            font-weight:
                700;
        }


        .inicio-link:hover {
            background:
                #f0f5fb;
        }


        .cart-button {
            min-height:
                42px;

            display:
                inline-flex;

            align-items:
                center;

            gap:
                9px;

            padding:
                0 17px;

            border:
                0;

            border-radius:
                8px;

            color:
                white;

            background:
                linear-gradient(
                    90deg,
                    #154c98,
                    #0e6ada
                );

            cursor:
                pointer;

            font-size: 14px;

            font-weight:
                700;

            box-shadow:
                0 7px 18px
                rgba(
                    20,
                    89,
                    181,
                    .18
                );
        }


        .cart-count {
            min-width:
                22px;

            height:
                22px;

            display:
                grid;

            place-items:
                center;

            padding:
                0 5px;

            border-radius:
                20px;

            color:
                #14509c;

            background:
                white;

            font-size: 14px;
        }


        /* ====================================================
           HERO
        ==================================================== */

        .catalogo-hero {
            padding:
                55px 0 35px;
        }


        .catalogo-hero-box {
            position:
                relative;

            overflow:
                hidden;

            display:
                grid;

            grid-template-columns:
                1.15fr .85fr;

            align-items:
                center;

            min-height:
                315px;

            padding:
                50px;

            border:
                1px solid
                #dce7f3;

            border-radius:
                22px;

            background:
                linear-gradient(
                    125deg,
                    #ffffff 0%,
                    #edf7ff 100%
                );

            box-shadow:
                0 14px 45px
                rgba(
                    35,
                    71,
                    110,
                    .07
                );
        }


        .hero-decoration {
            width:
                410px;

            height:
                410px;

            position:
                absolute;

            right:
                -120px;

            top:
                -90px;

            border-radius:
                50%;

            background:
                radial-gradient(
                    circle,
                    rgba(
                        38,
                        139,
                        221,
                        .14
                    ),
                    rgba(
                        38,
                        139,
                        221,
                        0
                    )
                );
        }


        .hero-content {
            position:
                relative;

            z-index:
                2;
        }


        .hero-eyebrow {
            display:
                inline-block;

            margin-bottom:
                10px;

            color:
                #1267c9;

            font-size: 14px;

            font-weight:
                800;

            letter-spacing:
                .7px;

            text-transform:
                uppercase;
        }


        .hero-content h1 {
            max-width:
                650px;

            margin:
                0;

            color:
                #11375e;

            font-size:
                clamp(
                    2.5rem,
                    5vw,
                    4.8rem
                );

            line-height:
                .98;

            letter-spacing:
                -2px;
        }


        .hero-content h1 span {
            color:
                #1871b4;
        }


        .hero-content p {
            max-width:
                610px;

            margin:
                22px 0 0;

            color:
                #60748d;

            font-size:
                15px;

            line-height:
                1.65;
        }


        .hero-visual {
            position:
                relative;

            z-index:
                2;

            display:
                grid;

            place-items:
                center;
        }


        .hero-visual-card {
            width: min(360px, 100%);
            aspect-ratio: 2.58 / 1;
            overflow: hidden;
            border: 5px solid rgba(255, 255, 255, .9);
            border-radius: 18px;
            background: #ffffff;
            box-shadow: 0 18px 45px rgba(39, 86, 131, .18);
        }

        .hero-visual-card img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }


        /* ====================================================
           BUSCADOR
        ==================================================== */

        .catalogo-tools {
            margin-bottom:
                38px;

            padding:
                18px;

            border:
                1px solid
                #dce5ef;

            border-radius:
                13px;

            background:
                white;

            box-shadow:
                0 5px 18px
                rgba(
                    23,
                    59,
                    95,
                    .035
                );
        }


        .catalogo-search {
            min-height:
                48px;

            display:
                flex;

            align-items:
                center;

            gap:
                11px;

            padding:
                0 16px;

            border:
                1px solid
                #d2deeb;

            border-radius:
                8px;

            background:
                #f9fbfd;
        }


        .catalogo-search-icon {
            color:
                #53749b;

            font-size:
                20px;
        }


        .catalogo-search input {
            width:
                100%;

            border:
                0;

            outline:
                0;

            color:
                #324d6d;

            background:
                transparent;

            font-size:
                13px;
        }


        .category-tabs {
            display:
                flex;

            gap:
                8px;

            margin-top:
                15px;

            padding-bottom:
                2px;

            overflow-x:
                auto;
        }


        .category-tab {
            flex:
                0 0 auto;

            min-height:
                34px;

            padding:
                0 13px;

            border:
                1px solid
                #d8e3ee;

            border-radius:
                20px;

            color:
                #45617f;

            background:
                white;

            cursor:
                pointer;

            font-size: 14px;

            font-weight:
                700;
        }


        .category-tab.active {
            color:
                white;

            border-color:
                #176bd8;

            background:
                #176bd8;
        }


        /* ====================================================
           ESTADOS
        ==================================================== */

        .catalogo-status {
            padding:
                45px 20px;

            border:
                1px solid
                #dfe7ef;

            border-radius:
                12px;

            color:
                #566b84;

            background:
                white;

            text-align:
                center;
        }


        .catalogo-status.error {
            color:
                #ae3a45;

            border-color:
                #f0c7cb;

            background:
                #fff5f6;
        }


        /* ====================================================
           CATEGORÍAS
        ==================================================== */

        .catalogo-section {
            margin-bottom:
                48px;
        }


        .catalogo-section-header {
            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap:
                15px;

            margin-bottom:
                17px;
        }


        .catalogo-section-header h2 {
            margin:
                0;

            color:
                #193e68;

            font-size:
                22px;

            letter-spacing:
                -.4px;
        }


        .catalogo-section-count {
            padding:
                5px 10px;

            border-radius:
                20px;

            color:
                #527091;

            background:
                #eaf1f8;

            font-size: 14px;

            font-weight:
                700;
        }


        /* ====================================================
           PRODUCTOS
        ==================================================== */

        .productos-grid {
            display:
                grid;

            grid-template-columns:
                repeat(
                    4,
                    minmax(
                        0,
                        1fr
                    )
                );

            gap:
                17px;
        }


        .producto-card {
            overflow:
                hidden;

            display:
                flex;

            flex-direction:
                column;

            border:
                1px solid
                #dce5ef;

            border-radius:
                13px;

            background:
                white;

            box-shadow:
                0 6px 22px
                rgba(
                    23,
                    63,
                    105,
                    .04
                );

            transition:
                transform .2s ease,
                box-shadow .2s ease,
                border .2s ease;
        }


        .producto-card:hover {
            transform:
                translateY(-4px);

            border-color:
                #b9d1eb;

            box-shadow:
                0 13px 32px
                rgba(
                    23,
                    63,
                    105,
                    .10
                );
        }


        .producto-image {
            height:
                190px;

            position:
                relative;

            display:
                grid;

            place-items:
                center;

            overflow:
                hidden;

            background:
                linear-gradient(
                    145deg,
                    #f5f8fb,
                    #eaf0f6
                );
        }


        .producto-image img {
            width:
                100%;

            height:
                100%;

            object-fit:
                contain;

            padding:
                15px;
        }


        .producto-placeholder {
            color:
                #9bacbf;

            font-size:
                54px;
        }


        .producto-status {
            position:
                absolute;

            top:
                11px;

            right:
                11px;

            padding:
                5px 9px;

            border-radius:
                20px;

            color:
                #137b4f;

            background:
                #dcf5e8;

            font-size: 14px;

            font-weight:
                800;
        }


        .producto-status.agotado {
            color:
                #be3943;

            background:
                #ffe2e5;
        }


        .producto-body {
            flex:
                1;

            display:
                flex;

            flex-direction:
                column;

            padding:
                16px;
        }


        .producto-category {
            margin-bottom:
                7px;

            color:
                #637b96;

            font-size: 14px;

            font-weight:
                700;

            text-transform:
                uppercase;
        }


        .producto-body h3 {
            margin:
                0 0 8px;

            color:
                #183c67;

            font-size:
                16px;

            line-height:
                1.25;
        }


        .producto-description {
            flex:
                1;

            margin:
                0 0 18px;

            color:
                #718098;

            font-size: 14px;

            line-height:
                1.55;
        }


        .producto-footer {
            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap:
                10px;

            margin-bottom:
                12px;
        }


        .producto-price {
            color:
                #123f75;

            font-size:
                16px;

            font-weight:
                900;
        }


        .precio-mayorista {
            display: grid;
            gap: 4px;
            margin: -5px 0 13px;
            color: #24724e;
            font-size: 14px;
        }

        .precio-mayorista strong {
            font-weight: 800;
        }

        .precio-mayorista small {
            color: #63758a;
            font-size: 12px;
            font-weight: 500;
        }

        .modal-precio-mayorista {
            margin: -7px 0 16px;
        }
.detail-button {
            flex:
                1;

            min-height:
                38px;

            border:
                1px solid
                #176bd8;

            border-radius:
                6px;

            color:
                #1763c2;

            background:
                white;

            cursor:
                pointer;

            font-size: 14px;

            font-weight:
                800;
        }


        .producto-actions {
            display:
                flex;

            gap:
                8px;
        }


        .add-product-button {
            flex:
                1;

            min-height:
                38px;

            border:
                0;

            border-radius:
                6px;

            color:
                white;

            background:
                #176bd8;

            cursor:
                pointer;

            font-size: 14px;

            font-weight:
                800;
        }


        .add-product-button:disabled {
            color:
                #8a98a8;

            background:
                #dbe3eb;

            cursor:
                not-allowed;
        }


        .detail-button:hover {
            color:
                white;

            background:
                #176bd8;
        }


        /* ====================================================
           MODAL
        ==================================================== */

        .modal-overlay {
            position:
                fixed;

            inset:
                0;

            z-index:
                1000;

            display:
                grid;

            place-items:
                center;

            padding:
                20px;

            background:
                rgba(
                    12,
                    28,
                    49,
                    .62
                );

            backdrop-filter:
                blur(5px);
        }


        .product-modal {
            width:
                min(
                    760px,
                    100%
                );

            max-height:
                90vh;

            overflow:
                auto;

            border-radius:
                15px;

            background:
                white;

            box-shadow:
                0 25px 70px
                rgba(
                    0,
                    0,
                    0,
                    .24
                );
        }


        .product-modal-header {
            display:
                flex;

            align-items:
                flex-start;

            justify-content:
                space-between;

            gap:
                20px;

            padding:
                22px 24px;

            border-bottom:
                1px solid
                #e5ebf2;
        }


        .product-modal-header small {
            color:
                #647c98;

            font-size: 14px;

            text-transform:
                uppercase;
        }


        .product-modal-header h2 {
            margin:
                6px 0 0;

            color:
                #183c67;

            font-size:
                24px;
        }


        .close-button {
            width:
                36px;

            height:
                36px;

            flex:
                0 0 36px;

            border:
                0;

            border-radius:
                50%;

            color:
                #425d79;

            background:
                #eef3f8;

            cursor:
                pointer;

            font-size:
                17px;
        }


        .modal-content {
            display:
                grid;

            grid-template-columns:
                280px 1fr;

            gap:
                25px;

            padding:
                24px;
        }


        .modal-image {
            min-height:
                270px;

            display:
                grid;

            place-items:
                center;

            overflow:
                hidden;

            border-radius:
                10px;

            background:
                #f0f4f8;
        }


        .modal-image img {
            width:
                100%;

            max-height:
                320px;

            object-fit:
                contain;
        }


        .modal-placeholder {
            color:
                #9aabbd;

            font-size:
                65px;
        }


        .modal-description {
            margin:
                0 0 18px;

            color:
                #687c94;

            font-size: 14px;

            line-height:
                1.65;
        }


        .product-data {
            display:
                grid;

            grid-template-columns:
                repeat(
                    2,
                    1fr
                );

            gap:
                10px;
        }


        .product-data div {
            padding:
                10px;

            border:
                1px solid
                #e4eaf1;

            border-radius:
                6px;

            background:
                #fafcfe;
        }


        .product-data dt {
            margin-bottom:
                4px;

            color:
                #70829a;

            font-size: 14px;

            font-weight:
                700;

            text-transform:
                uppercase;
        }


        .product-data dd {
            margin:
                0;

            color:
                #294c72;

            font-size: 14px;

            font-weight:
                700;
        }


        .modal-price {
            margin:
                19px 0 13px;

            color:
                #123f75;

            font-size:
                23px;

            font-weight:
                900;
        }


        .add-cart-button {
            width:
                100%;

            min-height:
                44px;

            border:
                0;

            border-radius:
                7px;

            color:
                white;

            background:
                linear-gradient(
                    90deg,
                    #1459b4,
                    #0871df
                );

            cursor:
                pointer;

            font-size: 14px;

            font-weight:
                800;
        }


        .add-cart-button:disabled {
            color:
                #8a98a8;

            background:
                #dbe3eb;

            cursor:
                not-allowed;
        }


        /* ====================================================
           CARRITO
        ==================================================== */

        .cart-overlay {
            position:
                fixed;

            inset:
                0;

            z-index:
                1100;

            display:
                flex;

            justify-content:
                flex-end;

            background:
                rgba(
                    12,
                    28,
                    49,
                    .48
                );

            backdrop-filter:
                blur(3px);

            animation:
                cart-overlay-in .2s ease-out;
        }


        @keyframes cart-overlay-in {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }


        .cart-drawer {
            width:
                min(
                    480px,
                    100%
                );

            height:
                100%;

            display:
                flex;

            flex-direction:
                column;

            background:
                #f8fafc;

            animation:
                cart-drawer-in .24s ease-out;

            box-shadow:
                -15px 0 45px
                rgba(
                    0,
                    0,
                    0,
                    .18
                );
        }


        @keyframes cart-drawer-in {
            from {
                transform: translateX(24px);
            }

            to {
                transform: translateX(0);
            }
        }


        .cart-header {
            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap:
                15px;

            padding:
                20px 24px;

            border-bottom:
                1px solid
                #e2e8ef;

            background:
                white;
        }


        .cart-header h2 {
            margin:
                0;

            color:
                #183c67;

            font-size:
                20px;

            letter-spacing:
                .2px;
        }


        .cart-body {
            flex:
                1;

            overflow-y:
                auto;

            padding:
                14px 20px 20px;
        }


        .empty-cart {
            margin-top:
                18px;

            padding:
                48px 20px;

            border:
                1px dashed
                #cbd9e8;

            border-radius:
                10px;

            background:
                white;

            color:
                #728298;

            text-align:
                center;
        }


        .empty-cart-icon {
            display:
                block;

            margin-bottom:
                12px;

            font-size:
                45px;
        }


        .cart-item {
            display:
                grid;

            grid-template-columns:
                1fr auto;

            gap:
                12px;

            margin-bottom:
                10px;

            padding:
                15px;

            border:
                1px solid
                #e1e9f2;

            border-radius:
                9px;

            background:
                white;

            box-shadow:
                0 3px 10px
                rgba(28, 62, 98, .04);

            border-bottom:
                1px solid
                #e6ebf0;
        }


        .cart-item h4 {
            margin:
                0 0 6px;

            color:
                #24496f;

            font-size:
                13px;

            line-height:
                1.35;
        }


        .cart-item-price {
            color:
                #617890;

            font-size: 14px;

            line-height:
                1.5;
        }


        .cart-item-subtotal {
            display:
                block;

            margin-top:
                5px;

            color:
                #123f75;

            font-size:
                13px;
        }


        .cart-item-controls {
            display:
                flex;

            align-items:
                center;

            gap:
                6px;
        }


        .quantity-button {
            width:
                29px;

            height:
                29px;

            border:
                1px solid
                #d4dfeb;

            border-radius:
                5px;

            color:
                #24547e;

            background:
                #f8fafc;

            cursor:
                pointer;

            font-size:
                16px;

            font-weight:
                700;

            transition:
                background .15s ease,
                border-color .15s ease;
        }


        .quantity-button:hover {
            border-color:
                #176bd8;

            background:
                #edf5ff;
        }


        .quantity-input {
            width:
                45px;

            height:
                29px;

            border:
                1px solid
                #d4dfeb;

            border-radius:
                5px;

            color:
                #31506f;

            text-align:
                center;

            font-size: 14px;

            font-weight:
                700;
        }


        .remove-button {
            margin-left:
                4px;

            border:
                0;

            color:
                #d63e49;

            background:
                transparent;

            cursor:
                pointer;

            font-size:
                16px;

            line-height:
                1;
        }


        .remove-button:hover {
            color:
                #a92432;
        }


        .cart-footer {
            max-height:
                58%;

            overflow-y:
                auto;

            padding:
                18px 22px 22px;

            border-top:
                1px solid
                #e3e9f0;

            background:
                white;

            box-shadow:
                0 -5px 18px
                rgba(26, 59, 94, .06);
        }


        .cart-total {
            display:
                flex;

            justify-content:
                space-between;

            margin-bottom:
                10px;

            color:
                #173d69;

            font-size:
                14px;

            font-weight:
                900;
        }


        .cart-total-small {
            margin-bottom: 8px;
            color: #617890;
            font-size: 14px;
            font-weight: 700;
        }


        .cart-total:last-of-type {
            margin-top:
                5px;

            padding-top:
                12px;

            border-top:
                1px solid
                #e2eaf2;

            font-size:
                19px;
        }


        .cart-step-form {
            display: grid;
            gap: 9px;
            margin-top: 14px;

            padding-top:
                14px;

            border-top:
                1px solid
                #e4ebf3;
        }


        .cart-step-form h3 {
            margin: 0 0 4px;
            color: #183c67;
            font-size: 14px;

            letter-spacing:
                .1px;
        }


        .cart-step-form input,
        .cart-step-form textarea,
        .cart-step-form select {
            width: 100%;
            min-height: 36px;
            padding: 8px 10px;
            border: 1px solid #d2deea;
            border-radius: 6px;
            color: #405c7d;
            background: white;
            font: inherit;
            font-size: 14px;

            outline:
                none;

            transition:
                border-color .15s ease,
                box-shadow .15s ease;
        }


        .cart-step-form input:focus,
        .cart-step-form textarea:focus,
        .cart-step-form select:focus {
            border-color:
                #176bd8;

            box-shadow:
                0 0 0 3px
                rgba(23, 107, 216, .12);
        }


        .cart-step-form textarea {
            min-height: 64px;
            resize: vertical;
        }


        .cart-step-form p {
            margin: 0;
            color: #526d8a;
            font-size: 14px;
            line-height: 1.45;
        }


        .transfer-account-info {
            display: grid;
            gap: 4px;
            padding: 11px;
            border: 1px solid #b9d2ed;
            border-radius: 6px;
            color: #214f80;
            background: #edf6ff;
            font-size: 14px;
        }


        .transfer-account-info span {
            color: #123f75;
            font-size: 16px;
            font-weight: 900;
            letter-spacing: 1px;
        }


        .cart-field {
            display:
                grid;

            gap:
                6px;

            margin-bottom:
                13px;
        }


        .cart-field label {
            color:
                #405e7e;

            font-size: 14px;

            font-weight:
                800;
        }


        .cart-field select {
            min-height:
                38px;

            padding:
                0 10px;

            border:
                1px solid
                #d2deea;

            border-radius:
                6px;

            color:
                #405c7d;

            background:
                white;
        }


        .checkout-button {
            width:
                100%;

            min-height:
                44px;

            border:
                0;

            border-radius:
                7px;

            color:
                white;

            background:
                linear-gradient(
                    135deg,
                    #155fbe,
                    #0b78d0
                );

            cursor:
                pointer;

            font-size: 14px;

            font-weight:
                800;

            box-shadow:
                0 7px 14px
                rgba(21, 95, 190, .18);

            transition:
                transform .15s ease,
                box-shadow .15s ease;
        }


        .checkout-button:hover:not(:disabled) {
            transform:
                translateY(-1px);

            box-shadow:
                0 9px 18px
                rgba(21, 95, 190, .25);
        }


        .checkout-button:disabled {
            opacity:
                .5;

            cursor:
                not-allowed;
        }


        .continue-shopping-button {
            width:
                100%;

            min-height:
                36px;

            margin-bottom:
                9px;

            border:
                1px solid
                #c8d8e8;

            border-radius:
                7px;

            color:
                #315d89;

            background:
                white;

            cursor:
                pointer;

            font-size: 14px;

            font-weight:
                800;

            transition:
                background .15s ease,
                border-color .15s ease;
        }


        .continue-shopping-button:hover {
            border-color:
                #176bd8;

            background:
                #f1f7ff;
        }


        .cart-message {
            margin:
                12px 0 0;

            padding:
                10px;

            border-radius:
                6px;

            color:
                #14764d;

            background:
                #e8f7ef;

            font-size: 14px;

            line-height:
                1.5;
        }


        /* ====================================================
           FOOTER
        ==================================================== */

        .catalogo-footer {
            margin-top:
                50px;

            padding:
                30px 0;

            border-top:
                1px solid
                #dce5ef;

            color:
                #77869a;

            text-align:
                center;

            font-size: 14px;
        }


        /* ====================================================
           RESPONSIVE
        ==================================================== */

        @media (
            max-width: 1050px
        ) {

            .productos-grid {
                grid-template-columns:
                    repeat(
                        3,
                        1fr
                    );
            }


            .catalogo-hero-box {
                grid-template-columns:
                    1fr .55fr;

                padding:
                    38px;
            }


            .hero-visual-card {
                width: 250px;
                aspect-ratio: 2.58 / 1;
            }

        }


        @media (
            max-width: 800px
        ) {

            .productos-grid {
                grid-template-columns:
                    repeat(
                        2,
                        1fr
                    );
            }


            .catalogo-hero-box {
                grid-template-columns:
                    1fr;
            }


            .hero-visual {
                display:
                    none;
            }


            .modal-content {
                grid-template-columns:
                    1fr;
            }


            .modal-image {
                min-height:
                    200px;
            }

        }


        @media (
            max-width: 560px
        ) {

            .catalogo-container {
                width:
                    min(
                        100% - 24px,
                        1240px
                    );
            }


            .catalogo-header-inner {
                min-height:
                    65px;
            }


            .catalogo-brand-text small,
            .inicio-link {
                display:
                    none;
            }


            .catalogo-hero {
                padding:
                    25px 0;
            }


            .catalogo-hero-box {
                min-height:
                    auto;

                padding:
                    30px 22px;

                border-radius:
                    14px;
            }


            .hero-content h1 {
                font-size:
                    2.7rem;
            }


            .productos-grid {
                grid-template-columns:
                    1fr;
            }


            .producto-image {
                height:
                    220px;
            }


            .product-data {
                grid-template-columns:
                    1fr;
            }

        }

    `;


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <>

            <style>
                {estilos}
            </style>


            <div className="catalogo-page">


                {/* =================================================
                    HEADER
                ================================================== */}

                <header className="catalogo-header">

                    <div className="catalogo-container catalogo-header-inner">


                        <Link
                            to="/"
                            className="catalogo-brand"
                        >

                            <img
                                className="catalogo-brand-logo"
                                src="/logo-comercial-san-cristobal.png"
                                alt="Logotipo Comercial San Cristóbal"
                            />


                            <div className="catalogo-brand-text">

                                <strong>
                                    Comercial San Cristóbal
                                </strong>

                                <small>
                                    Plásticos Desechables
                                </small>

                            </div>

                        </Link>


                        <div className="catalogo-header-actions">


                            <Link
                                to="/"
                                className="inicio-link"
                            >
                                Inicio
                            </Link>


                            <button
                                type="button"
                                className="cart-button"
                                onClick={
                                    () => {

                                        setMensaje('');

                                        setMostrarCarrito(
                                            true
                                        );

                                    }
                                }
                            >

                                🛒

                                Mi carrito

                                <span className="cart-count">
                                    {cantidadCarrito}
                                </span>

                            </button>


                        </div>

                    </div>

                </header>



                {/* =================================================
                    HERO
                ================================================== */}

                <section className="catalogo-hero">

                    <div className="catalogo-container">


                        <div className="catalogo-hero-box">


                            <div className="hero-decoration">
                            </div>


                            <div className="hero-content">

                                <span className="hero-eyebrow">
                                    Catálogo de productos
                                </span>


                                <h1>

                                    Productos para

                                    <br />

                                    <span>
                                        cada necesidad
                                    </span>

                                </h1>


                                <p>

                                    Consulta nuestros productos,
                                    especificaciones, precios y
                                    disponibilidad en Comercial
                                    San Cristóbal.

                                </p>

                            </div>


                            <div className="hero-visual">

                                <div className="hero-visual-card">
                                    <img
                                        src="/logo-comercial-san-cristobal.png"
                                        alt="Logotipo Comercial San Cristóbal"
                                    />
                                </div>

                            </div>


                        </div>

                    </div>

                </section>



                {/* =================================================
                    CATÁLOGO
                ================================================== */}

                <main className="catalogo-container">


                    {/* BUSCADOR */}

                    <section className="catalogo-tools">


                        <div className="catalogo-search">

                            <span className="catalogo-search-icon">
                                ⌕
                            </span>


                            <input
                                type="search"
                                placeholder="Buscar por nombre, SKU, categoría o descripción..."
                                value={busqueda}
                                onChange={
                                    evento =>
                                        setBusqueda(
                                            evento.target.value
                                        )
                                }
                            />

                        </div>



                        <div className="category-tabs">


                            <button
                                type="button"
                                className={
                                    categoriaSeleccionada ===
                                        'Todas'

                                        ? 'category-tab active'

                                        : 'category-tab'
                                }
                                onClick={
                                    () =>
                                        setCategoriaSeleccionada(
                                            'Todas'
                                        )
                                }
                            >
                                Todos los productos
                            </button>


                            {
                                categoriasDisponibles.map(
                                    categoria => (

                                        <button
                                            key={
                                                categoria
                                            }
                                            type="button"
                                            className={
                                                categoriaSeleccionada ===
                                                    categoria

                                                    ? 'category-tab active'

                                                    : 'category-tab'
                                            }
                                            onClick={
                                                () =>
                                                    setCategoriaSeleccionada(
                                                        categoria
                                                    )
                                            }
                                        >

                                            {categoria}

                                        </button>

                                    )
                                )
                            }


                        </div>


                    </section>



                    {/* CARGANDO */}

                    {
                        cargando
                        &&
                        (

                            <div className="catalogo-status">

                                Cargando productos...

                            </div>

                        )
                    }



                    {/* ERROR */}

                    {
                        error
                        &&
                        (

                            <div className="catalogo-status error">

                                {error}

                            </div>

                        )
                    }



                    {/* SIN PRODUCTOS */}

                    {
                        !cargando
                        &&
                        !error
                        &&
                        productosFiltrados.length === 0
                        &&
                        (

                            <div className="catalogo-status">

                                No se encontraron productos
                                con los criterios seleccionados.

                            </div>

                        )
                    }



                    {/* PRODUCTOS POR CATEGORÍA */}

                    {
                        !cargando
                        &&
                        !error
                        &&
                        Object.entries(
                            productosPorCategoria
                        ).map(
                            (
                                [
                                    categoria,
                                    productosCategoria
                                ]
                            ) => (

                                <section
                                    key={
                                        categoria
                                    }
                                    className="catalogo-section"
                                >


                                    <div className="catalogo-section-header">

                                        <h2>
                                            {categoria}
                                        </h2>


                                        <span className="catalogo-section-count">

                                            {
                                                productosCategoria.length
                                            }

                                            {' '}

                                            {
                                                productosCategoria.length === 1
                                                    ? 'producto'
                                                    : 'productos'
                                            }

                                        </span>

                                    </div>



                                    <div className="productos-grid">


                                        {
                                            productosCategoria.map(
                                                producto => {

                                                    const precio =
                                                        obtenerPrecio(
                                                            producto
                                                        );


                                                    const disponible =
                                                        productoDisponible(
                                                            producto
                                                        );


                                                    return (

                                                        <article
                                                            key={
                                                                producto.producto_id
                                                            }
                                                            className="producto-card"
                                                        >


                                                            {/* IMAGEN */}

                                                            <div className="producto-image">


                                                                {
                                                                    producto.imagen_url

                                                                        ?

                                                                        <img
                                                                            src={
                                                                                producto.imagen_url
                                                                            }
                                                                            alt={
                                                                                producto.nombre
                                                                            }
                                                                            loading="lazy"
                                                                            onError={
                                                                                evento => {

                                                                                    evento.currentTarget.style.display =
                                                                                        'none';

                                                                                }
                                                                            }
                                                                        />

                                                                        :

                                                                        <span className="producto-placeholder">
                                                                            ▣
                                                                        </span>
                                                                }


                                                                <span
                                                                    className={
                                                                        disponible

                                                                            ? 'producto-status'

                                                                            : 'producto-status agotado'
                                                                    }
                                                                >

                                                                    {
                                                                        producto.disponibilidad
                                                                        ||
                                                                        (
                                                                            disponible
                                                                                ? 'Disponible'
                                                                                : 'Agotado'
                                                                        )
                                                                    }

                                                                </span>


                                                            </div>



                                                            {/* INFORMACIÓN */}

                                                            <div className="producto-body">


                                                                <span className="producto-category">

                                                                    {
                                                                        producto.categoria
                                                                        ||
                                                                        categoria
                                                                    }

                                                                </span>


                                                                <h3>
                                                                    {producto.nombre}
                                                                </h3>


                                                                <p className="producto-description">

                                                                    {
                                                                        producto.descripcion
                                                                        ||
                                                                        (
                                                                            producto.sku
                                                                                ? `Código SKU: ${producto.sku}`
                                                                                : 'Consulta las características y disponibilidad del producto.'
                                                                        )
                                                                    }

                                                                </p>


                                                                <div className="producto-footer">

                                                                    <span className="producto-price">

                                                                        {
                                                                            formatoPrecio(
                                                                                precio
                                                                            )
                                                                        }

                                                                    </span>

                                                                </div>
                                                                <div className="precio-mayorista">
                                                                    <strong>
                                                                        Precio mayorista: {obtenerPrecioMayorista(producto) === null ? "No configurado" : formatoPrecio(obtenerPrecioMayorista(producto))}
                                                                    </strong>
                                                                    <small>Al comprar más de 10 productos</small>
                                                                </div>


                                                                <div className="producto-actions">

                                                                    <button
                                                                        type="button"
                                                                        className="add-product-button"
                                                                        disabled={
                                                                            !disponible
                                                                        }
                                                                        onClick={
                                                                            () =>
                                                                                agregarAlCarrito(
                                                                                    producto
                                                                                )
                                                                        }
                                                                    >

                                                                        Agregar

                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="detail-button"
                                                                        onClick={
                                                                            () =>
                                                                                setProductoSeleccionado(
                                                                                    producto
                                                                                )
                                                                        }
                                                                    >

                                                                        Ver detalle

                                                                    </button>

                                                                </div>


                                                            </div>


                                                        </article>

                                                    );

                                                }
                                            )
                                        }


                                    </div>


                                </section>

                            )
                        )
                    }



                    <footer className="catalogo-footer">

                        © 2026 Comercial San Cristóbal ·
                        Plásticos Desechables

                    </footer>


                </main>



                {/* =================================================
                    MODAL DETALLE
                ================================================== */}

                {
                    productoSeleccionado
                    &&
                    (

                        <div
                            className="modal-overlay"
                            onClick={
                                () =>
                                    setProductoSeleccionado(
                                        null
                                    )
                            }
                        >


                            <section
                                className="product-modal"
                                onClick={
                                    evento =>
                                        evento.stopPropagation()
                                }
                            >


                                <header className="product-modal-header">


                                    <div>

                                        <small>

                                            {
                                                productoSeleccionado.categoria
                                                ||
                                                'Producto'
                                            }

                                        </small>


                                        <h2>
                                            {
                                                productoSeleccionado.nombre
                                            }
                                        </h2>

                                    </div>


                                    <button
                                        type="button"
                                        className="close-button"
                                        onClick={
                                            () =>
                                                setProductoSeleccionado(
                                                    null
                                                )
                                        }
                                    >
                                        ×
                                    </button>


                                </header>



                                <div className="modal-content">


                                    {/* IMAGEN */}

                                    <div className="modal-image">

                                        {
                                            productoSeleccionado.imagen_url

                                                ?

                                                <img
                                                    src={
                                                        productoSeleccionado.imagen_url
                                                    }
                                                    alt={
                                                        productoSeleccionado.nombre
                                                    }
                                                />

                                                :

                                                <span className="modal-placeholder">
                                                    ▣
                                                </span>
                                        }

                                    </div>



                                    {/* INFORMACIÓN */}

                                    <div>


                                        <p className="modal-description">

                                            {
                                                productoSeleccionado.descripcion
                                                ||
                                                'Sin descripción registrada para este producto.'
                                            }

                                        </p>



                                        <dl className="product-data">


                                            <div>

                                                <dt>
                                                    SKU
                                                </dt>

                                                <dd>

                                                    {
                                                        productoSeleccionado.sku
                                                        ||
                                                        '-'
                                                    }

                                                </dd>

                                            </div>


                                            <div>

                                                <dt>
                                                    Material
                                                </dt>

                                                <dd>

                                                    {
                                                        productoSeleccionado.material
                                                        ||
                                                        '-'
                                                    }

                                                </dd>

                                            </div>


                                            <div>

                                                <dt>
                                                    Color
                                                </dt>

                                                <dd>

                                                    {
                                                        productoSeleccionado.color
                                                        ||
                                                        '-'
                                                    }

                                                </dd>

                                            </div>


                                            <div>

                                                <dt>
                                                    Capacidad
                                                </dt>

                                                <dd>

                                                    {
                                                        productoSeleccionado.capacidad_ml

                                                            ? `${productoSeleccionado.capacidad_ml} ml`

                                                            :
                                                            productoSeleccionado.volumen_oz

                                                                ? `${productoSeleccionado.volumen_oz} oz`

                                                                : '-'
                                                    }

                                                </dd>

                                            </div>


                                            <div>

                                                <dt>
                                                    Forma
                                                </dt>

                                                <dd>

                                                    {
                                                        productoSeleccionado.forma
                                                        ||
                                                        '-'
                                                    }

                                                </dd>

                                            </div>


                                            <div>

                                                <dt>
                                                    Número / Talla
                                                </dt>

                                                <dd>

                                                    {
                                                        productoSeleccionado.numero_talla
                                                        ||
                                                        '-'
                                                    }

                                                </dd>

                                            </div>


                                            <div>

                                                <dt>
                                                    Disponibilidad
                                                </dt>

                                                <dd>

                                                    {
                                                        productoSeleccionado.disponibilidad
                                                        ||
                                                        'Disponible'
                                                    }

                                                </dd>

                                            </div>


                                            <div>

                                                <dt>
                                                    Entrega
                                                </dt>

                                                <dd>
                                                    Retiro en tienda o envío
                                                </dd>

                                            </div>


                                        </dl>



                                        <div className="modal-price">

                                            {
                                                formatoPrecio(
                                                    obtenerPrecio(
                                                        productoSeleccionado
                                                    )
                                                )
                                            }

                                        </div>
                                        <div className="precio-mayorista modal-precio-mayorista">
                                            <strong>
                                                Precio mayorista: {obtenerPrecioMayorista(productoSeleccionado) === null ? "No configurado" : formatoPrecio(obtenerPrecioMayorista(productoSeleccionado))}
                                            </strong>
                                            <small>Al comprar más de 10 productos</small>
                                        </div>



                                        <button
                                            type="button"
                                            className="add-cart-button"
                                            disabled={
                                                !productoDisponible(
                                                    productoSeleccionado
                                                )
                                            }
                                            onClick={
                                                () =>
                                                    agregarAlCarrito(
                                                        productoSeleccionado
                                                    )
                                            }
                                        >

                                            {
                                                productoDisponible(
                                                    productoSeleccionado
                                                )

                                                    ? 'Agregar al carrito'

                                                    : 'Producto no disponible'
                                            }

                                        </button>


                                    </div>


                                </div>


                            </section>


                        </div>

                    )
                }



                {/* =================================================
                    CARRITO
                ================================================== */}

                {
                    mostrarCarrito
                    &&
                    (

                        <div
                            className="cart-overlay"
                            onClick={
                                () =>
                                    setMostrarCarrito(
                                        false
                                    )
                            }
                        >


                            <aside
                                className="cart-drawer"
                                onClick={
                                    evento =>
                                        evento.stopPropagation()
                                }
                            >


                                {/* HEADER */}

                                <header className="cart-header">


                                    <div>

                                        <h2>
                                            Mi carrito
                                        </h2>

                                    </div>


                                    <button
                                        type="button"
                                        className="close-button"
                                        onClick={
                                            () =>
                                                setMostrarCarrito(
                                                    false
                                                )
                                        }
                                    >
                                        ×
                                    </button>


                                </header>



                                {/* PRODUCTOS */}

                                <div className="cart-body">


                                    {
                                        carrito.length === 0

                                            ?

                                            <div className="empty-cart">

                                                <span className="empty-cart-icon">
                                                    🛒
                                                </span>

                                                Tu carrito está vacío.

                                            </div>

                                            :

                                            carrito.map(
                                                item => (

                                                    <article
                                                        key={
                                                            item.producto_id
                                                        }
                                                        className="cart-item"
                                                    >


                                                        <div>

                                                            <h4>
                                                                {item.nombre}
                                                            </h4>


                                                            <span className="cart-item-price">{formatoPrecio(obtenerPrecioAplicado(item, item.cantidad))} × {item.cantidad}{item.cantidad > 10 && obtenerPrecioMayorista(item) !== null ? " · Mayorista aplicado" : ""}</span>

                                                            <strong className="cart-item-subtotal">{formatoPrecio(obtenerPrecioAplicado(item, item.cantidad) * item.cantidad)}</strong>

                                                        </div>



                                                        <div className="cart-item-controls">


                                                            <button
                                                                type="button"
                                                                className="quantity-button"
                                                                onClick={
                                                                    () =>
                                                                        disminuirCantidad(
                                                                            item.producto_id
                                                                        )
                                                                }
                                                            >
                                                                −
                                                            </button>


                                                            <input
                                                                type="number"
                                                                min="1"
                                                                className="quantity-input"
                                                                value={
                                                                    item.cantidad
                                                                }
                                                                onChange={
                                                                    evento =>
                                                                        cambiarCantidad(
                                                                            item.producto_id,
                                                                            Math.max(
                                                                                1,
                                                                                Number(
                                                                                    evento.target.value
                                                                                )
                                                                                ||
                                                                                1
                                                                            )
                                                                        )
                                                                }
                                                            />


                                                            <button
                                                                type="button"
                                                                className="quantity-button"
                                                                onClick={
                                                                    () =>
                                                                        aumentarCantidad(
                                                                            item.producto_id
                                                                        )
                                                                }
                                                            >
                                                                +
                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="remove-button"
                                                                title="Eliminar"
                                                                onClick={
                                                                    () =>
                                                                        eliminarDelCarrito(
                                                                            item.producto_id
                                                                        )
                                                                }
                                                            >
                                                                ×
                                                            </button>


                                                        </div>


                                                    </article>

                                                )
                                            )
                                    }


                                </div>



                                {/* FOOTER CARRITO */}

                                <footer className="cart-footer">

                                    <div className="cart-total">
                                        <span>Subtotal</span>
                                        <span>{formatoPrecio(subtotalCarrito)}</span>
                                    </div>

                                    <div className="cart-total cart-total-small">
                                        <span>Costo de envío</span>
                                        <span>{formatoPrecio(costoEnvio)}</span>
                                    </div>

                                    <div className="cart-total">
                                        <span>Total</span>
                                        <span>{formatoPrecio(totalCarrito)}</span>
                                    </div>

                                    <button
                                        type="button"
                                        className="continue-shopping-button"
                                        onClick={() => setMostrarCarrito(false)}
                                    >
                                        Agregar más productos
                                    </button>

                                    {pasoCarrito === 'carrito' && (
                                        <button
                                            type="button"
                                            className="checkout-button"
                                            disabled={carrito.length === 0}
                                            onClick={continuarCompra}
                                        >
                                            Continuar compra
                                        </button>
                                    )}

                                    {pasoCarrito === 'cliente' && (
                                        <form onSubmit={continuarDatosCliente} className="cart-step-form">
                                            <h3>Datos del cliente</h3>
                                            <input name="nombre" value={datosCliente.nombre} onChange={cambiarDatosCliente} placeholder="Nombre completo *" required />
                                            <input name="telefono" value={datosCliente.telefono} onChange={cambiarDatosCliente} placeholder="Teléfono *" required />
                                            <input name="correo" type="email" value={datosCliente.correo} onChange={cambiarDatosCliente} placeholder="Correo" />
                                            <input name="nit" value={datosCliente.nit} onChange={cambiarDatosCliente} placeholder="NIT opcional" />
                                            <textarea name="observaciones" value={datosCliente.observaciones} onChange={cambiarDatosCliente} placeholder="Observaciones opcionales" />
                                            <button type="submit" className="checkout-button">Continuar</button>
                                        </form>
                                    )}

                                    {pasoCarrito === 'entrega' && (
                                        <form onSubmit={continuarEntrega} className="cart-step-form">
                                            <h3>Entrega</h3>
                                            <select value={entrega} onChange={evento => setEntrega(evento.target.value)}>
                                                <option value="TIENDA">Retiro en Tienda</option>
                                                <option value="ENVIO">Solicitar Envío</option>
                                            </select>
                                            {entrega === 'ENVIO' && (
                                                <>
                                                    <input name="departamento" value={datosEntrega.departamento} onChange={cambiarDatosEntrega} placeholder="Departamento *" required />
                                                    <input name="municipio" value={datosEntrega.municipio} onChange={cambiarDatosEntrega} placeholder="Municipio *" required />
                                                    <input name="direccion" value={datosEntrega.direccion} onChange={cambiarDatosEntrega} placeholder="Dirección exacta *" required />
                                                    <input name="referencia" value={datosEntrega.referencia} onChange={cambiarDatosEntrega} placeholder="Referencia" />
                                                    <input name="destinatarioNombre" value={datosEntrega.destinatarioNombre} onChange={cambiarDatosEntrega} placeholder="Nombre del destinatario *" required />
                                                    <input name="destinatarioTelefono" value={datosEntrega.destinatarioTelefono} onChange={cambiarDatosEntrega} placeholder="Teléfono del destinatario *" required />
                                                    <textarea name="observaciones" value={datosEntrega.observaciones} onChange={cambiarDatosEntrega} placeholder="Observaciones de entrega" />
                                                </>
                                            )}
                                            <button type="submit" className="checkout-button">Continuar</button>
                                        </form>
                                    )}

                                    {pasoCarrito === 'pago' && (
                                        <form onSubmit={continuarPago} className="cart-step-form">
                                            <h3>Forma de pago</h3>
                                            <select value={tipoPago} onChange={evento => setTipoPago(evento.target.value)}>
                                                <option value="EFECTIVO">Efectivo</option>
                                                <option value="TRANSFERENCIA">Transferencia bancaria</option>
                                            </select>
                                            {tipoPago === 'TRANSFERENCIA' && (
                                                <>
                                                    <select name="banco" value={datosPago.banco} onChange={cambiarDatosPago} required>
                                                        <option value="BANRURAL">Banrural</option>
                                                        <option value="BANCO INDUSTRIAL">Banco Industrial</option>
                                                    </select>
                                                    <select name="tipoCuenta" value={datosPago.tipoCuenta} onChange={cambiarDatosPago} required>
                                                        <option value="AHORRO">Cuenta de ahorro</option>
                                                        <option value="MONETARIA">Cuenta monetaria</option>
                                                    </select>
                                                    <div className="transfer-account-info">
                                                        <strong>Cuenta para depositar</strong>
                                                        <span>{CUENTAS_TRANSFERENCIA[datosPago.banco]}</span>
                                                        <small>
                                                            {datosPago.tipoCuenta === 'AHORRO'
                                                                ? 'Cuenta de ahorro'
                                                                : 'Cuenta monetaria'}
                                                        </small>
                                                        <small>A nombre de: Comercial San Cristóbal</small>
                                                    </div>
                                                    <input name="referencia" value={datosPago.referencia} onChange={cambiarDatosPago} placeholder="Número de referencia *" required />
                                                    <input name="monto" type="number" min="0" step="0.01" value={datosPago.monto} onChange={cambiarDatosPago} placeholder="Monto transferido *" required />
                                                    <small className="cart-message">Puedes registrar una transferencia por cualquier monto; el pago quedará pendiente de revisión.</small>
                                                    <input name="fecha" type="date" value={datosPago.fecha} onChange={cambiarDatosPago} required />
                                                    <input name="comprobante" type="file" accept="image/*,.pdf" onChange={seleccionarComprobante} required />
                                                    <p className="cart-message">Su transferencia será revisada por Comercial San Cristóbal. El envío del comprobante no significa que el pago haya sido confirmado.<br />Horario de validación: 08:00 AM - 06:00 PM. Tiempo estimado: hasta 60 minutos hábiles.</p>
                                                </>
                                            )}
                                            <button type="submit" className="checkout-button">Revisar pedido</button>
                                        </form>
                                    )}

                                    {pasoCarrito === 'revision' && (
                                        <div className="cart-step-form">
                                            <h3>Revisar pedido</h3>
                                            <p><strong>Cliente:</strong> {datosCliente.nombre}</p>
                                            <p><strong>Teléfono:</strong> {datosCliente.telefono}</p>
                                            <p><strong>Productos:</strong> {carrito.map(item => `${item.nombre} x${item.cantidad} (${formatoPrecio(obtenerPrecioAplicado(item, item.cantidad) * item.cantidad)}${item.cantidad > 10 && obtenerPrecioMayorista(item) !== null ? ' · precio mayorista' : ''})`).join(', ')}</p>
                                            <p><strong>Subtotal:</strong> {formatoPrecio(subtotalCarrito)}</p>
                                            <p><strong>Costo de envío:</strong> {formatoPrecio(costoEnvio)}</p>
                                            <p><strong>Total:</strong> {formatoPrecio(totalCarrito)}</p>
                                            <p><strong>Entrega:</strong> {entrega === 'ENVIO' ? 'Solicitar envío' : 'Retiro en Tienda'}</p>
                                            <p><strong>Forma de pago:</strong> {tipoPago === 'TRANSFERENCIA' ? 'Transferencia bancaria' : 'Efectivo'}</p>
                                            <button type="button" className="checkout-button" disabled={enviandoPedido} onClick={confirmarSolicitud}>
                                                {enviandoPedido ? 'Registrando solicitud...' : 'Confirmar solicitud de compra'}
                                            </button>
                                        </div>
                                    )}

                                    {mensaje && <p className="cart-message">{mensaje}</p>}

                                </footer>


                            </aside>


                        </div>

                    )
                }


            </div>

        </>

    );

}


export default Catalogo;