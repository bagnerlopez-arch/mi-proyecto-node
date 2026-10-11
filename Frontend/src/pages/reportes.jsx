import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';


function Reportes() {

    const [datosReporte, setDatosReporte] = useState(null);
    const [errorReporte, setErrorReporte] = useState('');


    useEffect(() => {

        async function cargarReporte() {

            try {

                const respuesta = await fetch('/api/cliente/reportes');

                if (!respuesta.ok) {
                    throw new Error('No se pudieron cargar los reportes.');
                }

                setDatosReporte(await respuesta.json());

            } catch (error) {

                console.error(error);
                setErrorReporte('No se pudieron cargar los datos del reporte.');

            }

        }

        cargarReporte();

    }, []);

    const ventasReporte = datosReporte?.ventas || {
        dia: 0,
        semana: 0,
        mes: 0,
        ano: 0,
        transacciones: 0
    };

    const inventarioReporte = datosReporte?.resumenInventario || {
        disponibles: 0,
        agotados: 0,
        stockMaximo: 0,
        alertas: []
    };

    // =========================================================
    // ESTADOS PRINCIPALES
    // =========================================================

    const [tipoInforme, setTipoInforme] =
        useState('ventas');

    const [tipoPeriodoPdf, setTipoPeriodoPdf] =
        useState('rango');

    const [periodoPdf, setPeriodoPdf] =
        useState(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));

    const [actualizando, setActualizando] =
        useState(false);

    const [generando, setGenerando] =
        useState(false);

    const [mensaje, setMensaje] =
        useState('');


    // =========================================================
    // FILTROS
    // =========================================================

    const [filtros, setFiltros] =
        useState({

            fechaInicio:
                '2026-05-01',

            fechaFin:
                '2026-05-24',

            comparar:
                'Sin comparación',

            categoria:
                'Todas',

            metodoPago:
                'Todos',

            cliente:
                'Todos',

            ubicacion:
                'Todas',

            vendedor:
                'Todos'

        });


    function manejarFiltro(evento) {

        const {
            name,
            value
        } = evento.target;


        setFiltros(
            anterior => ({

                ...anterior,

                [name]:
                    value

            })
        );

    }


    // =========================================================
    // CONFIGURACIÓN DE CADA INFORME
    // =========================================================

    const informacionInforme =
        useMemo(
            () => {

                if (
                    tipoInforme ===
                    'rotacion'
                ) {

                    return {

                        titulo:
                            'Informe de Rotación de Productos',

                        corto:
                            'Rotación de Productos',

                        descripcion:
                            'Productos más vendidos, movimiento, rotación de inventario y rendimiento.'

                    };

                }


                if (
                    tipoInforme ===
                    'segmentacion'
                ) {

                    return {

                        titulo:
                            'Informe de Segmentación de Clientes',

                        corto:
                            'Segmentación de Clientes',

                        descripcion:
                            'Clasificación de clientes por tipo, frecuencia de compra y volumen de ventas.'

                    };

                }


                return {

                    titulo:
                        'Informe de Ventas',

                    corto:
                        'Informe de Ventas',

                    descripcion:
                        'Resumen de ventas totales, por fecha, categoría, cliente y método de pago.'

                };

            },

            [
                tipoInforme
            ]
        );


    // =========================================================
    // LIMPIAR FILTROS
    // =========================================================

    function limpiarFiltros() {

        setFiltros({

            fechaInicio:
                '2026-05-01',

            fechaFin:
                '2026-05-24',

            comparar:
                'Sin comparación',

            categoria:
                'Todas',

            metodoPago:
                'Todos',

            cliente:
                'Todos',

            ubicacion:
                'Todas',

            vendedor:
                'Todos'

        });

    }


    // =========================================================
    // ACTUALIZAR VISTA PREVIA
    // =========================================================

    function actualizarVista() {

        setActualizando(true);

        setMensaje('');


        setTimeout(
            () => {

                setActualizando(false);

                setMensaje(
                    'Vista previa actualizada con los filtros seleccionados.'
                );

            },

            700
        );

    }


    // =========================================================
    // GENERAR INFORME
    // =========================================================

    function generarInforme() {
        setGenerando(true);
        setMensaje('');
        try {
            if (tipoPeriodoPdf !== 'rango' && !periodoPdf) throw new Error('Selecciona el día, mes o año que deseas consultar.');
            const rango = obtenerRangoPdf();
            if (rango.inicio > rango.fin) throw new Error('La fecha inicial no puede ser posterior a la fecha final.');
            exportarPdf(rango);
            setMensaje('Se abrió la vista de impresión. Selecciona “Guardar como PDF” para descargar el informe.');
        } catch (error) {
            console.error('Error al exportar el informe:', error);
            setMensaje(error.message || 'No fue posible exportar el informe. Intenta nuevamente.');
        } finally {
            setGenerando(false);
        }
    }

    function obtenerRangoPdf() {
        if (tipoPeriodoPdf === 'dia') return { inicio: periodoPdf, fin: periodoPdf };
        if (tipoPeriodoPdf === 'mes') {
            const [ano, mes] = periodoPdf.split('-').map(Number);
            const ultimoDia = new Date(ano, mes, 0).getDate();
            return { inicio: `${ano}-${String(mes).padStart(2, '0')}-01`, fin: `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}` };
        }
        if (tipoPeriodoPdf === 'ano') return { inicio: `${periodoPdf}-01-01`, fin: `${periodoPdf}-12-31` };
        return { inicio: filtros.fechaInicio, fin: filtros.fechaFin };
    }

    function datosParaExportar() {
        const rango = obtenerRangoPdf();
        const moneda = valor => `Q ${Number(valor || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const filas = [
            ['COMERCIAL SAN CRISTÓBAL', informacionInforme.titulo, '', '', '', ''],
            ['Generado', new Date().toLocaleString('es-GT'), '', '', '', ''],
            ['Filtro', 'Valor', '', '', '', ''],
            ['Fecha inicial', fechaVisual(rango.inicio), '', '', '', ''],
            ['Fecha final', fechaVisual(rango.fin), '', '', '', ''],
            ['Categoría', filtros.categoria, '', '', '', ''],
            ['Método de pago', filtros.metodoPago, '', '', '', ''],
            ['Cliente', filtros.cliente, '', '', '', ''],
            ['Ubicación', filtros.ubicacion, '', '', '', ''],
            ['Vendedor', filtros.vendedor, '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Resumen de ventas', 'Valor', '', '', '', ''],
            ['Ventas del día', moneda(ventasReporte.dia), '', '', '', ''],
            ['Ventas de la semana', moneda(ventasReporte.semana), '', '', '', ''],
            ['Ventas del mes', moneda(ventasReporte.mes), '', '', '', ''],
            ['Ventas del año', moneda(ventasReporte.ano), '', '', '', ''],
            ['Transacciones', Number(ventasReporte.transacciones || 0), '', '', '', ''],
            ['Productos disponibles', Number(inventarioReporte.disponibles || 0), '', '', '', ''],
            ['Productos agotados', Number(inventarioReporte.agotados || 0), '', '', '', ''],
            ['Productos con alertas', Number(inventarioReporte.alertas?.length || 0), '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Inventario', 'Producto', 'Categoría', 'Stock disponible', 'Stock mínimo', 'Stock máximo']
        ];
        (Array.isArray(datosReporte?.inventario) ? datosReporte.inventario : []).forEach(producto => {
            filas.push([
                'Inventario', producto.nombre || 'Producto', producto.categoria || '',
                Number(producto.stock_disponible || 0), Number(producto.stock_minimo || 0), Number(producto.stock_maximo || 0)
            ]);
        });
        return filas;
    }

    function escaparXml(valor) {
        return String(valor ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    function exportarPdf(rango) {
        const ventana = window.open('', '_blank');
        if (!ventana) throw new Error('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para crear el PDF.');
        const filas = datosParaExportar();
        const tabla = filas.map(fila => `<tr>${fila.map(valor => `<td>${escaparXml(valor)}</td>`).join('')}</tr>`).join('');
        const generado = new Date().toLocaleString('es-GT');
        const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escaparXml(informacionInforme.titulo)}</title><style>body{font:14px Arial,sans-serif;color:#18345a;margin:28px}h1{color:#123b78;margin-bottom:6px}p{color:#536b83}table{width:100%;border-collapse:collapse;font-size:11px}td{border:1px solid #cbd7e5;padding:7px;text-align:left}tr:first-child{font-weight:bold;background:#eaf2fb}tr:nth-child(even){background:#f7f9fc}.watermark{position:fixed;bottom:8px;right:8px;color:#718096;font-size:10px}@page{size:landscape;margin:12mm}@media print{body{margin:0}}</style></head><body><h1>${escaparXml(informacionInforme.titulo)}</h1><p>Comercial San Cristóbal · ${escaparXml(fechaVisual(rango.inicio))} al ${escaparXml(fechaVisual(rango.fin))}</p><table><tbody>${tabla}</tbody></table><div class="watermark">Generado ${escaparXml(generado)}</div></body></html>`;
        ventana.document.open(); ventana.document.write(html); ventana.document.close(); ventana.focus();
        ventana.setTimeout(() => ventana.print(), 350);
    }
    function fechaVisual(
        fecha
    ) {

        if (!fecha) {
            return '-';
        }


        const partes =
            fecha.split('-');


        return (
            `${partes[2]}/${partes[1]}/${partes[0]}`
        );

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

            color:
                #17365f;

            background:
                #f4f8fd;
        }


        button,
        input,
        select {
            font: inherit;
        }


        .reportes-page {
            min-height: 100vh;

            display: flex;

            background:
                linear-gradient(
                    135deg,
                    #f8fbff,
                    #eff6fd
                );
        }


        /* =====================================================
           SIDEBAR
        ===================================================== */

        .reportes-sidebar {
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
                    #0b3978 0%,
                    #073471 55%,
                    #0a315f 100%
                );
        }


        .reportes-logo {
            display: flex;

            align-items: center;

            gap: 10px;

            padding:
                20px 17px;

            color: white;

            text-decoration: none;
        }


        .reportes-logo-icon {
            width: 42px;
            height: 42px;

            display: grid;

            place-items: center;

            font-size: 27px;
        }


        .reportes-logo-text {
            display: flex;

            flex-direction: column;

            line-height: 1.03;
        }


        .reportes-logo-text strong {
            font-size: 13px;

            font-weight: 900;
        }


        .reportes-logo-text small {
            margin-top: 5px;

            color:
                #d7e6f8;

            font-size: 12px;
        }


        /* PERFIL */

        .reportes-perfil {
            display: flex;

            align-items: center;

            gap: 11px;

            padding:
                10px 17px 18px;
        }


        .reportes-avatar {
            width: 43px;
            height: 43px;

            flex:
                0 0 43px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color:
                #0d3973;

            background: white;

            font-size: 22px;
        }


        .reportes-perfil-info {
            display: flex;

            flex-direction: column;

            font-size: 12px;
        }


        .reportes-perfil-info strong {
            font-size: 12px;
        }


        .reportes-perfil-info span {
            margin-top: 4px;

            color:
                #dbe8f6;
        }


        .reportes-perfil-info small {
            margin-top: 5px;

            color:
                #60ed96;
        }


        /* MENÚ */

        .reportes-menu {
            display: grid;

            gap: 4px;

            padding: 7px;
        }


        .reportes-menu a {
            min-height: 43px;

            display: flex;

            align-items: center;

            gap: 12px;

            padding:
                0 14px;

            border-radius: 6px;

            color:
                #dae7f6;

            text-decoration: none;

            font-size: 12px;

            transition: .2s;
        }


        .reportes-menu a:hover {
            background:
                rgba(
                    255,
                    255,
                    255,
                    .08
                );
        }


        .reportes-menu a.activo {
            color: white;

            background:
                linear-gradient(
                    90deg,
                    #176ee4,
                    #135fd1
                );

            font-weight: 700;
        }


        .reportes-menu-icon {
            width: 22px;

            text-align: center;

            font-size: 17px;
        }


        .reportes-sidebar-footer {
            margin-top: auto;

            padding:
                20px 17px;

            border-top:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .14
                );

            color:
                #d1dfef;

            font-size: 12px;

            line-height: 1.7;
        }


        /* =====================================================
           CONTENIDO
        ===================================================== */

        .reportes-content {
            width:
                calc(
                    100% - 205px
                );

            margin-left:
                205px;
        }


        /* =====================================================
           TOPBAR
        ===================================================== */

        .reportes-topbar {
            height: 56px;

            position: sticky;

            top: 0;

            z-index: 90;

            display: flex;

            align-items: center;

            justify-content:
                space-between;

            padding:
                0 22px;

            border-bottom:
                1px solid
                #dbe4ef;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .97
                );
        }


        .reportes-top-left {
            display: flex;

            align-items: center;

            gap: 15px;
        }


        .reportes-menu-toggle {
            border: 0;

            color:
                #29507d;

            background:
                transparent;

            font-size: 20px;

            cursor: pointer;
        }


        .reportes-top-title {
            color:
                #173865;

            font-size: 13px;

            font-weight: 800;
        }


        .reportes-top-right {
            display: flex;

            align-items: center;

            gap: 20px;

            color:
                #1c3c68;

            font-size: 12px;
        }


        .reportes-date {
            display: flex;

            align-items: center;

            gap: 7px;

            font-weight: 700;
        }


        .reportes-notification {
            position: relative;

            font-size: 18px;
        }


        .reportes-notification span {
            width: 15px;
            height: 15px;

            position: absolute;

            top: -7px;
            right: -8px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color: white;

            background:
                #ee4050;

            font-size: 12px;
        }


        .reportes-user {
            display: flex;

            align-items: center;

            gap: 7px;

            font-weight: 700;
        }


        .reportes-user-avatar {
            width: 28px;
            height: 28px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color: white;

            background:
                #143e82;
        }


        /* =====================================================
           MAIN
        ===================================================== */

        .reportes-main {
            padding: 18px;
        }


        .reportes-heading {
            margin-bottom: 15px;
        }


        .reportes-heading h1 {
            margin: 0;

            color:
                #17386a;

            font-size: 19px;
        }


        .reportes-heading p {
            margin:
                5px 0 0;

            color:
                #73849b;

            font-size: 12px;
        }


        .reportes-layout {
            display: grid;

            grid-template-columns:
                minmax(
                    0,
                    1fr
                )
                210px;

            gap: 12px;
        }


        /* =====================================================
           PASOS
        ===================================================== */

        .reportes-steps {
            min-height: 55px;

            display: grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            margin-bottom: 10px;

            border:
                1px solid
                #dce5ef;

            border-radius: 6px;

            background: white;
        }


        .report-step {
            position: relative;

            display: flex;

            align-items: center;

            gap: 9px;

            padding:
                8px 13px;
        }


        .report-step:not(:last-child)::after {
            content: '›';

            position: absolute;

            right: 8px;

            color:
                #8094ad;

            font-size: 21px;
        }


        .step-number {
            width: 23px;
            height: 23px;

            flex:
                0 0 23px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color:
                #506987;

            background:
                #edf2f8;

            font-size: 12px;

            font-weight: 800;
        }


        .report-step.active
        .step-number {
            color: white;

            background:
                #1269db;
        }


        .report-step strong {
            display: block;

            color:
                #294c77;

            font-size: 12px;
        }


        .report-step small {
            display: block;

            margin-top: 3px;

            color:
                #8291a5;

            font-size: 12px;
        }


        /* =====================================================
           TIPO DE INFORME
        ===================================================== */

        .tipo-informe-grid {
            display: grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            gap: 9px;

            margin-bottom: 10px;
        }


        .tipo-informe {
            min-height: 88px;

            position: relative;

            display: flex;

            align-items: center;

            gap: 12px;

            padding: 12px;

            border:
                1px solid
                #dce5ef;

            border-radius: 6px;

            background: white;

            cursor: pointer;

            transition: .2s;
        }


        .tipo-informe:hover {
            border-color:
                #8bb5ef;
        }


        .tipo-informe.selected {
            border:
                1.5px solid
                #216fe0;

            box-shadow:
                0 0 0 2px
                rgba(
                    25,
                    108,
                    222,
                    .05
                );
        }


        .tipo-informe-radio {
            width: 12px;
            height: 12px;

            position: absolute;

            top: 10px;
            right: 10px;

            border:
                1px solid
                #bbc9d9;

            border-radius: 50%;
        }


        .tipo-informe.selected
        .tipo-informe-radio {
            border:
                3px solid
                #196bda;
        }


        .tipo-icon {
            width: 48px;
            height: 48px;

            flex:
                0 0 48px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            font-size: 22px;
        }


        .tipo-blue {
            color:
                #1d69d8;

            background:
                #e1edff;
        }


        .tipo-green {
            color:
                #1fa86e;

            background:
                #ddf5e9;
        }


        .tipo-purple {
            color:
                #7549e9;

            background:
                #eee8ff;
        }


        .tipo-informe h3 {
            margin: 0;

            color:
                #234a7b;

            font-size: 12px;
        }


        .tipo-informe p {
            margin:
                5px 0 0;

            color:
                #73869e;

            font-size: 12px;

            line-height: 1.35;
        }


        /* =====================================================
           CARDS GENERALES
        ===================================================== */

        .report-card {
            margin-bottom: 10px;

            overflow: hidden;

            border:
                1px solid
                #dce5ef;

            border-radius: 6px;

            background: white;
        }


        .report-card-header {
            min-height: 36px;

            display: flex;

            align-items: center;

            justify-content:
                space-between;

            padding:
                0 11px;
        }


        .report-card-header strong {
            color:
                #173f77;

            font-size: 12px;
        }


        /* =====================================================
           FILTROS
        ===================================================== */

        .filtros-body {
            display: grid;

            grid-template-columns:
                repeat(
                    4,
                    1fr
                );

            gap:
                11px 13px;

            padding:
                0 11px 12px;
        }


        .report-field {
            display: grid;

            gap: 5px;
        }


        .report-field label {
            color:
                #385675;

            font-size: 12px;

            font-weight: 700;
        }


        .report-field input,
        .report-field select {
            width: 100%;

            height: 32px;

            padding:
                0 8px;

            border:
                1px solid
                #d2deea;

            border-radius: 4px;

            outline: 0;

            color:
                #466484;

            background: white;

            font-size: 12px;
        }


        .range-box {
            display: grid;

            grid-template-columns:
                1fr auto 1fr;

            align-items: center;

            gap: 4px;
        }


        .range-box span {
            color:
                #8192a5;

            font-size: 12px;
        }


        .clear-filter {
            align-self: end;

            height: 32px;

            border:
                1px solid
                #d4dfeb;

            border-radius: 4px;

            color:
                #3b6090;

            background: white;

            font-size: 12px;

            font-weight: 700;

            cursor: pointer;
        }


        /* =====================================================
           VISTA PREVIA
        ===================================================== */

        .preview-refresh {
            height: 27px;

            padding:
                0 10px;

            border:
                1px solid
                #d5e0ec;

            border-radius: 4px;

            color:
                #2e5b91;

            background: white;

            font-size: 12px;

            font-weight: 700;

            cursor: pointer;
        }


        .preview-kpis {
            display: grid;

            grid-template-columns:
                repeat(
                    4,
                    1fr
                );

            gap: 7px;

            padding:
                0 10px 9px;
        }


        .preview-kpi {
            min-height: 56px;

            display: flex;

            align-items: center;

            gap: 8px;

            padding:
                8px;

            border:
                1px solid
                #e0e7ef;

            border-radius: 5px;
        }


        .preview-kpi-icon {
            width: 37px;
            height: 37px;

            flex:
                0 0 37px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            font-size: 17px;
        }


        .kpi-blue {
            color:
                #1769db;

            background:
                #e2edff;
        }


        .kpi-green {
            color:
                #1aa66e;

            background:
                #e0f5ea;
        }


        .kpi-purple {
            color:
                #7448e8;

            background:
                #eee7ff;
        }


        .kpi-orange {
            color:
                #f17825;

            background:
                #ffecdf;
        }


        .preview-kpi small {
            display: block;

            color:
                #607791;

            font-size: 12px;
        }


        .preview-kpi h3 {
            margin:
                4px 0 2px;

            color:
                #173d75;

            font-size: 12px;
        }


        .preview-kpi span {
            color:
                #24a26f;

            font-size: 12px;
        }


        /* =====================================================
           GRÁFICAS
        ===================================================== */

        .charts-grid {
            display: grid;

            grid-template-columns:
                1.35fr
                .9fr
                .9fr;

            gap: 7px;

            padding:
                0 10px 10px;
        }


        .chart-box {
            min-height: 160px;

            padding: 9px;

            border:
                1px solid
                #e0e7ef;

            border-radius: 5px;
        }


        .chart-title {
            display: flex;

            align-items: center;

            justify-content:
                space-between;

            margin-bottom: 5px;

            color:
                #294e7c;

            font-size: 12px;

            font-weight: 700;
        }


        .chart-title select {
            height: 23px;

            border:
                1px solid
                #d5e0ea;

            border-radius: 3px;

            color:
                #53708f;

            background: white;

            font-size: 12px;
        }


        .line-chart {
            width: 100%;
            height: 125px;
        }


        .chart-grid-line {
            stroke:
                #e5ebf2;

            stroke-width: 1;
        }


        .chart-area {
            fill:
                rgba(
                    33,
                    110,
                    220,
                    .13
                );
        }


        .chart-line {
            fill: none;

            stroke:
                #1667d9;

            stroke-width: 2.4;
        }


        .chart-dot {
            fill:
                #1667d9;
        }


        .chart-text {
            fill:
                #6f8097;

            font-size: 12px;
        }


        /* DONUT */

        .donut-chart {
            width: 105px;
            height: 105px;

            position: relative;

            margin:
                12px auto 5px;

            border-radius: 50%;
        }


        .donut-category {
            background:
                conic-gradient(
                    #1765d8 0 35%,
                    #4387e7 35% 60%,
                    #65a3ed 60% 80%,
                    #69c8ca 80% 92%,
                    #67c99d 92% 100%
                );
        }


        .donut-payment { background: conic-gradient(#1765d8 0 60%, #66c9a5 60% 100%); }


        .donut-chart::after {
            content: '';

            width: 47px;
            height: 47px;

            position: absolute;

            inset: 0;

            margin: auto;

            border-radius: 50%;

            background: white;
        }


        .donut-main-value {
            position: absolute;

            inset: 0;

            z-index: 3;

            display: grid;

            place-items: center;

            color:
                #1c467c;

            font-size: 12px;

            font-weight: 800;
        }


        .mini-legend {
            display: flex;

            justify-content: center;

            gap: 7px;

            flex-wrap: wrap;

            font-size: 12px;
        }


        .legend-dot {
            width: 5px;
            height: 5px;

            display: inline-block;

            margin-right: 2px;

            border-radius: 50%;
        }


        .c1 {
            background: #1765d8;
        }


        .c2 {
            background: #4387e7;
        }


        .c3 {
            background: #65a3ed;
        }


        .c4 {
            background: #69c8ca;
        }


        .c5 {
            background: #67c99d;
        }


        /* =====================================================
           NOTA
        ===================================================== */

        .report-info-note {
            display: flex;

            align-items: center;

            gap: 8px;

            padding:
                10px;

            border-radius: 5px;

            color:
                #43658c;

            background:
                #eaf4ff;

            font-size: 12px;
        }


        .report-info-note span:first-child {
            color:
                #136cda;

            font-size: 15px;
        }


        /* =====================================================
           PANEL DERECHO
        ===================================================== */

        .report-summary {
            align-self:
                start;

            position:
                sticky;

            top: 68px;

            overflow: hidden;

            border:
                1px solid
                #dbe5ef;

            border-radius: 7px;

            background: white;
        }


        .summary-header {
            padding:
                14px 12px;

            color:
                #163e75;

            font-size: 12px;

            font-weight: 800;
        }


        .summary-body {
            padding:
                0 12px 12px;
        }


        .summary-section {
            margin-bottom: 13px;
        }


        .summary-section > strong {
            display: block;

            margin-bottom: 6px;

            color:
                #49617f;

            font-size: 12px;

            text-transform:
                uppercase;
        }


        .summary-section p {
            margin:
                0 0 5px;

            color:
                #173f77;

            font-size: 12px;

            line-height: 1.4;
        }


        .summary-filters {
            display: grid;

            gap: 6px;
        }


        .summary-filter {
            display: flex;

            align-items: center;

            gap: 6px;

            color:
                #4d6685;

            font-size: 12px;
        }


        .summary-check {
            width: 10px;
            height: 10px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color: white;

            background:
                #21a66d;

            font-size: 12px;
        }


        .summary-notice {
            margin-bottom: 14px;

            padding:
                9px;

            border:
                1px solid
                #cfe8d9;

            border-radius: 5px;

            color:
                #39705d;

            background:
                #eef9f2;

            font-size: 12px;

            line-height: 1.5;
        }




        .generate-report {
            width: 100%;

            min-height: 36px;

            border: 0;

            border-radius: 5px;

            color: white;

            background:
                linear-gradient(
                    90deg,
                    #0869e5,
                    #105ed2
                );

            font-size: 12px;

            font-weight: 700;

            cursor: pointer;
        }


        .generate-report:disabled {
            opacity: .6;

            cursor: wait;
        }


        /* =====================================================
           MENSAJE
        ===================================================== */

        .report-message {
            margin:
                0 0 10px;

            padding:
                9px 11px;

            border:
                1px solid
                #bfe6d0;

            border-radius: 5px;

            color:
                #18784d;

            background:
                #eaf8f0;

            font-size: 12px;
        }


        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (
            max-width: 1150px
        ) {

            .reportes-layout {
                grid-template-columns:
                    1fr;
            }


            .report-summary {
                position: static;
            }


            .filtros-body {
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

            .reportes-sidebar {
                width: 76px;
            }


            .reportes-logo-text,
            .reportes-perfil-info,
            .reportes-menu a span:last-child,
            .reportes-sidebar-footer {
                display: none;
            }


            .reportes-logo,
            .reportes-perfil {
                justify-content: center;

                padding-left: 0;
                padding-right: 0;
            }


            .reportes-menu a {
                justify-content: center;

                padding: 0;
            }


            .reportes-content {
                width:
                    calc(
                        100% - 76px
                    );

                margin-left: 76px;
            }


            .tipo-informe-grid {
                grid-template-columns:
                    1fr;
            }


            .preview-kpis {
                grid-template-columns:
                    repeat(
                        2,
                        1fr
                    );
            }


            .charts-grid {
                grid-template-columns:
                    1fr;
            }

        }


        @media (
            max-width: 620px
        ) {

            .reportes-date,
            .reportes-user span {
                display: none;
            }


            .reportes-main {
                padding: 12px;
            }


            .reportes-steps {
                grid-template-columns:
                    1fr;
            }


            .report-step:not(:last-child)::after {
                display: none;
            }


            .filtros-body,
            .preview-kpis {
                grid-template-columns:
                    1fr;
            }

        }

        /* Reportes se muestra dentro de PublicLayout. */
        .reportes-page {
            min-height: auto;
            display: block;
        }

        .reportes-sidebar,
        .reportes-topbar {
            display: none !important;
        }

        .reportes-content {
            width: 100%;
            margin-left: 0;
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


            <div className="reportes-page">


                {/* =================================================
                    SIDEBAR
                ================================================== */}

                <aside className="reportes-sidebar">


                    <Link
                        to="/admin"
                        className="reportes-logo"
                    >
<img
                    src="/logo-comercial-san-cristobal.png"
                    alt="Logotipo Comercial San Cristóbal"
                    style={{ width: '220px', maxWidth: '100%', height: '84px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '8px', padding: '3px' }}
                />
</Link>


                    <div className="reportes-perfil">

                        <div className="reportes-avatar">
                            👤
                        </div>


                        <div className="reportes-perfil-info">

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


                    <nav className="reportes-menu">


                        <Link to="/admin">

                            <span className="reportes-menu-icon">
                                ⌂
                            </span>

                            <span>
                                Dashboard
                            </span>

                        </Link>


                        <Link to="/clientes">

                            <span className="reportes-menu-icon">
                                ♙
                            </span>

                            <span>
                                Clientes
                            </span>

                        </Link>


                        <Link to="/productos">

                            <span className="reportes-menu-icon">
                                ◇
                            </span>

                            <span>
                                Productos
                            </span>

                        </Link>


                        <Link to="/inventario">

                            <span className="reportes-menu-icon">
                                ▣
                            </span>

                            <span>
                                Inventario
                            </span>

                        </Link>


                        <Link to="/ventas">

                            <span className="reportes-menu-icon">
                                🛒
                            </span>

                            <span>
                                Ventas
                            </span>

                        </Link>


                        <Link to="/compras">

                            <span className="reportes-menu-icon">
                                ▤
                            </span>

                            <span>
                                Compras
                            </span>

                        </Link>


                        <Link
                            to="/reportes"
                            className="activo"
                        >

                            <span className="reportes-menu-icon">
                                ▥
                            </span>

                            <span>
                                Informes y Reportes
                            </span>

                        </Link>


                        <Link to="/usuarios">

                            <span className="reportes-menu-icon">
                                ♙
                            </span>

                            <span>
                                Usuarios
                            </span>

                        </Link>


                        <Link to="/cerrar-sesion">

                            <span className="reportes-menu-icon">
                                ↪
                            </span>

                            <span>
                                Cerrar sesión
                            </span>

                        </Link>


                    </nav>


                    <div className="reportes-sidebar-footer">

                        Comercial San Cristóbal

                        <br />

                        © 2026 Todos los derechos reservados.

                    </div>


                </aside>



                {/* =================================================
                    CONTENIDO
                ================================================== */}

                <section className="reportes-content">


                    {/* TOPBAR */}

                    <header className="reportes-topbar">


                        <div className="reportes-top-left">

                            <button
                                type="button"
                                className="reportes-menu-toggle"
                            >
                                ☰
                            </button>


                            <span className="reportes-top-title">

                                Informes y Reportes

                            </span>

                        </div>


                        <div className="reportes-top-right">


                            <div className="reportes-date">

                                <span>
                                    📅
                                </span>

                                <span>
                                    24 de mayo, 2026
                                </span>

                            </div>


                            <div className="reportes-notification">

                                ♧

                                <span>
                                    3
                                </span>

                            </div>


                            <div className="reportes-user">

                                <div className="reportes-user-avatar">
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

                    <main className="reportes-main">


                        <section className="reportes-heading">

                            <h1>
                                Generación de Informes y Reportes
                            </h1>

                            <p>

                                Seleccione el tipo de informe,
                                configure los filtros y genere
                                el reporte deseado.

                            </p>

                        </section>


                        {
                            mensaje
                            &&
                            (

                                <div className="report-message">

                                    {mensaje}

                                </div>

                            )
                        }


                        <div className="reportes-layout">


                            {/* =================================================
                                COLUMNA PRINCIPAL
                            ================================================== */}

                            <section>


                                <section className="report-card">

                                    <div className="report-card-header">
                                        <strong>Resumen real de ventas e inventario</strong>
                                    </div>

                                    {errorReporte && (
                                        <p>{errorReporte}</p>
                                    )}

                                    <div className="preview-kpis">
                                        <article className="preview-kpi">
                                            <div className="preview-kpi-icon kpi-blue">$</div>
                                            <div>
                                                <small>Ventas del día</small>
                                                <h3>Q {Number(ventasReporte.dia).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</h3>
                                            </div>
                                        </article>

                                        <article className="preview-kpi">
                                            <div className="preview-kpi-icon kpi-green">$</div>
                                            <div>
                                                <small>Ventas de la semana</small>
                                                <h3>Q {Number(ventasReporte.semana).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</h3>
                                            </div>
                                        </article>

                                        <article className="preview-kpi">
                                            <div className="preview-kpi-icon kpi-purple">$</div>
                                            <div>
                                                <small>Ventas del mes</small>
                                                <h3>Q {Number(ventasReporte.mes).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</h3>
                                            </div>
                                        </article>

                                        <article className="preview-kpi">
                                            <div className="preview-kpi-icon kpi-orange">$</div>
                                            <div>
                                                <small>Ventas del año</small>
                                                <h3>Q {Number(ventasReporte.ano).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</h3>
                                            </div>
                                        </article>
                                    </div>

                                    <div className="preview-kpis">
                                        <article className="preview-kpi">
                                            <div className="preview-kpi-icon kpi-green">✓</div>
                                            <div>
                                                <small>Productos con stock</small>
                                                <h3>{inventarioReporte.disponibles}</h3>
                                            </div>
                                        </article>

                                        <article className="preview-kpi">
                                            <div className="preview-kpi-icon kpi-red">!</div>
                                            <div>
                                                <small>Productos agotados</small>
                                                <h3>{inventarioReporte.agotados}</h3>
                                            </div>
                                        </article>

                                        <article className="preview-kpi">
                                            <div className="preview-kpi-icon kpi-orange">↥</div>
                                            <div>
                                                <small>En stock máximo</small>
                                                <h3>{inventarioReporte.stockMaximo}</h3>
                                            </div>
                                        </article>

                                        <article className="preview-kpi">
                                            <div className="preview-kpi-icon kpi-red">⚠</div>
                                            <div>
                                                <small>Alertas bajo 10 unidades</small>
                                                <h3>{inventarioReporte.alertas.length}</h3>
                                            </div>
                                        </article>
                                    </div>

                                    {inventarioReporte.alertas.length > 0 && (
                                        <div className="report-info-note">
                                            <span>⚠</span>
                                            <span>
                                                Alerta de stock: {inventarioReporte.alertas.map(producto => producto.nombre).join(', ')} tienen menos de 10 unidades disponibles.
                                            </span>
                                        </div>
                                    )}

                                </section>


                                {/* PASOS */}

                                <div className="reportes-steps">


                                    <div className="report-step active">

                                        <span className="step-number">
                                            1
                                        </span>

                                        <div>

                                            <strong>
                                                Seleccione el tipo de informe
                                            </strong>

                                            <small>
                                                Elija el informe que desea generar
                                            </small>

                                        </div>

                                    </div>


                                    <div className="report-step">

                                        <span className="step-number">
                                            2
                                        </span>

                                        <div>

                                            <strong>
                                                Configure los filtros
                                            </strong>

                                            <small>
                                                Defina el rango de fechas y filtros
                                            </small>

                                        </div>

                                    </div>


                                    <div className="report-step">

                                        <span className="step-number">
                                            3
                                        </span>

                                        <div>

                                            <strong>
                                                Vista previa del informe
                                            </strong>

                                            <small>
                                                Revise y exporte el reporte
                                            </small>

                                        </div>

                                    </div>


                                </div>



                                {/* =============================================
                                    TIPOS DE INFORME
                                ============================================== */}

                                <div className="tipo-informe-grid">


                                    <article
                                        className={
                                            tipoInforme === 'ventas'
                                                ?
                                                'tipo-informe selected'
                                                :
                                                'tipo-informe'
                                        }
                                        onClick={
                                            () =>
                                                setTipoInforme(
                                                    'ventas'
                                                )
                                        }
                                    >

                                        <span className="tipo-informe-radio">
                                        </span>


                                        <div className="tipo-icon tipo-blue">
                                            ▥
                                        </div>


                                        <div>

                                            <h3>
                                                Informe de Ventas
                                            </h3>

                                            <p>

                                                Resumen de ventas totales,
                                                por fecha, categoría, cliente
                                                y método de pago.

                                            </p>

                                        </div>

                                    </article>


                                    <article
                                        className={
                                            tipoInforme === 'rotacion'
                                                ?
                                                'tipo-informe selected'
                                                :
                                                'tipo-informe'
                                        }
                                        onClick={
                                            () =>
                                                setTipoInforme(
                                                    'rotacion'
                                                )
                                        }
                                    >

                                        <span className="tipo-informe-radio">
                                        </span>


                                        <div className="tipo-icon tipo-green">
                                            ◇
                                        </div>


                                        <div>

                                            <h3>
                                                Informe de Rotación de Productos
                                            </h3>

                                            <p>

                                                Productos más vendidos,
                                                movimiento, rotación de inventario
                                                y rendimiento.

                                            </p>

                                        </div>

                                    </article>


                                    <article
                                        className={
                                            tipoInforme === 'segmentacion'
                                                ?
                                                'tipo-informe selected'
                                                :
                                                'tipo-informe'
                                        }
                                        onClick={
                                            () =>
                                                setTipoInforme(
                                                    'segmentacion'
                                                )
                                        }
                                    >

                                        <span className="tipo-informe-radio">
                                        </span>


                                        <div className="tipo-icon tipo-purple">
                                            ♙
                                        </div>


                                        <div>

                                            <h3>
                                                Informe de Segmentación de Clientes
                                            </h3>

                                            <p>

                                                Clasificación de clientes por tipo,
                                                frecuencia de compra y volumen
                                                de ventas.

                                            </p>

                                        </div>

                                    </article>


                                </div>



                                {/* =============================================
                                    FILTROS
                                ============================================== */}

                                <section className="report-card">


                                    <div className="report-card-header">

                                        <strong>
                                            Cerrar sesión de filtros
                                        </strong>

                                    </div>


                                    <div className="filtros-body">


                                        <div className="report-field">

                                            <label>
                                                Rango de fechas
                                            </label>


                                            <div className="range-box">

                                                <input
                                                    type="date"
                                                    name="fechaInicio"
                                                    value={
                                                        filtros.fechaInicio
                                                    }
                                                    onChange={
                                                        manejarFiltro
                                                    }
                                                />

                                                <span>
                                                    →
                                                </span>

                                                <input
                                                    type="date"
                                                    name="fechaFin"
                                                    value={
                                                        filtros.fechaFin
                                                    }
                                                    onChange={
                                                        manejarFiltro
                                                    }
                                                />

                                            </div>

                                        </div>


                                        <div className="report-field">

                                            <label>
                                                Comparar con
                                            </label>

                                            <select
                                                name="comparar"
                                                value={
                                                    filtros.comparar
                                                }
                                                onChange={
                                                    manejarFiltro
                                                }
                                            >

                                                <option>
                                                    Sin comparación
                                                </option>

                                                <option>
                                                    Período anterior
                                                </option>

                                                <option>
                                                    Mes anterior
                                                </option>

                                                <option>
                                                    Año anterior
                                                </option>

                                            </select>

                                        </div>


                                        <div className="report-field">

                                            <label>
                                                Categoría
                                            </label>

                                            <select
                                                name="categoria"
                                                value={
                                                    filtros.categoria
                                                }
                                                onChange={
                                                    manejarFiltro
                                                }
                                            >

                                                <option>
                                                    Todas
                                                </option>

                                                <option>
                                                    Vasos
                                                </option>

                                                <option>
                                                    Platos
                                                </option>

                                                <option>
                                                    Contenedores
                                                </option>

                                                <option>
                                                    Bolsas
                                                </option>

                                                <option>
                                                    Cubiertos
                                                </option>

                                            </select>

                                        </div>


                                        <div className="report-field">

                                            <label>
                                                Método de pago
                                            </label>

                                            <select
                                                name="metodoPago"
                                                value={
                                                    filtros.metodoPago
                                                }
                                                onChange={
                                                    manejarFiltro
                                                }
                                            >

                                                <option>
                                                    Todos
                                                </option>

                                                <option>
                                                    Efectivo
                                                </option>

                                                

                                                <option>
                                                    Transferencia
                                                </option>

                                            </select>

                                        </div>


                                        <div className="report-field">

                                            <label>
                                                Cliente
                                            </label>

                                            <select
                                                name="cliente"
                                                value={
                                                    filtros.cliente
                                                }
                                                onChange={
                                                    manejarFiltro
                                                }
                                            >

                                                <option>
                                                    Todos
                                                </option>

                                                <option>
                                                    Cliente general
                                                </option>

                                                <option>
                                                    Mayorista
                                                </option>

                                                <option>
                                                    Minorista
                                                </option>

                                            </select>

                                        </div>


                                        <div className="report-field">

                                            <label>
                                                Ubicación
                                            </label>

                                            <select
                                                name="ubicacion"
                                                value={
                                                    filtros.ubicacion
                                                }
                                                onChange={
                                                    manejarFiltro
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


                                        <div className="report-field">

                                            <label>
                                                Vendedor
                                            </label>

                                            <select
                                                name="vendedor"
                                                value={
                                                    filtros.vendedor
                                                }
                                                onChange={
                                                    manejarFiltro
                                                }
                                            >

                                                <option>
                                                    Todos
                                                </option>

                                                <option>
                                                    Administrador
                                                </option>

                                                <option>
                                                    Vendedor 1
                                                </option>

                                            </select>

                                        </div>


                                        <button
                                            type="button"
                                            className="clear-filter"
                                            onClick={
                                                limpiarFiltros
                                            }
                                        >

                                            ⚲ Limpiar filtros

                                        </button>


                                    </div>


                                </section>



                                {/* =============================================
                                    VISTA PREVIA
                                ============================================== */}

                                <section className="report-card">


                                    <div className="report-card-header">

                                        <strong>
                                            Vista previa del informe
                                        </strong>


                                        <button
                                            type="button"
                                            className="preview-refresh"
                                            onClick={
                                                actualizarVista
                                            }
                                            disabled={
                                                actualizando
                                            }
                                        >

                                            ↻ {
                                                actualizando
                                                    ?
                                                    'Actualizando...'
                                                    :
                                                    'Actualizar vista previa'
                                            }

                                        </button>

                                    </div>



                                    {/* KPI */}

                                    <div className="preview-kpis">


                                        <article className="preview-kpi">

                                            <div className="preview-kpi-icon kpi-blue">
                                                $
                                            </div>

                                            <div>

                                                <small>
                                                    Ventas Totales
                                                </small>

                                                <h3>
                                                    Q 125,430.00
                                                </h3>

                                                <span>
                                                    ▲ 18.5% vs. período anterior
                                                </span>

                                            </div>

                                        </article>


                                        <article className="preview-kpi">

                                            <div className="preview-kpi-icon kpi-green">
                                                ♧
                                            </div>

                                            <div>

                                                <small>
                                                    Total de Transacciones
                                                </small>

                                                <h3>
                                                    356
                                                </h3>

                                                <span>
                                                    ▲ 12.4% vs. período anterior
                                                </span>

                                            </div>

                                        </article>


                                        <article className="preview-kpi">

                                            <div className="preview-kpi-icon kpi-purple">
                                                ♙
                                            </div>

                                            <div>

                                                <small>
                                                    Clientes Atendidos
                                                </small>

                                                <h3>
                                                    142
                                                </h3>

                                                <span>
                                                    ▲ 8.7% vs. período anterior
                                                </span>

                                            </div>

                                        </article>


                                        <article className="preview-kpi">

                                            <div className="preview-kpi-icon kpi-orange">
                                                ▥
                                            </div>

                                            <div>

                                                <small>
                                                    Ticket Promedio
                                                </small>

                                                <h3>
                                                    Q 352.33
                                                </h3>

                                                <span>
                                                    ▲ 6.1% vs. período anterior
                                                </span>

                                            </div>

                                        </article>


                                    </div>



                                    {/* GRÁFICAS */}

                                    <div className="charts-grid">


                                        {/* LINEA */}

                                        <article className="chart-box">

                                            <div className="chart-title">

                                                <span>
                                                    Ventas por día
                                                </span>

                                                <select>

                                                    <option>
                                                        Importe
                                                    </option>

                                                    <option>
                                                        Transacciones
                                                    </option>

                                                </select>

                                            </div>


                                            <svg
                                                className="line-chart"
                                                viewBox="0 0 330 135"
                                            >

                                                <line
                                                    className="chart-grid-line"
                                                    x1="40"
                                                    y1="18"
                                                    x2="320"
                                                    y2="18"
                                                />

                                                <line
                                                    className="chart-grid-line"
                                                    x1="40"
                                                    y1="45"
                                                    x2="320"
                                                    y2="45"
                                                />

                                                <line
                                                    className="chart-grid-line"
                                                    x1="40"
                                                    y1="72"
                                                    x2="320"
                                                    y2="72"
                                                />

                                                <line
                                                    className="chart-grid-line"
                                                    x1="40"
                                                    y1="99"
                                                    x2="320"
                                                    y2="99"
                                                />


                                                <path
                                                    className="chart-area"
                                                    d="
                                                        M 48 88
                                                        L 69 95
                                                        L 90 66
                                                        L 111 51
                                                        L 132 72
                                                        L 153 59
                                                        L 174 69
                                                        L 195 34
                                                        L 216 44
                                                        L 237 75
                                                        L 258 66
                                                        L 279 70
                                                        L 300 37
                                                        L 320 18
                                                        L 320 110
                                                        L 48 110
                                                        Z
                                                    "
                                                />


                                                <path
                                                    className="chart-line"
                                                    d="
                                                        M 48 88
                                                        L 69 95
                                                        L 90 66
                                                        L 111 51
                                                        L 132 72
                                                        L 153 59
                                                        L 174 69
                                                        L 195 34
                                                        L 216 44
                                                        L 237 75
                                                        L 258 66
                                                        L 279 70
                                                        L 300 37
                                                        L 320 18
                                                    "
                                                />


                                                {
                                                    [
                                                        [48, 88],
                                                        [69, 95],
                                                        [90, 66],
                                                        [111, 51],
                                                        [132, 72],
                                                        [153, 59],
                                                        [174, 69],
                                                        [195, 34],
                                                        [216, 44],
                                                        [237, 75],
                                                        [258, 66],
                                                        [279, 70],
                                                        [300, 37],
                                                        [320, 18]
                                                    ]
                                                        .map(
                                                            (
                                                                punto,
                                                                index
                                                            ) => (

                                                                <circle
                                                                    key={
                                                                        index
                                                                    }
                                                                    className="chart-dot"
                                                                    cx={
                                                                        punto[0]
                                                                    }
                                                                    cy={
                                                                        punto[1]
                                                                    }
                                                                    r="2.8"
                                                                />

                                                            )
                                                        )
                                                }


                                                <text
                                                    className="chart-text"
                                                    x="2"
                                                    y="21"
                                                >
                                                    Q 40,000
                                                </text>

                                                <text
                                                    className="chart-text"
                                                    x="2"
                                                    y="48"
                                                >
                                                    Q 30,000
                                                </text>

                                                <text
                                                    className="chart-text"
                                                    x="2"
                                                    y="75"
                                                >
                                                    Q 20,000
                                                </text>

                                                <text
                                                    className="chart-text"
                                                    x="2"
                                                    y="102"
                                                >
                                                    Q 10,000
                                                </text>


                                                <text
                                                    className="chart-text"
                                                    x="42"
                                                    y="126"
                                                >
                                                    01 May
                                                </text>

                                                <text
                                                    className="chart-text"
                                                    x="95"
                                                    y="126"
                                                >
                                                    04 May
                                                </text>

                                                <text
                                                    className="chart-text"
                                                    x="150"
                                                    y="126"
                                                >
                                                    10 May
                                                </text>

                                                <text
                                                    className="chart-text"
                                                    x="205"
                                                    y="126"
                                                >
                                                    13 May
                                                </text>

                                                <text
                                                    className="chart-text"
                                                    x="260"
                                                    y="126"
                                                >
                                                    19 May
                                                </text>

                                                <text
                                                    className="chart-text"
                                                    x="305"
                                                    y="126"
                                                >
                                                    24
                                                </text>


                                            </svg>

                                        </article>



                                        {/* CATEGORÍAS */}

                                        <article className="chart-box">

                                            <div className="chart-title">

                                                <span>
                                                    Ventas por categoría
                                                </span>

                                            </div>


                                            <div className="donut-chart donut-category">

                                                <div className="donut-main-value">
                                                    35%
                                                </div>

                                            </div>


                                            <div className="mini-legend">

                                                <span>
                                                    <i className="legend-dot c1"></i>
                                                    Vasos
                                                </span>

                                                <span>
                                                    <i className="legend-dot c2"></i>
                                                    Platos
                                                </span>

                                                <span>
                                                    <i className="legend-dot c3"></i>
                                                    Contenedores
                                                </span>

                                                <span>
                                                    <i className="legend-dot c4"></i>
                                                    Bolsas
                                                </span>

                                                <span>
                                                    <i className="legend-dot c5"></i>
                                                    Cubiertos
                                                </span>

                                            </div>

                                        </article>



                                        {/* MÉTODO DE PAGO */}

                                        <article className="chart-box">

                                            <div className="chart-title">

                                                <span>
                                                    Ventas por método de pago
                                                </span>

                                            </div>


                                            <div className="donut-chart donut-payment">

                                                <div className="donut-main-value">
                                                    60%
                                                </div>

                                            </div>


                                            <div className="mini-legend">

                                                <span>
                                                    <i className="legend-dot c1"></i>
                                                    Efectivo
                                                </span>

                                                

                                                <span>
                                                    <i className="legend-dot c5"></i>
                                                    Transferencia
                                                </span>

                                            </div>

                                        </article>


                                    </div>


                                </section>



                                <div className="report-info-note">

                                    <span>
                                        ⓘ
                                    </span>

                                    <span>

                                        La vista previa muestra los datos
                                        con los filtros seleccionados.
                                        Al generar el informe, el documento
                                        incluirá una marca de agua con
                                        fecha y hora.

                                    </span>

                                </div>


                            </section>



                            {/* =================================================
                                PANEL DERECHO
                            ================================================== */}

                            <aside className="report-summary">


                                <div className="summary-header">
                                    Resumen del informe
                                </div>


                                <div className="summary-body">


                                    <div className="summary-section">

                                        <strong>
                                            Tipo de informe
                                        </strong>

                                        <p>
                                            {
                                                informacionInforme.corto
                                            }
                                        </p>

                                    </div>


                                    <div className="summary-section">

                                        <strong>
                                            Rango de fechas
                                        </strong>

                                        <p>

                                            {
                                                fechaVisual(
                                                    filtros.fechaInicio
                                                )
                                            }

                                            {' - '}

                                            {
                                                fechaVisual(
                                                    filtros.fechaFin
                                                )
                                            }

                                        </p>

                                    </div>


                                    <div className="summary-section">

                                        <strong>
                                            Filtros aplicados
                                        </strong>


                                        <div className="summary-filters">


                                            <div className="summary-filter">

                                                <span className="summary-check">
                                                    ✓
                                                </span>

                                                Categoría:
                                                {' '}
                                                {
                                                    filtros.categoria
                                                }

                                            </div>


                                            <div className="summary-filter">

                                                <span className="summary-check">
                                                    ✓
                                                </span>

                                                Método de pago:
                                                {' '}
                                                {
                                                    filtros.metodoPago
                                                }

                                            </div>


                                            <div className="summary-filter">

                                                <span className="summary-check">
                                                    ✓
                                                </span>

                                                Cliente:
                                                {' '}
                                                {
                                                    filtros.cliente
                                                }

                                            </div>


                                            <div className="summary-filter">

                                                <span className="summary-check">
                                                    ✓
                                                </span>

                                                Ubicación:
                                                {' '}
                                                {
                                                    filtros.ubicacion
                                                }

                                            </div>


                                            <div className="summary-filter">

                                                <span className="summary-check">
                                                    ✓
                                                </span>

                                                Vendedor:
                                                {' '}
                                                {
                                                    filtros.vendedor
                                                }

                                            </div>


                                        </div>

                                    </div>


                                    <div className="summary-section">

                                        <strong>
                                            Incluye
                                        </strong>


                                        <div className="summary-filters">


                                            <div className="summary-filter">

                                                <span className="summary-check">
                                                    ✓
                                                </span>

                                                Resumen general

                                            </div>


                                            <div className="summary-filter">

                                                <span className="summary-check">
                                                    ✓
                                                </span>

                                                Gráficos y tendencias

                                            </div>


                                            <div className="summary-filter">

                                                <span className="summary-check">
                                                    ✓
                                                </span>

                                                Detalle de transacciones

                                            </div>


                                        </div>

                                    </div>


                                    <div className="summary-notice">

                                        ⓘ Este informe se generará
                                        con los filtros seleccionados.

                                        <br /><br />

                                        La marca de agua con fecha
                                        y hora se agregará al exportar.

                                    </div>


                                    <div className="summary-section">
                                        <strong>Descarga de informe PDF</strong>
                                        <div className="report-field">
                                            <label htmlFor="periodo-pdf">Período de búsqueda</label>
                                            <select id="periodo-pdf" value={tipoPeriodoPdf} onChange={evento => {
                                                const tipo = evento.target.value;
                                                const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
                                                setTipoPeriodoPdf(tipo);
                                                setPeriodoPdf(tipo === 'ano' ? periodoPdf.slice(0, 4) || hoy.slice(0, 4) : tipo === 'mes' ? (periodoPdf.length >= 7 ? periodoPdf.slice(0, 7) : hoy.slice(0, 7)) : tipo === 'dia' ? (periodoPdf.length === 10 ? periodoPdf : periodoPdf.length === 7 ? `${periodoPdf}-01` : `${periodoPdf}-01-01`) : periodoPdf);
                                            }}>
                                                <option value="rango">Rango de fechas</option>
                                                <option value="dia">Día</option>
                                                <option value="mes">Mes</option>
                                                <option value="ano">Año</option>
                                            </select>
                                            {tipoPeriodoPdf !== 'rango' && (
                                                <input
                                                    type={tipoPeriodoPdf === 'dia' ? 'date' : tipoPeriodoPdf === 'mes' ? 'month' : 'number'}
                                                    min={tipoPeriodoPdf === 'ano' ? '2000' : undefined}
                                                    max={tipoPeriodoPdf === 'ano' ? String(new Date().getFullYear()) : undefined}
                                                    value={tipoPeriodoPdf === 'dia' ? periodoPdf : tipoPeriodoPdf === 'mes' ? periodoPdf.slice(0, 7) : periodoPdf.slice(0, 4)}
                                                    onChange={evento => setPeriodoPdf(evento.target.value)}
                                                    aria-label="Seleccionar período para el PDF"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="generate-report"
                                        onClick={
                                            generarInforme
                                        }
                                        disabled={
                                            generando
                                        }
                                    >

                                        ▤ &nbsp;

                                        {
                                            generando
                                                ?
                                                'Generando...'
                                                :
                                                'Generar Informe'
                                        }

                                    </button>


                                </div>


                            </aside>


                        </div>


                    </main>


                </section>


            </div>

        </>

    );

}


export default Reportes;