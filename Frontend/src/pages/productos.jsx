import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';


function Productos() {

    const navigate = useNavigate();
    const fechaActual = new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    // =========================================================
    // CATÁLOGOS
    // =========================================================

    const [categorias, setCategorias] = useState([
        { id: 'Banderas', nombre: 'Banderas' },
        { id: 'Bolsas Color Y Transparente', nombre: 'Bolsas Color Y Transparente' },
        { id: 'Carpeta Y Vinil Para Mesa', nombre: 'Carpeta Y Vinil Para Mesa' },
        { id: 'Globos', nombre: 'Globos' },
        { id: 'Nailo', nombre: 'Nailo' },
        { id: 'Pita', nombre: 'Pita' },
        { id: 'Platos Bandejas Y Contenedores', nombre: 'Platos Bandejas Y Contenedores' },
        { id: 'Vasos', nombre: 'Vasos' },
        { id: 'Cubiertos', nombre: 'Cubiertos' },
        { id: 'Platos', nombre: 'Platos' },
        { id: 'Tazones y Contenedores', nombre: 'Tazones y Contenedores' },
        { id: 'Bolsas', nombre: 'Bolsas' },
        { id: 'Bolsas y Empaques', nombre: 'Bolsas y Empaques' },
        { id: 'Otros', nombre: 'Otros' }
    ]);
    const [unidades, setUnidades] = useState([
        { id: 'Unidad', nombre: 'Unidad' },
        { id: 'Paquete', nombre: 'Paquete' },
        { id: 'Caja', nombre: 'Caja' },
        { id: 'Rollo', nombre: 'Rollo' },
        { id: 'Docena', nombre: 'Docena' },
        { id: 'Onzas', nombre: 'Onzas' },
        { id: 'Libras', nombre: 'Libras' }
    ]);
    const [cargandoCatalogos, setCargandoCatalogos] = useState(true);


    // =========================================================
    // FORMULARIO
    // =========================================================

    const estadoInicial = {
        categoria_id: '',
        unidad_medida_id: '',
        nombre: '',
        descripcion: '',
        imagen_url: '',
        ancho_pulgadas: '',
        largo_pulgadas: '',
        calibre_milipulgadas: '',
        divisiones: '',
        numero_talla: '',
        forma: '',
        color: '',
        volumen_oz: '',
        material: '',
        precio_costo: '',
        precio_mayorista: '0',
        stock_actual: '',
        stock_minimo: '',
        stock_maximo: '',
        ubicacion: 'BODEGA',
        estado: 'ACTIVO'
    };


    const [producto, setProducto] =
        useState(estadoInicial);


    const [imagenPreview, setImagenPreview] =
        useState('');


    const [guardando, setGuardando] =
        useState(false);


    const [mensaje, setMensaje] =
        useState('');


    const [tipoMensaje, setTipoMensaje] =
        useState('');


    useEffect(() => {

        async function cargarCatalogos() {

            try {

                const resultados = await Promise.allSettled([
                    fetch('/api/cliente/categorias'),
                    fetch('/api/cliente/unidades')
                ]);

                const [resultadoCategorias, resultadoUnidades] = resultados;
                const errores = [];

                if (
                    resultadoCategorias.status === 'fulfilled'
                    && resultadoCategorias.value.ok
                ) {
                    const categoriasDatos =
                        await resultadoCategorias.value.json();

                    if (categoriasDatos.length > 0) {
                        setCategorias(categoriasActuales => {
                            const categoriasCombinadas = [
                                ...categoriasActuales,
                                ...categoriasDatos.map(categoria => ({
                                    id: categoria.nombre,
                                    nombre: categoria.nombre
                                }))
                            ];
                            const categoriasUnicas = new Map();
                            categoriasCombinadas.forEach(categoria => {
                                const clave = categoria.nombre.trim().toLocaleLowerCase('es');
                                if (!categoriasUnicas.has(clave)) {
                                    categoriasUnicas.set(clave, categoria);
                                }
                            });
                            return Array.from(categoriasUnicas.values());
                        });
                    }
                } else {
                    errores.push('categorías');
                }

                if (
                    resultadoUnidades.status === 'fulfilled'
                    && resultadoUnidades.value.ok
                ) {
                    const unidadesDatos =
                        await resultadoUnidades.value.json();

                    if (unidadesDatos.length > 0) {
                        setUnidades(
                            unidadesDatos.map(unidad => ({
                                id: unidad.nombre,
                                nombre: unidad.nombre
                            }))
                        );
                    }
                } else {
                    errores.push('unidades');
                }

                if (errores.length > 0) {
                    setTipoMensaje('error');
                    setMensaje(
                        `No se pudieron cargar: ${errores.join(' y ')}. Reinicia el backend.`
                    );
                }

            } catch (error) {

                console.error('Error cargando catálogos:', error);
                setTipoMensaje('error');
                setMensaje('No se pudieron cargar categorías y unidades.');

            } finally {

                setCargandoCatalogos(false);

            }

        }

        cargarCatalogos();

    }, []);


    // =========================================================
    // CAMBIAR CAMPOS
    // =========================================================

    function manejarCambio(evento) {

        const {
            name,
            value
        } = evento.target;


        setProducto(
            anterior => ({
                ...anterior,
                [name]: value
            })
        );

    }


    // =========================================================
    // CAMBIAR ESTADO
    // =========================================================

    function cambiarEstado() {

        setProducto(
            anterior => ({
                ...anterior,

                estado:
                    anterior.estado === 'ACTIVO'
                        ? 'INACTIVO'
                        : 'ACTIVO'
            })
        );

    }


    // =========================================================
    // IMAGEN
    // =========================================================

    function seleccionarImagen(evento) {

        const archivo =
            evento.target.files?.[0];


        if (!archivo) {
            return;
        }


        const tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];


        if (
            !tiposPermitidos.includes(
                archivo.type
            )
        ) {

            setTipoMensaje('error');

            setMensaje(
                'Solo puedes seleccionar imágenes JPG, PNG o WEBP.'
            );

            return;
        }


        if (
            archivo.size >
            2 * 1024 * 1024
        ) {

            setTipoMensaje('error');

            setMensaje(
                'La imagen no debe superar los 2 MB.'
            );

            return;
        }


        const lector = new FileReader();

        lector.onload = () => {

            const imagenBase64 =
                String(lector.result || '');

            setImagenPreview(imagenBase64);

            setProducto(
                anterior => ({
                    ...anterior,
                    imagen_url: imagenBase64
                })
            );

            setMensaje('');

        };

        lector.onerror = () => {

            setTipoMensaje('error');
            setMensaje('No fue posible leer la imagen seleccionada.');

        };

        lector.readAsDataURL(archivo);

    }


    // =========================================================
    // CATEGORÍA SELECCIONADA
    // =========================================================

    const nombreCategoria =
        useMemo(
            () => {

                const categoria =
                    categorias.find(
                        item =>
                            String(item.id) ===
                            String(
                                producto.categoria_id
                            )
                    );


                return categoria?.nombre || '-';

            },

            [
                producto.categoria_id
            ]
        );


    const nombreUnidad =
        useMemo(
            () => {

                const unidad =
                    unidades.find(
                        item =>
                            String(item.id) ===
                            String(
                                producto.unidad_medida_id
                            )
                    );


                return unidad?.nombre || '-';

            },

            [
                producto.unidad_medida_id
            ]
        );


    // =========================================================
    // VALIDACIÓN
    // =========================================================

    function validarFormulario() {

        if (
            !producto.nombre.trim()
        ) {

            return 'Debes ingresar el nombre del producto.';
        }


        if (
            !producto.categoria_id
        ) {

            return 'Debes seleccionar una categoría.';
        }


        if (
            !producto.unidad_medida_id
        ) {

            return 'Debes seleccionar una unidad de medida.';
        }


        if (
            producto.precio_costo === ''
            ||
            Number(
                producto.precio_costo
            ) < 0
        ) {

            return 'Debes ingresar un precio de costo válido.';
        }


        if (
            producto.stock_minimo === ''
            ||
            Number(
                producto.stock_minimo
            ) < 0
        ) {

            return 'Debes ingresar el stock mínimo.';
        }


        if (
            producto.stock_actual === ''
            ||
            Number(producto.stock_actual) < 0
        ) {
            return 'Debes ingresar el stock disponible.';
        }


        if (
            producto.stock_maximo === ''
            ||
            Number(
                producto.stock_maximo
            ) < 0
        ) {

            return 'Debes ingresar el stock máximo.';
        }


        if (
            Number(
                producto.stock_maximo
            )
            <
            Number(
                producto.stock_minimo
            )
        ) {

            return 'El stock máximo no puede ser menor que el stock mínimo.';
        }


        if (!producto.ubicacion) {
            return 'Debes seleccionar una ubicación de inventario.';
        }


        return '';

    }


    // =========================================================
    // PREPARAR DATOS
    // =========================================================

    function prepararDatos() {

        const numeroONull =
            valor =>
                valor === ''
                    ? null
                    : Number(valor);


        return {

            categoria_id:
                producto.categoria_id,

            unidad_medida_id:
                producto.unidad_medida_id,

            nombre:
                producto.nombre.trim(),

            descripcion:
                producto.descripcion.trim()
                || null,

            imagen_url:
                producto.imagen_url
                || null,

            ancho_pulgadas:
                numeroONull(
                    producto.ancho_pulgadas
                ),

            largo_pulgadas:
                numeroONull(
                    producto.largo_pulgadas
                ),

            calibre_milipulgadas:
                numeroONull(
                    producto.calibre_milipulgadas
                ),

            divisiones:
                numeroONull(
                    producto.divisiones
                ),

            numero_talla:
                producto.numero_talla.trim()
                || null,

            forma:
                producto.forma
                || null,

            color:
                producto.color
                || null,

            volumen_oz:
                numeroONull(
                    producto.volumen_oz
                ),

            material:
                producto.material
                || null,

            precio_costo:
                Number(
                    producto.precio_costo
                ),

            precio_mayorista:
                Number(producto.precio_mayorista || 0),

            stock_actual:
                Number(
                    producto.stock_actual
                ),

            stock_minimo:
                Number(
                    producto.stock_minimo
                ),

            stock_maximo:
                Number(
                    producto.stock_maximo
                ),

            ubicacion:
                producto.ubicacion,

            estado:
                producto.estado

        };

    }


    // =========================================================
    // GUARDAR PRODUCTO
    // =========================================================

    async function guardarProducto(
        crearOtro = false
    ) {

        const errorValidacion =
            validarFormulario();


        if (errorValidacion) {

            setTipoMensaje('error');

            setMensaje(
                errorValidacion
            );

            return;

        }


        try {

            setGuardando(true);

            setMensaje('');


            const datos =
                prepararDatos();


            /*
             * La ruta de productos pertenece al módulo cliente.
             */

            const respuesta =
                await fetch(
                    '/api/cliente/productos',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify(
                                datos
                            )
                    }
                );


            const resultado =
                await respuesta
                    .json()
                    .catch(
                        () => ({})
                    );


            if (!respuesta.ok) {

                throw new Error(
                    resultado.error
                    ||
                    resultado.mensaje
                    ||
                    'No fue posible guardar el producto.'
                );

            }


            setTipoMensaje(
                'exito'
            );


            setMensaje(
                'Producto registrado correctamente.'
            );


            if (crearOtro) {

                setProducto(
                    estadoInicial
                );

                setImagenPreview('');

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });

                return;

            }


            setTimeout(
                () => {
                    navigate(
                        '/public/productos'
                    );
                },

                900
            );


        } catch (error) {

            setTipoMensaje(
                'error'
            );


            setMensaje(
                error.message
            );


        } finally {

            setGuardando(false);

        }

    }


    // =========================================================
    // CANCELAR
    // =========================================================

    function cancelar() {

        const confirmar =
            window.confirm(
                '¿Deseas cancelar la creación del producto?'
            );


        if (confirmar) {

            navigate(
                '/public/productos'
            );

        }

    }


    // =========================================================
    // CSS
    // =========================================================

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
                Arial,
                Helvetica,
                sans-serif;

            color:
                #18345e;

            background:
                #f5f8fc;
        }


        button,
        input,
        select,
        textarea {
            font: inherit;
        }


        .producto-page {
            min-height: 100vh;

            display: flex;

            background:
                linear-gradient(
                    135deg,
                    #f6f9fd,
                    #edf5fd
                );
        }


        /* ==========================================
           SIDEBAR
        ========================================== */

        .producto-sidebar {
            width: 205px;

            min-height: 100vh;

            position: fixed;

            left: 0;
            top: 0;
            bottom: 0;

            z-index: 100;

            display: flex;

            flex-direction: column;

            color: white;

            background:
                linear-gradient(
                    180deg,
                    #103e79 0%,
                    #123d72 45%,
                    #173b68 100%
                );
        }


        .producto-logo {
            display: flex;

            align-items: center;

            gap: 10px;

            padding:
                26px 20px;

            color: white;

            text-decoration: none;
        }


        .producto-logo-icon {
            width: 45px;

            height: 45px;

            display: grid;

            place-items: center;

            border-radius: 8px;

            font-size: 30px;
        }


        .producto-logo-text {
            display: flex;

            flex-direction: column;

            line-height: 1.02;
        }


        .producto-logo-text strong {
            font-size: 15px;

            font-weight: 900;
        }


        .producto-logo-text small {
            margin-top: 6px;

            color:
                #dce8f7;

            font-size: 12px;
        }


        .producto-menu {
            display: grid;

            gap: 5px;

            padding:
                10px 7px;
        }


        .producto-menu a {
            min-height: 47px;

            display: flex;

            align-items: center;

            gap: 13px;

            padding:
                0 16px;

            border-radius: 6px;

            color:
                #dbe7f6;

            text-decoration: none;

            font-size: 12px;

            transition:
                .2s;
        }


        .producto-menu a:hover {
            background:
                rgba(
                    255,
                    255,
                    255,
                    .08
                );
        }


        .producto-menu a.activo {
            color: white;

            background:
                linear-gradient(
                    90deg,
                    #1b78ee,
                    #1768dc
                );

            font-weight: 700;
        }


        .producto-menu-icon {
            width: 23px;

            text-align: center;

            font-size: 18px;
        }


        .producto-sidebar-decoration {
            margin-top: auto;

            padding:
                20px;

            color:
                #dce8f7;
        }


        .producto-sidebar-decoration-icon {
            margin-bottom: 20px;

            color:
                rgba(
                    255,
                    255,
                    255,
                    .15
                );

            font-size: 70px;
        }


        .producto-sidebar-decoration p {
            margin: 0;

            font-size: 14px;

            line-height: 1.5;
        }


        .producto-sidebar-footer {
            margin-top: 35px;

            padding-top: 18px;

            border-top:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .13
                );

            font-size: 13px;
        }


        /* ==========================================
           CONTENIDO
        ========================================== */

        .producto-content {
            width:
                calc(
                    100% - 205px
                );

            margin-left:
                205px;
        }


        /* ==========================================
           TOPBAR
        ========================================== */

        .producto-topbar {
            min-height: 64px;

            position: sticky;

            top: 0;

            z-index: 80;

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 20px;

            padding:
                0 26px;

            border-bottom:
                1px solid
                #dce5ef;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .96
                );

            backdrop-filter:
                blur(10px);
        }


        .producto-top-left {
            display: flex;

            align-items: center;

            gap: 24px;
        }


        .menu-toggle {
            border: 0;

            color:
                #234c7b;

            background:
                transparent;

            font-size: 21px;

            cursor: pointer;
        }


        .producto-top-search {
            width: 445px;

            height: 39px;

            display: flex;

            align-items: center;

            gap: 10px;

            padding:
                0 14px;

            border:
                1px solid
                #dce6f0;

            border-radius: 6px;

            background:
                #f5f8fb;
        }


        .producto-top-search span {
            color:
                #426991;

            font-size: 18px;
        }


        .producto-top-search input {
            flex: 1;

            min-width: 0;

            border: 0;

            outline: 0;

            color:
                #566f8f;

            background:
                transparent;

            font-size: 13px;
        }


        .producto-top-actions {
            display: flex;

            align-items: center;

            gap: 24px;

            color:
                #18365e;

            font-size: 13px;
        }


        .producto-date {
            display: flex;

            align-items: center;

            gap: 8px;

            font-weight: 700;
        }


        .producto-bell {
            position: relative;

            font-size: 20px;
        }


        .producto-bell span {
            width: 17px;

            height: 17px;

            position: absolute;

            top: -8px;

            right: -10px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color: white;

            background:
                #ef4552;

            font-size: 13px;
        }


        .producto-user {
            display: flex;

            align-items: center;

            gap: 9px;

            font-weight: 700;
        }


        .producto-user-avatar {
            width: 35px;

            height: 35px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color: white;

            background:
                #1672df;

            font-size: 15px;
        }


        /* ==========================================
           MAIN
        ========================================== */

        .producto-main {
            padding:
                21px;
        }


        .breadcrumb {
            display: flex;

            align-items: center;

            gap: 9px;

            margin-bottom: 19px;

            color:
                #5275a1;

            font-size: 12px;
        }


        .breadcrumb a {
            color:
                #2672d8;

            text-decoration: none;
        }


        .producto-heading {
            display: flex;

            align-items: center;

            gap: 14px;

            margin-bottom: 20px;
        }


        .heading-icon {
            width: 45px;

            height: 45px;

            display: grid;

            place-items: center;

            color:
                #1872dc;

            font-size: 34px;
        }


        .producto-heading h1 {
            margin: 0;

            color:
                #154285;

            font-size: 30px;

            letter-spacing: -.5px;
        }


        .producto-heading p {
            margin:
                4px 0 0;

            color:
                #5d779b;

            font-size: 13px;
        }


        /* ==========================================
           GRID PRINCIPAL
        ========================================== */

        .producto-layout {
            display: grid;

            grid-template-columns:
                minmax(
                    0,
                    1fr
                )
                270px;

            gap: 14px;
        }


        .producto-left-column {
            display: grid;

            gap: 13px;
        }


        /* ==========================================
           TARJETAS
        ========================================== */

        .producto-card {
            overflow: hidden;

            border:
                1px solid
                #dbe5ef;

            border-radius: 8px;

            background:
                white;

            box-shadow:
                0 2px 8px
                rgba(
                    30,
                    70,
                    110,
                    .025
                );
        }


        .producto-card-header {
            display: flex;

            align-items: flex-start;

            gap: 11px;

            padding:
                15px 15px 7px;
        }


        .producto-card-icon {
            width: 27px;

            height: 27px;

            display: grid;

            place-items: center;

            color:
                #0969de;

            font-size: 20px;
        }


        .producto-card-header h2 {
            margin: 0;

            color:
                #154584;

            font-size: 15px;
        }


        .producto-card-header p {
            margin:
                4px 0 0;

            color:
                #71849c;

            font-size: 12px;
        }


        .producto-card-body {
            padding:
                10px 15px 15px;
        }


        /* ==========================================
           CAMPOS
        ========================================== */

        .grid-general {
            display: grid;

            grid-template-columns:
                repeat(
                    3,
                    minmax(
                        0,
                        1fr
                    )
                );

            gap:
                14px 18px;
        }


        .form-field {
            display: grid;

            gap: 6px;
        }


        .form-field.full {
            grid-column:
                1 / -1;
        }


        .form-field label {
            color:
                #29486e;

            font-size: 12px;

            font-weight: 700;
        }


        .required {
            color:
                #f44352;
        }


        .input-box {
            min-height: 39px;

            display: flex;

            align-items: center;

            overflow: hidden;

            border:
                1px solid
                #cfdae6;

            border-radius: 5px;

            background:
                white;

            transition:
                .2s;
        }


        .input-box:focus-within {
            border-color:
                #448bea;

            box-shadow:
                0 0 0 3px
                rgba(
                    36,
                    116,
                    220,
                    .08
                );
        }


        .field-icon {
            width: 39px;

            align-self: stretch;

            display: grid;

            place-items: center;

            border-right:
                1px solid
                #d5dfeb;

            color:
                #52739d;

            background:
                #f5f8fb;

            font-size: 15px;
        }


        .input-box input,
        .input-box select {
            flex: 1;

            min-width: 0;

            height: 37px;

            padding:
                0 10px;

            border: 0;

            outline: 0;

            color:
                #405d81;

            background:
                white;

            font-size: 12px;
        }


        .textarea-box {
            min-height: 70px;

            display: flex;

            overflow: hidden;

            border:
                1px solid
                #cfdae6;

            border-radius: 5px;
        }


        .textarea-box .field-icon {
            min-width: 39px;
        }


        .textarea-wrapper {
            flex: 1;

            position: relative;
        }


        .textarea-wrapper textarea {
            width: 100%;

            height: 70px;

            padding:
                10px;

            resize: vertical;

            border: 0;

            outline: 0;

            color:
                #405d81;

            font-size: 12px;
        }


        .textarea-count {
            position: absolute;

            right: 7px;

            bottom: 5px;

            color:
                #8193aa;

            font-size: 13px;
        }


        /* ==========================================
           SWITCH
        ========================================== */

        .estado-field {
            min-height: 39px;

            display: flex;

            align-items: center;

            gap: 10px;
        }


        .switch {
            width: 43px;

            height: 23px;

            position: relative;

            flex: 0 0 43px;

            border: 0;

            border-radius: 20px;

            background:
                #c5d0dc;

            cursor: pointer;

            transition:
                .2s;
        }


        .switch.activo {
            background:
                #176dde;
        }


        .switch::after {
            content: '';

            width: 17px;

            height: 17px;

            position: absolute;

            left: 3px;

            top: 3px;

            border-radius: 50%;

            background:
                white;

            box-shadow:
                0 1px 4px
                rgba(
                    0,
                    0,
                    0,
                    .25
                );

            transition:
                .2s;
        }


        .switch.activo::after {
            transform:
                translateX(
                    20px
                );
        }


        .estado-label {
            color:
                #35567d;

            font-size: 13px;

            font-weight: 700;
        }


        .estado-helper {
            display: block;

            margin-top: 3px;

            color:
                #8292a6;

            font-size: 13px;

            font-weight: normal;
        }


        /* ==========================================
           CARACTERÍSTICAS
        ========================================== */

        .grid-characteristics-top {
            display: grid;

            grid-template-columns:
                repeat(
                    4,
                    minmax(
                        0,
                        1fr
                    )
                );

            gap: 13px;

            margin-bottom: 16px;
        }


        .grid-characteristics-bottom {
            display: grid;

            grid-template-columns:
                repeat(
                    6,
                    minmax(
                        0,
                        1fr
                    )
                );

            gap: 10px;
        }


        /* ==========================================
           INVENTARIO E IMAGEN
        ========================================== */

        .bottom-grid {
            display: grid;

            grid-template-columns:
                1fr .72fr;

            gap: 13px;
        }


        .inventory-fields {
            display: grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            gap: 15px;
        }


        .image-upload {
            min-height: 100px;

            position: relative;

            display: grid;

            place-items: center;

            padding: 15px;

            border:
                1.5px dashed
                #98b3d2;

            border-radius: 6px;

            text-align: center;

            color:
                #547397;

            background:
                #fbfdff;

            cursor: pointer;
        }


        .image-upload:hover {
            background:
                #f4f9ff;
        }


        .image-upload input {
            position: absolute;

            inset: 0;

            width: 100%;

            height: 100%;

            opacity: 0;

            cursor: pointer;
        }


        .upload-icon {
            color:
                #1671de;

            font-size: 29px;
        }


        .image-upload strong {
            display: block;

            color:
                #1470db;

            font-size: 12px;
        }


        .image-upload small {
            display: block;

            margin-top: 5px;

            color:
                #8091a7;

            font-size: 13px;
        }


        /* ==========================================
           VISTA PREVIA
        ========================================== */

        .preview-card {
            align-self: start;

            position: sticky;

            top: 80px;

            border:
                1px solid
                #dce5ef;

            border-radius: 8px;

            background:
                white;

            box-shadow:
                0 4px 14px
                rgba(
                    33,
                    68,
                    105,
                    .04
                );
        }


        .preview-header {
            display: flex;

            gap: 10px;

            padding:
                15px 14px 8px;
        }


        .preview-header > span {
            color:
                #106de0;

            font-size: 20px;
        }


        .preview-header h3 {
            margin: 0;

            color:
                #164481;

            font-size: 13px;
        }


        .preview-header p {
            margin:
                4px 0 0;

            color:
                #7889a0;

            font-size: 12px;
        }


        .preview-image {
            height: 180px;

            margin:
                7px 14px 12px;

            display: grid;

            place-items: center;

            overflow: hidden;

            border-radius: 6px;

            color:
                #899db6;

            background:
                linear-gradient(
                    135deg,
                    #f1f6fb,
                    #e8eef5
                );
        }


        .preview-image img {
            width: 100%;

            height: 100%;

            object-fit: contain;

            background: white;
        }


        .preview-empty {
            text-align: center;
        }


        .preview-empty span {
            display: block;

            margin-bottom: 10px;

            font-size: 45px;
        }


        .preview-empty strong {
            display: block;

            font-size: 12px;
        }


        .preview-empty small {
            display: block;

            margin-top: 6px;

            font-size: 13px;
        }


        .preview-data {
            display: grid;

            gap: 2px;

            padding:
                5px 14px 14px;
        }


        .preview-row {
            min-height: 32px;

            display: grid;

            grid-template-columns:
                23px 105px 1fr;

            align-items: center;

            gap: 5px;

            border-bottom:
                1px solid
                #edf1f5;

            font-size: 12px;
        }


        .preview-row:last-child {
            border-bottom: 0;
        }


        .preview-row-icon {
            color:
                #315d92;

            font-size: 13px;
        }


        .preview-row strong {
            color:
                #365274;
        }


        .preview-row span:last-child {
            overflow: hidden;

            color:
                #607896;

            text-overflow:
                ellipsis;

            white-space: nowrap;
        }


        .preview-separator {
            height: 1px;

            margin:
                0 14px;

            background:
                #dce5ef;
        }


        .preview-status {
            padding:
                12px 14px;
        }


        .preview-status-row {
            display: flex;

            align-items: center;

            justify-content: space-between;

            color:
                #355376;

            font-size: 12px;

            font-weight: 700;
        }


        .status-pill {
            padding:
                5px 12px;

            border-radius: 20px;

            color:
                #15814f;

            background:
                #dcf4e5;
        }


        .status-pill.inactivo {
            color:
                #ba3d45;

            background:
                #ffe5e7;
        }


        .preview-note {
            margin:
                0 14px 14px;

            padding:
                11px;

            border:
                1px solid
                #cfe0f4;

            border-radius: 5px;

            color:
                #34608c;

            background:
                #eef6ff;

            font-size: 13px;

            line-height: 1.5;
        }


        /* ==========================================
           MENSAJES
        ========================================== */

        .producto-message {
            margin-bottom: 13px;

            padding:
                12px 15px;

            border-radius: 6px;

            font-size: 12px;
        }


        .producto-message.error {
            color:
                #a83b44;

            border:
                1px solid
                #f5c7cb;

            background:
                #fff0f1;
        }


        .producto-message.exito {
            color:
                #13764a;

            border:
                1px solid
                #bfe5d1;

            background:
                #eaf8f0;
        }


        /* ==========================================
           FOOTER BOTONES
        ========================================== */

        .producto-actions {
            display: flex;

            justify-content: space-between;

            align-items: center;

            gap: 15px;

            margin-top: 15px;

            padding:
                14px 4px 0;
        }


        .producto-actions-right {
            display: flex;

            gap: 10px;
        }


        .action-button {
            min-height: 42px;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 8px;

            padding:
                0 23px;

            border-radius: 5px;

            font-size: 12px;

            font-weight: 700;

            cursor: pointer;

            transition:
                .2s;
        }


        .action-button:hover {
            transform:
                translateY(
                    -1px
                );
        }


        .button-cancel {
            color:
                #3b536f;

            border: 0;

            background:
                #e4ebf3;
        }


        .button-new {
            color:
                #1167d8;

            border:
                1px solid
                #1470df;

            background:
                white;
        }


        .button-save {
            color:
                white;

            border:
                1px solid
                #0b68dd;

            background:
                linear-gradient(
                    90deg,
                    #0b70ec,
                    #1266d9
                );
        }


        .action-button:disabled {
            opacity: .6;

            cursor: wait;

            transform: none;
        }


        /* ==========================================
           RESPONSIVE
        ========================================== */

        @media (
            max-width: 1150px
        ) {

            .producto-layout {
                grid-template-columns:
                    1fr;
            }


            .preview-card {
                position: static;
            }


            .grid-characteristics-bottom {
                grid-template-columns:
                    repeat(
                        3,
                        1fr
                    );
            }

        }


        @media (
            max-width: 900px
        ) {

            .producto-sidebar {
                width: 76px;
            }


            .producto-logo-text,
            .producto-menu a span:last-child,
            .producto-sidebar-decoration {
                display: none;
            }


            .producto-logo {
                justify-content: center;

                padding:
                    20px 0;
            }


            .producto-menu a {
                justify-content: center;

                padding: 0;
            }


            .producto-content {
                width:
                    calc(
                        100% - 76px
                    );

                margin-left:
                    76px;
            }


            .producto-top-search {
                width: 300px;
            }


            .grid-general {
                grid-template-columns:
                    repeat(
                        2,
                        1fr
                    );
            }


            .grid-characteristics-top {
                grid-template-columns:
                    repeat(
                        2,
                        1fr
                    );
            }


            .bottom-grid {
                grid-template-columns:
                    1fr;
            }

        }


        @media (
            max-width: 650px
        ) {

            .producto-topbar {
                padding:
                    10px 15px;
            }


            .producto-top-search {
                width: 190px;
            }


            .producto-date,
            .producto-user span {
                display: none;
            }


            .producto-main {
                padding:
                    15px 10px;
            }


            .producto-heading h1 {
                font-size: 24px;
            }


            .grid-general,
            .grid-characteristics-top,
            .grid-characteristics-bottom,
            .inventory-fields {
                grid-template-columns:
                    1fr;
            }


            .producto-actions {
                align-items: stretch;

                flex-direction: column;
            }


            .producto-actions-right {
                flex-direction: column;
            }


            .action-button {
                width: 100%;
            }

        }

        /* Productos se muestra dentro de PublicLayout. */
        .producto-page {
            min-height: auto;
            display: block;
        }

        .producto-sidebar,
        .producto-topbar {
            display: none !important;
        }

        .producto-content {
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


            <div className="producto-page">


                {/* =================================================
                    SIDEBAR
                ================================================== */}

                <aside className="producto-sidebar">


                    <Link
                        to="/admin"
                        className="producto-logo"
                    >
<img
                    src="/logo-comercial-san-cristobal.png"
                    alt="Logotipo Comercial San Cristóbal"
                    style={{ width: '220px', maxWidth: '100%', height: '84px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '8px', padding: '3px' }}
                />
</Link>


                    <nav className="producto-menu">


                        <Link to="/admin">

                            <span className="producto-menu-icon">
                                ⌂
                            </span>

                            <span>
                                Dashboard
                            </span>

                        </Link>


                        <Link to="/clientes">

                            <span className="producto-menu-icon">
                                ♙
                            </span>

                            <span>
                                Clientes
                            </span>

                        </Link>


                        <Link
                            to="/productos"
                            className="activo"
                        >

                            <span className="producto-menu-icon">
                                ◇
                            </span>

                            <span>
                                Productos
                            </span>

                        </Link>


                        <Link to="/inventario">

                            <span className="producto-menu-icon">
                                ▣
                            </span>

                            <span>
                                Inventario
                            </span>

                        </Link>


                        <Link to="/ventas">

                            <span className="producto-menu-icon">
                                🛒
                            </span>

                            <span>
                                Ventas
                            </span>

                        </Link>


                        <Link to="/compras">

                            <span className="producto-menu-icon">
                                ♧
                            </span>

                            <span>
                                Compras
                            </span>

                        </Link>


                        <Link to="/reportes">

                            <span className="producto-menu-icon">
                                ▥
                            </span>

                            <span>
                                Informes y Reportes
                            </span>

                        </Link>


                        <Link to="/usuarios">

                            <span className="producto-menu-icon">
                                ♙
                            </span>

                            <span>
                                Usuarios
                            </span>

                        </Link>


                        <Link to="/cerrar-sesion">

                            <span className="producto-menu-icon">
                                ↪
                            </span>

                            <span>
                                Cerrar sesión
                            </span>

                        </Link>


                    </nav>


                    <div className="producto-sidebar-decoration">

                        <div className="producto-sidebar-decoration-icon">
                            🥤
                        </div>


                        <p>

                            Tu negocio,

                            <br />

                            nuestro plástico.

                        </p>


                        <div className="producto-sidebar-footer">

                            © 2026 Comercial San Cristóbal

                            <br />

                            v1.0.0

                        </div>

                    </div>


                </aside>



                {/* =================================================
                    CONTENIDO
                ================================================== */}

                <section className="producto-content">


                    {/* =================================================
                        TOPBAR
                    ================================================== */}

                    <header className="producto-topbar">


                        <div className="producto-top-left">

                            <button
                                type="button"
                                className="menu-toggle"
                            >
                                ☰
                            </button>


                            <div className="producto-top-search">

                                <span>
                                    ⌕
                                </span>

                                <input
                                    type="search"
                                    placeholder="Buscar en el sistema..."
                                />

                            </div>

                        </div>


                        <div className="producto-top-actions">


                            <div className="producto-date">

                                <span>
                                    📅
                                </span>

                                <span>
                                    {fechaActual}
                                </span>

                            </div>


                            <div className="producto-bell">

                                ♧

                                <span>
                                    3
                                </span>

                            </div>


                            <div className="producto-user">

                                <div className="producto-user-avatar">
                                    A
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

                    <main className="producto-main">


                        <section className="producto-heading">

                            <div className="heading-icon">
                                ◇
                            </div>


                            <div>

                                <h1>
                                    Crear Producto
                                </h1>

                                <p>

                                    Registra un nuevo producto
                                    para el catálogo y control
                                    de inventario.

                                </p>

                            </div>

                        </section>


                        {
                            mensaje
                            &&
                            (

                                <div
                                    className={
                                        `producto-message ${tipoMensaje}`
                                    }
                                >

                                    {mensaje}

                                </div>

                            )
                        }


                        <div className="producto-layout">


                            {/* =================================================
                                COLUMNA IZQUIERDA
                            ================================================== */}

                            <div className="producto-left-column">


                                {/* =============================================
                                    INFORMACIÓN GENERAL
                                ============================================== */}

                                <section className="producto-card">


                                    <div className="producto-card-header">

                                        <div className="producto-card-icon">
                                            ▣
                                        </div>


                                        <div>

                                            <h2>
                                                Información General
                                            </h2>

                                            <p>
                                                Datos básicos del producto.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="producto-card-body">


                                        <div className="grid-general">


                                            {/* NOMBRE */}

                                            <div className="form-field">

                                                <label>

                                                    Nombre del producto

                                                    <span className="required">
                                                        {' '}*
                                                    </span>

                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        ◆
                                                    </span>


                                                    <input
                                                        name="nombre"
                                                        value={
                                                            producto.nombre
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                        placeholder="Ej. Vaso desechable 12 oz"
                                                        maxLength={150}
                                                    />

                                                </div>

                                            </div>


                                            {/* CATEGORÍA */}

                                            <div className="form-field">

                                                <label>

                                                    Categoría

                                                    <span className="required">
                                                        {' '}*
                                                    </span>

                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        ▰
                                                    </span>


                                                    <select
                                                        name="categoria_id"
                                                        value={
                                                            producto.categoria_id
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                    >

                                                        <option value="">
                                                            Selecciona una categoría
                                                        </option>


                                                        {
                                                            categorias.map(
                                                                categoria => (

                                                                    <option
                                                                        key={
                                                                            categoria.id
                                                                        }
                                                                        value={
                                                                            categoria.id
                                                                        }
                                                                    >

                                                                        {
                                                                            categoria.nombre
                                                                        }

                                                                    </option>

                                                                )
                                                            )
                                                        }

                                                    </select>

                                                </div>

                                            </div>


                                            {/* UNIDAD */}

                                            <div className="form-field">

                                                <label>

                                                    Unidad de medida

                                                    <span className="required">
                                                        {' '}*
                                                    </span>

                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        📏
                                                    </span>


                                                    <select
                                                        name="unidad_medida_id"
                                                        value={
                                                            producto.unidad_medida_id
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                    >

                                                        <option value="">
                                                            Selecciona una unidad
                                                        </option>


                                                        {
                                                            unidades.map(
                                                                unidad => (

                                                                    <option
                                                                        key={
                                                                            unidad.id
                                                                        }
                                                                        value={
                                                                            unidad.id
                                                                        }
                                                                    >

                                                                        {
                                                                            unidad.nombre
                                                                        }

                                                                    </option>

                                                                )
                                                            )
                                                        }

                                                    </select>

                                                </div>

                                            </div>


                                            {/* ESTADO */}

                                            <div className="form-field">

                                                <label>

                                                    Estado

                                                    <span className="required">
                                                        {' '}*
                                                    </span>

                                                </label>


                                                <div className="estado-field">

                                                    <button
                                                        type="button"
                                                        className={
                                                            producto.estado === 'ACTIVO'
                                                                ?
                                                                'switch activo'
                                                                :
                                                                'switch'
                                                        }
                                                        onClick={
                                                            cambiarEstado
                                                        }
                                                        aria-label="Cambiar estado"
                                                    >
                                                    </button>


                                                    <div className="estado-label">

                                                        {
                                                            producto.estado === 'ACTIVO'
                                                                ?
                                                                'Activo'
                                                                :
                                                                'Inactivo'
                                                        }


                                                        <span className="estado-helper">

                                                            Indica si el producto
                                                            estará disponible.

                                                        </span>

                                                    </div>

                                                </div>

                                            </div>


                                            {/* DESCRIPCIÓN */}

                                            <div className="form-field full">

                                                <label>
                                                    Descripción
                                                </label>


                                                <div className="textarea-box">

                                                    <span className="field-icon">
                                                        ▤
                                                    </span>


                                                    <div className="textarea-wrapper">

                                                        <textarea
                                                            name="descripcion"
                                                            value={
                                                                producto.descripcion
                                                            }
                                                            onChange={
                                                                manejarCambio
                                                            }
                                                            placeholder="Describe el producto, usos, presentaciones, etc."
                                                            maxLength={500}
                                                        >
                                                        </textarea>


                                                        <span className="textarea-count">

                                                            {
                                                                producto.descripcion.length
                                                            }

                                                            /500

                                                        </span>

                                                    </div>

                                                </div>

                                            </div>


                                        </div>

                                    </div>

                                </section>



                                {/* =============================================
                                    CARACTERÍSTICAS
                                ============================================== */}

                                <section className="producto-card">


                                    <div className="producto-card-header">

                                        <div className="producto-card-icon">
                                            ↪
                                        </div>


                                        <div>

                                            <h2>
                                                Características del Producto
                                            </h2>

                                            <p>
                                                Especificaciones y detalles técnicos.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="producto-card-body">


                                        <div className="grid-characteristics-top">


                                            <div className="form-field">

                                                <label>
                                                    Material
                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        ▰
                                                    </span>


                                                    <select
                                                        name="material"
                                                        value={
                                                            producto.material
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                    >

                                                        <option value="">
                                                            Selecciona un material
                                                        </option>

                                                        <option value="Polipropileno">
                                                            Polipropileno
                                                        </option>

                                                        <option value="Poliestireno">
                                                            Poliestireno
                                                        </option>

                                                        <option value="PET">
                                                            PET
                                                        </option>

                                                        <option value="HDPE">
                                                            HDPE
                                                        </option>

                                                        <option value="LDPE">
                                                            LDPE
                                                        </option>

                                                        <option value="Cartón">
                                                            Cartón
                                                        </option>

                                                        <option value="Otro">
                                                            Otro
                                                        </option>

                                                    </select>

                                                </div>

                                            </div>


                                            <div className="form-field">

                                                <label>
                                                    Color
                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        ●
                                                    </span>


                                                    <select
                                                        name="color"
                                                        value={
                                                            producto.color
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                    >

                                                        <option value="">
                                                            Selecciona un color
                                                        </option>

                                                        <option value="Transparente">
                                                            Transparente
                                                        </option>

                                                        <option value="Blanco">
                                                            Blanco
                                                        </option>

                                                        <option value="Negro">
                                                            Negro
                                                        </option>

                                                        <option value="Rojo">
                                                            Rojo
                                                        </option>

                                                        <option value="Azul">
                                                            Azul
                                                        </option>

                                                        <option value="Otro">
                                                            Otro
                                                        </option>

                                                    </select>

                                                </div>

                                            </div>


                                            <div className="form-field">

                                                <label>
                                                    Forma
                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        ○
                                                    </span>


                                                    <select
                                                        name="forma"
                                                        value={
                                                            producto.forma
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                    >

                                                        <option value="">
                                                            Selecciona una forma
                                                        </option>

                                                        <option value="Redondo">
                                                            Redondo
                                                        </option>

                                                        <option value="Cuadrado">
                                                            Cuadrado
                                                        </option>

                                                        <option value="Rectangular">
                                                            Rectangular
                                                        </option>

                                                        <option value="Ovalado">
                                                            Ovalado
                                                        </option>

                                                        <option value="Otro">
                                                            Otro
                                                        </option>

                                                    </select>

                                                </div>

                                            </div>


                                            <div className="form-field">

                                                <label>
                                                    Número / Talla
                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        #
                                                    </span>


                                                    <input
                                                        name="numero_talla"
                                                        value={
                                                            producto.numero_talla
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                        placeholder="Ej. 12, M, G"
                                                        maxLength={20}
                                                    />

                                                </div>

                                            </div>


                                        </div>


                                        <div className="grid-characteristics-bottom">


                                            <div className="form-field">

                                                <label>
                                                    Volumen (onz)
                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        💧
                                                    </span>


                                                    <input
                                                        name="volumen_oz"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            producto.volumen_oz
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                        placeholder="12"
                                                    />

                                                </div>

                                            </div>


                                            <div className="form-field">

                                                <label>
                                                    Ancho (pulgadas)
                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        ↗
                                                    </span>


                                                    <input
                                                        name="ancho_pulgadas"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            producto.ancho_pulgadas
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                        placeholder="3.5"
                                                    />

                                                </div>

                                            </div>


                                            <div className="form-field">

                                                <label>
                                                    Largo (pulgadas)
                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        ↔
                                                    </span>


                                                    <input
                                                        name="largo_pulgadas"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            producto.largo_pulgadas
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                        placeholder="4.5"
                                                    />

                                                </div>

                                            </div>


                                            <div className="form-field">

                                                <label>
                                                    Calibre
                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        ≡
                                                    </span>


                                                    <input
                                                        name="calibre_milipulgadas"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            producto.calibre_milipulgadas
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                        placeholder="12"
                                                    />

                                                </div>

                                            </div>


                                            <div className="form-field">

                                                <label>
                                                    Divisiones
                                                </label>


                                                <div className="input-box">

                                                    <span className="field-icon">
                                                        ▦
                                                    </span>


                                                    <input
                                                        name="divisiones"
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={
                                                            producto.divisiones
                                                        }
                                                        onChange={
                                                            manejarCambio
                                                        }
                                                        placeholder="1"
                                                    />

                                                </div>

                                            </div>


                                        </div>

                                    </div>

                                </section>



                                {/* =============================================
                                    INVENTARIO + IMAGEN
                                ============================================== */}

                                <div className="bottom-grid">


                                    {/* INVENTARIO */}

                                    <section className="producto-card">

                                        <div className="producto-card-header">

                                            <div className="producto-card-icon">
                                                ◉
                                            </div>


                                            <div>

                                                <h2>
                                                    Inventario y Costos
                                                </h2>

                                                <p>
                                                    Define los costos y niveles de inventario.
                                                </p>

                                            </div>

                                        </div>


                                        <div className="producto-card-body">


                                            <div className="inventory-fields">


                                                <div className="form-field">

                                                    <label>

                                                        Precio de venta

                                                        <span className="required">
                                                            {' '}*
                                                        </span>

                                                    </label>


                                                    <div className="input-box">

                                                        <span className="field-icon">
                                                            Q
                                                        </span>


                                                        <input
                                                            name="precio_costo"
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                producto.precio_costo
                                                            }
                                                            onChange={
                                                                manejarCambio
                                                            }
                                                            placeholder="0.00"
                                                        />

                                                    </div>

                                                </div>
                                                <div className="form-field">
                                                    <label>Precio por mayor</label>
                                                    <div className="input-box">
                                                        <span className="field-icon">Q</span>
                                                        <input
                                                            name="precio_mayorista"
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={producto.precio_mayorista}
                                                            onChange={manejarCambio}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>


                                                <div className="form-field">
                                                    <label>
                                                        Stock disponible inicial

                                                        <span className="required">
                                                            {' '}*
                                                        </span>
                                                    </label>

                                                    <div className="input-box">

                                                        <span className="field-icon">
                                                            ◇
                                                        </span>

                                                        <input
                                                            name="stock_actual"
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={producto.stock_actual}
                                                            onChange={manejarCambio}
                                                            placeholder="0"
                                                        />

                                                    </div>

                                                </div>


                                                <div className="form-field">

                                                    <label>

                                                        Stock mínimo

                                                        <span className="required">
                                                            {' '}*
                                                        </span>

                                                    </label>


                                                    <div className="input-box">

                                                        <span className="field-icon">
                                                            ◇
                                                        </span>


                                                        <input
                                                            name="stock_minimo"
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={
                                                                producto.stock_minimo
                                                            }
                                                            onChange={
                                                                manejarCambio
                                                            }
                                                            placeholder="0"
                                                        />

                                                    </div>

                                                </div>


                                                <div className="form-field">

                                                    <label>

                                                        Stock máximo

                                                        <span className="required">
                                                            {' '}*
                                                        </span>

                                                    </label>


                                                    <div className="input-box">

                                                        <span className="field-icon">
                                                            ◇
                                                        </span>


                                                        <input
                                                            name="stock_maximo"
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={
                                                                producto.stock_maximo
                                                            }
                                                            onChange={
                                                                manejarCambio
                                                            }
                                                            placeholder="0"
                                                        />

                                                    </div>

                                                </div>


                                                <div className="form-field">

                                                    <label>
                                                        Ubicación del inventario

                                                        <span className="required">
                                                            {' '}*
                                                        </span>
                                                    </label>

                                                    <div className="input-box">

                                                        <span className="field-icon">
                                                            ◎
                                                        </span>

                                                        <select
                                                            name="ubicacion"
                                                            value={producto.ubicacion}
                                                            onChange={manejarCambio}
                                                        >
                                                            <option value="BODEGA">
                                                                Bodega
                                                            </option>

                                                            <option value="TIENDA">
                                                                Tienda
                                                            </option>
                                                        </select>

                                                    </div>

                                                </div>


                                            </div>

                                        </div>

                                    </section>



                                    {/* IMAGEN */}

                                    <section className="producto-card">

                                        <div className="producto-card-header">

                                            <div className="producto-card-icon">
                                                ▧
                                            </div>


                                            <div>

                                                <h2>
                                                    Imagen del Producto
                                                </h2>

                                                <p>
                                                    Sube una imagen representativa.
                                                </p>

                                            </div>

                                        </div>


                                        <div className="producto-card-body">

                                            <label className="image-upload">

                                                <input
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                                    onChange={
                                                        seleccionarImagen
                                                    }
                                                />


                                                <div>

                                                    <div className="upload-icon">
                                                        ☁
                                                    </div>

                                                    <strong>
                                                        Haz clic para subir una imagen
                                                    </strong>

                                                    <small>

                                                        o arrastra un archivo aquí

                                                        <br />

                                                        JPG, PNG o WEBP
                                                        (máx. 2 MB)

                                                    </small>

                                                </div>

                                            </label>

                                        </div>

                                    </section>


                                </div>


                            </div>



                            {/* =================================================
                                VISTA PREVIA
                            ================================================== */}

                            <aside className="preview-card">


                                <div className="preview-header">

                                    <span>
                                        ◉
                                    </span>


                                    <div>

                                        <h3>
                                            Vista previa del producto
                                        </h3>

                                        <p>
                                            Así se mostrará en el catálogo.
                                        </p>

                                    </div>

                                </div>


                                <div className="preview-image">


                                    {
                                        imagenPreview

                                            ?

                                            <img
                                                src={
                                                    imagenPreview
                                                }
                                                alt={
                                                    producto.nombre
                                                    ||
                                                    'Producto'
                                                }
                                            />

                                            :

                                            <div className="preview-empty">

                                                <span>
                                                    ▧
                                                </span>

                                                <strong>
                                                    Sin imagen
                                                </strong>

                                                <small>
                                                    Elige una imagen para previsualizar
                                                </small>

                                            </div>
                                    }


                                </div>


                                <div className="preview-data">


                                    <div className="preview-row">

                                        <span className="preview-row-icon">
                                            ◇
                                        </span>

                                        <strong>
                                            Nombre:
                                        </strong>

                                        <span>
                                            {
                                                producto.nombre
                                                || '-'
                                            }
                                        </span>

                                    </div>


                                    <div className="preview-row">

                                        <span className="preview-row-icon">
                                            ▰
                                        </span>

                                        <strong>
                                            Categoría:
                                        </strong>

                                        <span>
                                            {
                                                nombreCategoria
                                            }
                                        </span>

                                    </div>


                                    <div className="preview-row">

                                        <span className="preview-row-icon">
                                            📏
                                        </span>

                                        <strong>
                                            Unidad:
                                        </strong>

                                        <span>
                                            {
                                                nombreUnidad
                                            }
                                        </span>

                                    </div>


                                </div>


                                <div className="preview-separator">
                                </div>


                                <div className="preview-data">


                                    <div className="preview-row">

                                        <span className="preview-row-icon">
                                            Q
                                        </span>

                                        <strong>
                                            Precio de costo:
                                        </strong>

                                        <span>

                                            {
                                                producto.precio_costo
                                                    ?
                                                    `Q ${Number(
                                                        producto.precio_costo
                                                    ).toFixed(2)}`
                                                    :
                                                    '-'
                                            }

                                        </span>

                                    </div>

                                    <div className="preview-row">
                                        <span className="preview-row-icon">Q</span>
                                        <strong>Precio por mayor:</strong>
                                        <span>{`Q ${Number(producto.precio_mayorista || 0).toFixed(2)}`}</span>
                                    </div>




                                    <div className="preview-row">

                                        <span className="preview-row-icon">
                                            ◇
                                        </span>

                                        <strong>
                                            Stock mínimo:
                                        </strong>

                                        <span>
                                            {
                                                producto.stock_minimo
                                                || '-'
                                            }
                                        </span>

                                    </div>


                                    <div className="preview-row">

                                        <span className="preview-row-icon">
                                            ◇
                                        </span>

                                        <strong>
                                            Stock máximo:
                                        </strong>

                                        <span>
                                            {
                                                producto.stock_maximo
                                                || '-'
                                            }
                                        </span>

                                    </div>


                                </div>


                                <div className="preview-separator">
                                </div>


                                <div className="preview-status">

                                    <div className="preview-status-row">

                                        <span>
                                            Estado:
                                        </span>


                                        <span
                                            className={
                                                producto.estado === 'ACTIVO'
                                                    ?
                                                    'status-pill'
                                                    :
                                                    'status-pill inactivo'
                                            }
                                        >

                                            {
                                                producto.estado === 'ACTIVO'
                                                    ?
                                                    'Activo'
                                                    :
                                                    'Inactivo'
                                            }

                                        </span>

                                    </div>

                                </div>


                                <div className="preview-note">

                                    ℹ La vista previa se actualizará
                                    automáticamente conforme completes
                                    la información.

                                </div>


                            </aside>


                        </div>



                        {/* =================================================
                            BOTONES
                        ================================================== */}

                        <div className="producto-actions">


                            <button
                                type="button"
                                className="action-button button-cancel"
                                onClick={
                                    cancelar
                                }
                            >

                                ✕ Cancelar

                            </button>


                            <div className="producto-actions-right">


                                <button
                                    type="button"
                                    className="action-button button-save"
                                    disabled={
                                        guardando
                                    }
                                    onClick={
                                        () =>
                                            guardarProducto(
                                                false
                                            )
                                    }
                                >

                                    {
                                        guardando
                                            ?
                                            'Guardando...'
                                            :
                                            'Guardar Producto'
                                    }

                                </button>


                            </div>


                        </div>


                    </main>

                </section>


            </div>

        </>

    );

}


export default Productos;