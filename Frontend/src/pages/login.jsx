import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';


function Login() {

    const navigate = useNavigate();

    const credencialesAdministrador = {
        usuario: 'admin',
        password: 'admin123'
    };

    const credencialesBodeguero = {
        usuario: 'bodeguero1',
        password: 'bodeguero123'
    };

    const credencialesVendedor = {
        usuario: 'vendedor1',
        password: 'vendedor123'
    };

    const [formulario, setFormulario] = useState({
        usuario: '',
        password: '',
        recordar: false
    });

    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');


    // =====================================================
    // CAMBIO DE DATOS DEL FORMULARIO
    // =====================================================

    function manejarCambio(evento) {

        const {
            name,
            value,
            type,
            checked
        } = evento.target;


        setFormulario(anterior => ({
            ...anterior,

            [name]:
                type === 'checkbox'
                    ? checked
                    : value
        }));
    }


    // =====================================================
    // INICIAR SESIÓN
    // =====================================================

    async function iniciarSesion(evento) {

        evento.preventDefault();

        setMensaje('');


        if (
            !formulario.usuario.trim() ||
            !formulario.password.trim()
        ) {

            setMensaje(
                'Ingresa tu usuario y contraseña.'
            );

            return;
        }


        try {

            setCargando(true);

            const esAdministrador =
                formulario.usuario === credencialesAdministrador.usuario
                && formulario.password === credencialesAdministrador.password;

            const esBodeguero =
                formulario.usuario === credencialesBodeguero.usuario
                && formulario.password === credencialesBodeguero.password;

            const esVendedor =
                formulario.usuario === credencialesVendedor.usuario
                && formulario.password === credencialesVendedor.password;

            if (!esAdministrador && !esBodeguero && !esVendedor) {
                throw new Error(
                    'Usuario o contraseña incorrectos.'
                );
            }

            const datos = {
                usuario: {
                    usuario: esVendedor
                        ? credencialesVendedor.usuario
                        : esBodeguero
                            ? credencialesBodeguero.usuario
                            : credencialesAdministrador.usuario,
                    rol: esVendedor
                        ? 'VENDEDOR'
                        : esBodeguero
                            ? 'BODEGUERO'
                            : 'ADMINISTRADOR'
                }
            };


            // =================================================
            // GUARDAR TOKEN
            // =================================================

            if (datos.token) {

                const almacenamiento =
                    formulario.recordar
                        ? localStorage
                        : sessionStorage;


                almacenamiento.setItem(
                    'token',
                    datos.token
                );
            }


            // =================================================
            // GUARDAR USUARIO
            // =================================================

            if (datos.usuario) {

                const almacenamiento =
                    formulario.recordar
                        ? localStorage
                        : sessionStorage;


                almacenamiento.setItem(
                    'usuario',
                    JSON.stringify(
                        datos.usuario
                    )
                );
            }


            navigate(
                esVendedor
                    ? '/vendedor'
                    : esBodeguero
                        ? '/bodeguero'
                        : '/public'
            );


        } catch (error) {

            setMensaje(
                error.message
            );


        } finally {

            setCargando(false);
        }
    }


    // =====================================================
    // RECUPERAR CONTRASEÑA
    // =====================================================

    function recuperarPassword() {

        setMensaje(
            'La recuperación de contraseña se configurará posteriormente.'
        );
    }


    // =====================================================
    // CSS COMPLETO
    // =====================================================

    const estilos = `

        :root {
            --login-blue-dark: #062968;
            --login-blue: #1158d5;
            --login-blue-light: #69a8ff;

            --login-white: #ffffff;

            --login-text: #14284b;
            --login-muted: #71809a;

            --login-border: #d7dfeb;

            --login-background: #f6f8fc;

            --login-shadow:
                0 15px 45px
                rgba(20, 42, 78, 0.15);
        }


        * {
            box-sizing: border-box;
        }


        html,
        body,
        #root {
            width: 100%;
            min-height: 100%;
        }


        body {
            margin: 0;
        }


        button,
        input {
            font: inherit;
        }


        .login-page {
            width: 100%;
            min-height: 100vh;

            display: flex;
            flex-direction: column;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            color:
                var(--login-text);

            background:
                var(--login-background);
        }


        /* =================================================
           CONTENIDO PRINCIPAL
        ================================================= */

        .login-main {
            flex: 1;

            display: grid;

            grid-template-columns:
                47% 53%;

            min-height:
                calc(
                    100vh - 115px
                );
        }


        /* =================================================
           PANEL IZQUIERDO
        ================================================= */

        .login-left {
            min-height: 700px;

            position: relative;

            overflow: hidden;

            color: white;

            background:

                radial-gradient(
                    circle at 80% 20%,
                    rgba(55, 128, 255, 0.30),
                    transparent 28%
                ),

                linear-gradient(
                    145deg,
                    #052763 0%,
                    #062b70 50%,
                    #0b347d 100%
                );
        }


        .login-left-overlay {
            position: absolute;

            inset: 0;

            pointer-events: none;

            background:

                radial-gradient(
                    circle at 20% 65%,
                    rgba(54, 118, 230, 0.18),
                    transparent 27%
                );
        }


        .login-left-content {
            min-height: 700px;

            position: relative;

            z-index: 2;

            display: flex;
            flex-direction: column;

            padding:
                60px 58px 22px;
        }


        /* =================================================
           LOGO
        ================================================= */

        .login-brand {
            width: fit-content;

            display: flex;

            align-items: center;

            gap: 14px;

            color: white;

            text-decoration: none;
        }


        .brand-logo {
            width: 65px;
            height: 65px;

            display: grid;

            place-items: center;

            position: relative;
        }


        .plastic-logo {
            font-size: 48px;
        }


        .brand-text {
            display: flex;

            flex-direction: column;

            line-height: 1.03;
        }


        .brand-text strong {
            font-size: 24px;

            font-weight: 900;
        }


        .brand-text small {
            margin-top: 7px;

            color:
                #d6e4ff;

            font-size: 13px;

            font-weight: 700;
        }


        /* =================================================
           BIENVENIDA
        ================================================= */

        .welcome-content {
            max-width: 520px;

            margin-top: 45px;
        }


        .welcome-content h1 {
            margin: 0;

            font-size:
                clamp(
                    2.1rem,
                    3vw,
                    3rem
                );

            letter-spacing: -1px;
        }


        .welcome-content h1 span {
            color:
                var(--login-blue-light);
        }


        .welcome-content p {
            max-width: 510px;

            margin-top: 15px;

            color:
                #eef4ff;

            font-size: 17px;

            line-height: 1.6;
        }


        /* =================================================
           IMAGEN
        ================================================= */

        .login-products {
            flex: 1;

            min-height: 290px;

            display: flex;

            justify-content: center;

            align-items: flex-end;

            margin:
                5px -58px 0;

            overflow: hidden;
        }


        .login-products img {
            width: 100%;

            max-height: 360px;

            object-fit: cover;

            object-position:
                center bottom;
        }


        /* =================================================
           BENEFICIOS
        ================================================= */

        .login-benefits {
            width: 90%;

            max-width: 625px;

            align-self: center;

            display: grid;

            grid-template-columns:
                repeat(3, 1fr);

            overflow: hidden;

            border:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.20
                );

            border-radius: 15px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.16
                );

            backdrop-filter:
                blur(12px);
        }


        .login-benefits article {
            min-height: 122px;

            display: flex;

            flex-direction: column;

            justify-content: center;

            align-items: center;

            padding: 14px;

            text-align: center;

            border-right:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    0.16
                );
        }


        .login-benefits article:last-child {
            border-right: 0;
        }


        .benefit-icon {
            margin-bottom: 7px;

            font-size: 28px;
        }


        .login-benefits strong {
            font-size: 12px;
        }


        .login-benefits p {
            max-width: 150px;

            margin:
                6px 0 0;

            color:
                #d9e5ff;

            font-size: 10px;

            line-height: 1.4;
        }


        /* =================================================
           PANEL DERECHO
        ================================================= */

        .login-right {
            min-height: 700px;

            display: grid;

            place-items: center;

            padding: 45px;

            background:

                radial-gradient(
                    circle at 20% 20%,
                    #ffffff,
                    transparent 35%
                ),

                linear-gradient(
                    135deg,
                    #f8fbff,
                    #ffffff
                );
        }


        /* =================================================
           TARJETA LOGIN
        ================================================= */

        .login-card {
            width:
                min(
                    520px,
                    100%
                );

            padding:
                34px 39px 30px;

            border:
                1px solid
                #ebeff5;

            border-radius: 14px;

            background: white;

            box-shadow:
                var(--login-shadow);
        }


        .login-card-logo {
            display: flex;

            justify-content: center;
        }


        .login-card-logo > div {
            width: 76px;

            height: 76px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            color:
                var(--login-blue);

            background:
                #e9f2ff;

            font-size: 18px;

            font-weight: 900;
        }


        .login-card h2 {
            margin:
                15px 0 4px;

            text-align: center;

            color:
                #112957;

            font-size: 28px;
        }


        .login-description {
            margin:
                0 0 25px;

            text-align: center;

            color:
                var(--login-muted);

            font-size: 12px;
        }


        /* =================================================
           FORMULARIO
        ================================================= */

        .login-form {
            display: grid;

            gap: 16px;
        }


        .form-group {
            display: grid;

            gap: 8px;
        }


        .form-group label {
            color:
                #354667;

            font-size: 12px;

            font-weight: 700;
        }


        .input-container {
            min-height: 49px;

            display: flex;

            align-items: center;

            overflow: hidden;

            border:
                1px solid
                #cad5e4;

            border-radius: 7px;

            background: white;

            transition: 0.2s;
        }


        .input-container:focus-within {
            border-color:
                var(--login-blue);

            box-shadow:
                0 0 0 3px
                rgba(
                    17,
                    88,
                    213,
                    0.10
                );
        }


        .input-icon {
            width: 45px;

            display: grid;

            place-items: center;

            color:
                #8094b5;

            font-size: 17px;
        }


        .input-container input {
            flex: 1;

            min-width: 0;

            height: 47px;

            padding:
                0 8px;

            border: 0;

            outline: 0;

            color:
                #243551;

            background: transparent;

            font-size: 13px;
        }


        .input-container input::placeholder {
            color:
                #9cacc2;
        }


        .password-toggle {
            width: 50px;

            height: 47px;

            border: 0;

            background: transparent;

            cursor: pointer;

            font-size: 16px;
        }


        /* =================================================
           OPCIONES
        ================================================= */

        .login-options {
            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 15px;
        }


        .remember {
            display: flex;

            align-items: center;

            gap: 8px;

            color:
                #465675;

            font-size: 12px;

            cursor: pointer;
        }


        .remember input {
            width: 16px;

            height: 16px;

            accent-color:
                var(--login-blue);
        }


        .forgot-link {
            border: 0;

            color:
                var(--login-blue);

            background: transparent;

            font-size: 11px;

            font-weight: 800;

            cursor: pointer;
        }


        /* =================================================
           MENSAJE
        ================================================= */

        .login-message {
            padding:
                10px 12px;

            border-radius: 6px;

            color:
                #99423c;

            background:
                #fff0ef;

            font-size: 11px;
        }


        /* =================================================
           BOTÓN LOGIN
        ================================================= */

        .login-button {
            min-height: 48px;

            display: flex;

            justify-content: center;

            align-items: center;

            gap: 10px;

            border: 0;

            border-radius: 6px;

            color: white;

            background:
                linear-gradient(
                    90deg,
                    #0757dc,
                    #1653d1
                );

            font-size: 13px;

            font-weight: 800;

            cursor: pointer;

            box-shadow:
                0 8px 18px
                rgba(
                    16,
                    84,
                    211,
                    0.18
                );

            transition: 0.2s;
        }


        .login-button:hover {
            transform:
                translateY(-1px);

            filter:
                brightness(1.05);
        }


        .login-button:disabled {
            opacity: 0.65;

            cursor: wait;
        }


        /* =================================================
           ADMIN
        ================================================= */

        .admin-help {
            text-align: center;

            color:
                #68758c;

            font-size: 11px;
        }


        .admin-help button {
            margin-left: 6px;

            border: 0;

            color:
                var(--login-blue);

            background: transparent;

            font-weight: 800;

            cursor: pointer;
        }


        /* =================================================
           FOOTER
        ================================================= */

        .login-footer {
            min-height: 115px;

            display: grid;

            grid-template-columns:
                1.2fr
                1px
                1.2fr
                1px
                1.5fr
                1px
                1.2fr;

            align-items: center;

            gap: 25px;

            padding:
                18px 55px;

            color: white;

            background:
                linear-gradient(
                    90deg,
                    #07317a,
                    #052769
                );
        }


        .footer-item {
            display: flex;

            align-items: center;

            gap: 13px;
        }


        .footer-main-icon {
            width: 44px;

            height: 44px;

            flex: 0 0 44px;

            display: grid;

            place-items: center;

            border-radius: 50%;

            font-size: 25px;
        }


        .footer-main-icon.green {
            color:
                #4de578;

            background:
                rgba(
                    29,
                    169,
                    77,
                    0.20
                );
        }


        .footer-item strong {
            display: block;

            font-size: 11px;
        }


        .footer-item p {
            margin:
                4px 0 0;

            color:
                #d9e6ff;

            font-size: 10px;

            line-height: 1.45;
        }


        .footer-line {
            width: 1px;

            height: 50px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.20
                );
        }


        /* =================================================
           MARCA FOOTER
        ================================================= */

        .footer-brand {
            display: flex;

            align-items: center;

            gap: 11px;
        }


        .footer-logo {
            width: 46px;

            height: 46px;

            display: grid;

            place-items: center;

            border:
                2px solid white;

            border-radius: 9px;

            font-size: 11px;

            font-weight: 900;
        }


        .footer-brand > div:last-child {
            display: flex;

            flex-direction: column;

            line-height: 1.05;
        }


        .footer-brand strong,
        .footer-brand span {
            font-size: 14px;

            font-weight: 800;
        }


        .footer-brand small {
            margin-top: 4px;

            color:
                #cbdaff;

            font-size: 8px;
        }


        /* =================================================
           TABLET
        ================================================= */

        @media (
            max-width: 1050px
        ) {

            .login-main {
                grid-template-columns:
                    42% 58%;
            }


            .login-left-content {
                padding:
                    50px 35px 25px;
            }


            .login-products {
                margin:
                    5px -35px 0;
            }


            .login-benefits {
                width: 100%;
            }


            .login-footer {
                grid-template-columns:
                    repeat(2, 1fr);

                gap: 20px;
            }


            .footer-line {
                display: none;
            }

        }


        /* =================================================
           MÓVIL
        ================================================= */

        @media (
            max-width: 800px
        ) {

            .login-main {
                display: block;
            }


            .login-left {
                min-height: auto;
            }


            .login-left-content {
                min-height: auto;

                padding:
                    35px 25px;
            }


            .welcome-content {
                margin-top: 35px;
            }


            .login-products {
                display: none;
            }


            .login-benefits {
                margin-top: 35px;
            }


            .login-right {
                min-height: auto;

                padding:
                    45px 20px;
            }


            .login-footer {
                grid-template-columns:
                    1fr;

                padding:
                    30px;
            }

        }


        @media (
            max-width: 520px
        ) {

            .brand-text strong {
                font-size: 19px;
            }


            .welcome-content h1 {
                font-size: 34px;
            }


            .login-benefits {
                grid-template-columns:
                    1fr;
            }


            .login-benefits article {
                border-right: 0;

                border-bottom:
                    1px solid
                    rgba(
                        255,
                        255,
                        255,
                        0.15
                    );
            }


            .login-card {
                padding:
                    30px 22px;
            }


            .login-options {
                align-items: flex-start;

                flex-direction: column;
            }

        }

    `;


    // =====================================================
    // INTERFAZ
    // =====================================================

    return (

        <>

            {/* CSS INCLUIDO EN ESTE MISMO ARCHIVO */}

            <style>
                {estilos}
            </style>


            <div className="login-page">


                {/* =================================================
                    CONTENIDO PRINCIPAL
                ================================================== */}

                <main className="login-main">


                    {/* =============================================
                        PANEL IZQUIERDO
                    ============================================== */}

                    <section className="login-left">


                        <div className="login-left-overlay">
                        </div>


                        <div className="login-left-content">


                            {/* LOGO */}

                            <Link
                                to="/"
                                className="login-brand"
                            >
<img
                                    src="/logo-comercial-san-cristobal.png"
                                    alt="Logotipo Comercial San Cristóbal"
                                    style={{ width: 'min(460px, 100%)', maxWidth: '100%', height: 'auto', maxHeight: '178px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '10px', padding: '5px' }}
                                />
</Link>


                            {/* BIENVENIDA */}

                            <div className="welcome-content">

                                <h1>

                                    Bienvenido

                                    <span>
                                        {' '}de vuelta a Comercial San Cristobal.
                                    </span>

                                </h1>


                                <p>

                                    Ingresa a tu cuenta para
                                    gestionar productos,
                                    inventario, ventas y mucho más.

                                </p>

                            </div>


                        </div>

                    </section>


                    {/* =============================================
                        PANEL DERECHO
                    ============================================== */}

                    <section className="login-right">


                        <div className="login-card">


                            {/* LOGO */}

                            <div className="login-card-logo">

                                <img
                                        src="/logo-comercial-san-cristobal.png"
                                        alt="Logotipo Comercial San Cristóbal"
                                        style={{ width: '260px', maxWidth: '100%', height: '100px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '9px', padding: '4px' }}
                                    />

                            </div>


                            <h2>
                                Iniciar sesión
                            </h2>


                            <p className="login-description">

                                Accede a tu cuenta de
                                Comercial San Cristóbal

                            </p>


                            {/* =====================================
                                FORMULARIO
                            ====================================== */}

                            <form
                                onSubmit={iniciarSesion}
                                className="login-form"
                            >


                                {/* USUARIO */}

                                <div className="form-group">

                                    <label htmlFor="usuario">

                                        Usuario

                                    </label>


                                    <div className="input-container">

                                        <span className="input-icon">
                                            👤
                                        </span>


                                        <input
                                            id="usuario"
                                            name="usuario"
                                            type="text"
                                            value={
                                                formulario.usuario
                                            }
                                            onChange={
                                                manejarCambio
                                            }
                                            placeholder="Ingresa tu usuario"
                                            autoComplete="username"
                                        />

                                    </div>

                                </div>


                                {/* CONTRASEÑA */}

                                <div className="form-group">

                                    <label htmlFor="password">

                                        Contraseña

                                    </label>


                                    <div className="input-container">

                                        <span className="input-icon">
                                            🔒
                                        </span>


                                        <input
                                            id="password"
                                            name="password"
                                            type={
                                                mostrarPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={
                                                formulario.password
                                            }
                                            onChange={
                                                manejarCambio
                                            }
                                            placeholder="Ingresa tu contraseña"
                                            autoComplete="current-password"
                                        />


                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={
                                                () =>
                                                    setMostrarPassword(
                                                        !mostrarPassword
                                                    )
                                            }
                                            aria-label={
                                                mostrarPassword
                                                    ?
                                                    'Ocultar contraseña'
                                                    :
                                                    'Mostrar contraseña'
                                            }
                                        >

                                            {
                                                mostrarPassword
                                                    ? '🙈'
                                                    : '👁️'
                                            }

                                        </button>

                                    </div>

                                </div>


                                {/* RECORDAR */}

                                <div className="login-options">


                                    <label className="remember">

                                        <input
                                            type="checkbox"
                                            name="recordar"
                                            checked={
                                                formulario.recordar
                                            }
                                            onChange={
                                                manejarCambio
                                            }
                                        />

                                        <span>
                                            Recordarme
                                        </span>

                                    </label>


                                    <button
                                        type="button"
                                        className="forgot-link"
                                        onClick={
                                            recuperarPassword
                                        }
                                    >

                                        ¿Olvidaste tu contraseña?

                                    </button>

                                </div>


                                {/* MENSAJE */}

                                {
                                    mensaje
                                    &&
                                    (

                                        <div className="login-message">

                                            {mensaje}

                                        </div>

                                    )
                                }


                                {/* BOTÓN */}

                                <button
                                    type="submit"
                                    className="login-button"
                                    disabled={
                                        cargando
                                    }
                                >

                                    <span>
                                        🔒
                                    </span>


                                    {
                                        cargando
                                            ?
                                            'Ingresando...'
                                            :
                                            'Iniciar sesión'
                                    }

                                </button>
{/* ADMIN */}

                                <div className="admin-help">

                                    ¿No tienes cuenta?

                                    <button
                                        type="button"
                                        onClick={
                                            () =>
                                                setMensaje(
                                                    'Solicita una cuenta al administrador del sistema.'
                                                )
                                        }
                                    >

                                        Contacta al administrador

                                    </button>

                                </div>


                            </form>

                        </div>

                    </section>

                </main>


                {/* =================================================
                    FOOTER
                ================================================== */}

            </div>

        </>

    );

}


export default Login;

