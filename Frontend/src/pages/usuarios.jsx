import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';


function Usuarios() {

    const [usuarios, setUsuarios] = useState([]);

    const [cargando, setCargando] = useState(true);

    const [error, setError] = useState('');

    const [busqueda, setBusqueda] = useState('');

    const [rolFiltro, setRolFiltro] = useState('');

    const [estadoFiltro, setEstadoFiltro] = useState('');

    const [pagina, setPagina] = useState(1);

    const [mostrarModal, setMostrarModal] = useState(false);

    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

    const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

    const [eliminando, setEliminando] = useState(false);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const [modoFormulario, setModoFormulario] = useState('nuevo');

    const [guardando, setGuardando] = useState(false);

    const [mensajeFormulario, setMensajeFormulario] = useState('');

    const formularioInicial = {
        usuario: '',
        nombre: '',
        correo: '',
        password: '',
        rol: 'Administrador',
        estado: 'Activo'
    };

    const [formulario, setFormulario] = useState(formularioInicial);


    useEffect(() => {

        async function cargarUsuarios() {

            try {

                const respuesta = await fetch('/api/cliente/usuarios');

                if (!respuesta.ok) {
                    throw new Error(
                        'No fue posible cargar los usuarios.'
                    );
                }

                const datos = await respuesta.json();

                setUsuarios(Array.isArray(datos) ? datos : []);

            } catch (errorCarga) {

                setError(errorCarga.message);
                setUsuarios([]);

            } finally {

                setCargando(false);

            }

        }

        cargarUsuarios();

    }, []);


    // =====================================================
    // FILTRAR USUARIOS
    // =====================================================

    const usuariosFiltrados = useMemo(() => {

        return usuarios.filter(usuario => {

            const texto =
                busqueda.toLowerCase().trim();


            const coincideBusqueda =
                usuario.usuario.toLowerCase().includes(texto) ||
                usuario.nombre.toLowerCase().includes(texto) ||
                usuario.correo.toLowerCase().includes(texto);


            const coincideRol =
                !rolFiltro ||
                usuario.rol === rolFiltro;


            const coincideEstado =
                !estadoFiltro ||
                usuario.estado === estadoFiltro;


            return (
                coincideBusqueda &&
                coincideRol &&
                coincideEstado
            );

        });

    }, [
        usuarios,
        busqueda,
        rolFiltro,
        estadoFiltro
    ]);


    // =====================================================
    // ELIMINAR USUARIO
    // =====================================================

    function solicitarEliminarUsuario(usuario) {

        setUsuarioAEliminar(usuario);
    }


    async function eliminarUsuario() {

        if (!usuarioAEliminar) {
            return;
        }

        setEliminando(true);


        try {

            const respuesta = await fetch(
                `/api/cliente/usuarios/${usuarioAEliminar.id}`,
                { method: 'DELETE' }
            );

            if (!respuesta.ok) {
                const datos = await respuesta.json();
                throw new Error(datos.error || 'No fue posible eliminar el usuario.');
            }

            setUsuarios(usuariosActuales =>
                usuariosActuales.filter(
                    usuario => usuario.id !== usuarioAEliminar.id
                )
            );

            setUsuarioAEliminar(null);

        } catch (errorEliminacion) {
            window.alert(errorEliminacion.message);

        } finally {

            setEliminando(false);
        }
    }


    // =====================================================
    // VER USUARIO
    // =====================================================

    function verUsuario(usuario) {

        setUsuarioSeleccionado(usuario);

        setMostrarModal(true);
    }


    // =====================================================
    // EDITAR USUARIO
    // =====================================================

    function editarUsuario(usuario) {

        setUsuarioSeleccionado(usuario);
        setModoFormulario('editar');
        setFormulario({
            usuario: usuario.usuario,
            nombre: usuario.nombre,
            correo: usuario.correo,
            password: '',
            rol: usuario.rol,
            estado: usuario.estado
        });
        setMensajeFormulario('');
        setMostrarFormulario(true);
    }


    // =====================================================
    // NUEVO USUARIO
    // =====================================================

    function nuevoUsuario() {

        setModoFormulario('nuevo');
        setFormulario(formularioInicial);
        setMensajeFormulario('');
        setMostrarFormulario(true);
    }


    function manejarCambioFormulario(evento) {

        const { name, value } = evento.target;

        setFormulario(formularioActual => ({
            ...formularioActual,
            [name]: value
        }));
    }


    async function guardarUsuario(evento) {

        evento.preventDefault();
        setMensajeFormulario('');
        setGuardando(true);

        try {

            const esEdicion = modoFormulario === 'editar';
            const usuarioId = usuarioSeleccionado?.id;
            const respuesta = await fetch(
                esEdicion
                    ? `/api/cliente/usuarios/${usuarioId}`
                    : '/api/cliente/usuarios',
                {
                    method: esEdicion ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formulario)
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.error || 'No fue posible guardar el usuario.'
                );
            }

            if (esEdicion) {
                setUsuarios(usuariosActuales =>
                    usuariosActuales.map(usuario =>
                        usuario.id === datos.id ? datos : usuario
                    )
                );
            } else {
                setUsuarios(usuariosActuales => [
                    ...usuariosActuales,
                    datos
                ]);
            }

            setMostrarFormulario(false);
            setUsuarioSeleccionado(null);

        } catch (errorGuardado) {

            setMensajeFormulario(errorGuardado.message);

        } finally {

            setGuardando(false);

        }
    }


    // =====================================================
    // CONTADORES
    // =====================================================

    const totalUsuarios =
        usuarios.length;


    const totalAdministradores =
        usuarios.filter(
            usuario =>
                usuario.rol === 'Administrador'
        ).length;


    const totalBodegueros =
        usuarios.filter(
            usuario =>
                usuario.rol === 'Bodeguero'
        ).length;


    const totalVendedores =
        usuarios.filter(
            usuario =>
                usuario.rol === 'Vendedor'
        ).length;


    // =====================================================
    // CSS COMPLETO
    // =====================================================

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

            background:
                #f4f8fd;

            color:
                #13264b;
        }


        button,
        input,
        select {
            font: inherit;
        }


        .usuarios-page {
            min-height: 100vh;

            display: flex;

            background:
                linear-gradient(
                    135deg,
                    #f8fbff,
                    #edf5fd
                );
        }


        /* =================================================
           SIDEBAR
        ================================================= */

        .usuarios-sidebar {
            width: 252px;

            min-height: 100vh;

            position: fixed;

            left: 0;

            top: 0;

            bottom: 0;

            display: flex;

            flex-direction: column;

            color:
                white;

            background:
                linear-gradient(
                    180deg,
                    #172e4e 0%,
                    #183452 48%,
                    #17314f 100%
                );

            z-index: 100;
        }


        .usuarios-logo {
            display: flex;

            align-items: center;

            gap: 12px;

            padding:
                30px 27px 25px;

            color:
                white;

            text-decoration: none;
        }


        .usuarios-logo-icon {
            width: 45px;

            height: 45px;

            display: grid;

            place-items: center;

            border-radius: 10px;

            color:
                white;

            background:
                linear-gradient(
                    145deg,
                    #17c6f6,
                    #116cd7
                );

            font-size: 26px;
        }


        .usuarios-logo-text {
            display: flex;

            flex-direction: column;

            line-height: 1.04;
        }


        .usuarios-logo-text strong {
            font-size: 18px;

            font-weight: 900;
        }


        .usuarios-logo-text small {
            margin-top: 7px;

            color:
                #d9e5f4;

            font-size: 11px;
        }


        /* MENU */

        .usuarios-menu {
            display: grid;

            gap: 7px;

            padding:
                10px 12px;
        }


        .usuarios-menu a {
            min-height: 52px;

            display: flex;

            align-items: center;

            gap: 16px;

            padding:
                0 20px;

            border-radius: 9px;

            color:
                #d5e0ec;

            text-decoration: none;

            font-size: 14px;

            transition:
                .2s;
        }


        .usuarios-menu a:hover {
            color:
                white;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .08
                );
        }


        .usuarios-menu a.activo {
            position: relative;

            color:
                white;

            background:
                linear-gradient(
                    90deg,
                    #23496f,
                    #294e75
                );

            font-weight:
                700;
        }


        .usuarios-menu a.activo::before {
            content: '';

            width: 5px;

            position: absolute;

            left: 0;

            top: 0;

            bottom: 0;

            border-radius:
                5px 0 0 5px;

            background:
                #11c3f1;
        }


        .usuarios-menu-icon {
            width: 26px;

            text-align: center;

            font-size: 22px;
        }


        /* SIDEBAR FOOTER */

        .sidebar-bottom {
            margin-top:
                auto;

            padding:
                30px;
        }


        .sidebar-divider {
            height: 1px;

            margin-bottom:
                28px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .13
                );
        }


        .grow-box {
            display: flex;

            align-items: center;

            gap: 13px;

            margin-bottom:
                55px;

            color:
                #d4e1ed;

            font-size: 13px;

            line-height: 1.45;
        }


        .grow-icon {
            font-size: 25px;
        }


        .sidebar-copyright {
            color:
                #d2dfec;

            font-size: 10px;

            line-height: 1.8;
        }


        /* =================================================
           CONTENIDO PRINCIPAL
        ================================================= */

        .usuarios-content {
            width:
                calc(
                    100% - 252px
                );

            margin-left:
                252px;
        }


        /* =================================================
           TOPBAR
        ================================================= */

        .usuarios-topbar {
            min-height: 73px;

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 30px;

            padding:
                0 32px;

            border-bottom:
                1px solid
                #dce4ed;

            background:
                rgba(
                    255,
                    255,
                    255,
                    .97
                );
        }


        .top-search {
            width: 435px;

            height: 43px;

            display: flex;

            align-items: center;

            gap: 12px;

            padding:
                0 16px;

            border:
                1px solid
                #dae4ef;

            border-radius: 8px;

            background:
                #f6f9fd;
        }


        .top-search span {
            color:
                #375c87;

            font-size: 20px;
        }


        .top-search input {
            flex: 1;

            min-width: 0;

            border: 0;

            outline: 0;

            color:
                #536b8e;

            background:
                transparent;
        }


        .search-shortcut {
            color:
                #778ca9;

            font-size: 11px;
        }


        .usuarios-top-actions {
            display: flex;

            align-items: center;

            gap: 25px;
        }


        .fecha-admin {
            display: flex;

            align-items: center;

            gap: 12px;

            color:
                #19335b;

            font-size: 13px;

            font-weight: 700;
        }


        .fecha-admin span:first-child {
            font-size: 22px;
        }


        .fecha-admin small {
            display: block;

            color:
                #7d8aa0;

            font-weight: normal;
        }


        .notificaciones {
            position: relative;

            font-size: 22px;
        }


        .badge-notificacion {
            width: 17px;

            height: 17px;

            position: absolute;

            top: -7px;

            right: -9px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color: white;

            background:
                #f23c4a;

            font-size: 9px;

            font-weight: 800;
        }


        .usuario-superior {
            display: flex;

            align-items: center;

            gap: 11px;

            color:
                #152c52;

            font-size: 13px;

            font-weight: 700;
        }


        .usuario-superior-avatar {
            width: 37px;

            height: 37px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color: white;

            background:
                #0868dc;

            font-weight: 800;
        }


        /* =================================================
           MAIN
        ================================================= */

        .usuarios-main {
            padding:
                26px 28px 35px;
        }


        /* CABECERA */

        .usuarios-heading {
            display: flex;

            justify-content: space-between;

            align-items: flex-start;

            gap: 30px;

            margin-bottom: 22px;
        }


        .usuarios-heading h1 {
            margin: 0;

            color:
                #101d47;

            font-size: 36px;

            letter-spacing:
                -1px;
        }


        .usuarios-heading p {
            margin:
                7px 0 0;

            color:
                #687a98;

            font-size: 16px;
        }


        .nuevo-usuario {
            min-width: 205px;

            min-height: 54px;

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 13px;

            border: 0;

            border-radius: 8px;

            color: white;

            background:
                linear-gradient(
                    90deg,
                    #0871ed,
                    #0666e2
                );

            font-weight: 700;

            cursor: pointer;

            box-shadow:
                0 8px 20px
                rgba(
                    5,
                    102,
                    226,
                    .15
                );
        }


        .nuevo-usuario span {
            font-size: 25px;

            font-weight: 300;
        }


        /* =================================================
           RESUMEN
        ================================================= */

        .usuarios-resumen {
            display: grid;

            grid-template-columns:
                repeat(
                    4,
                    1fr
                );

            gap: 13px;

            margin-bottom: 20px;
        }


        .resumen-card {
            min-height: 125px;

            display: flex;

            align-items: center;

            gap: 20px;

            padding:
                20px;

            border:
                1px solid
                #dce5ef;

            border-radius: 10px;

            background:
                white;

            box-shadow:
                0 4px 12px
                rgba(
                    25,
                    66,
                    105,
                    .03
                );
        }


        .resumen-icon {
            width: 73px;

            height: 73px;

            flex: 0 0 73px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            font-size: 35px;
        }


        .resumen-blue {
            color:
                #0969df;

            background:
                #dcecff;
        }


        .resumen-green {
            color:
                #0aa275;

            background:
                #daf5ea;
        }


        .resumen-purple {
            color:
                #7041e9;

            background:
                #ece6ff;
        }


        .resumen-orange {
            color:
                #f18a00;

            background:
                #fff0dc;
        }


        .resumen-data small {
            color:
                #1a3a65;

            font-size: 12px;

            font-weight: 700;
        }


        .resumen-data h2 {
            margin:
                7px 0 5px;

            color:
                #0d2048;

            font-size: 27px;
        }


        .resumen-growth {
            color:
                #078d63;

            font-size: 11px;

            font-weight: 700;
        }


        .resumen-growth span {
            margin-left: 8px;

            color:
                #7a8ba7;

            font-weight: normal;
        }


        .growth-neutral {
            color:
                #587097;
        }


        /* =================================================
           PANEL USUARIOS
        ================================================= */

        .usuarios-panel {
            overflow: hidden;

            border:
                1px solid
                #dbe4ee;

            border-radius: 10px;

            background:
                white;

            box-shadow:
                0 4px 15px
                rgba(
                    20,
                    58,
                    98,
                    .035
                );
        }


        /* FILTROS */

        .usuarios-filtros {
            display: grid;

            grid-template-columns:
                minmax(
                    300px,
                    1fr
                )
                210px
                210px
                140px;

            gap: 12px;

            padding:
                15px;

            border-bottom:
                1px solid
                #e4eaf1;
        }


        .usuarios-buscador {
            min-height: 47px;

            display: flex;

            align-items: center;

            gap: 13px;

            padding:
                0 17px;

            border:
                1px solid
                #d2dfed;

            border-radius: 7px;
        }


        .usuarios-buscador span {
            color:
                #375f8c;

            font-size: 20px;
        }


        .usuarios-buscador input {
            width: 100%;

            border: 0;

            outline: 0;

            color:
                #456285;
        }


        .usuarios-filtros select {
            padding:
                0 15px;

            border:
                1px solid
                #d2dfed;

            border-radius: 7px;

            color:
                #294a76;

            background:
                white;

            outline: 0;
        }


        .boton-buscar {
            border: 0;

            border-radius: 7px;

            color: white;

            background:
                #0869e4;

            font-weight: 700;

            cursor: pointer;
        }


        /* =================================================
           TABLA
        ================================================= */

        .tabla-scroll {
            width: 100%;

            overflow-x: auto;
        }


        .usuarios-tabla {
            width: 100%;

            border-collapse: collapse;

            min-width: 1050px;
        }


        .usuarios-tabla thead {
            background:
                linear-gradient(
                    #edf4fa,
                    #e9f1f9
                );
        }


        .usuarios-tabla th {
            padding:
                14px 12px;

            color:
                #2f4f7a;

            font-size: 11px;

            text-align: left;

            font-weight: 700;
        }


        .usuarios-tabla td {
            padding:
                8px 12px;

            border-bottom:
                1px solid
                #e5ebf2;

            color:
                #466389;

            font-size: 11px;
        }


        .usuarios-tabla tbody tr:hover {
            background:
                #f9fbfe;
        }


        .usuario-celda {
            display: flex;

            align-items: center;

            gap: 12px;

            color:
                #173b6f;

            font-weight: 700;
        }


        .tabla-avatar {
            width: 39px;

            height: 39px;

            flex: 0 0 39px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            font-size: 15px;

            font-weight: 800;
        }


        .avatar-azul {
            color:
                #0866d9;

            background:
                #dcecff;
        }


        .avatar-azul-claro {
            color:
                #2144d2;

            background:
                #e3e9ff;
        }


        .avatar-morado {
            color:
                #542fc9;

            background:
                #e9e0ff;
        }


        .avatar-morado-claro {
            color:
                #6436d5;

            background:
                #eadfff;
        }


        .avatar-rosa {
            color:
                #a53869;

            background:
                #ffe3ed;
        }


        .avatar-naranja {
            color:
                #9b4b13;

            background:
                #ffe7d8;
        }


        .avatar-amarillo {
            color:
                #d57200;

            background:
                #fff0d7;
        }


        .avatar-verde {
            color:
                #067f69;

            background:
                #dbf4ec;
        }


        /* ROLES */

        .rol {
            display: inline-block;

            padding:
                6px 10px;

            border-radius: 6px;

            font-size: 10px;

            font-weight: 700;
        }


        .rol-admin {
            color:
                #0066df;

            background:
                #dcecff;
        }


        .rol-bodeguero {
            color:
                #6531dc;

            background:
                #eee6ff;
        }

        .rol-vendedor {
            color:
                #16803c;

            background:
                #e1f6e8;
        }


        .rol-cliente {
            color:
                #e36b00;

            background:
                #fff0dc;
        }


        /* ESTADO */

        .estado-usuario {
            display: inline-flex;

            align-items: center;

            gap: 8px;
        }


        .estado-punto {
            width: 11px;

            height: 11px;

            border-radius: 50%;
        }


        .punto-activo {
            background:
                #1aac7c;
        }


        .punto-inactivo {
            background:
                #fb354a;
        }


        /* ACCIONES */

        .acciones {
            display: flex;

            align-items: center;

            gap: 10px;
        }


        .accion {
            width: 42px;

            height: 38px;

            display: grid;

            place-items: center;

            border: 0;

            border-radius: 6px;

            cursor: pointer;

            transition:
                .2s;

            font-size: 16px;
        }


        .accion:hover {
            transform:
                translateY(-1px);
        }


        .accion-ver {
            color:
                #1d558d;

            border:
                1px solid
                #d5e1ec;

            background:
                #f5f9fd;
        }


        .accion-editar {
            color:
                white;

            background:
                #086be9;
        }


        .accion-eliminar {
            color:
                white;

            background:
                #fb3248;
        }


        /* =================================================
           PAGINACIÓN
        ================================================= */

        .usuarios-paginacion {
            min-height: 85px;

            display: flex;

            align-items: center;

            justify-content: space-between;

            padding:
                15px 17px;

            color:
                #4d6b92;

            font-size: 11px;
        }


        .paginas {
            display: flex;

            align-items: center;

            gap: 5px;
        }


        .paginas button {
            width: 42px;

            height: 42px;

            border:
                1px solid
                #d6e2ed;

            border-radius: 6px;

            color:
                #284b75;

            background:
                white;

            cursor: pointer;
        }


        .paginas button.pagina-activa {
            color:
                white;

            border-color:
                #0769e5;

            background:
                #0769e5;
        }


        /* =================================================
           MODAL
        ================================================= */

        .modal-overlay {
            position: fixed;

            inset: 0;

            z-index: 500;

            display: grid;

            place-items: center;

            padding: 20px;

            background:
                rgba(
                    10,
                    27,
                    51,
                    .55
                );

            backdrop-filter:
                blur(3px);
        }


        .modal-card {
            width:
                min(
                    470px,
                    100%
                );

            padding:
                27px;

            border-radius: 13px;

            background:
                white;

            box-shadow:
                0 20px 50px
                rgba(
                    0,
                    0,
                    0,
                    .18
                );
        }


        .confirmacion-card {
            width:
                min(
                    430px,
                    100%
                );

            padding: 30px;

            border-radius: 13px;

            text-align: center;

            background: white;

            box-shadow:
                0 20px 50px
                rgba(
                    0,
                    0,
                    0,
                    .2
                );
        }


        .confirmacion-icono {
            width: 58px;

            height: 58px;

            display: grid;

            place-items: center;

            margin: 0 auto 17px;

            border-radius: 50%;

            color: #c52b3b;

            background: #fff0f1;

            font-size: 25px;
        }


        .confirmacion-card h2 {
            margin: 0 0 10px;

            color: #14315b;

            font-size: 21px;
        }


        .confirmacion-card p {
            margin: 0;

            color: #617895;

            font-size: 14px;

            line-height: 1.55;
        }


        .confirmacion-usuario {
            margin-top: 7px !important;

            color: #243f62 !important;

            font-weight: 700;
        }


        .confirmacion-acciones {
            display: flex;

            justify-content: center;

            gap: 10px;

            margin-top: 26px;
        }


        .confirmacion-acciones button {
            min-height: 42px;

            padding: 0 18px;

            border: 0;

            border-radius: 6px;

            cursor: pointer;

            font-weight: 700;
        }


        .confirmacion-cancelar {
            color: #315078;

            background: #eef3f8;
        }


        .confirmacion-eliminar {
            color: white;

            background: #d93649;
        }


        .confirmacion-eliminar:disabled {
            cursor: wait;

            opacity: .65;
        }


        .modal-header {
            display: flex;

            justify-content: space-between;

            align-items: center;

            margin-bottom: 25px;
        }


        .modal-header h2 {
            margin: 0;

            color:
                #14315b;
        }


        .modal-close {
            width: 35px;

            height: 35px;

            border: 0;

            border-radius: 50%;

            color:
                #536981;

            background:
                #eef3f8;

            cursor: pointer;
        }


        .detalle-usuario {
            display: grid;

            gap: 15px;
        }


        .detalle-fila {
            display: grid;

            grid-template-columns:
                140px 1fr;

            gap: 15px;

            padding-bottom: 11px;

            border-bottom:
                1px solid
                #edf1f5;

            font-size: 13px;
        }


        .detalle-fila strong {
            color:
                #315078;
        }


        .formulario-usuario {
            display: grid;

            gap: 15px;
        }


        .campo-usuario {
            display: grid;

            gap: 6px;
        }


        .campo-usuario label {
            color:
                #315078;

            font-size: 13px;

            font-weight: 700;
        }


        .campo-usuario input,
        .campo-usuario select {
            width: 100%;

            min-height: 40px;

            padding: 0 11px;

            border: 1px solid #d5e0eb;

            border-radius: 6px;

            outline: 0;
        }


        .campo-usuario input:focus,
        .campo-usuario select:focus {
            border-color: #0769e5;
        }


        .mensaje-formulario {
            margin: 0;

            color: #c52b3b;

            font-size: 13px;
        }


        .acciones-formulario {
            display: flex;

            justify-content: flex-end;

            gap: 10px;

            margin-top: 5px;
        }


        .acciones-formulario button {
            min-height: 40px;

            padding: 0 16px;

            border: 0;

            border-radius: 6px;

            cursor: pointer;
        }


        .boton-cancelar {
            color: #315078;

            background: #eef3f8;
        }


        .boton-guardar {
            color: white;

            background: #0769e5;
        }


        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (
            max-width: 1150px
        ) {

            .usuarios-resumen {
                grid-template-columns:
                    repeat(
                        2,
                        1fr
                    );
            }


            .usuarios-filtros {
                grid-template-columns:
                    1fr 1fr;
            }


            .boton-buscar {
                min-height: 46px;
            }

        }


        @media (
            max-width: 850px
        ) {

            .usuarios-sidebar {
                width: 82px;
            }


            .usuarios-logo-text,
            .usuarios-menu a span:last-child,
            .sidebar-bottom {
                display: none;
            }


            .usuarios-logo {
                justify-content: center;

                padding-left: 0;

                padding-right: 0;
            }


            .usuarios-menu a {
                justify-content: center;

                padding: 0;
            }


            .usuarios-content {
                width:
                    calc(
                        100% - 82px
                    );

                margin-left:
                    82px;
            }


            .top-search {
                width: 280px;
            }


            .fecha-admin {
                display: none;
            }


            .usuarios-heading h1 {
                font-size: 29px;
            }

        }


        @media (
            max-width: 620px
        ) {

            .usuarios-topbar {
                padding:
                    0 15px;
            }


            .top-search {
                width: 180px;
            }


            .search-shortcut {
                display: none;
            }


            .usuario-superior span {
                display: none;
            }


            .usuarios-main {
                padding:
                    20px 14px;
            }


            .usuarios-heading {
                flex-direction: column;
            }


            .nuevo-usuario {
                width: 100%;
            }


            .usuarios-resumen {
                grid-template-columns:
                    1fr;
            }


            .usuarios-filtros {
                grid-template-columns:
                    1fr;
            }


            .usuarios-filtros select {
                min-height: 46px;
            }


            .usuarios-paginacion {
                align-items: flex-start;

                flex-direction: column;

                gap: 15px;
            }

        }

        /* Usuarios se muestra dentro de PublicLayout. */
        .usuarios-page {
            min-height: auto;
            display: block;
        }

        .usuarios-sidebar,
        .usuarios-topbar {
            display: none !important;
        }

        .usuarios-content {
            width: 100%;
            margin-left: 0;
        }

    `;


    // =====================================================
    // INTERFAZ
    // =====================================================

    return (

        <>

            <style>
                {estilos}
            </style>


            <div className="usuarios-page">


                {/* =================================================
                    SIDEBAR
                ================================================== */}

                <aside className="usuarios-sidebar">


                    <Link
                        to="/"
                        className="usuarios-logo"
                    >
<img
                    src="/logo-comercial-san-cristobal.png"
                    alt="Logotipo Comercial San Cristóbal"
                    style={{ width: '220px', maxWidth: '100%', height: '84px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '8px', padding: '3px' }}
                />
</Link>


                    <nav className="usuarios-menu">


                        <Link to="/admin">

                            <span className="usuarios-menu-icon">
                                ⌂
                            </span>

                            <span>
                                Dashboard
                            </span>

                        </Link>


                        <Link to="/clientes">

                            <span className="usuarios-menu-icon">
                                ♙
                            </span>

                            <span>
                                Clientes
                            </span>

                        </Link>


                        <Link to="/productos">

                            <span className="usuarios-menu-icon">
                                ◇
                            </span>

                            <span>
                                Productos
                            </span>

                        </Link>


                        <Link to="/inventario">

                            <span className="usuarios-menu-icon">
                                ▣
                            </span>

                            <span>
                                Inventario
                            </span>

                        </Link>


                        <Link to="/ventas">

                            <span className="usuarios-menu-icon">
                                🛒
                            </span>

                            <span>
                                Ventas
                            </span>

                        </Link>


                        <Link to="/compras">

                            <span className="usuarios-menu-icon">
                                ▤
                            </span>

                            <span>
                                Compras
                            </span>

                        </Link>


                        <Link to="/reportes">

                            <span className="usuarios-menu-icon">
                                ▥
                            </span>

                            <span>
                                Informes y Reportes
                            </span>

                        </Link>


                        <Link
                            to="/usuarios"
                            className="activo"
                        >

                            <span className="usuarios-menu-icon">
                                ♙
                            </span>

                            <span>
                                Usuarios
                            </span>

                        </Link>


                        <Link to="/cerrar-sesion">

                            <span className="usuarios-menu-icon">
                                ↪
                            </span>

                            <span>
                                Cerrar sesión
                            </span>

                        </Link>


                    </nav>


                    <div className="sidebar-bottom">

                        <div className="sidebar-divider">
                        </div>


                        <div className="grow-box">

                            <span className="grow-icon">
                                ◒
                            </span>

                            <span>

                                Creciendo juntos

                                <br />

                                cada día

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

                <section className="usuarios-content">


                    {/* =============================================
                        TOPBAR
                    ============================================== */}

                    <header className="usuarios-topbar">


                        <div className="top-search">

                            <span>
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder="Buscar en el sistema..."
                            />

                            <small className="search-shortcut">
                                Ctrl + K
                            </small>

                        </div>


                        <div className="usuarios-top-actions">


                            <div className="fecha-admin">

                                <span>
                                    ▣
                                </span>

                                <div>

                                    24 de mayo, 2026

                                    <small>
                                        Sábado
                                    </small>

                                </div>

                            </div>


                            <div className="notificaciones">

                                ♧

                                <span className="badge-notificacion">
                                    3
                                </span>

                            </div>


                            <div className="usuario-superior">

                                <div className="usuario-superior-avatar">
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



                    {/* =============================================
                        MAIN
                    ============================================== */}

                    <main className="usuarios-main">


                        {/* CABECERA */}

                        <section className="usuarios-heading">


                            <div>

                                <h1>
                                    Gestión de Usuarios
                                </h1>

                                <p>

                                    Administra los usuarios
                                    del sistema, sus roles
                                    y permisos.

                                </p>

                            </div>


                            <button
                                type="button"
                                className="nuevo-usuario"
                                onClick={nuevoUsuario}
                            >

                                <span>
                                    +
                                </span>

                                Nuevo Usuario

                            </button>


                        </section>



                        {/* =========================================
                            RESUMEN
                        ========================================== */}

                        <section className="usuarios-resumen">


                            <article className="resumen-card">

                                <div className="resumen-icon resumen-blue">
                                    ♙
                                </div>

                                <div className="resumen-data">

                                    <small>
                                        Total de Usuarios
                                    </small>

                                    <h2>
                                        {totalUsuarios}
                                    </h2>

                                    <div className="resumen-growth">

                                        ▲ 20%

                                        <span>
                                            vs. mes anterior
                                        </span>

                                    </div>

                                </div>

                            </article>


                            <article className="resumen-card">

                                <div className="resumen-icon resumen-green">
                                    ♢
                                </div>

                                <div className="resumen-data">

                                    <small>
                                        Administradores
                                    </small>

                                    <h2>
                                        {totalAdministradores}
                                    </h2>

                                    <div className="resumen-growth growth-neutral">

                                        — 0%

                                        <span>
                                            vs. mes anterior
                                        </span>

                                    </div>

                                </div>

                            </article>


                            <article className="resumen-card">

                                <div className="resumen-icon resumen-purple">
                                    ◇
                                </div>

                                <div className="resumen-data">

                                    <small>
                                        Bodegueros
                                    </small>

                                    <h2>
                                        {totalBodegueros}
                                    </h2>

                                    <div className="resumen-growth">

                                        ▲ 33%

                                        <span>
                                            vs. mes anterior
                                        </span>

                                    </div>

                                </div>

                            </article>


                            <article className="resumen-card">

                                <div className="resumen-icon resumen-orange">
                                    ♙
                                </div>

                                <div className="resumen-data">

                                    <small>
                                        Vendedores
                                    </small>

                                    <h2>
                                        {totalVendedores}
                                    </h2>

                                    <div className="resumen-growth">

                                        ▲ 25%

                                        <span>
                                            vs. mes anterior
                                        </span>

                                    </div>

                                </div>

                            </article>


                        </section>



                        {/* =========================================
                            PANEL TABLA
                        ========================================== */}

                        <section className="usuarios-panel">


                            {/* FILTROS */}

                            <div className="usuarios-filtros">


                                <div className="usuarios-buscador">

                                    <span>
                                        ⌕
                                    </span>

                                    <input
                                        type="search"
                                        placeholder="Buscar usuario, nombre o correo electrónico..."
                                        value={busqueda}
                                        onChange={
                                            evento =>
                                                setBusqueda(
                                                    evento.target.value
                                                )
                                        }
                                    />

                                </div>


                                <select
                                    value={rolFiltro}
                                    onChange={
                                        evento =>
                                            setRolFiltro(
                                                evento.target.value
                                            )
                                    }
                                >

                                    <option value="">
                                        Todos los roles
                                    </option>

                                    <option value="Administrador">
                                        Administrador
                                    </option>

                                    <option value="Bodeguero">
                                        Bodeguero
                                    </option>

                                    <option value="Vendedor">
                                        Vendedor
                                    </option>

                                </select>


                                <select
                                    value={estadoFiltro}
                                    onChange={
                                        evento =>
                                            setEstadoFiltro(
                                                evento.target.value
                                            )
                                    }
                                >

                                    <option value="">
                                        Todos los estados
                                    </option>

                                    <option value="Activo">
                                        Activo
                                    </option>

                                    <option value="Inactivo">
                                        Inactivo
                                    </option>

                                </select>


                                <button
                                    type="button"
                                    className="boton-buscar"
                                >

                                    ⌕ &nbsp; Buscar

                                </button>


                            </div>



                            {/* TABLA */}

                            <div className="tabla-scroll">

                                <table className="usuarios-tabla">


                                    <thead>

                                        <tr>

                                            <th>
                                                #
                                            </th>

                                            <th>
                                                Usuario
                                            </th>

                                            <th>
                                                Nombre Completo
                                            </th>

                                            <th>
                                                Correo Electrónico
                                            </th>

                                            <th>
                                                Rol
                                            </th>

                                            <th>
                                                Estado
                                            </th>

                                            <th>
                                                Último Acceso
                                            </th>

                                            <th>
                                                Acciones
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>


                                        {
                                            cargando ? (
                                                <tr>
                                                    <td colSpan="9">
                                                        Cargando usuarios...
                                                    </td>
                                                </tr>
                                            ) : error ? (
                                                <tr>
                                                    <td colSpan="9">
                                                        {error}
                                                    </td>
                                                </tr>
                                            ) : usuariosFiltrados.length === 0 ? (
                                                <tr>
                                                    <td colSpan="9">
                                                        No hay usuarios registrados.
                                                    </td>
                                                </tr>
                                            ) : usuariosFiltrados.map(
                                                usuario => (

                                                    <tr key={usuario.id}>


                                                        <td>
                                                            {usuario.id}
                                                        </td>


                                                        <td>

                                                            <div className="usuario-celda">

                                                                <span
                                                                    className={
                                                                        `tabla-avatar avatar-${usuario.color}`
                                                                    }
                                                                >

                                                                    {
                                                                        usuario.inicial
                                                                    }

                                                                </span>

                                                                {
                                                                    usuario.usuario
                                                                }

                                                            </div>

                                                        </td>


                                                        <td>
                                                            {usuario.nombre}
                                                        </td>


                                                        <td>
                                                            {usuario.correo}
                                                        </td>


                                                        <td>

                                                            <span
                                                                className={
                                                                    usuario.rol === 'Administrador'
                                                                        ?
                                                                        'rol rol-admin'
                                                                        :
                                                                        usuario.rol === 'Bodeguero'
                                                                            ?
                                                                            'rol rol-bodeguero'
                                                                            :
                                                                            usuario.rol === 'Vendedor'
                                                                                ?
                                                                                'rol rol-vendedor'
                                                                                :
                                                                                'rol rol-cliente'
                                                                }
                                                            >

                                                                {
                                                                    usuario.rol
                                                                }

                                                            </span>

                                                        </td>


                                                        <td>

                                                            <span className="estado-usuario">

                                                                <span
                                                                    className={
                                                                        usuario.estado === 'Activo'
                                                                            ?
                                                                            'estado-punto punto-activo'
                                                                            :
                                                                            'estado-punto punto-inactivo'
                                                                    }
                                                                >
                                                                </span>

                                                                {
                                                                    usuario.estado
                                                                }

                                                            </span>

                                                        </td>


                                                        <td>
                                                            {usuario.acceso}
                                                        </td>


                                                        <td>

                                                            <div className="acciones">


                                                                <button
                                                                    type="button"
                                                                    className="accion accion-ver"
                                                                    title="Ver usuario"
                                                                    onClick={
                                                                        () =>
                                                                            verUsuario(
                                                                                usuario
                                                                            )
                                                                    }
                                                                >

                                                                    ◉

                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="accion accion-editar"
                                                                    title="Editar usuario"
                                                                    onClick={
                                                                        () =>
                                                                            editarUsuario(
                                                                                usuario
                                                                            )
                                                                    }
                                                                >

                                                                    ✎

                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="accion accion-eliminar"
                                                                    title="Eliminar usuario"
                                                                    onClick={
                                                                        () =>
                                                                            solicitarEliminarUsuario(
                                                                                usuario
                                                                            )
                                                                    }
                                                                >

                                                                    🗑

                                                                </button>


                                                            </div>

                                                        </td>


                                                    </tr>

                                                )
                                            )
                                        }


                                    </tbody>


                                </table>

                            </div>



                            {/* PAGINACIÓN */}

                            <div className="usuarios-paginacion">


                                <span>

                                    Mostrando 1 a {
                                        usuariosFiltrados.length
                                    } de {
                                        usuariosFiltrados.length
                                    } usuarios

                                </span>


                                <div className="paginas">


                                    <button
                                        type="button"
                                        onClick={
                                            () =>
                                                setPagina(
                                                    pagina =>
                                                        Math.max(
                                                            1,
                                                            pagina - 1
                                                        )
                                                )
                                        }
                                    >

                                        ‹

                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            pagina === 1
                                                ?
                                                'pagina-activa'
                                                :
                                                ''
                                        }
                                        onClick={
                                            () =>
                                                setPagina(1)
                                        }
                                    >

                                        1

                                    </button>


                                    <button
                                        type="button"
                                        className={
                                            pagina === 2
                                                ?
                                                'pagina-activa'
                                                :
                                                ''
                                        }
                                        onClick={
                                            () =>
                                                setPagina(2)
                                        }
                                    >

                                        2

                                    </button>


                                    <button
                                        type="button"
                                        onClick={
                                            () =>
                                                setPagina(
                                                    pagina =>
                                                        Math.min(
                                                            2,
                                                            pagina + 1
                                                        )
                                                )
                                        }
                                    >

                                        ›

                                    </button>


                                </div>

                            </div>


                        </section>


                    </main>

                </section>



                {/* =================================================
                    MODAL CONFIRMAR ELIMINACIÓN
                ================================================== */}

                {
                    usuarioAEliminar &&
                    (

                        <div className="modal-overlay">

                            <div
                                className="confirmacion-card"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="titulo-confirmacion"
                            >

                                <div className="confirmacion-icono">
                                    !
                                </div>

                                <h2 id="titulo-confirmacion">
                                    Eliminar usuario
                                </h2>

                                <p>
                                    Esta acción eliminará permanentemente este usuario del sistema.
                                </p>

                                <p className="confirmacion-usuario">
                                    {usuarioAEliminar.nombre} ({usuarioAEliminar.usuario})
                                </p>

                                <div className="confirmacion-acciones">
                                    <button
                                        type="button"
                                        className="confirmacion-cancelar"
                                        onClick={() => setUsuarioAEliminar(null)}
                                        disabled={eliminando}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className="confirmacion-eliminar"
                                        onClick={eliminarUsuario}
                                        disabled={eliminando}
                                    >
                                        {eliminando ? 'Eliminando...' : 'Eliminar usuario'}
                                    </button>
                                </div>

                            </div>

                        </div>
                    )
                }


                {/* =================================================
                    MODAL NUEVO / EDITAR USUARIO
                ================================================== */}

                {
                    mostrarFormulario &&
                    (

                        <div className="modal-overlay">

                            <form
                                className="modal-card formulario-usuario"
                                onSubmit={guardarUsuario}
                            >

                                <div className="modal-header">

                                    <h2>
                                        {
                                            modoFormulario === 'editar'
                                                ? 'Editar Usuario'
                                                : 'Nuevo Usuario'
                                        }
                                    </h2>

                                    <button
                                        type="button"
                                        className="modal-close"
                                        onClick={() => setMostrarFormulario(false)}
                                    >
                                        ✕
                                    </button>

                                </div>

                                <div className="campo-usuario">
                                    <label htmlFor="usuario">Usuario</label>
                                    <input
                                        id="usuario"
                                        name="usuario"
                                        value={formulario.usuario}
                                        onChange={manejarCambioFormulario}
                                        required
                                    />
                                </div>

                                <div className="campo-usuario">
                                    <label htmlFor="nombre">Nombre completo</label>
                                    <input
                                        id="nombre"
                                        name="nombre"
                                        value={formulario.nombre}
                                        onChange={manejarCambioFormulario}
                                        required
                                    />
                                </div>

                                <div className="campo-usuario">
                                    <label htmlFor="correo">Correo electrónico</label>
                                    <input
                                        id="correo"
                                        name="correo"
                                        type="email"
                                        value={formulario.correo}
                                        onChange={manejarCambioFormulario}
                                        required
                                    />
                                </div>

                                <div className="campo-usuario">
                                    <label htmlFor="password">
                                        Contraseña
                                        {
                                            modoFormulario === 'editar'
                                                ? ' (opcional)'
                                                : ''
                                        }
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formulario.password}
                                        onChange={manejarCambioFormulario}
                                        required={modoFormulario === 'nuevo'}
                                    />
                                </div>

                                <div className="campo-usuario">
                                    <label htmlFor="rol">Rol</label>
                                    <select
                                        id="rol"
                                        name="rol"
                                        value={formulario.rol}
                                        onChange={manejarCambioFormulario}
                                    >
                                        <option value="Administrador">Administrador</option>
                                        <option value="Bodeguero">Bodeguero</option>
                                        <option value="Vendedor">Vendedor</option>
                                    </select>
                                </div>

                                <div className="campo-usuario">
                                    <label htmlFor="estado">Estado</label>
                                    <select
                                        id="estado"
                                        name="estado"
                                        value={formulario.estado}
                                        onChange={manejarCambioFormulario}
                                    >
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                    </select>
                                </div>

                                {
                                    mensajeFormulario &&
                                    <p className="mensaje-formulario">
                                        {mensajeFormulario}
                                    </p>
                                }

                                <div className="acciones-formulario">
                                    <button
                                        type="button"
                                        className="boton-cancelar"
                                        onClick={() => setMostrarFormulario(false)}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="boton-guardar"
                                        disabled={guardando}
                                    >
                                        {guardando ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>

                            </form>

                        </div>
                    )
                }


                {/* =================================================
                    MODAL VER USUARIO
                ================================================== */}

                {
                    mostrarModal &&
                    usuarioSeleccionado
                    &&
                    (

                        <div className="modal-overlay">


                            <div className="modal-card">


                                <div className="modal-header">

                                    <h2>
                                        Información del Usuario
                                    </h2>


                                    <button
                                        type="button"
                                        className="modal-close"
                                        onClick={
                                            () =>
                                                setMostrarModal(
                                                    false
                                                )
                                        }
                                    >

                                        ✕

                                    </button>

                                </div>


                                <div className="detalle-usuario">


                                    <div className="detalle-fila">

                                        <strong>
                                            Usuario:
                                        </strong>

                                        <span>
                                            {
                                                usuarioSeleccionado.usuario
                                            }
                                        </span>

                                    </div>


                                    <div className="detalle-fila">

                                        <strong>
                                            Nombre:
                                        </strong>

                                        <span>
                                            {
                                                usuarioSeleccionado.nombre
                                            }
                                        </span>

                                    </div>


                                    <div className="detalle-fila">

                                        <strong>
                                            Correo:
                                        </strong>

                                        <span>
                                            {
                                                usuarioSeleccionado.correo
                                            }
                                        </span>

                                    </div>


                                    <div className="detalle-fila">

                                        <strong>
                                            Rol:
                                        </strong>

                                        <span>
                                            {
                                                usuarioSeleccionado.rol
                                            }
                                        </span>

                                    </div>


                                    <div className="detalle-fila">

                                        <strong>
                                            Estado:
                                        </strong>

                                        <span>
                                            {
                                                usuarioSeleccionado.estado
                                            }
                                        </span>

                                    </div>


                                    <div className="detalle-fila">

                                        <strong>
                                            Último acceso:
                                        </strong>

                                        <span>
                                            {
                                                usuarioSeleccionado.acceso
                                            }
                                        </span>

                                    </div>


                                </div>


                            </div>

                        </div>

                    )
                }


            </div>

        </>

    );

}


export default Usuarios;