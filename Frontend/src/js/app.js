const API = '/api/cliente';


const listaProductos =
    document.getElementById(
        'listaProductos'
    );


const estadoCatalogo =
    document.getElementById(
        'estadoCatalogo'
    );


const mensajeVacio =
    document.getElementById(
        'mensajeVacio'
    );


const buscarProducto =
    document.getElementById(
        'buscarProducto'
    );


const categoriaProducto =
    document.getElementById(
        'categoriaProducto'
    );


const menuBoton =
    document.getElementById(
        'menuBoton'
    );


const menu =
    document.getElementById(
        'menu'
    );


let temporizador;


// =========================================
// MENÚ MÓVIL
// =========================================

menuBoton.addEventListener(
    'click',
    () => {

        menu.classList.toggle(
            'activo'
        );

    }
);


document
    .querySelectorAll(
        '.menu a'
    )
    .forEach(
        enlace => {

            enlace.addEventListener(
                'click',
                () => {

                    menu.classList.remove(
                        'activo'
                    );

                }
            );

        }
    );


// =========================================
// SEGURIDAD PARA TEXTO
// =========================================

function escaparHTML(valor = '') {

    return String(valor)
        .replaceAll(
            '&',
            '&amp;'
        )
        .replaceAll(
            '<',
            '&lt;'
        )
        .replaceAll(
            '>',
            '&gt;'
        )
        .replaceAll(
            '"',
            '&quot;'
        )
        .replaceAll(
            "'",
            '&#039;'
        );

}


// =========================================
// PRECIOS
// =========================================

function formatearPrecio(precio) {

    if (
        precio === null ||
        precio === undefined ||
        precio === ''
    ) {

        return 'Consultar precio';

    }


    return new Intl.NumberFormat(
        'es-GT',
        {
            style:
                'currency',

            currency:
                'GTQ'
        }
    ).format(
        Number(precio)
    );

}


// =========================================
// DISPONIBILIDAD
// =========================================

function obtenerDisponibilidad(
    valor
) {

    switch (valor) {

        case 'TIENDA':

            return {
                texto:
                    'Disponible en tienda',

                clase:
                    'disponible-tienda'
            };


        case 'BODEGA':

            return {
                texto:
                    'Disponible en bodega',

                clase:
                    'disponible-bodega'
            };


        default:

            return {
                texto:
                    'Agotado',

                clase:
                    'agotado'
            };

    }

}


// =========================================
// CATEGORÍAS
// =========================================

async function cargarCategorias() {

    try {

        const respuesta =
            await fetch(
                `${API}/categorias`
            );


        if (!respuesta.ok) {

            throw new Error(
                'No se pudieron cargar las categorías.'
            );

        }


        const categorias =
            await respuesta.json();


        categorias.forEach(
            categoria => {

                const opcion =
                    document.createElement(
                        'option'
                    );


                opcion.value =
                    categoria.categoria_id;


                opcion.textContent =
                    categoria.nombre;


                categoriaProducto.appendChild(
                    opcion
                );

            }
        );


    } catch (error) {

        console.error(
            error
        );

    }

}


// =========================================
// PRODUCTOS
// =========================================

async function cargarProductos() {

    try {

        estadoCatalogo.textContent =
            'Cargando productos...';


        mensajeVacio.classList.add(
            'oculto'
        );


        const parametros =
            new URLSearchParams();


        const busqueda =
            buscarProducto
                .value
                .trim();


        const categoria =
            categoriaProducto.value;


        if (busqueda) {

            parametros.set(
                'buscar',
                busqueda
            );

        }


        if (categoria) {

            parametros.set(
                'categoria',
                categoria
            );

        }


        const respuesta =
            await fetch(
                `${API}/productos?${parametros.toString()}`
            );


        if (!respuesta.ok) {

            throw new Error(
                'No se pudo cargar el catálogo.'
            );

        }


        const productos =
            await respuesta.json();


        mostrarProductos(
            productos
        );


    } catch (error) {

        console.error(
            error
        );


        listaProductos.innerHTML =
            '';


        estadoCatalogo.textContent =
            'No fue posible cargar el catálogo.';


        mensajeVacio.classList.remove(
            'oculto'
        );

    }

}


// =========================================
// MOSTRAR PRODUCTOS
// =========================================

function mostrarProductos(
    productos
) {

    listaProductos.innerHTML =
        '';


    if (
        productos.length === 0
    ) {

        estadoCatalogo.textContent =
            '0 productos encontrados';


        mensajeVacio.classList.remove(
            'oculto'
        );


        return;

    }


    mensajeVacio.classList.add(
        'oculto'
    );


    estadoCatalogo.textContent =
        `${productos.length} producto(s) encontrado(s)`;


    productos.forEach(
        producto => {

            const disponibilidad =
                obtenerDisponibilidad(
                    producto.disponibilidad
                );


            const tarjeta =
                document.createElement(
                    'article'
                );


            tarjeta.className =
                'producto-card';


            let imagen =
                '<span>📦</span>';


            if (producto.imagen_url) {

                imagen = `

                    <img
                        src="${escaparHTML(
                            producto.imagen_url
                        )}"
                        alt="${escaparHTML(
                            producto.nombre
                        )}"
                        loading="lazy"
                    >

                `;

            }


            tarjeta.innerHTML = `

                <div
                    class="producto-imagen"
                >

                    ${imagen}

                </div>


                <div
                    class="producto-contenido"
                >

                    <span
                        class="producto-categoria"
                    >

                        ${escaparHTML(
                            producto.categoria
                            || 'Producto'
                        )}

                    </span>


                    <h3>

                        ${escaparHTML(
                            producto.nombre
                        )}

                    </h3>


                    <p
                        class="producto-descripcion"
                    >

                        ${escaparHTML(
                            producto.descripcion
                            ||
                            'Producto plástico desechable.'
                        )}

                    </p>


                    <div
                        class="producto-footer"
                    >

                        <strong
                            class="producto-precio"
                        >

                            ${formatearPrecio(
                                producto.precio_venta
                            )}

                        </strong>


                        <span
                            class="
                                disponibilidad
                                ${disponibilidad.clase}
                            "
                        >

                            ${disponibilidad.texto}

                        </span>

                    </div>

                </div>

            `;


            listaProductos.appendChild(
                tarjeta
            );

        }
    );

}


// =========================================
// INFORMACIÓN DEL NEGOCIO
// =========================================

async function cargarInformacion() {

    try {

        const respuesta =
            await fetch(
                `${API}/info`
            );


        if (!respuesta.ok) {

            throw new Error(
                'No se pudo cargar la información del negocio.'
            );

        }


        const negocio =
            await respuesta.json();


        document.getElementById(
            'nombreNegocio'
        ).textContent =
            negocio.nombre;


        document.getElementById(
            'descripcionNegocio'
        ).textContent =
            negocio.descripcion;


        document.getElementById(
            'direccionNegocio'
        ).textContent =
            negocio.direccion;


        document.getElementById(
            'telefonoNegocio'
        ).textContent =
            negocio.telefono;


        document.getElementById(
            'horarioNegocio'
        ).textContent =
            negocio.horario;


        const whatsapp =
            String(
                negocio.whatsapp || ''
            ).replace(
                /\D/g,
                ''
            );


        const boton =
            document.getElementById(
                'botonWhatsapp'
            );


        if (whatsapp) {

            boton.href =
                `https://wa.me/${whatsapp}?text=${encodeURIComponent(
                    'Hola, quisiera consultar sobre sus productos.'
                )}`;

        } else {

            boton.style.display =
                'none';

        }


    } catch (error) {

        console.error(
            error
        );

    }

}


// =========================================
// BUSCADOR
// =========================================

buscarProducto.addEventListener(
    'input',
    () => {

        clearTimeout(
            temporizador
        );


        temporizador =
            setTimeout(
                cargarProductos,
                350
            );

    }
);


categoriaProducto.addEventListener(
    'change',
    cargarProductos
);


// =========================================
// INICIAR
// =========================================

async function iniciarPagina() {

    await cargarCategorias();


    await Promise.all([
        cargarProductos(),
        cargarInformacion()
    ]);

}


iniciarPagina();