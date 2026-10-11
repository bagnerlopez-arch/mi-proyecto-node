import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';


function Inventario({ soloBodega = false }) {

    function calcularEstado(stock, minimo) {

        const stockActual = Number(stock || 0);
        const stockMinimo = Number(minimo || 0);

        if (stockActual === 0) {
            return 'Crítico';
        }

        if (stockActual <= stockMinimo) {
            return 'Bajo';
        }

        return 'Óptimo';
    }

    const [inventario, setInventario] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [productoEditando, setProductoEditando] = useState(null);
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);
    const [productoAEliminar, setProductoAEliminar] = useState(null);
    const [credencialesEliminacion, setCredencialesEliminacion] = useState({
        usuario: '',
        password: ''
    });
    const [eliminandoProducto, setEliminandoProducto] = useState(false);


    useEffect(() => {

        async function cargarProductos() {

            try {

                const respuesta = await fetch('/api/cliente/productos?todos=true');

                if (!respuesta.ok) {
                    throw new Error('No se pudieron cargar los productos.');
                }

                const productos = await respuesta.json();

                setInventario(
                    productos.map(producto => ({
                        id: producto.producto_id,
                        producto: producto.nombre,
                        codigo: producto.sku || '-',
                        imagen: producto.imagen_url || '',
                        estadoProducto: producto.estado || '-',
                        categoria: producto.categoria || 'Sin categoría',
                        unidad: producto.unidad_medida || '-',
                        descripcion: producto.descripcion || '-',
                        peso: producto.peso_lbs,
                        dimensiones: [
                            producto.ancho_pulgadas,
                            producto.largo_pulgadas
                        ].filter(Boolean).join(' x ') || '-',
                        calibre: producto.calibre_milipulgadas,
                        divisiones: producto.divisiones,
                        talla: producto.numero_talla || '-',
                        forma: producto.forma || '-',
                        color: producto.color || '-',
                        material: producto.material || '-',
                        volumen: producto.volumen_oz,
                        precioVenta: Number(producto.precio_venta || 0),
                        precioMayorista: Number(producto.precio_mayorista || 0),
                        bodegaStock: Number(producto.bodega_stock || 0),
                        bodegaMinimo: Number(producto.bodega_minimo || 0),
                        bodegaMaximo: Number(producto.bodega_maximo || 0),
                        bodegaEstado: calcularEstado(
                            producto.bodega_stock,
                            producto.bodega_minimo
                        ),
                        bodegaAsignado: producto.bodega_asignado,
                        localStock: Number(producto.tienda_stock || 0),
                        localMinimo: Number(producto.tienda_minimo || 0),
                        localMaximo: Number(producto.tienda_maximo || 0),
                        localEstado: calcularEstado(
                            producto.tienda_stock,
                            producto.tienda_minimo
                        ),
                        tiendaAsignado: producto.tienda_asignado
                    }))
                );

            } catch (cargaError) {

                console.error(cargaError);
                setError('No se pudieron cargar los productos del inventario.');

            } finally {

                setCargando(false);

            }

        }

        cargarProductos();

    }, []);

    const [busqueda, setBusqueda] =
        useState('');

    const [ubicacion, setUbicacion] =
        useState(soloBodega ? 'Bodega Central' : 'Negocio Local');

    const mostrarBodega =
        ubicacion === 'Todas'
        || ubicacion === 'Bodega Central';

    const mostrarTienda =
        ubicacion === 'Todas'
        || ubicacion === 'Negocio Local';

    const [categoria, setCategoria] =
        useState('Todas');

    const [estado, setEstado] =
        useState('Todos');

    const [pagina, setPagina] =
        useState(1);

    const [mostrar, setMostrar] =
        useState(5);


    // =========================================================
    // EDITAR PRODUCTO
    // =========================================================

    function abrirEdicion(item) {

        setProductoEditando({
            ...item,
            precioMayorista: Number(item.precioMayorista || 0),
            descripcion: item.descripcion === '-' ? '' : item.descripcion,
            peso: item.peso ?? '',
            calibre: item.calibre ?? '',
            divisiones: item.divisiones ?? '',
            volumen: item.volumen ?? '',
            material: item.material === '-' ? '' : item.material,
            color: item.color === '-' ? '' : item.color,
            forma: item.forma === '-' ? '' : item.forma,
            talla: item.talla === '-' ? '' : item.talla
        });

    }


    function seleccionarImagenEdicion(evento) {

        const archivo = evento.target.files?.[0];

        if (!archivo) {
            return;
        }

        const tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!tiposPermitidos.includes(archivo.type)) {
            setError('La imagen debe ser JPG, PNG o WEBP.');
            return;
        }

        if (archivo.size > 2 * 1024 * 1024) {
            setError('La imagen no debe superar 2 MB.');
            return;
        }

        const lector = new FileReader();

        lector.onload = () => {
            setProductoEditando(actual => ({
                ...actual,
                imagen: String(lector.result || '')
            }));
            setError('');
        };

        lector.onerror = () => {
            setError('No fue posible leer la imagen seleccionada.');
        };

        lector.readAsDataURL(archivo);

    }


    async function guardarEdicion(evento) {

        evento.preventDefault();

        if (!productoEditando) {
            return;
        }

        try {

            setGuardandoEdicion(true);

            const respuesta = await fetch(
                `/api/cliente/productos/${productoEditando.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sku: productoEditando.codigo,
                        nombre: productoEditando.producto,
                        descripcion: productoEditando.descripcion,
                        imagen_url: productoEditando.imagen,
                        peso_lbs: productoEditando.peso || null,
                        calibre_milipulgadas: productoEditando.calibre || null,
                        divisiones: productoEditando.divisiones || null,
                        numero_talla: productoEditando.talla,
                        forma: productoEditando.forma,
                        color: productoEditando.color,
                        volumen_oz: productoEditando.volumen || null,
                        material: productoEditando.material,
                        precio_venta: productoEditando.precioVenta,
                        precio_mayorista: productoEditando.precioMayorista,
                        estado: productoEditando.estadoProducto
                    })
                }
            );

            const resultado = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                throw new Error(resultado.error || 'No se pudo editar el producto.');
            }

            setInventario(inventarioActual =>
                inventarioActual.map(item =>
                    item.id === productoEditando.id
                        ? {
                            ...item,
                            producto: productoEditando.producto,
                            codigo: productoEditando.codigo,
                            descripcion: productoEditando.descripcion || '-',
                            peso: productoEditando.peso,
                            calibre: productoEditando.calibre,
                            divisiones: productoEditando.divisiones,
                            talla: productoEditando.talla || '-',
                            forma: productoEditando.forma || '-',
                            color: productoEditando.color || '-',
                            material: productoEditando.material || '-',
                            volumen: productoEditando.volumen,
                            imagen: productoEditando.imagen,
                            precioVenta: Number(productoEditando.precioVenta || 0),
                            precioMayorista: Number(productoEditando.precioMayorista || 0),
                            estadoProducto: productoEditando.estadoProducto
                        }
                        : item
                )
            );

            setProductoEditando(null);

        } catch (errorEdicion) {

            setError(errorEdicion.message);

        } finally {

            setGuardandoEdicion(false);

        }

    }


    function abrirEliminacion(item) {

        setProductoAEliminar(item);
        setCredencialesEliminacion({ usuario: '', password: '' });
        setError('');

    }


    async function eliminarProducto(evento) {

        evento.preventDefault();

        if (!productoAEliminar) {
            return;
        }

        try {

            setEliminandoProducto(true);

            const respuesta = await fetch(
                `/api/cliente/productos/${productoAEliminar.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(credencialesEliminacion)
                }
            );

            const resultado = await respuesta.json().catch(() => ({}));

            if (!respuesta.ok) {
                throw new Error(resultado.error || 'No se pudo eliminar el producto.');
            }

            setInventario(inventarioActual =>
                inventarioActual.filter(item => item.id !== productoAEliminar.id)
            );
            setProductoAEliminar(null);

        } catch (errorEliminacion) {

            setError(errorEliminacion.message);

        } finally {

            setEliminandoProducto(false);

        }

    }


    // =========================================================
    // FILTROS
    // =========================================================

    const inventarioFiltrado = useMemo(() => {

        const texto =
            busqueda
                .trim()
                .toLowerCase();


        return inventario.filter(item => {

            const coincideTexto =
                item.producto
                    .toLowerCase()
                    .includes(texto)
                ||
                item.codigo
                    .toLowerCase()
                    .includes(texto);


            const coincideCategoria =
                categoria === 'Todas'
                ||
                item.categoria === categoria;


            const estadosItem = [
                item.bodegaEstado,
                item.localEstado
            ];


            const coincideEstado =
                estado === 'Todos'
                ||
                estadosItem.includes(
                    estado
                );


            let coincideUbicacion = true;


            if (
                ubicacion === 'Bodega Central'
            ) {

                coincideUbicacion =
                    item.bodegaAsignado === true;

            }


            if (
                ubicacion === 'Negocio Local'
            ) {

                coincideUbicacion =
                    item.tiendaAsignado === true;

            }


            return (
                coincideTexto
                &&
                coincideCategoria
                &&
                coincideEstado
                &&
                coincideUbicacion
            );

        });

    }, [
        inventario,
        busqueda,
        ubicacion,
        categoria,
        estado
    ]);

    const categoriasDisponibles = useMemo(
        () => [
            ...new Set(
                inventario.map(item => item.categoria)
            )
        ],
        [inventario]
    );

    const paginasTotales = Math.max(
        1,
        Math.ceil(inventarioFiltrado.length / mostrar)
    );

    const inventarioPaginado = inventarioFiltrado.slice(
        (pagina - 1) * mostrar,
        pagina * mostrar
    );


    // =========================================================
    // EXPORTAR CSV
    // =========================================================

    function exportarInventario() {

        const encabezados = [
            'Producto',
            'Código',
            'Categoría',
            'Unidad',
            'Stock Bodega',
            'Mínimo Bodega',
            'Estado Bodega',
            'Stock Local',
            'Mínimo Local',
            'Estado Local'
        ];


        const filas =
            inventarioFiltrado.map(
                item => [
                    item.producto,
                    item.codigo,
                    item.categoria,
                    item.unidad,
                    item.bodegaStock,
                    item.bodegaMinimo,
                    item.bodegaEstado,
                    item.localStock,
                    item.localMinimo,
                    item.localEstado
                ]
            );


        const csv = [
            encabezados,
            ...filas
        ]
            .map(
                fila =>
                    fila
                        .map(
                            valor =>
                                `"${String(valor).replaceAll('"', '""')}"`
                        )
                        .join(',')
            )
            .join('\n');


        const archivo =
            new Blob(
                [csv],
                {
                    type:
                        'text/csv;charset=utf-8;'
                }
            );


        const url =
            URL.createObjectURL(
                archivo
            );


        const enlace =
            document.createElement(
                'a'
            );


        enlace.href = url;

        enlace.download =
            'inventario-comercial-san-cristobal.csv';

        enlace.click();


        URL.revokeObjectURL(
            url
        );

    }


    // =========================================================
    // ESTILO DE ESTADOS
    // =========================================================

    function claseEstado(valor) {

        if (valor === 'Crítico') {
            return 'estado-stock critico';
        }

        if (valor === 'Bajo') {
            return 'estado-stock bajo';
        }

        return 'estado-stock optimo';

    }


    // =========================================================
    // CSS
    // =========================================================

    const estilos = `

        * {
            box-sizing: border-box;
        }

        html,
        body,
        #root {
            min-height: 100%;
        }

        body {
            margin: 0;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
            background: #f5f8fc;
            color: #17365f;
        }

        button,
        input,
        select {
            font: inherit;
        }


        /* =====================================================
           PÁGINA
        ===================================================== */

        .inventario-page {
            min-height: 100vh;
            display: flex;
            background:
                linear-gradient(
                    135deg,
                    #f8fbff,
                    #eef5fc
                );
        }


        /* =====================================================
           SIDEBAR
        ===================================================== */

        .inventario-sidebar {
            width: 205px;
            min-height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 100;

            display: flex;
            flex-direction: column;

            color: white;

            background:
                linear-gradient(
                    180deg,
                    #0c3974 0%,
                    #0a3470 55%,
                    #0b315f 100%
                );
        }


        .inventario-logo {
            display: flex;
            align-items: center;
            gap: 10px;

            padding: 20px 17px;

            color: white;
            text-decoration: none;
        }


        .inventario-logo-icon {
            width: 42px;
            height: 42px;

            display: grid;
            place-items: center;

            font-size: 28px;
        }


        .inventario-logo-text {
            display: flex;
            flex-direction: column;

            line-height: 1.02;
        }


        .inventario-logo-text strong {
            font-size: 13px;
            font-weight: 900;
        }


        .inventario-logo-text small {
            margin-top: 5px;

            color: #d8e7f9;

            font-size: 12px;
        }


        /* PERFIL */

        .inventario-perfil {
            display: flex;
            align-items: center;
            gap: 11px;

            padding:
                10px 17px 18px;
        }


        .inventario-avatar {
            width: 43px;
            height: 43px;

            flex: 0 0 43px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            color: #0e3971;
            background: white;

            font-size: 22px;
        }


        .inventario-perfil-info {
            display: flex;
            flex-direction: column;

            font-size: 12px;
        }


        .inventario-perfil-info strong {
            font-size: 12px;
        }


        .inventario-perfil-info span {
            margin-top: 4px;
            color: #dce9f8;
        }


        .inventario-perfil-info small {
            margin-top: 5px;
            color: #5cf294;
        }


        /* MENÚ */

        .inventario-menu {
            display: grid;
            gap: 4px;

            padding: 7px;
        }


        .inventario-menu a {
            min-height: 43px;

            display: flex;
            align-items: center;

            gap: 12px;

            padding: 0 14px;

            border-radius: 6px;

            color: #dce8f6;

            text-decoration: none;

            font-size: 12px;

            transition: .2s;
        }


        .inventario-menu a:hover {
            background:
                rgba(
                    255,
                    255,
                    255,
                    .08
                );
        }


        .inventario-menu a.activo {
            color: white;

            background:
                linear-gradient(
                    90deg,
                    #176fe4,
                    #135fd0
                );

            font-weight: 700;
        }


        .inventario-menu-icon {
            width: 22px;

            text-align: center;

            font-size: 17px;
        }


        /* UBICACIONES SIDEBAR */

        .sidebar-ubicaciones {
            margin-top: auto;

            padding:
                15px 17px;
        }


        .sidebar-line {
            height: 1px;

            margin-bottom: 16px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .15
                );
        }


        .sidebar-ubicaciones h4 {
            margin:
                0 0 12px;

            color:
                #c9d9ec;

            font-size: 12px;
        }


        .ubicacion-side {
            display: flex;

            align-items: center;

            gap: 10px;

            margin-bottom: 14px;

            color: white;

            font-size: 12px;
        }


        .ubicacion-side-icon {
            width: 25px;

            font-size: 20px;
        }


        .ubicacion-side-info {
            flex: 1;
        }


        .ubicacion-side-info strong {
            display: block;
        }


        .ubicacion-side-info small {
            display: block;

            margin-top: 3px;

            color: #c9d9ec;

            font-size: 12px;
        }


        .ubicacion-dot {
            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: #2c88ff;
        }


        .ubicacion-dot.green {
            background: #43d994;
        }


        .sidebar-copyright {
            margin-top: 25px;

            color: #ccdbee;

            font-size: 12px;

            line-height: 1.7;
        }


        /* =====================================================
           CONTENIDO
        ===================================================== */

        .inventario-content {
            width:
                calc(
                    100% - 205px
                );

            margin-left: 205px;
        }


        /* =====================================================
           TOPBAR
        ===================================================== */

        .inventario-topbar {
            height: 56px;

            position: sticky;

            top: 0;

            z-index: 90;

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding:
                0 22px;

            border-bottom:
                1px solid #dae4ee;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .97
                );
        }


        .topbar-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }


        .topbar-menu {
            border: 0;

            color: #264f7b;

            background: transparent;

            font-size: 20px;

            cursor: pointer;
        }


        .topbar-title {
            color: #173966;

            font-size: 13px;

            font-weight: 800;
        }


        .topbar-right {
            display: flex;
            align-items: center;

            gap: 20px;

            color: #183860;

            font-size: 12px;
        }


        .top-date {
            display: flex;
            align-items: center;
            gap: 7px;

            font-weight: 700;
        }


        .top-notification {
            position: relative;

            font-size: 18px;
        }


        .top-notification span {
            width: 15px;
            height: 15px;

            position: absolute;

            top: -7px;
            right: -8px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            color: white;
            background: #f14450;

            font-size: 12px;
        }


        .top-user {
            display: flex;
            align-items: center;
            gap: 7px;

            font-weight: 700;
        }


        .top-user-avatar {
            width: 27px;
            height: 27px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            color: white;
            background: #153d80;
        }


        /* =====================================================
           MAIN
        ===================================================== */

        .inventario-main {
            padding: 18px;
        }


        .inventario-heading {
            margin-bottom: 14px;
        }


        .inventario-heading h1 {
            margin: 0;

            color: #153766;

            font-size: 19px;
        }


        .inventario-heading p {
            margin:
                5px 0 0;

            color: #73839a;

            font-size: 12px;
        }


        /* =====================================================
           FILTROS
        ===================================================== */

        .inventario-filtros {
            display: grid;
            grid-template-columns: minmax(240px, 1.7fr) repeat(3, minmax(150px, 1fr)) auto auto;
            align-items: end;
            gap: 16px;
            margin-bottom: 20px;
            padding: 20px;
            border: 1px solid #e1e9f2;
            border-radius: 14px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
            box-shadow: 0 5px 18px rgba(25, 55, 90, .06);
        }


        .inventory-location-buttons {
            grid-column: 1 / -1;

            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }


        .location-button {
            min-height: 40px;

            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;

            padding: 0 18px;

            border: 1px solid #cbd9e8;
            border-radius: 9px;

            color: #31577f;
            background: white;

            cursor: pointer;
            font-size: 14px;
            font-weight: 800;
            text-decoration: none;
            transition: .2s ease;
        }


        .location-button:hover {
            color: #1665c1;
            border-color: #1665c1;
            background: #f2f7ff;
        }


        .location-button:focus-visible {
            outline: 3px solid rgba(22,101,193,.22);
            outline-offset: 2px;
        }


        .location-button.active {
            color: white;
            border-color: #1665c1;
            background: #1665c1;
        }


        .filter-search {
            min-height: 44px;

            display: flex;
            align-items: center;

            gap: 8px;

            padding:
                0 13px;

            border:
                1px solid #d5e0ec;

            border-radius: 9px;

            background: white;
        }


        .filter-search span {
            color: #4d70a0;
        }


        .filter-search input {
            flex: 1;

            min-width: 0;

            border: 0;
            outline: 0;

            color: #314b68;

            font-size: 14px;
        }


        .filter-group {
            display: grid;
            grid-template-rows: auto 44px;
            align-items: center;
            gap: 7px;
            min-width: 0;
        }


        .filter-group label {
            color: #405c7c;

            font-size: 14px;

            font-weight: 700;
        }


        .filter-group select {
            flex: 1;

            height: 44px;

            border:
                1px solid #d5e0ec;

            border-radius: 9px;

            padding:
                0 11px;

            color: #405e83;

            background: white;

            font-size: 14px;
        }


        .filter-button,
        .export-button {
            min-height: 44px;

            border:
                1px solid #d3deea;

            border-radius: 9px;

            color: #325a89;

            background: white;

            font-size: 14px;

            font-weight: 700;

            cursor: pointer;
            padding: 0 15px;
            white-space: nowrap;
            transition: .2s ease;
        }


        .filter-button:hover,
        .export-button:hover {
            border-color: #1665c1;
            background: #f2f7ff;
            box-shadow: 0 3px 9px rgba(22, 101, 193, .12);
        }


        .export-button {
            color: #214f8f;
        }


        /* =====================================================
           KPI
        ===================================================== */

        .inventory-stats {
            display: grid;

            grid-template-columns:
                repeat(
                    5,
                    1fr
                );

            gap: 9px;

            margin-bottom: 10px;
        }


        .inventory-stat {
            min-height: 87px;

            display: flex;
            align-items: center;

            gap: 11px;

            padding: 12px;

            border:
                1px solid #dce5ef;

            border-radius: 7px;

            background: white;
        }


        .inventory-stat-icon {
            width: 43px;
            height: 43px;

            flex: 0 0 43px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            font-size: 21px;
        }


        .stat-blue {
            color: #386ee4;
            background: #e4ecff;
        }


        .stat-green {
            color: #16a56c;
            background: #dff5e8;
        }


        .stat-purple {
            color: #7448e5;
            background: #eee7ff;
        }


        .stat-orange {
            color: #f07c28;
            background: #ffecdf;
        }


        .stat-red {
            color: #ef4b52;
            background: #ffe6e8;
        }


        .inventory-stat-data small {
            color: #365271;

            font-size: 12px;

            font-weight: 700;
        }


        .inventory-stat-data h3 {
            margin:
                6px 0 4px;

            color: #163c77;

            font-size: 14px;
        }


        .inventory-stat-data span {
            color: #8090a6;

            font-size: 12px;
        }


        /* =====================================================
           FILA RESUMEN
        ===================================================== */

        .inventory-dashboard-grid {
            display: grid;

            grid-template-columns:
                1.08fr 1fr;

            gap: 9px;

            margin-bottom: 10px;
        }


        .inventory-card {
            border:
                1px solid #dce5ef;

            border-radius: 7px;

            background: white;

            overflow: hidden;
        }


        .inventory-card-title {
            padding:
                10px 12px;

            color: #163d75;

            font-size: 12px;

            font-weight: 800;
        }


        /* =====================================================
           TABLA UBICACIONES
        ===================================================== */

        .summary-table {
            width: 100%;

            border-collapse: collapse;

            font-size: 12px;
        }


        .summary-table th {
            padding:
                7px 7px;

            color: #50657f;

            background: #f4f7fb;

            text-align: left;
        }


        .summary-table td {
            padding:
                8px 7px;

            border-bottom:
                1px solid #edf1f5;

            color: #3f5878;
        }


        .summary-location {
            display: flex;
            align-items: center;
            gap: 8px;
        }


        .summary-location-icon {
            width: 25px;
            height: 25px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            color: white;

            background: #1769d8;
        }


        .summary-location-icon.green {
            background: #20a86c;
        }


        .summary-location strong {
            display: block;

            color: #183f77;

            font-size: 12px;
        }


        .summary-location small {
            display: block;

            margin-top: 3px;

            color: #8593a6;

            font-size: 12px;
        }


        .badge-number {
            display: inline-block;

            min-width: 22px;

            padding:
                3px 6px;

            border-radius: 4px;

            text-align: center;
        }


        .badge-orange {
            color: #d46815;
            background: #ffead8;
        }


        .badge-red {
            color: #d63e47;
            background: #ffe0e3;
        }


        .summary-total {
            background: #f0f6ff;
            font-weight: 700;
        }


        /* =====================================================
           DONUT
        ===================================================== */

        .distribution-content {
            min-height: 145px;

            display: grid;

            grid-template-columns:
                1fr 150px 1fr;

            align-items: center;

            padding:
                5px 15px 14px;
        }


        .distribution-legend {
            font-size: 12px;
        }


        .distribution-legend strong {
            display: block;

            color: #173d73;

            margin-bottom: 7px;
        }


        .distribution-legend h3 {
            margin:
                6px 0 0;

            font-size: 17px;
        }


        .distribution-legend.blue h3 {
            color: #1568da;
        }


        .distribution-legend.green h3 {
            color: #21a66d;
        }


        .distribution-donut {
            width: 130px;
            height: 130px;

            margin: auto;

            position: relative;

            border-radius: 50%;

            background:
                conic-gradient(
                    #28b777 0 34%,
                    #1b69da 34% 100%
                );
        }


        .distribution-donut::after {
            content: '';

            width: 70px;
            height: 70px;

            position: absolute;

            inset: 0;

            margin: auto;

            border-radius: 50%;

            background: white;
        }


        .donut-center {
            position: absolute;

            inset: 0;

            z-index: 2;

            display: grid;
            place-content: center;

            text-align: center;
        }


        .donut-center strong {
            color: #163e75;

            font-size: 13px;
        }


        .donut-center span {
            margin-top: 3px;

            color: #71839d;

            font-size: 12px;
        }


        /* =====================================================
           ALERTAS
        ===================================================== */

        .alerts-card {
            margin-bottom: 10px;
        }


        .alerts-grid {
            display: grid;

            grid-template-columns:
                repeat(
                    4,
                    1fr
                );

            gap: 10px;

            padding:
                0 12px 12px;
        }


        .alert-box {
            min-height: 76px;

            display: flex;
            gap: 10px;

            padding: 11px;

            border:
                1px solid #e0e7ef;

            border-radius: 5px;

            background: white;
        }


        .alert-icon {
            width: 30px;
            flex: 0 0 30px;

            font-size: 22px;
        }


        .alert-orange {
            color: #f37c23;
        }


        .alert-red {
            color: #f0474e;
        }


        .alert-blue {
            color: #407de4;
        }


        .alert-green {
            color: #22a56d;
        }


        .alert-box strong {
            display: block;

            margin-bottom: 5px;

            font-size: 12px;
        }


        .alert-box p {
            margin: 0;

            color: #5f728c;

            font-size: 12px;

            line-height: 1.4;
        }


        .alert-box a {
            display: block;

            margin-top: 6px;

            color: #176bdc;

            text-decoration: none;

            font-size: 12px;

            font-weight: 700;
        }


        /* =====================================================
           TABLA PRINCIPAL
        ===================================================== */

        .inventory-products-card {
            overflow: hidden;
        }


        .inventory-table-scroll {
            width: 100%;

            overflow-x: auto;
        }


        .inventory-table {
            width: 100%;

            min-width: 950px;

            border-collapse: collapse;

            font-size: 12px;
        }


        .inventory-table th {
            padding:
                8px 6px;

            color: #3e5879;

            background: #f3f7fb;

            text-align: left;
        }


        .inventory-table th.group-blue {
            color: #2064c8;

            background: #eaf3ff;

            text-align: center;
        }


        .inventory-table td {
            padding:
                7px 6px;

            border-bottom:
                1px solid #e8edf3;

            color: #435d7e;
        }


        .product-name-cell {
            display: flex;
            align-items: center;
            gap: 7px;

            color: #213f68;

            font-weight: 700;
        }


        .product-circle {
            width: 20px;
            height: 20px;

            display: grid;
            place-items: center;

            border-radius: 50%;

            background: #eef2f6;

            font-size: 12px;
        }


        .estado-stock {
            display: inline-block;

            min-width: 43px;

            padding:
                3px 6px;

            border-radius: 4px;

            text-align: center;

            font-size: 12px;
        }


        .estado-stock.optimo {
            color: #19895a;
            background: #dcf5e8;
        }


        .estado-stock.bajo {
            color: #d56b16;
            background: #fff0da;
        }


        .estado-stock.critico {
            color: #d63f48;
            background: #ffe2e4;
        }


        .view-button {
            border: 0;

            color: #1769db;

            background: transparent;

            cursor: pointer;

            font-size: 13px;
        }


        .edit-button {
            min-height: 28px;
            padding: 0 9px;
            border: 1px solid #1769db;
            border-radius: 5px;
            color: #1769db;
            background: white;
            cursor: pointer;
            font-size: 12px;
            font-weight: 800;
        }


        .delete-button {
            min-height: 28px;
            margin-left: 5px;
            padding: 0 9px;
            border: 1px solid #d94450;
            border-radius: 5px;
            color: #c93643;
            background: white;
            cursor: pointer;
            font-size: 12px;
            font-weight: 800;
        }


        .delete-button:hover {
            color: white;
            background: #d94450;
        }


        .delete-modal {
            width: min(420px, 100%);
        }


        .delete-warning {
            margin: 0 0 18px;
            color: #536d89;
            font-size: 12px;
            line-height: 1.5;
        }


        .delete-error {
            margin: 12px 0 0;
            color: #c93643;
            font-size: 12px;
            font-weight: 700;
        }


        .edit-overlay {
            position: fixed;
            inset: 0;
            z-index: 1200;
            display: grid;
            place-items: center;
            padding: 20px;
            background: rgba(14, 34, 58, .48);
        }


        .edit-modal {
            width: min(620px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            padding: 24px;
            border-radius: 8px;
            background: white;
            box-shadow: 0 18px 50px rgba(0, 0, 0, .22);
        }


        .edit-modal-header,
        .edit-modal-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }


        .edit-modal-header {
            margin-bottom: 18px;
        }


        .edit-modal-header h2 {
            margin: 0;
            color: #153766;
            font-size: 18px;
        }


        .edit-close {
            border: 0;
            color: #536d89;
            background: transparent;
            cursor: pointer;
            font-size: 22px;
        }


        .edit-fields {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }


        .edit-field {
            display: grid;
            gap: 5px;
        }


        .edit-field.full {
            grid-column: 1 / -1;
        }


        .edit-field label {
            color: #405e7e;
            font-size: 12px;
            font-weight: 800;
        }


        .edit-field input,
        .edit-field textarea,
        .edit-field select {
            width: 100%;
            padding: 9px;
            border: 1px solid #d2deea;
            border-radius: 5px;
            color: #294c72;
            background: white;
            font: inherit;
            font-size: 12px;
        }


        .edit-field textarea {
            min-height: 70px;
            resize: vertical;
        }


        .edit-image-preview {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px;
            border: 1px solid #d2deea;
            border-radius: 6px;
            background: #f8fafc;
        }


        .edit-image-preview img {
            width: 64px;
            height: 64px;
            object-fit: cover;
            border-radius: 5px;
            border: 1px solid #d7e2ee;
        }


        .edit-image-preview span {
            color: #6d8199;
            font-size: 12px;
        }


        .edit-modal-actions {
            justify-content: flex-end;
            margin-top: 20px;
        }


        .edit-cancel,
        .edit-save {
            min-height: 36px;
            padding: 0 14px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 800;
        }


        .edit-cancel {
            border: 1px solid #d2deea;
            color: #48627e;
            background: white;
        }


        .edit-save {
            border: 0;
            color: white;
            background: #1769db;
        }


        /* =====================================================
           PAGINACIÓN
        ===================================================== */

        .inventory-pagination {
            display: flex;
            align-items: center;
            justify-content: space-between;

            padding:
                10px 12px;

            color: #57708f;

            font-size: 12px;
        }


        .pagination-center {
            display: flex;
            gap: 4px;
        }


        .pagination-center button {
            width: 25px;
            height: 25px;

            border:
                1px solid #d9e3ed;

            border-radius: 4px;

            color: #456285;

            background: white;

            cursor: pointer;

            font-size: 12px;
        }


        .pagination-center button.active {
            color: white;
            border-color: #176be0;
            background: #176be0;
        }


        .show-control {
            display: flex;
            align-items: center;
            gap: 6px;
        }


        .show-control select {
            height: 27px;

            border:
                1px solid #d6e1ed;

            border-radius: 4px;

            color: #476481;

            background: white;

            font-size: 12px;
        }


        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (
            max-width: 1200px
        ) {

            .inventory-stats {
                grid-template-columns:
                    repeat(
                        3,
                        1fr
                    );
            }


            .inventario-filtros {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .filter-search { grid-column: 1 / -1; }


            .alerts-grid {
                grid-template-columns:
                    repeat(
                        2,
                        1fr
                    );
            }

        }


        @media (
            max-width: 900px
        ) {

            .inventario-sidebar {
                width: 76px;
            }


            .inventario-logo-text,
            .inventario-perfil-info,
            .inventario-menu a span:last-child,
            .sidebar-ubicaciones {
                display: none;
            }


            .inventario-logo,
            .inventario-perfil {
                justify-content: center;

                padding-left: 0;
                padding-right: 0;
            }


            .inventario-menu a {
                justify-content: center;

                padding: 0;
            }


            .inventario-content {
                width:
                    calc(
                        100% - 76px
                    );

                margin-left: 76px;
            }


            .inventory-dashboard-grid {
                grid-template-columns:
                    1fr;
            }


            .inventory-stats {
                grid-template-columns:
                    repeat(
                        2,
                        1fr
                    );
            }

        }


        @media (
            max-width: 620px
        ) {

            .top-date,
            .top-user span {
                display: none;
            }


            .inventario-main {
                padding: 12px;
            }


            .inventario-filtros {
                grid-template-columns: 1fr;
                gap: 13px;
                padding: 15px;
            }

            .filter-search,
            .inventory-location-buttons { grid-column: 1; }


            .filter-group {
                grid-template-columns: 1fr;
                grid-template-rows: auto 44px;
            }


            .inventory-stats {
                grid-template-columns:
                    1fr;
            }


            .alerts-grid {
                grid-template-columns:
                    1fr;
            }


            .distribution-content {
                grid-template-columns:
                    1fr;
                gap: 20px;

                text-align: center;
            }


            .inventory-pagination {
                align-items: flex-start;
                flex-direction: column;
                gap: 10px;
            }

        }

        /* Inventario se muestra dentro de PublicLayout. */
        .inventario-page {
            min-height: auto;
            display: block;
        }

        .inventario-sidebar,
        .inventario-topbar {
            display: none !important;
        }

        .inventario-content {
            width: 100%;
            margin-left: 0;
        }

        .inventario-page.solo-bodega .inventory-dashboard-grid {
            display: none;
        }

    `;


    // =========================================================
    // INTERFAZ
    // =========================================================

    return (

        <>

            <style>
                {estilos}
            </style>


            <div className={
                soloBodega
                    ? 'inventario-page solo-bodega'
                    : 'inventario-page'
            }>


                {/* =================================================
                    SIDEBAR
                ================================================== */}

                <aside className="inventario-sidebar">


                    <Link
                        to="/admin"
                        className="inventario-logo"
                    >
<img
                    src="/logo-comercial-san-cristobal.png"
                    alt="Logotipo Comercial San Cristóbal"
                    style={{ width: '220px', maxWidth: '100%', height: '84px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '8px', padding: '3px' }}
                />
</Link>


                    <div className="inventario-perfil">

                        <div className="inventario-avatar">
                            👤
                        </div>


                        <div className="inventario-perfil-info">

                            <strong>
                                Administrador
                            </strong>

                            <span>
                                admin@sancristobal.com
                            </span>

                            <small>
                                ● En línea
                            </small>

                        </div>

                    </div>


                    <nav className="inventario-menu">


                        <Link to="/admin">

                            <span className="inventario-menu-icon">
                                ⌂
                            </span>

                            <span>
                                Dashboard
                            </span>

                        </Link>


                        <Link to="/clientes">

                            <span className="inventario-menu-icon">
                                ♙
                            </span>

                            <span>
                                Clientes
                            </span>

                        </Link>


                        <Link to="/productos">

                            <span className="inventario-menu-icon">
                                ◇
                            </span>

                            <span>
                                Productos
                            </span>

                        </Link>


                        <Link
                            to="/inventario"
                            className="activo"
                        >

                            <span className="inventario-menu-icon">
                                ▣
                            </span>

                            <span>
                                Inventario
                            </span>

                        </Link>


                        <Link to="/ventas">

                            <span className="inventario-menu-icon">
                                🛒
                            </span>

                            <span>
                                Ventas
                            </span>

                        </Link>


                        <Link to="/compras">

                            <span className="inventario-menu-icon">
                                ▤
                            </span>

                            <span>
                                Compras
                            </span>

                        </Link>


                        <Link to="/reportes">

                            <span className="inventario-menu-icon">
                                ▥
                            </span>

                            <span>
                                Informes y Reportes
                            </span>

                        </Link>


                        <Link to="/usuarios">

                            <span className="inventario-menu-icon">
                                ♙
                            </span>

                            <span>
                                Usuarios
                            </span>

                        </Link>


                        <Link to="/cerrar-sesion">

                            <span className="inventario-menu-icon">
                                ↪
                            </span>

                            <span>
                                Cerrar sesión
                            </span>

                        </Link>


                    </nav>


                    <div className="sidebar-ubicaciones">

                        <div className="sidebar-line">
                        </div>


                        <h4>
                            Ubicaciones
                        </h4>


                        <div className="ubicacion-side">

                            <div className="ubicacion-side-icon">
                                🏬
                            </div>


                            <div className="ubicacion-side-info">

                                <strong>
                                    Bodega Central
                                </strong>

                                <small>
                                    Almacén principal
                                </small>

                            </div>


                            <span className="ubicacion-dot">
                            </span>

                        </div>


                        <div className="ubicacion-side">

                            <div className="ubicacion-side-icon">
                                🏪
                            </div>


                            <div className="ubicacion-side-info">

                                <strong>
                                    Negocio Local
                                </strong>

                                <small>
                                    Tienda / Punto de venta
                                </small>

                            </div>


                            <span className="ubicacion-dot green">
                            </span>

                        </div>


                        <div className="sidebar-copyright">

                            Comercial San Cristóbal

                            <br />

                            © 2026 Todos los derechos reservados.

                        </div>

                    </div>


                </aside>



                {/* =================================================
                    CONTENIDO
                ================================================== */}

                <section className="inventario-content">


                    {/* =================================================
                        TOPBAR
                    ================================================== */}

                    <header className="inventario-topbar">


                        <div className="topbar-left">

                            <button
                                type="button"
                                className="topbar-menu"
                            >
                                ☰
                            </button>


                            <span className="topbar-title">

                                {soloBodega
                                    ? 'Inventario de Bodega'
                                    : 'Inventario de Tienda'}

                            </span>

                        </div>


                        <div className="topbar-right">


                            <div className="top-date">

                                <span>
                                    📅
                                </span>

                                <span>
                                    24 de mayo, 2026
                                </span>

                            </div>


                            <div className="top-notification">

                                ♧

                                <span>
                                    3
                                </span>

                            </div>


                            <div className="top-user">

                                <div className="top-user-avatar">
                                    👤
                                </div>

                                <span>
                                    Administrador
                                </span>

                                <span>
                                    ⌄
                                </span>

                            </div>


                        </div>


                    </header>



                    {/* =================================================
                        MAIN
                    ================================================== */}

                    <main className="inventario-main">


                        {/* TÍTULO */}

                        <section className="inventario-heading">

                            <h1>
                                {soloBodega
                                    ? 'Inventario de Bodega'
                                    : 'Inventario de Tienda'}
                            </h1>

                            <p>
                                {soloBodega
                                    ? 'Consulta las existencias disponibles en Bodega Central.'
                                    : 'Consulta las existencias disponibles en Negocio Local.'}
                            </p>

                        </section>



                        {/* =================================================
                            FILTROS
                        ================================================== */}

                        <section className="inventario-filtros">


                            {!soloBodega && (
                            <div className="inventory-location-buttons">

                                <Link
                                    to="/public/inventariobodega"
                                    className={
                                        'location-button'
                                    }
                                    aria-label="Ver inventario de bodega"
                                >
                                    🏬 Bodega
                                </Link>

                                <button
                                    type="button"
                                    className={
                                        mostrarTienda && !mostrarBodega
                                            ? 'location-button active'
                                            : 'location-button'
                                    }
                                    onClick={() => setUbicacion('Negocio Local')}
                                >
                                    🏪 Tienda
                                </button>

                            </div>
                            )}


                            <div className="filter-search">

                                <span>
                                    ⌕
                                </span>

                                <input
                                    type="search"
                                    value={busqueda}
                                    onChange={
                                        evento =>
                                            setBusqueda(
                                                evento.target.value
                                            )
                                    }
                                    placeholder="Buscar producto por nombre o código..."
                                />

                            </div>


                            {!soloBodega && (
                            <div className="filter-group">

                                <label>
                                    Ubicación
                                </label>

                                <select
                                    value={ubicacion}
                                    onChange={
                                        evento =>
                                            setUbicacion(
                                                evento.target.value
                                            )
                                    }
                                >

                                    <option>
                                        Todas
                                    </option>

                                    <option>
                                        Bodega Central
                                    </option>

                                    <option>
                                        Negocio Local
                                    </option>

                                </select>

                            </div>
                            )}


                            <div className="filter-group">

                                <label>
                                    Categoría
                                </label>

                                <select
                                    value={categoria}
                                    onChange={
                                        evento =>
                                            setCategoria(
                                                evento.target.value
                                            )
                                    }
                                >

                                    <option>
                                        Todas
                                    </option>

                                    {
                                        categoriasDisponibles.map(
                                            categoriaDisponible => (
                                                <option
                                                    key={categoriaDisponible}
                                                >
                                                    {categoriaDisponible}
                                                </option>
                                            )
                                        )
                                    }

                                </select>

                            </div>


                            <div className="filter-group">

                                <label>
                                    Estado
                                </label>

                                <select
                                    value={estado}
                                    onChange={
                                        evento =>
                                            setEstado(
                                                evento.target.value
                                            )
                                    }
                                >

                                    <option>
                                        Todos
                                    </option>

                                    <option>
                                        Óptimo
                                    </option>

                                    <option>
                                        Bajo
                                    </option>

                                    <option>
                                        Crítico
                                    </option>

                                </select>

                            </div>


                            <button
                                type="button"
                                className="filter-button"
                            >
                                ⚲ Filtros
                            </button>


                            <button
                                type="button"
                                className="export-button"
                                onClick={
                                    exportarInventario
                                }
                            >
                                ⇩ Exportar
                            </button>


                        </section>



                        {/* =================================================
                            INDICADORES
                        ================================================== */}

                        <section className="inventory-stats">


                            <article className="inventory-stat">

                                <div className="inventory-stat-icon stat-blue">
                                    ▦
                                </div>

                                <div className="inventory-stat-data">

                                    <small>
                                        Inventario Total
                                    </small>

                                    <h3>
                                        Q 258,650.00
                                    </h3>

                                    <span>
                                        Valor total en inventario
                                    </span>

                                </div>

                            </article>


                            <article className="inventory-stat">

                                <div className="inventory-stat-icon stat-green">
                                    ◇
                                </div>

                                <div className="inventory-stat-data">

                                    <small>
                                        Productos Registrados
                                    </small>

                                    <h3>
                                        1,245
                                    </h3>

                                    <span>
                                        Activos
                                    </span>

                                </div>

                            </article>


                            <article className="inventory-stat">

                                <div className="inventory-stat-icon stat-purple">
                                    ▣
                                </div>

                                <div className="inventory-stat-data">

                                    <small>
                                        Total de Unidades
                                    </small>

                                    <h3>
                                        32,450
                                    </h3>

                                    <span>
                                        Unidades disponibles
                                    </span>

                                </div>

                            </article>


                            <article className="inventory-stat">

                                <div className="inventory-stat-icon stat-orange">
                                    △
                                </div>

                                <div className="inventory-stat-data">

                                    <small>
                                        Productos con Stock Bajo
                                    </small>

                                    <h3>
                                        28
                                    </h3>

                                    <span>
                                        Requieren atención
                                    </span>

                                </div>

                            </article>


                            <article className="inventory-stat">

                                <div className="inventory-stat-icon stat-red">
                                    ⊗
                                </div>

                                <div className="inventory-stat-data">

                                    <small>
                                        Productos Agotados
                                    </small>

                                    <h3>
                                        8
                                    </h3>

                                    <span>
                                        Sin existencias
                                    </span>

                                </div>

                            </article>


                        </section>



                        {/* =================================================
                            RESUMEN
                        ================================================== */}

                        <section className="inventory-dashboard-grid">


                            {/* RESUMEN POR UBICACIÓN */}

                            <article className="inventory-card">


                                <div className="inventory-card-title">
                                    Resumen por Ubicación
                                </div>


                                <table className="summary-table">

                                    <thead>

                                        <tr>

                                            <th>
                                                Ubicación
                                            </th>

                                            <th>
                                                Valor en Inventario
                                            </th>

                                            <th>
                                                Unidades Disponibles
                                            </th>

                                            <th>
                                                Productos
                                            </th>

                                            <th>
                                                Stock Bajo
                                            </th>

                                            <th>
                                                Agotados
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>


                                        <tr>

                                            <td>

                                                <div className="summary-location">

                                                    <span className="summary-location-icon">
                                                        🏬
                                                    </span>

                                                    <div>

                                                        <strong>
                                                            Bodega Central
                                                        </strong>

                                                        <small>
                                                            Almacén principal
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                Q 168,230.00
                                            </td>

                                            <td>
                                                21,450
                                            </td>

                                            <td>
                                                850
                                            </td>

                                            <td>

                                                <span className="badge-number badge-orange">
                                                    18
                                                </span>

                                            </td>

                                            <td>

                                                <span className="badge-number badge-red">
                                                    5
                                                </span>

                                            </td>

                                        </tr>


                                        <tr>

                                            <td>

                                                <div className="summary-location">

                                                    <span className="summary-location-icon green">
                                                        🏪
                                                    </span>

                                                    <div>

                                                        <strong>
                                                            Negocio Local
                                                        </strong>

                                                        <small>
                                                            Tienda / Punto de venta
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                Q 90,420.00
                                            </td>

                                            <td>
                                                11,000
                                            </td>

                                            <td>
                                                620
                                            </td>

                                            <td>

                                                <span className="badge-number badge-orange">
                                                    10
                                                </span>

                                            </td>

                                            <td>

                                                <span className="badge-number badge-red">
                                                    3
                                                </span>

                                            </td>

                                        </tr>


                                        <tr className="summary-total">

                                            <td>
                                                Total General
                                            </td>

                                            <td>
                                                Q 258,650.00
                                            </td>

                                            <td>
                                                32,450
                                            </td>

                                            <td>
                                                1,470
                                            </td>

                                            <td>

                                                <span className="badge-number badge-orange">
                                                    28
                                                </span>

                                            </td>

                                            <td>

                                                <span className="badge-number badge-red">
                                                    8
                                                </span>

                                            </td>

                                        </tr>


                                    </tbody>

                                </table>


                            </article>



                            {/* DISTRIBUCIÓN */}

                            <article className="inventory-card">


                                <div className="inventory-card-title">

                                    Distribución del Inventario por Ubicación

                                </div>


                                <div className="distribution-content">


                                    <div className="distribution-legend blue">

                                        <strong>
                                            ■ Bodega Central
                                        </strong>

                                        <span>
                                            21,450 uds
                                        </span>

                                        <h3>
                                            66%
                                        </h3>

                                    </div>


                                    <div className="distribution-donut">

                                        <div className="donut-center">

                                            <strong>
                                                32,450
                                            </strong>

                                            <span>
                                                Unidades
                                            </span>

                                        </div>

                                    </div>


                                    <div className="distribution-legend green">

                                        <strong>
                                            ■ Negocio Local
                                        </strong>

                                        <span>
                                            11,000 uds
                                        </span>

                                        <h3>
                                            34%
                                        </h3>

                                    </div>


                                </div>


                            </article>


                        </section>



                        {/* =================================================
                            ALERTAS
                        ================================================== */}

                        <section className="inventory-card alerts-card">


                            <div className="inventory-card-title">
                                Alertas de Inventario
                            </div>


                            <div className="alerts-grid">


                                <article className="alert-box">

                                    <div className="alert-icon alert-orange">
                                        ♧
                                    </div>

                                    <div>

                                        <strong className="alert-orange">
                                            Stock Bajo (18)
                                        </strong>

                                        <p>

                                            Productos con inventario
                                            debajo del mínimo establecido.

                                        </p>

                                        <Link to="/inventario">
                                            Ver detalles
                                        </Link>

                                    </div>

                                </article>


                                <article className="alert-box">

                                    <div className="alert-icon alert-red">
                                        ⊗
                                    </div>

                                    <div>

                                        <strong className="alert-red">
                                            Agotados (5)
                                        </strong>

                                        <p>

                                            Productos sin existencias
                                            disponibles.

                                        </p>

                                        <Link to="/inventario">
                                            Ver detalles
                                        </Link>

                                    </div>

                                </article>


                                <article className="alert-box">

                                    <div className="alert-icon alert-blue">
                                        ▤
                                    </div>

                                    <div>

                                        <strong className="alert-blue">
                                            Próximos a Agotarse (10)
                                        </strong>

                                        <p>

                                            Productos que pueden agotarse
                                            próximamente.

                                        </p>

                                        <Link to="/inventario">
                                            Ver detalles
                                        </Link>

                                    </div>

                                </article>


                                <article className="alert-box">

                                    <div className="alert-icon alert-green">
                                        ✓
                                    </div>

                                    <div>

                                        <strong className="alert-green">
                                            Inventario Saludable
                                        </strong>

                                        <p>

                                            85% de los productos se
                                            encuentran en niveles óptimos.

                                        </p>

                                        <Link to="/inventario">
                                            Ver detalles
                                        </Link>

                                    </div>

                                </article>


                            </div>


                        </section>



                        {/* =================================================
                            INVENTARIO POR PRODUCTO
                        ================================================== */}

                        <section className="inventory-card inventory-products-card">


                            <div className="inventory-card-title">
                                Inventario por Producto y Ubicación
                            </div>


                            {cargando && (
                                <p>
                                    Cargando productos desde la base de datos...
                                </p>
                            )}

                            {error && (
                                <p>
                                    {error}
                                </p>
                            )}


                            <div className="inventory-table-scroll">


                                <table className="inventory-table">


                                    <thead>

                                        <tr>

                                            <th rowSpan="2">
                                                Producto
                                            </th>

                                            <th rowSpan="2">
                                                Código
                                            </th>

                                            <th rowSpan="2">
                                                Categoría
                                            </th>

                                            <th rowSpan="2">
                                                Unidad
                                            </th>

                                            <th rowSpan="2">Descripción</th>
                                            <th rowSpan="2">Peso (lbs)</th>
                                            <th rowSpan="2">Dimensiones</th>
                                            <th rowSpan="2">Calibre</th>
                                            <th rowSpan="2">Divisiones</th>
                                            <th rowSpan="2">Volumen (onz)</th>
                                            <th rowSpan="2">Material</th>
                                            <th rowSpan="2">Color</th>
                                            <th rowSpan="2">Forma</th>
                                            <th rowSpan="2">Talla</th>
                                            <th rowSpan="2">Estado</th>

                                            {mostrarBodega && (
                                                <th
                                                    colSpan="4"
                                                    className="group-blue"
                                                >
                                                    Bodega Central
                                                </th>
                                            )}

                                            {mostrarTienda && (
                                                <th
                                                    colSpan="4"
                                                    className="group-blue"
                                                >
                                                    Tienda
                                                </th>
                                            )}

                                            <th rowSpan="2">
                                                Acciones
                                            </th>

                                        </tr>


                                        <tr>

                                            {mostrarBodega && (
                                                <>
                                                    <th>Stock Disponible</th>
                                                    <th>Stock Mínimo</th>
                                                    <th>Stock Máximo</th>
                                                    <th>Estado</th>
                                                </>
                                            )}

                                            {mostrarTienda && (
                                                <>
                                                    <th>Stock Disponible</th>
                                                    <th>Stock Mínimo</th>
                                                    <th>Stock Máximo</th>
                                                    <th>Estado</th>
                                                </>
                                            )}

                                        </tr>

                                    </thead>


                                    <tbody>


                                        {
                                            inventarioPaginado
                                                .map(
                                                    item => (

                                                        <tr key={item.id}>


                                                            <td>

                                                                <div className="product-name-cell">

                                                                    {item.imagen && (
                                                                        <img
                                                                            src={item.imagen}
                                                                            alt=""
                                                                            width="28"
                                                                            height="28"
                                                                        />
                                                                    )}

                                                                    <span className="product-circle">
                                                                        ◯
                                                                    </span>

                                                                    {
                                                                        item.producto
                                                                    }

                                                                </div>

                                                            </td>


                                                            <td>
                                                                {item.codigo}
                                                            </td>


                                                            <td>
                                                                {item.categoria}
                                                            </td>


                                                            <td>
                                                                {item.unidad}
                                                            </td>

                                                            <td>{item.descripcion}</td>
                                                            <td>{item.peso ?? '-'}</td>
                                                            <td>{item.dimensiones}</td>
                                                            <td>{item.calibre ?? '-'}</td>
                                                            <td>{item.divisiones ?? '-'}</td>
                                                            <td>{item.volumen ?? '-'}</td>
                                                            <td>{item.material}</td>
                                                            <td>{item.color}</td>
                                                            <td>{item.forma}</td>
                                                            <td>{item.talla}</td>
                                                            <td>{item.estadoProducto}</td>


                                                            {mostrarBodega && (
                                                                <>
                                                                    <td>
                                                                        {item.bodegaStock.toLocaleString()}
                                                                    </td>

                                                                    <td>
                                                                        {item.bodegaMinimo.toLocaleString()}
                                                                    </td>

                                                                    <td>
                                                                        {item.bodegaMaximo.toLocaleString()}
                                                                    </td>

                                                                    <td>

                                                                <span
                                                                    className={
                                                                        claseEstado(
                                                                            item.bodegaEstado
                                                                        )
                                                                    }
                                                                >

                                                                    {
                                                                        item.bodegaEstado
                                                                    }

                                                                </span>

                                                                    </td>
                                                                </>
                                                            )}

                                                            {mostrarTienda && (
                                                                <>
                                                                    <td>
                                                                        {item.localStock.toLocaleString()}
                                                                    </td>

                                                                    <td>
                                                                        {item.localMinimo.toLocaleString()}
                                                                    </td>

                                                                    <td>
                                                                        {item.localMaximo.toLocaleString()}
                                                                    </td>

                                                                    <td>

                                                                <span
                                                                    className={
                                                                        claseEstado(
                                                                            item.localEstado
                                                                        )
                                                                    }
                                                                >

                                                                    {
                                                                        item.localEstado
                                                                    }

                                                                </span>

                                                                    </td>
                                                                </>
                                                            )}


                                                            <td>

                                                                <button
                                                                    type="button"
                                                                    className="edit-button"
                                                                    title="Editar producto"
                                                                    onClick={
                                                                        () => abrirEdicion(item)
                                                                    }
                                                                >
                                                                    Editar
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="delete-button"
                                                                    title="Eliminar producto"
                                                                    onClick={
                                                                        () => abrirEliminacion(item)
                                                                    }
                                                                >
                                                                    Eliminar
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="view-button"
                                                                    title="Ver producto"
                                                                    onClick={
                                                                        () =>
                                                                            alert(
                                                                                `Producto: ${item.producto}`
                                                                            )
                                                                    }
                                                                >
                                                                    ◉
                                                                </button>

                                                            </td>


                                                        </tr>

                                                    )
                                                )
                                        }


                                    </tbody>


                                </table>


                            </div>



                            {/* PAGINACIÓN */}

                            <div className="inventory-pagination">


                                <span>

                                    Mostrando {
                                        inventarioFiltrado.length === 0
                                            ? 0
                                            : ((pagina - 1) * mostrar) + 1
                                    } a {
                                        Math.min(
                                            pagina * mostrar,
                                            inventarioFiltrado.length
                                        )
                                    } de {
                                        inventarioFiltrado.length
                                    } productos

                                </span>


                                <div className="pagination-center">

                                    <button
                                        onClick={() => setPagina(1)}
                                    >
                                        «
                                    </button>

                                    <button
                                        onClick={() => setPagina(Math.max(1, pagina - 1))}
                                    >
                                        ‹
                                    </button>

                                    {Array.from(
                                        { length: paginasTotales },
                                        (_, indice) => indice + 1
                                    ).map(numeroPagina => (
                                        <button
                                            key={numeroPagina}
                                            className={
                                                pagina === numeroPagina
                                                    ? 'active'
                                                    : ''
                                            }
                                            onClick={() => setPagina(numeroPagina)}
                                        >
                                            {numeroPagina}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setPagina(Math.min(paginasTotales, pagina + 1))}
                                    >
                                        ›
                                    </button>

                                    <button
                                        onClick={() => setPagina(paginasTotales)}
                                    >
                                        »
                                    </button>

                                </div>


                                <div className="show-control">

                                    <span>
                                        Mostrar:
                                    </span>

                                    <select
                                        value={mostrar}
                                        onChange={
                                            evento =>
                                                setMostrar(
                                                    Number(
                                                        evento.target.value
                                                    )
                                                )
                                        }
                                    >

                                        <option value="5">
                                            5
                                        </option>

                                        <option value="10">
                                            10
                                        </option>

                                        <option value="20">
                                            20
                                        </option>

                                    </select>

                                </div>


                            </div>


                        </section>


                    </main>


                    {
                        productoEditando
                        && (
                            <div
                                className="edit-overlay"
                                onClick={() => setProductoEditando(null)}
                            >

                                <form
                                    className="edit-modal"
                                    onSubmit={guardarEdicion}
                                    onClick={evento => evento.stopPropagation()}
                                >

                                    <div className="edit-modal-header">
                                        <h2>Editar producto</h2>

                                        <button
                                            type="button"
                                            className="edit-close"
                                            onClick={() => setProductoEditando(null)}
                                        >
                                            ×
                                        </button>
                                    </div>


                                    <div className="edit-fields">

                                        <div className="edit-field">
                                            <label>Nombre</label>
                                            <input
                                                value={productoEditando.producto}
                                                onChange={evento =>
                                                    setProductoEditando({
                                                        ...productoEditando,
                                                        producto: evento.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>


                                        <div className="edit-field">
                                            <label>SKU</label>
                                            <input
                                                value={productoEditando.codigo === '-' ? '' : productoEditando.codigo}
                                                onChange={evento =>
                                                    setProductoEditando({
                                                        ...productoEditando,
                                                        codigo: evento.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>


                                        <div className="edit-field">
                                            <label>Precio de venta</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={productoEditando.precioVenta}
                                                onChange={evento =>
                                                    setProductoEditando({
                                                        ...productoEditando,
                                                        precioVenta: evento.target.value
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="edit-field">
                                            <label>Precio por mayor</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={productoEditando.precioMayorista}
                                                onChange={evento =>
                                                    setProductoEditando({
                                                        ...productoEditando,
                                                        precioMayorista: evento.target.value
                                                    })
                                                }
                                            />
                                        </div>


                                        <div className="edit-field">
                                            <label>Estado</label>
                                            <select
                                                value={productoEditando.estadoProducto}
                                                onChange={evento =>
                                                    setProductoEditando({
                                                        ...productoEditando,
                                                        estadoProducto: evento.target.value
                                                    })
                                                }
                                            >
                                                <option value="ACTIVO">Activo</option>
                                                <option value="INACTIVO">Inactivo</option>
                                            </select>
                                        </div>


                                        <div className="edit-field full">
                                            <label>Descripción</label>
                                            <textarea
                                                value={productoEditando.descripcion}
                                                onChange={evento =>
                                                    setProductoEditando({
                                                        ...productoEditando,
                                                        descripcion: evento.target.value
                                                    })
                                                }
                                            />
                                        </div>


                                        <div className="edit-field full">
                                            <label>Imagen del producto</label>
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                                onChange={seleccionarImagenEdicion}
                                            />

                                            <div className="edit-image-preview">
                                                {productoEditando.imagen ? (
                                                    <img
                                                        src={productoEditando.imagen}
                                                        alt={productoEditando.producto}
                                                    />
                                                ) : (
                                                    <span>Sin imagen seleccionada</span>
                                                )}

                                                <span>
                                                    JPG, PNG o WEBP. Máximo 2 MB.
                                                </span>
                                            </div>
                                        </div>


                                        <div className="edit-field">
                                            <label>Material</label>
                                            <input
                                                value={productoEditando.material}
                                                onChange={evento =>
                                                    setProductoEditando({
                                                        ...productoEditando,
                                                        material: evento.target.value
                                                    })
                                                }
                                            />
                                        </div>


                                        <div className="edit-field">
                                            <label>Color</label>
                                            <input
                                                value={productoEditando.color}
                                                onChange={evento =>
                                                    setProductoEditando({
                                                        ...productoEditando,
                                                        color: evento.target.value
                                                    })
                                                }
                                            />
                                        </div>

                                    </div>


                                    <div className="edit-modal-actions">
                                        <button
                                            type="button"
                                            className="edit-cancel"
                                            onClick={() => setProductoEditando(null)}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            className="edit-save"
                                            disabled={guardandoEdicion}
                                        >
                                            {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                                        </button>
                                    </div>

                                </form>

                            </div>
                        )
                    }


                    {
                        productoAEliminar
                        && (
                            <div
                                className="edit-overlay"
                                onClick={() => setProductoAEliminar(null)}
                            >

                                <form
                                    className="edit-modal delete-modal"
                                    onSubmit={eliminarProducto}
                                    onClick={evento => evento.stopPropagation()}
                                >

                                    <div className="edit-modal-header">
                                        <h2>Eliminar producto</h2>

                                        <button
                                            type="button"
                                            className="edit-close"
                                            onClick={() => setProductoAEliminar(null)}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <p className="delete-warning">
                                        Para eliminar <strong>{productoAEliminar.producto}</strong>,
                                        ingresa las credenciales de un usuario administrador.
                                    </p>

                                    <div className="edit-fields">

                                        <div className="edit-field full">
                                            <label htmlFor="usuario-eliminacion">Usuario administrador</label>
                                            <input
                                                id="usuario-eliminacion"
                                                value={credencialesEliminacion.usuario}
                                                onChange={evento =>
                                                    setCredencialesEliminacion({
                                                        ...credencialesEliminacion,
                                                        usuario: evento.target.value
                                                    })
                                                }
                                                autoComplete="username"
                                                required
                                            />
                                        </div>

                                        <div className="edit-field full">
                                            <label htmlFor="password-eliminacion">Contraseña</label>
                                            <input
                                                id="password-eliminacion"
                                                type="password"
                                                value={credencialesEliminacion.password}
                                                onChange={evento =>
                                                    setCredencialesEliminacion({
                                                        ...credencialesEliminacion,
                                                        password: evento.target.value
                                                    })
                                                }
                                                autoComplete="current-password"
                                                required
                                            />
                                        </div>

                                    </div>

                                    {error && (
                                        <p className="delete-error">{error}</p>
                                    )}

                                    <div className="edit-modal-actions">
                                        <button
                                            type="button"
                                            className="edit-cancel"
                                            onClick={() => setProductoAEliminar(null)}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            className="edit-save"
                                            disabled={eliminandoProducto}
                                        >
                                            {eliminandoProducto ? 'Eliminando...' : 'Confirmar eliminación'}
                                        </button>
                                    </div>

                                </form>

                            </div>
                        )
                    }

                </section>


            </div>

        </>

    );

}


export default Inventario;