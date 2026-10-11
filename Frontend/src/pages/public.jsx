import React, { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';


function Public({ embedded = false }) {

    const location = useLocation();
    const [ventas, setVentas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    const [periodo, setPeriodo] = useState('mes');
    const [cargandoDashboard, setCargandoDashboard] = useState(true);
    const [errorDashboard, setErrorDashboard] = useState('');

    useEffect(() => {
        let activo = true;
        async function cargarDashboard() {
            setCargandoDashboard(true);
            try {
                const rutas = ['/api/cliente/ventas', '/api/cliente/productos', '/api/cliente/solicitudes-bodega'];
                const respuestas = await Promise.all(rutas.map((ruta) => fetch(ruta)));
                const cuerpos = await Promise.all(respuestas.map((respuesta) => respuesta.json().catch(() => [])));
                const fallida = respuestas.findIndex((respuesta) => !respuesta.ok);
                if (fallida >= 0) throw new Error(cuerpos[fallida]?.error || 'No fue posible cargar los datos del dashboard.');
                if (!activo) return;
                setVentas(Array.isArray(cuerpos[0]) ? cuerpos[0] : []);
                setProductos(Array.isArray(cuerpos[1]) ? cuerpos[1] : []);
                setSolicitudes(Array.isArray(cuerpos[2]) ? cuerpos[2] : []);
                setErrorDashboard('');
            } catch (error) {
                if (activo) setErrorDashboard(error.message || 'No fue posible cargar los datos del dashboard.');
            } finally {
                if (activo) setCargandoDashboard(false);
            }
        }
        cargarDashboard();
        return () => { activo = false; };
    }, []);

    const ventasPeriodo = useMemo(() => {
        const ahora = new Date();
        const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const inicioSemana = new Date(inicioDia);
        inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const inicioAno = new Date(ahora.getFullYear(), 0, 1);
        const inicio = periodo === 'dia' ? inicioDia : periodo === 'semana' ? inicioSemana : periodo === 'ano' ? inicioAno : inicioMes;
        return ventas.filter((venta) => {
            const fecha = new Date(venta.fecha_venta);
            return !Number.isNaN(fecha.getTime()) && fecha >= inicio && fecha <= ahora;
        });
    }, [ventas, periodo]);

    const totalVentasPeriodo = ventasPeriodo.reduce((total, venta) => total + Number(venta.total || 0), 0);
    const totalInventario = productos.reduce((total, producto) => total + Number(producto.bodega_stock || 0) + Number(producto.tienda_stock || 0), 0);
    const solicitudesPendientes = solicitudes.filter((solicitud) => String(solicitud.estado || '').toLowerCase() === 'pendiente').length;
    const formatoMoneda = (valor) => `Q ${Number(valor || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const alertasInventario = useMemo(() => productos.flatMap((producto) => {
        const ubicaciones = [
            { nombre: 'Bodega', stock: Number(producto.bodega_stock || 0), minimo: Number(producto.bodega_minimo || 0), asignada: producto.bodega_asignado },
            { nombre: 'Tienda', stock: Number(producto.tienda_stock || 0), minimo: Number(producto.tienda_minimo || 0), asignada: producto.tienda_asignado },
        ];
        return ubicaciones.filter((ubicacion) => ubicacion.asignada && (ubicacion.stock === 0 || (ubicacion.minimo > 0 && ubicacion.stock < ubicacion.minimo))).map((ubicacion) => ({
            id: `${producto.producto_id}-${ubicacion.nombre}`, producto: producto.nombre, ubicacion: ubicacion.nombre,
            stock: ubicacion.stock, minimo: ubicacion.minimo, estado: ubicacion.stock === 0 ? 'Crítico' : 'Stock Bajo',
        }));
    }).sort((a, b) => a.stock - b.stock).slice(0, 8), [productos]);

    const productosPorCategoria = useMemo(() => {
        const conteo = new Map();
        productos.forEach((producto) => { const nombre = producto.categoria || 'Sin categoría'; conteo.set(nombre, (conteo.get(nombre) || 0) + 1); });
        return [...conteo.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
    }, [productos]);

    const ventasPorMetodo = useMemo(() => {
        const conteo = new Map();
        ventasPeriodo.forEach((venta) => { const metodo = String(venta.tipo_pago || 'No especificado').replaceAll('_', ' '); conteo.set(metodo, (conteo.get(metodo) || 0) + Number(venta.total || 0)); });
        const total = [...conteo.values()].reduce((suma, monto) => suma + monto, 0);
        return [...conteo.entries()].map(([nombre, monto]) => ({ nombre, monto, porcentaje: total ? Math.round(monto / total * 100) : 0 })).sort((a, b) => b.monto - a.monto);
    }, [ventasPeriodo]);

    const serieVentas = useMemo(() => {
        let buckets;
        if (periodo === 'dia') {
            buckets = Array.from({ length: 12 }, (_, indice) => ({ label: `${String(indice * 2).padStart(2, '0')} h`, valor: 0 }));
            ventasPeriodo.forEach((venta) => { const indice = Math.floor(new Date(venta.fecha_venta).getHours() / 2); buckets[indice].valor += Number(venta.total || 0); });
        } else if (periodo === 'semana') {
            buckets = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => ({ label, valor: 0 }));
            ventasPeriodo.forEach((venta) => { const indice = (new Date(venta.fecha_venta).getDay() + 6) % 7; buckets[indice].valor += Number(venta.total || 0); });
        } else if (periodo === 'ano') {
            buckets = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((label) => ({ label, valor: 0 }));
            ventasPeriodo.forEach((venta) => { buckets[new Date(venta.fecha_venta).getMonth()].valor += Number(venta.total || 0); });
        } else {
            buckets = Array.from({ length: 5 }, (_, indice) => ({ label: `Sem ${indice + 1}`, valor: 0 }));
            ventasPeriodo.forEach((venta) => { const indice = Math.min(Math.floor((new Date(venta.fecha_venta).getDate() - 1) / 7), 4); buckets[indice].valor += Number(venta.total || 0); });
        }
        return buckets;
    }, [ventasPeriodo, periodo]);
    const maxVentaGrafica = Math.max(...serieVentas.map((item) => item.valor), 1);



    const menu = [
        { nombre: 'Dashboard', icono: '⌂', ruta: '/public' },
        { nombre: 'Productos', icono: '◇', ruta: '/public/productos' },
        { nombre: 'Inventario', icono: '⬡', ruta: '/public/inventario' },
        { nombre: 'Ventas', icono: '🛒', ruta: '/public/ventas' },
        { nombre: 'Compras', icono: '▣', ruta: '/public/compras' },
        { nombre: 'Informes y Reportes', icono: '▥', ruta: '/public/informes' },
        { nombre: 'Usuarios', icono: '♙', ruta: '/public/usuarios' },
        { nombre: 'Cerrar sesión', icono: '↪', ruta: '/cerrar-sesion' }
    ];


    function claseEstado(estado) {

        if (estado === 'Crítico') {
            return 'estado critico';
        }

        if (estado === 'Stock Bajo') {
            return 'estado bajo';
        }

        return 'estado disponible';
    }


    const estilos = `

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            background: #f3f7fc;
            font-family: Arial, Helvetica, sans-serif;
            color: #152542;
        }

        button,
        select {
            font: inherit;
        }

        .admin-page {
            min-height: 100vh;
            display: flex;
            background: #f4f8fd;
        }

        .embedded-dashboard {
            min-height: auto;
            display: block;
            background: transparent;
        }

        .embedded-dashboard .sidebar,
        .embedded-dashboard .topbar {
            display: none;
        }

        .embedded-dashboard .admin-content {
            width: 100%;
            margin-left: 0;
        }


        /* =====================================
           SIDEBAR
        ===================================== */

        .sidebar {
            width: 250px;
            min-height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            color: white;
            background:
                linear-gradient(
                    180deg,
                    #063782 0%,
                    #032b69 52%,
                    #062b64 100%
                );
            z-index: 100;
        }

        .sidebar-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 27px 22px 20px;
            text-decoration: none;
            color: white;
        }

        .sidebar-logo-icon {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            font-size: 32px;
        }

        .sidebar-logo-text {
            display: flex;
            flex-direction: column;
            line-height: 1.02;
        }

        .sidebar-logo-text strong {
            font-size: 17px;
            font-weight: 900;
        }

        .sidebar-logo-text small {
            margin-top: 6px;
            font-size: 12px;
            color: #d5e6ff;
        }


        /* PERFIL */

        .sidebar-user {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 22px 20px;
        }

        .user-avatar {
            width: 48px;
            height: 48px;
            flex: 0 0 48px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            color: #06347b;
            background: white;
            font-size: 26px;
        }

        .sidebar-user-info {
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        .sidebar-user-info strong {
            font-size: 12px;
        }

        .sidebar-user-info small {
            margin-top: 4px;
            font-size: 12px;
            color: #d5e4fb;
        }

        .online {
            color: #74e692 !important;
        }


        /* MENU */

        .sidebar-menu {
            display: grid;
            gap: 4px;
            padding: 6px 12px;
        }

        .sidebar-menu button,
        .sidebar-menu a {
            width: 100%;
            min-height: 45px;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 0 15px;
            border: 0;
            border-radius: 6px;
            color: #e1ebfb;
            background: transparent;
            text-align: left;
            cursor: pointer;
            transition: .2s;
            font-size: 12px;
            font-weight: 700;
        }

        .sidebar-menu a {
            text-decoration: none;
        }

        .sidebar-menu button:hover,
        .sidebar-menu a:hover {
            background: rgba(255,255,255,.08);
        }

        .sidebar-menu button.activo,
        .sidebar-menu a.activo {
            color: white;
            background: #145ed6;
        }

        .menu-icon {
            width: 24px;
            text-align: center;
            font-size: 19px;
        }


        /* FOOTER SIDEBAR */

        .sidebar-footer {
            margin-top: auto;
            padding: 24px 22px;
            border-top: 1px solid rgba(255,255,255,.15);
        }

        .sidebar-footer strong {
            display: block;
            font-size: 12px;
        }

        .sidebar-footer small {
            display: block;
            margin-top: 7px;
            font-size: 12px;
            color: #cfe0f7;
        }


        /* =====================================
           AREA PRINCIPAL
        ===================================== */

        .admin-content {
            width: calc(100% - 250px);
            margin-left: 250px;
        }


        /* HEADER */

        .topbar {
            height: 65px;
            position: sticky;
            top: 0;
            z-index: 90;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 23px;
            border-bottom: 1px solid #dbe4ef;
            background: rgba(255,255,255,.97);
        }

        .topbar-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .hamburger {
            border: 0;
            background: transparent;
            color: #18375e;
            font-size: 22px;
            cursor: pointer;
        }

        .topbar-title {
            font-size: 16px;
            font-weight: 800;
            color: #11264b;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 26px;
        }

.top-user {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 800;
        }

        .top-user-avatar {
            width: 29px;
            height: 29px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            color: white;
            background: #123b80;
        }


        /* =====================================
           DASHBOARD
        ===================================== */

        .dashboard {
            padding: 23px;
        }

        .welcome-admin h1 {
            margin: 0;
            color: #102a54;
            font-size: 24px;
        }

        .welcome-admin p {
            margin: 6px 0 19px;
            color: #718097;
            font-size: 13px;
        }


        /* =====================================
           KPI CARDS
        ===================================== */

        .dashboard-period-filter { display:flex; align-items:center; justify-content:space-between; gap:14px; margin:0 0 16px; padding:14px 17px; border:1px solid #dce4ee; border-radius:9px; background:#fff; }
        .dashboard-period-filter strong { display:block; color:#173459; font-size:13px; }
        .dashboard-period-filter small { display:block; margin-top:4px; color:#718096; font-size:12px; }
        .dashboard-period-filter select { padding:8px 11px; border:1px solid #dae2ed; border-radius:6px; color:#344964; background:#fff; font-size:13px; }
        .dashboard-load-state { margin:0 0 12px; padding:10px 13px; border-radius:7px; background:#fff4e2; color:#885b0a; font-size:12px; }
        .dashboard-real-chart { min-height:208px; display:grid; grid-template-columns:repeat(auto-fit,minmax(28px,1fr)); align-items:end; gap:8px; padding:20px 14px 8px; }
        .dashboard-real-bar { min-width:0; display:flex; height:180px; flex-direction:column; justify-content:flex-end; align-items:center; gap:6px; }
        .dashboard-real-bar-fill { width:min(26px,72%); min-height:3px; border-radius:5px 5px 2px 2px; background:linear-gradient(180deg,#4e9cf5,#1765d1); }
        .dashboard-real-bar small { color:#718096; font-size: 13px; white-space:nowrap; }
        .dashboard-chart-total { padding:8px 15px 13px; border-top:1px solid #edf1f6; color:#667991; font-size:12px; }
        .dashboard-chart-total strong { color:#163e77; font-size:13px; }
        .dashboard-empty { padding:24px; color:#8391a5; text-align:center; font-size:12px; }
        .dashboard-category-row { display:grid; grid-template-columns:1fr auto; gap:6px 12px; padding:10px 16px; border-bottom:1px solid #edf1f6; color:#324967; font-size:12px; }
        .dashboard-category-track { grid-column:1 / -1; height:5px; overflow:hidden; border-radius:8px; background:#edf1f6; }
        .dashboard-category-track span { display:block; height:100%; border-radius:inherit; background:#327be2; }
        .dashboard-alert-count { margin-left:7px; padding:3px 7px; border-radius:10px; background:#fff0df; color:#a05f13; font-size: 13px; }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 11px;
        }

        .stat-card {
            min-height: 112px;
            display: flex;
            align-items: center;
            gap: 13px;
            padding: 18px 14px;
            border: 1px solid #dce4ee;
            border-radius: 9px;
            background: white;
            box-shadow: 0 2px 7px rgba(31,64,105,.03);
        }

        .stat-icon {
            width: 50px;
            height: 50px;
            flex: 0 0 50px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            font-size: 25px;
        }

        .icon-blue {
            color: #2677de;
            background: #dcecff;
        }

        .icon-green {
            color: #24aa78;
            background: #ddf4e9;
        }

        .icon-purple {
            color: #775be4;
            background: #ece8ff;
        }

        .icon-orange {
            color: #d98b21;
            background: #ffefd6;
        }

        .icon-red {
            color: #ef6262;
            background: #ffe7e7;
        }

        .stat-info {
            min-width: 0;
        }

        .stat-info small {
            display: block;
            color: #334965;
            font-size: 12px;
            font-weight: 700;
        }

        .stat-info h3 {
            margin: 6px 0;
            color: #0f2854;
            font-size: 20px;
        }

        .stat-info span {
            font-size: 13px;
            color: #718197;
        }

        .positive {
            color: #22a76d !important;
        }


        /* =====================================
           PANELS
        ===================================== */

        .dashboard-grid {
            display: grid;
            grid-template-columns: 1.05fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
        }

        .dashboard-card {
            overflow: hidden;
            border: 1px solid #dce4ee;
            border-radius: 9px;
            background: white;
        }

        .dashboard-card-header {
            min-height: 42px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
        }

        .dashboard-card-header strong {
            color: #153462;
            font-size: 13px;
        }

        .dashboard-card-header select {
            padding: 6px 10px;
            border: 1px solid #dae2ed;
            border-radius: 5px;
            color: #344964;
            background: white;
            font-size: 12px;
        }


        /* =====================================
           GRAFICA LINEA
        ===================================== */

        .line-chart-wrapper {
            padding: 0 16px 12px;
        }

        .line-chart {
            width: 100%;
            height: 205px;
        }

        .grid-line {
            stroke: #e7ecf3;
            stroke-width: 1;
        }

        .line-path {
            fill: none;
            stroke: #1767d7;
            stroke-width: 3;
        }

        .area-path {
            fill: rgba(36,111,220,.13);
        }

        .chart-point {
            fill: #1767d7;
        }

        .axis-label {
            fill: #68778d;
            font-size: 12px;
        }


        /* =====================================
           DONUT CHART
        ===================================== */

        .donut-content {
            min-height: 205px;
            display: grid;
            grid-template-columns: 48% 52%;
            align-items: center;
            padding: 0 15px 16px;
        }

        .donut {
            width: 150px;
            height: 150px;
            margin: auto;
            border-radius: 50%;
            position: relative;
        }

        .donut-category {
            background:
                conic-gradient(
                    #125bd3 0 35%,
                    #327be2 35% 60%,
                    #5a9def 60% 80%,
                    #67c2c4 80% 92%,
                    #64c69c 92% 100%
                );
        }

        .donut-payment {
            background:
                conic-gradient(
                    #115bd4 0 60%,
                    #5899ed 60% 85%,
                    #62c8a6 85% 100%
                );
        }

        .donut::after {
            content: '';
            width: 62px;
            height: 62px;
            position: absolute;
            inset: 0;
            margin: auto;
            border-radius: 50%;
            background: white;
        }

        .donut-label {
            position: absolute;
            z-index: 3;
            color: white;
            font-size: 12px;
            font-weight: 800;
        }

        .donut-label.l1 {
            top: 28px;
            right: 24px;
        }

        .donut-label.l2 {
            bottom: 24px;
            right: 32px;
        }

        .donut-label.l3 {
            left: 18px;
            bottom: 51px;
        }

        .donut-legend {
            display: grid;
            gap: 12px;
        }

        .legend-row {
            display: grid;
            grid-template-columns: 10px 1fr auto;
            gap: 8px;
            align-items: center;
            font-size: 12px;
        }

        .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .dot1 { background: #125bd3; }
        .dot2 { background: #327be2; }
        .dot3 { background: #5a9def; }
        .dot4 { background: #67c2c4; }
        .dot5 { background: #64c69c; }

        .legend-row strong {
            color: #173459;
        }


        /* =====================================
           TABLA INVENTARIO
        ===================================== */

        .inventory-table-wrapper {
            padding: 0 13px 13px;
        }

        .inventory-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        .inventory-table th {
            padding: 6px;
            color: #42536b;
            background: #f4f7fa;
            font-size: 13px;
            text-align: left;
        }

        .inventory-table td {
            padding: 6px;
            border-bottom: 1px solid #edf0f4;
            color: #33455f;
        }

        .product-cell {
            display: flex;
            align-items: center;
            gap: 7px;
        }

        .product-mini {
            width: 19px;
            height: 19px;
            display: grid;
            place-items: center;
            border-radius: 4px;
            background: #edf2f6;
        }

        .estado {
            display: inline-block;
            min-width: 52px;
            padding: 4px 6px;
            border-radius: 5px;
            text-align: center;
            font-size: 13px;
        }

        .estado.bajo {
            color: #a86c00;
            background: #fff1d5;
        }

        .estado.critico {
            color: #d94141;
            background: #ffe1e1;
        }

        .estado.disponible {
            color: #188b52;
            background: #dcf4e7;
        }

        .table-link {
            display: block;
            padding: 8px;
            color: #1d64cb;
            text-align: center;
            font-size: 12px;
            font-weight: 700;
        }


        /* =====================================
           VENTAS PAGO
        ===================================== */

        .payment-legend {
            display: grid;
            gap: 18px;
        }

        .payment-row {
            display: grid;
            grid-template-columns: 10px 1fr auto;
            gap: 8px;
            align-items: start;
        }

        .payment-row p {
            margin: 0;
            color: #173459;
            font-size: 12px;
            font-weight: 700;
        }

        .payment-row small {
            color: #718096;
            font-size: 13px;
        }

        .payment-row strong {
            font-size: 12px;
        }



        /* =====================================
           RESPONSIVE
        ===================================== */

        @media (max-width: 1200px) {

            .stats-grid {
                grid-template-columns: repeat(3, 1fr);
            }

            .productos-public-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }


        @media (max-width: 900px) {

            .sidebar {
                width: 78px;
            }

            .sidebar-logo-text,
            .sidebar-user-info,
            .sidebar-menu button span:last-child,
            .sidebar-footer {
                display: none;
            }

            .sidebar-logo {
                justify-content: center;
                padding-left: 0;
                padding-right: 0;
            }

            .sidebar-user {
                justify-content: center;
                padding-left: 0;
                padding-right: 0;
            }

            .sidebar-menu {
                padding-left: 8px;
                padding-right: 8px;
            }

            .sidebar-menu button {
                justify-content: center;
                padding: 0;
            }

            .admin-content {
                width: calc(100% - 78px);
                margin-left: 78px;
            }

            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .dashboard-grid {
                grid-template-columns: 1fr;
            }
        }


        @media (max-width: 600px) {

            .dashboard {
                padding: 14px;
            }

.topbar-right {
                gap: 15px;
            }

            .top-user span {
                display: none;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .donut-content {
                grid-template-columns: 1fr;
                gap: 25px;
            }

            .inventory-table {
                min-width: 550px;
            }

            .inventory-table-wrapper {
                overflow-x: auto;
            }
        }

    `;


    return (

        <>

            <style>
                {estilos}
            </style>

            <style>{`
                .admin-page { background:#f3f6fb; color:#172b4d; font-family:Inter,"Segoe UI",Arial,sans-serif; }
                .sidebar { width:270px; color:#dce8f8; background:linear-gradient(180deg,#102f5d,#0b2448); box-shadow:8px 0 28px rgba(16,39,74,.08); }
                .sidebar-logo { min-height:104px; justify-content:center; padding:16px 18px; border-bottom:1px solid rgba(255,255,255,.1); }
                .sidebar-user { margin:12px 14px 8px; padding:15px 12px; border:1px solid rgba(255,255,255,.12); border-radius:14px; background:rgba(255,255,255,.06); }
                .user-avatar { color:#fff; background:linear-gradient(145deg,#3d8df1,#245ec4); box-shadow:0 5px 14px rgba(0,0,0,.15); }
                .sidebar-menu { gap:6px; padding:12px 14px; }
                .sidebar-menu a { min-height:48px; border-radius:11px; color:#cfdbed; font-size:14px; transition:background .18s ease,color .18s ease,transform .18s ease; }
                .sidebar-menu a:hover { color:#fff; background:rgba(255,255,255,.09); transform:translateX(2px); }
                .sidebar-menu a.activo { color:#fff; background:linear-gradient(100deg,#2879e6,#1b61c7); box-shadow:0 7px 18px rgba(16,89,190,.28); }
                .admin-content { width:calc(100% - 270px); margin-left:270px; }
                .topbar { height:74px; padding:0 30px; border-bottom-color:#e8edf5; background:rgba(255,255,255,.94); box-shadow:0 4px 18px rgba(21,45,80,.04); backdrop-filter:blur(12px); }
                .topbar-title { color:#17345f; font-size:18px; letter-spacing:-.02em; }
                .hamburger { display:none; }
                .top-user { gap:10px; padding:7px 12px 7px 8px; border:1px solid #e7edf5; border-radius:999px; color:#354b68; background:#fff; font-size:14px; }
                .top-user-avatar { width:34px; height:34px; color:#2165c8; background:#e8f1ff; }
                .dashboard { max-width:1680px; margin:0 auto; padding:30px; }
                .welcome-admin { margin-bottom:22px; padding:28px 32px; border:1px solid #d9e8fb; border-radius:20px; background:linear-gradient(115deg,#eaf3ff,#f8fbff 68%,#edf7ff); box-shadow:0 10px 26px rgba(35,86,151,.06); }
                .welcome-admin h1 { color:#153a70; font-size:clamp(25px,2.5vw,32px); letter-spacing:-.035em; }
                .welcome-admin p { margin:8px 0 0; color:#61758f; font-size:15px; }
                .dashboard-period-filter { min-height:76px; margin-bottom:20px; padding:17px 20px; border-color:#e3eaf3; border-radius:15px; box-shadow:0 6px 20px rgba(20,43,76,.04); }
                .dashboard-period-filter strong,.stat-info small { font-size:14px; }
                .dashboard-period-filter small { font-size:13px; }
                .dashboard-period-filter select { min-width:155px; min-height:42px; border-color:#d8e2ef; border-radius:10px; font-size:14px; }
                .stats-grid { grid-template-columns:repeat(auto-fit,minmax(205px,1fr)); gap:16px; margin-bottom:18px; }
                .stat-card { min-height:132px; padding:20px; border-color:#e5ebf3; border-radius:16px; box-shadow:0 7px 22px rgba(20,43,76,.045); transition:transform .18s ease,box-shadow .18s ease; }
                .stat-card:hover { transform:translateY(-2px); box-shadow:0 12px 26px rgba(20,43,76,.09); }
                .stat-icon { width:54px; height:54px; flex-basis:54px; border-radius:15px; }
                .stat-info h3 { font-size:clamp(19px,1.6vw,24px); letter-spacing:-.025em; }
                .stat-info span,.dashboard-chart-total,.dashboard-chart-total strong { font-size:14px; }
                .dashboard-grid { gap:18px; margin-bottom:18px; }
                .dashboard-card { border-color:#e4eaf2; border-radius:16px; box-shadow:0 7px 22px rgba(20,43,76,.045); }
                .dashboard-card-header { min-height:58px; padding:0 20px; border-bottom:1px solid #edf1f6; }
                .dashboard-card-header strong { font-size:15px; }
                .dashboard-category-row { padding:13px 20px; font-size:14px; }
                .dashboard-category-track { height:7px; }
                .dashboard-real-chart { min-height:230px; padding:22px 20px 10px; }
                .dashboard-real-bar { height:195px; }
                .dashboard-real-bar small { font-size:12px; }
                .inventory-table-wrapper { padding:8px 18px 16px; }
                .inventory-table { font-size:14px; }
                .inventory-table th { padding:12px 10px; font-size:13px; }
                .inventory-table td { padding:12px 10px; }
                .estado { min-width:78px; padding:6px 9px; font-size:12px; }
                .table-link { padding:12px; font-size:14px; text-decoration:none; }
                .table-link:hover { color:#104da8; text-decoration:underline; }
                .payment-legend { gap:0; }
                .payment-row { padding:13px 0; border-bottom:1px solid #edf1f6; }
                .payment-row p,.payment-row strong { font-size:14px; }
                .payment-row small { font-size:13px; }
                .dashboard-empty { font-size:14px; }
                @media(max-width:900px) {
                    .sidebar { width:78px; }
                    .sidebar-menu a span:last-child { display:none; }
                    .sidebar-menu a { justify-content:center; padding:0; }
                    .admin-content { width:calc(100% - 78px); margin-left:78px; }
                    .dashboard { padding:22px; }
                    .stats-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
                }
                @media(max-width:600px) {
                    .topbar { height:64px; padding:0 16px; }
                    .topbar-title { font-size:16px; }
                    .top-user { padding:5px; }
                    .top-user span { display:none; }
                    .dashboard { padding:16px 12px; }
                    .welcome-admin { padding:22px 19px; border-radius:15px; }
                    .dashboard-period-filter { align-items:stretch; flex-direction:column; }
                    .dashboard-period-filter select { width:100%; }
                    .stats-grid { grid-template-columns:1fr; gap:12px; }
                    .dashboard-grid { gap:14px; }
                }
            `}</style>
            <div className={embedded ? 'admin-page embedded-dashboard' : 'admin-page'}>


                {/* ======================================
                    SIDEBAR
                ======================================= */}

                <aside className="sidebar">


                    <Link
                        to="/"
                        className="sidebar-logo"
                    >
<img
                    src="/logo-comercial-san-cristobal.png"
                    alt="Logotipo Comercial San Cristóbal"
                    style={{ width: '220px', maxWidth: '100%', height: '84px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '8px', padding: '3px' }}
                />
</Link>


                    <div className="sidebar-user">

                        <div className="user-avatar">
                            👤
                        </div>


                        <div className="sidebar-user-info">

                            <strong>
                                Administrador
                            </strong>

                            <small>
                                admin@sancristobal.com
                            </small>

                            <small className="online">
                                ● En línea
                            </small>

                        </div>

                    </div>


                    <nav className="sidebar-menu">

                        {
                            menu.map(
                                item => (

                                    <Link
                                        key={item.nombre}
                                        to={item.ruta}
                                        className={
                                            location.pathname === item.ruta
                                                ? 'activo'
                                                : ''
                                        }
                                    >

                                        <span className="menu-icon">
                                            {item.icono}
                                        </span>

                                        <span>
                                            {item.nombre}
                                        </span>

                                    </Link>

                                )
                            )
                        }

                    </nav>


                    <div className="sidebar-footer">

                        <strong>
                            Comercial San Cristóbal
                        </strong>

                        <small>
                            © 2026 Todos los derechos reservados.
                        </small>

                    </div>

                </aside>



                {/* ======================================
                    CONTENIDO
                ======================================= */}

                <div className="admin-content">


                    {/* TOPBAR */}

                    <header className="topbar">


                        <div className="topbar-left">
                            <span className="topbar-title">
                                Panel Administrativo
                            </span>

                        </div>


                        <div className="topbar-right">


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



                    {/* ======================================
                        DASHBOARD
                    ======================================= */}

                    <main className="dashboard">

                        {location.pathname !== '/public' && <Outlet />}

                        {location.pathname === '/public' && (
                        <>


                        <section className="welcome-admin">

                            <h1>
                                ¡Bienvenido, Administrador!
                            </h1>

                            <p>
                                Aquí tienes un resumen general de tu negocio.
                            </p>

                        </section>


                                                <section className="dashboard-period-filter">
                            <div><strong>Periodo de estadísticas</strong><small>Las ventas y los métodos de pago se calculan para el periodo seleccionado.</small></div>
                            <select value={periodo} onChange={(evento) => setPeriodo(evento.target.value)} aria-label="Periodo de estadísticas">
                                <option value="dia">Hoy</option><option value="semana">Esta semana</option><option value="mes">Este mes</option><option value="ano">Este año</option>
                            </select>
                        </section>
                        {errorDashboard && <div className="dashboard-load-state" role="alert">{errorDashboard}</div>}
                        {cargandoDashboard && <div className="dashboard-load-state" role="status">Cargando información real del negocio...</div>}

                        <section className="stats-grid">
                            <article className="stat-card"><div className="stat-icon icon-blue">🛒</div><div className="stat-info"><small>Ventas del periodo</small><h3>{formatoMoneda(totalVentasPeriodo)}</h3><span>{ventasPeriodo.length} transacciones</span></div></article>
                            <article className="stat-card"><div className="stat-icon icon-green">↗</div><div className="stat-info"><small>Transacciones</small><h3>{ventasPeriodo.length.toLocaleString('es-GT')}</h3><span>En el periodo seleccionado</span></div></article>
                            <article className="stat-card"><div className="stat-icon icon-purple">◇</div><div className="stat-info"><small>Productos activos</small><h3>{productos.length.toLocaleString('es-GT')}</h3><span>En el catálogo</span></div></article>
                            <article className="stat-card"><div className="stat-icon icon-orange">▣</div><div className="stat-info"><small>Inventario total</small><h3>{totalInventario.toLocaleString('es-GT')}</h3><span>Unidades en tienda y bodega</span></div></article>
                            <article className="stat-card"><div className="stat-icon icon-red">▤</div><div className="stat-info"><small>Solicitudes pendientes</small><h3>{solicitudesPendientes.toLocaleString('es-GT')}</h3><span>Por atender en bodega</span></div></article>
                        </section>

                        <section className="dashboard-grid">
                            <article className="dashboard-card">
                                <div className="dashboard-card-header"><strong>Ventas por {periodo === 'dia' ? 'hora' : periodo === 'semana' ? 'día' : periodo === 'ano' ? 'mes' : 'semana'}</strong></div>
                                {serieVentas.some((item) => item.valor > 0) ? (
                                    <div className="dashboard-real-chart">
                                        {serieVentas.map((item) => (
                                            <div className="dashboard-real-bar" key={item.label} title={`${item.label}: ${formatoMoneda(item.valor)}`}>
                                                <div className="dashboard-real-bar-fill" style={{ height: `${Math.max((item.valor / maxVentaGrafica) * 100, item.valor > 0 ? 4 : 0)}%` }} />
                                                <small>{item.label}</small>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="dashboard-empty">No hay ventas registradas para este periodo.</div>}
                                <div className="dashboard-chart-total">Total del periodo: <strong>{formatoMoneda(totalVentasPeriodo)}</strong></div>
                            </article>
                            <article className="dashboard-card">
                                <div className="dashboard-card-header"><strong>Productos por categoría</strong></div>
                                {productosPorCategoria.length ? productosPorCategoria.map((item) => (
                                    <div className="dashboard-category-row" key={item.nombre}>
                                        <span>{item.nombre}</span><strong>{item.cantidad}</strong>
                                        <div className="dashboard-category-track"><span style={{ width: `${(item.cantidad / Math.max(...productosPorCategoria.map((categoria) => categoria.cantidad), 1)) * 100}%` }} /></div>
                                    </div>
                                )) : <div className="dashboard-empty">No hay productos registrados.</div>}
                            </article>
                        </section>

                        <section className="dashboard-grid">
                            <article className="dashboard-card">
                                <div className="dashboard-card-header"><strong>Alertas de inventario <span className="dashboard-alert-count">{alertasInventario.length}</span></strong></div>
                                <div className="inventory-table-wrapper">
                                    <table className="inventory-table">
                                        <thead><tr><th>Producto</th><th>Ubicación</th><th>Stock</th><th>Mínimo</th><th>Estado</th></tr></thead>
                                        <tbody>
                                            {alertasInventario.length ? alertasInventario.map((item) => (
                                                <tr key={item.id}><td><div className="product-cell"><span className="product-mini">📦</span>{item.producto}</div></td><td>{item.ubicacion}</td><td>{item.stock}</td><td>{item.minimo}</td><td><span className={claseEstado(item.estado)}>{item.estado}</span></td></tr>
                                            )) : <tr><td colSpan="5" className="dashboard-empty">No hay alertas de inventario.</td></tr>}
                                        </tbody>
                                    </table>
                                    <Link className="table-link" to="/public/inventario">Ver inventario</Link>
                                </div>
                            </article>
                            <article className="dashboard-card">
                                <div className="dashboard-card-header"><strong>Ventas por método de pago</strong></div>
                                <div className="payment-legend" style={{ padding: '12px 16px' }}>
                                    {ventasPorMetodo.length ? ventasPorMetodo.map((item, index) => (
                                        <div className="payment-row" key={item.nombre}>
                                            <span className={`legend-dot dot${(index % 5) + 1}`} />
                                            <div><p>{item.nombre}</p><small>{formatoMoneda(item.monto)}</small></div>
                                            <strong>{item.porcentaje}%</strong>
                                        </div>
                                    )) : <div className="dashboard-empty">No hay pagos registrados para este periodo.</div>}
                                </div>
                            </article>
                        </section>


                        </>
                        )}

                    </main>

                </div>

            </div>

        </>

    );

}


export default Public;