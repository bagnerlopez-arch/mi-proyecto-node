import React, {
    useEffect,
    useState
} from 'react';

import {
    Link
} from 'react-router-dom';

import '../css/styles.css';


function Inicio() {

    const [
        negocio,
        setNegocio
    ] = useState({

        nombre:
            'Comercial San Cristóbal',

        descripcion:
            'Empresa dedicada a la venta y distribución de productos plásticos desechables.',

        direccion:
            'Mercado La Terminal De Buses Zona 2 De Chimaltenango, Chimaltenango',

        telefono:
            '31302535',

        horario:
            'Lunes a sábado de 7:30 am a 6:00 pm y domingo de 8:00 am a 2:00 pm.',

        whatsapp:
            '50231302535'

    });


    useEffect(
        () => {

            async function cargarNegocio() {

                try {

                    const respuesta =
                        await fetch(
                            '/api/cliente/info'
                        );


                    if (!respuesta.ok) {
                        return;
                    }


                    const datos =
                        await respuesta.json();


                    setNegocio({
                        ...datos,
                        direccion: 'Mercado La Terminal De Buses Zona 2 De Chimaltenango, Chimaltenango',
                        telefono: '31302535',
                        horario: 'Lunes a sábado de 7:30 am a 6:00 pm y domingo de 8:00 am a 2:00 pm.',
                        whatsapp: '50231302535'
                    });

                } catch (error) {

                    console.log(
                        'Información del negocio no disponible:',
                        error.message
                    );

                }

            }


            cargarNegocio();

        },

        []
    );
return (

        <div className="inicio-page">


            {/* =========================
                HEADER
            ========================== */}

            <header className="inicio-header">

                <div className="contenedor navbar">

                    <Link
                        to="/"
                        className="marca"
                    >

                        <img
                            className="marca-logo"
                            src="/logo-comercial-san-cristobal.png"
                            alt="Logotipo Comercial San Cristóbal"
                        />

                    </Link>

                    <nav className="menu">
                        <Link to="/login" className="boton-login">
                            Iniciar sesión
                        </Link>
                    </nav>

                </div>

            </header>


            <main>


                {/* =========================
                    HERO
                ========================== */}

                <section
                    id="inicio"
                    className="hero"
                >

                    <div className="contenedor hero-grid">

                        <div className="hero-contenido">


                            <span className="etiqueta">

                                Productos para tu negocio
                                y hogar

                            </span>


                            <h1>

                                Todo en

                                <span>
                                    {' '}plásticos desechables{' '}
                                </span>

                                en un solo lugar

                            </h1>


                            <p>

                                Encuentra vasos, platos,
                                recipientes, bolsas y otros
                                productos para cubrir las
                                necesidades de tu negocio.

                            </p>


                            <div className="hero-botones">


                                <Link
                                    to="/catalogo"
                                    className="boton boton-principal"
                                >

                                    Ver catálogo

                                </Link>


                                <a
                                    href="#contacto"
                                    className="boton boton-secundario"
                                >

                                    Contáctanos

                                </a>


                            </div>


                            <div className="hero-beneficios">


                                <span>
                                    ✓ Variedad de productos
                                </span>


                                <span>
                                    ✓ Precios competitivos
                                </span>


                                <span>
                                    ✓ Atención personalizada
                                </span>


                            </div>

                        </div>


                        <div className="hero-visual">

                            <div className="circulo-productos">

                                <div className="producto-central">
                                    🥤
                                </div>


                                <div className="producto-flotante plato">
                                    🍽️
                                </div>


                                <div className="producto-flotante bolsa">
                                    🛍️
                                </div>


                                <div className="catalogo-tarjeta">

                                    <small>
                                        CATÁLOGO
                                    </small>

                                    <strong>
                                        Productos disponibles
                                    </strong>

                                    <span>
                                        Consulta precio y existencia
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =========================
                    CATEGORÍAS
                ========================== */}

                <section className="categorias-inicio">

                    <div className="contenedor categorias-grid">


                        <article>

                            <span>
                                🥤
                            </span>

                            <div>

                                <strong>
                                    Vasos
                                </strong>

                                <p>
                                    Diferentes tamaños
                                </p>

                            </div>

                        </article>


                        <article>

                            <span>
                                🍽️
                            </span>

                            <div>

                                <strong>
                                    Platos
                                </strong>

                                <p>
                                    Para todo tipo de ocasión
                                </p>

                            </div>

                        </article>


                        <article>

                            <span>
                                🥡
                            </span>

                            <div>

                                <strong>
                                    Recipientes
                                </strong>

                                <p>
                                    Soluciones para alimentos
                                </p>

                            </div>

                        </article>


                        <article>

                            <span>
                                🛍️
                            </span>

                            <div>

                                <strong>
                                    Bolsas
                                </strong>

                                <p>
                                    Diferentes medidas
                                </p>

                            </div>

                        </article>


                    </div>

                </section>


                {/* =========================
                    NOSOTROS
                ========================== */}

                <section
                    id="nosotros"
                    className="seccion nosotros"
                >

                    <div className="contenedor nosotros-grid">

                        <div className="nosotros-imagen nosotros-logo">

                            <img
                                src="/logo-comercial-san-cristobal.png"
                                alt="Logotipo Comercial San Cristóbal"
                            />

                        </div>


                        <div className="nosotros-texto">

                            <span className="subtitulo">
                                Sobre nosotros
                            </span>


                            <h2>
                                {negocio.nombre}
                            </h2>


                            <p>
                                {negocio.descripcion}
                            </p>


                            <div className="ventajas">


                                <article>

                                    <span>
                                        🏪
                                    </span>

                                    <div>

                                        <strong>
                                            Tienda física
                                        </strong>

                                        <p>
                                            Atención directa
                                            a nuestros clientes.
                                        </p>

                                    </div>

                                </article>


                                <article>

                                    <span>
                                        📦
                                    </span>

                                    <div>

                                        <strong>
                                            Bodega
                                        </strong>

                                        <p>
                                            Control y abastecimiento
                                            de productos.
                                        </p>

                                    </div>

                                </article>


                                <article>

                                    <span>
                                        🤝
                                    </span>

                                    <div>

                                        <strong>
                                            Atención personalizada
                                        </strong>

                                        <p>
                                            Estamos para ayudarte
                                            con tus compras.
                                        </p>

                                    </div>

                                </article>


                            </div>

                        </div>

                    </div>

                </section>


                {/* =========================
                    CONTACTO
                ========================== */}

                <section
                    id="contacto"
                    className="seccion contacto"
                >

                    <div className="contenedor">


                        <div className="titulo-seccion">

                            <span className="subtitulo">
                                Contacto
                            </span>

                            <h2>
                                Estamos para servirte
                            </h2>

                            <p>

                                Comunícate con Comercial
                                San Cristóbal o visítanos
                                en nuestra tienda.

                            </p>

                        </div>


                        <div className="contacto-grid">


                            <article className="contacto-card">

                                <span className="contacto-icono">
                                    📍
                                </span>

                                <h3>
                                    Dirección
                                </h3>

                                <a
                                    className="contacto-direccion"
                                    href="https://www.google.com/maps/search/?api=1&query=Mercado%20La%20Terminal%20De%20Buses%20Zona%202%20De%20Chimaltenango%2C%20Chimaltenango"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {negocio.direccion}
                                </a>

                            </article>


                            <article className="contacto-card">

                                <span className="contacto-icono">
                                    📞
                                </span>

                                <h3>
                                    Teléfono
                                </h3>

                                <p>+502 31302535</p>

                            </article>


                            <article className="contacto-card">

                                <span className="contacto-icono">
                                    🕐
                                </span>

                                <h3>
                                    Horario
                                </h3>

                                <p>
                                    {negocio.horario}
                                </p>

                            </article>


                        </div>
                        <div className="whatsapp-area">
                            <a
                                href="https://wa.me/50231302535?text=Comercial%20San%20Cristobal%2C%20es%20un%20gusto%20servirte%20en%20productos%20desechables%20en%20que%20podemos%20ayudarte."
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                💬 Consultar por WhatsApp
                            </a>
                        </div>

                    </div>

                </section>

            </main>


            {/* =========================
                FOOTER
            ========================== */}

            <footer className="footer">
<div className="footer-copy">

                    © 2026 Comercial San Cristóbal.
                    Todos los derechos reservados.

                </div>

            </footer>


        </div>

    );

}


export default Inicio;