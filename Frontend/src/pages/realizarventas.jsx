import React, { useEffect, useMemo, useState } from 'react';

const API_PRODUCTOS = '/api/cliente/productos?todos=true';
const carritoInicial = [];

function obtenerStockTienda(producto) {
    return Number(
        producto.tienda_stock
        ?? producto.stock_tienda
        ?? producto.localStock
        ?? 0
    );
}

function obtenerPrecio(producto) {
    return Number(
        producto.precio_venta
        ?? producto.precioVenta
        ?? producto.precio
        ?? 0
    );
}

function obtenerPrecioMayorista(producto) {
    const precio = Number(producto.precio_mayorista);
    return Number.isFinite(precio) && precio > 0 ? precio : null;
}

function obtenerPrecioCarrito(item) {
    return item.cantidad > 10 && item.precioMayorista > 0
        ? item.precioMayorista
        : item.precio;
}

function formatoPrecio(precio) {
    return `Q ${Number(precio || 0).toFixed(2)}`;
}
function obtenerStockBodega(producto) {
    return Number(producto.bodega_stock ?? producto.stock_bodega ?? 0);
}

function RealizarVentas() {
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState(carritoInicial);
    const [solicitudesBodega, setSolicitudesBodega] = useState([]);
    const [prioridadSolicitud, setPrioridadSolicitud] = useState('Media');
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [notificacionVenta, setNotificacionVenta] = useState('');
    const [notificacionSolicitud, setNotificacionSolicitud] = useState('');
    const [dineroRecibido, setDineroRecibido] = useState('');
    const [ventaEnProceso, setVentaEnProceso] = useState(false);
    const [solicitudEnProceso, setSolicitudEnProceso] = useState(false);

    useEffect(() => {
        if (!notificacionVenta && !notificacionSolicitud) return undefined;

        const temporizador = window.setTimeout(() => {
            setNotificacionVenta('');
            setNotificacionSolicitud('');
        }, 6000);

        return () => window.clearTimeout(temporizador);
    }, [notificacionVenta, notificacionSolicitud]);

    useEffect(() => {
        const controlador = new AbortController();

        async function cargarProductos() {
            try {
                const respuesta = await fetch(API_PRODUCTOS, { signal: controlador.signal });
                if (!respuesta.ok) {
                    throw new Error('No se pudieron cargar los productos.');
                }
                const datos = await respuesta.json();
                const lista = Array.isArray(datos) ? datos : datos.productos || [];
                setProductos(lista.filter(producto => (
                    obtenerStockTienda(producto) > 0
                    || obtenerStockBodega(producto) > 0
                )));
            } catch (errorCarga) {
                if (errorCarga.name !== 'AbortError') {
                    setError(errorCarga.message || 'No se pudieron cargar los productos.');
                }
            } finally {
                setCargando(false);
            }
        }

        cargarProductos();
        return () => controlador.abort();
    }, []);

    const productosVisibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return productos.filter(producto => {
            const nombre = String(producto.nombre || producto.producto || '').toLowerCase();
            const sku = String(producto.sku || producto.codigo || '').toLowerCase();
            return !texto || nombre.includes(texto) || sku.includes(texto);
        });
    }, [busqueda, productos]);

    const total = carrito.reduce((suma, item) => suma + obtenerPrecioCarrito(item) * item.cantidad, 0);
    const cantidadProductos = carrito.reduce((suma, item) => suma + item.cantidad, 0);
    const recibidoEnCentavos = Math.round((Number(dineroRecibido) || 0) * 100);
    const totalEnCentavos = Math.round(total * 100);
    const cambio = Math.max(0, recibidoEnCentavos - totalEnCentavos) / 100;
    const restante = Math.max(0, totalEnCentavos - recibidoEnCentavos) / 100;

    function agregarAlCarrito(producto) {
        const id = producto.producto_id ?? producto.id;
        const stock = obtenerStockTienda(producto);
        const precio = obtenerPrecio(producto);
        const precioMayorista = obtenerPrecioMayorista(producto);
        const nombre = producto.nombre || producto.producto;

        setCarrito(anterior => {
            const existente = anterior.find(item => item.id === id);
            if (existente) {
                if (existente.cantidad >= stock) {
                    setMensaje(`No hay más unidades disponibles de ${nombre}.`);
                    return anterior;
                }
                return anterior.map(item => item.id === id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
                );
            }
            return [...anterior, { id, nombre, precio, precioMayorista, stock, cantidad: 1 }];
        });
        setMensaje(`${nombre} fue agregado al carrito.`);
    }

    function solicitarProducto(producto) {
        const id = producto.producto_id ?? producto.id;
        const stock = obtenerStockBodega(producto);
        const nombre = producto.nombre || producto.producto;

        setSolicitudesBodega(anterior => {
            const existente = anterior.find(item => item.id === id);

            if (existente) {
                if (existente.cantidad >= stock) {
                    setMensaje(`No hay más unidades de ${nombre} disponibles en bodega.`);
                    return anterior;
                }

                return anterior.map(item => item.id === id
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
                );
            }

            return [...anterior, { id, nombre, stock, cantidad: 1 }];
        });
        setMensaje(`${nombre} fue agregado a la solicitud de bodega.`);
    }

    function cambiarCantidad(id, cantidad) {
        setCarrito(anterior => anterior.map(item => {
            if (item.id !== id) return item;
            const nuevaCantidad = Math.max(1, Math.min(Number(cantidad), item.stock));
            return { ...item, cantidad: nuevaCantidad };
        }));
    }

    function eliminarDelCarrito(id) {
        setCarrito(anterior => anterior.filter(item => item.id !== id));
    }

    function cambiarCantidadSolicitud(id, cantidad) {
        setSolicitudesBodega(anterior => anterior.map(item => {
            if (item.id !== id) return item;
            const nuevaCantidad = Math.max(1, Math.min(Number(cantidad), item.stock));
            return { ...item, cantidad: nuevaCantidad };
        }));
    }

    function eliminarSolicitud(id) {
        setSolicitudesBodega(anterior => anterior.filter(item => item.id !== id));
    }

    async function crearTicketSolicitud() {
        if (solicitudesBodega.length === 0) {
            setMensaje('Agrega al menos un producto de bodega a la solicitud.');
            return;
        }

        setSolicitudEnProceso(true);
        setNotificacionSolicitud('');
        setMensaje('');
        try {
            const respuesta = await fetch('/api/cliente/solicitudes-bodega', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productos: solicitudesBodega.map(item => ({
                        producto_id: item.id,
                        cantidad: item.cantidad
                    })),
                    solicitante: 'Vendedor',
                    ubicacion: 'Negocio Local',
                    prioridad: prioridadSolicitud,
                    notas: 'Solicitud enviada desde el portal del vendedor.'
                })
            });
            const resultado = await respuesta.json().catch(() => ({}));
            if (!respuesta.ok) {
                throw new Error(resultado.error || 'No fue posible enviar la solicitud.');
            }
            setSolicitudesBodega([]);
            setPrioridadSolicitud('Media');
            setNotificacionSolicitud(
                `¡Solicitud enviada exitosamente! Ticket ${resultado.numero_solicitud} enviado a Bodega.`
            );
        } catch (errorSolicitud) {
            setMensaje(errorSolicitud.message);
        } finally {
            setSolicitudEnProceso(false);
        }
    }

    async function realizarVenta() {
        setNotificacionVenta('');
        if (carrito.length === 0) {
            setMensaje('Agrega al menos un producto al carrito.');
            return;
        }
        if (restante > 0) {
            setMensaje(`El pago es insuficiente. Falta Q ${restante.toFixed(2)}.`);
            return;
        }

        let usuario;
        try {
            const datosUsuario = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
            const sesion = JSON.parse(datosUsuario || '{}');
            if (sesion.rol !== 'VENDEDOR' || !sesion.usuario) {
                setMensaje('Inicia sesión como vendedor para registrar la venta.');
                return;
            }
            usuario = sesion.usuario;
        } catch {
            setMensaje('No se pudo identificar al vendedor conectado. Vuelve a iniciar sesión.');
            return;
        }

        setVentaEnProceso(true);
        try {
            const respuesta = await fetch('/api/cliente/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: carrito.map(item => ({ producto_id: item.id, cantidad: item.cantidad })),
                    dinero_recibido: recibidoEnCentavos / 100,
                    usuario
                })
            });
            const resultado = await respuesta.json().catch(() => ({}));
            if (!respuesta.ok) {
                throw new Error(resultado.error || 'No fue posible registrar la venta.');
            }

            setCarrito([]);
            setDineroRecibido('');
            setMensaje('');
            setNotificacionVenta(
                `¡Venta exitosa! Venta #${resultado.venta_id}. Total: Q ${Number(resultado.total).toFixed(2)}. Cambio: Q ${Number(resultado.cambio).toFixed(2)}.`
            );

            try {
                const respuestaProductos = await fetch(API_PRODUCTOS);
                if (respuestaProductos.ok) {
                    const datosProductos = await respuestaProductos.json();
                    const lista = Array.isArray(datosProductos) ? datosProductos : datosProductos.productos || [];
                    setProductos(lista.filter(producto => (
                        obtenerStockTienda(producto) > 0
                        || obtenerStockBodega(producto) > 0
                    )));
                }
            } catch {
                // La venta ya se registró; la lista se actualizará al volver a cargar la pantalla.
            }
        } catch (errorVenta) {
            setMensaje(errorVenta.message || 'No fue posible registrar la venta.');
        } finally {
            setVentaEnProceso(false);
        }
    }
    return (
        <section className="ventas-page">
            <style>{`
                .ventas-page { color: #173459; }
                .ventas-heading { display: flex; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 20px; }
                .ventas-heading h1 { margin: 0; color: #102a54; font-size: 25px; }
                .ventas-heading p { margin: 7px 0 0; color: #718097; font-size: 12px; }
                .ventas-layout { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(290px, .75fr); gap: 16px; align-items: start; }
                .ventas-panel { overflow: hidden; border: 1px solid #dce4ee; border-radius: 9px; background: white; box-shadow: 0 2px 7px rgba(31,64,105,.04); }
                .ventas-panel-header { padding: 16px 18px; border-bottom: 1px solid #edf1f6; }
                .ventas-panel-header h2 { margin: 0; color: #153462; font-size: 14px; }
                .ventas-panel-header p { margin: 5px 0 0; color: #7a889b; font-size: 10px; }
                .ventas-search { margin: 14px 18px; width: calc(100% - 36px); padding: 10px; border: 1px solid #d7e0eb; border-radius: 5px; font-size: 11px; }
                .ventas-products { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; padding: 0 14px 14px; }
                .venta-product { padding: 13px; border: 1px solid #e1e8f0; border-radius: 7px; }
                .venta-product-image { width: 100%; height: 118px; display: grid; place-items: center; margin-bottom: 10px; overflow: hidden; border-radius: 5px; background: #f1f5fa; }
                .venta-product-image img { width: 100%; height: 100%; object-fit: contain; }
                .venta-product-placeholder { color: #8a9bb0; font-size: 30px; }
                .venta-product strong { display: block; min-height: 30px; color: #153462; font-size: 11px; }
                .venta-product small { display: block; margin-top: 7px; color: #718097; font-size: 9px; }
                .venta-product-price { margin-top: 9px; color: #1765be; font-size: 13px; font-weight: 800; }
                .venta-wholesale-hint { color: #387b5b !important; font-size: 10px !important; line-height: 1.4; }
                .venta-actions { display: grid; gap: 6px; margin-top: 10px; }
                .venta-add, .venta-request { width: 100%; padding: 8px; border: 0; border-radius: 5px; color: white; cursor: pointer; font-size: 10px; font-weight: 700; }
                .venta-add { background: #145ed6; }
                .venta-add:hover { background: #0d4eaf; }
                .venta-request { background: #c47720; }
                .venta-request:hover { background: #a86013; }
                .ventas-cart { position: sticky; top: 88px; }
                .venta-cart-list { display: grid; gap: 10px; max-height: 260px; overflow-y: auto; padding: 14px; }
                .venta-cart-item { display: grid; grid-template-columns: 1fr 65px 24px; gap: 7px; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #edf1f6; }
                .venta-cart-item strong { color: #153462; font-size: 10px; }
                .venta-cart-item small { display: block; margin-top: 4px; color: #718097; font-size: 10px; line-height: 1.45; }
                .venta-cart-item input { width: 65px; padding: 6px; border: 1px solid #d7e0eb; border-radius: 4px; font-size: 10px; }
                .venta-remove { width: 24px; height: 26px; border: 1px solid #f0caca; border-radius: 4px; color: #c34242; background: #fff5f5; cursor: pointer; }
                .venta-cart-total { display: flex; justify-content: space-between; padding: 14px; color: #102a54; font-size: 14px; font-weight: 800; }
                .venta-payment { display: grid; gap: 6px; margin: 0 14px 12px; color: #42536b; font-size: 10px; font-weight: 700; }
                .venta-payment input { width: 100%; padding: 9px 10px; border: 1px solid #d7e0eb; border-radius: 5px; color: #233e63; font-size: 12px; }
                .venta-change { display: flex; justify-content: space-between; padding: 0 14px 14px; color: #147748; font-size: 12px; font-weight: 800; }
                .venta-change.pending { color: #b13e3e; }
                .venta-finish { width: calc(100% - 28px); margin: 0 14px 14px; padding: 11px; border: 0; border-radius: 5px; color: white; background: #188b52; cursor: pointer; font-size: 11px; font-weight: 700; }
                .venta-message { margin: 0 14px 14px; padding: 9px; border-radius: 5px; color: #176c49; background: #e4f6ed; font-size: 10px; }
                .venta-success-notification { position: fixed; top: 78px; right: 24px; z-index: 200; max-width: min(460px, calc(100vw - 32px)); padding: 14px 18px; border: 1px solid #a8dfbf; border-radius: 8px; color: #125c36; background: #e4f6ed; box-shadow: 0 8px 24px rgba(20, 72, 43, .2); font-size: 13px; font-weight: 700; }
                .solicitud-success-notification { position: fixed; top: 78px; right: 24px; z-index: 200; max-width: min(460px, calc(100vw - 32px)); padding: 14px 18px; border: 1px solid #a8dfbf; border-radius: 8px; color: #125c36; background: #e4f6ed; box-shadow: 0 8px 24px rgba(20, 72, 43, .2); font-size: 13px; font-weight: 700; }
                .venta-empty { padding: 25px 14px; color: #718097; text-align: center; font-size: 11px; }
                .venta-section-title { margin: 14px 14px 8px; color: #52657d; font-size: 10px; font-weight: 800; }
                .venta-priority { width: calc(100% - 28px); margin: 0 14px 10px; padding: 8px; border: 1px solid #d7e0eb; border-radius: 5px; color: #233e63; background: white; font-size: 10px; }
                .venta-ticket-button { width: calc(100% - 28px); margin: 0 14px 14px; padding: 11px; border: 0; border-radius: 5px; color: white; background: #c47720; cursor: pointer; font-size: 11px; font-weight: 700; }
                @media (max-width: 850px) { .ventas-layout { grid-template-columns: 1fr; } .ventas-cart { position: static; } }
            `}</style>

            {notificacionVenta && (
                <div className="venta-success-notification" role="status" aria-live="polite">
                    {notificacionVenta}
                </div>
            )}
            {notificacionSolicitud && (
                <div className="solicitud-success-notification" role="status" aria-live="polite">
                    {notificacionSolicitud}
                </div>
            )}

            <div className="ventas-heading">
                <div>
                    <h1>Realizar ventas</h1>
                        <p>Vende productos de tienda o solicita productos disponibles en bodega.</p>
                </div>
            </div>

            <div className="ventas-layout">
                <section className="ventas-panel">
                    <div className="ventas-panel-header">
                        <h2>Productos disponibles</h2>
                        <p>Consulta existencias de tienda y bodega.</p>
                    </div>
                    <input className="ventas-search" value={busqueda} onChange={evento => setBusqueda(evento.target.value)} placeholder="Buscar producto o código" aria-label="Buscar productos" />
                    {cargando && <div className="venta-empty">Cargando productos...</div>}
                    {error && <div className="venta-empty">{error}</div>}
                    {!cargando && !error && productosVisibles.length === 0 && <div className="venta-empty">No hay productos disponibles en tienda.</div>}
                    <div className="ventas-products">
                        {productosVisibles.map(producto => {
                            const id = producto.producto_id ?? producto.id;
                            const stock = obtenerStockTienda(producto);
                            const stockBodega = obtenerStockBodega(producto);
                            const precio = obtenerPrecio(producto);
                            const precioMayorista = obtenerPrecioMayorista(producto);
                            return (
                                <article className="venta-product" key={id}>
                                    <div className="venta-product-image">
                                        {producto.imagen_url ? (
                                            <img src={producto.imagen_url} alt={producto.nombre || producto.producto} loading="lazy" />
                                        ) : (
                                            <span className="venta-product-placeholder">▣</span>
                                        )}
                                    </div>
                                    <strong>{producto.nombre || producto.producto}</strong>
                                    <small>Stock en tienda: {stock}</small>
                                    <small>Stock en bodega: {stockBodega}</small>
                                    <div className="venta-product-price">Unitario: {formatoPrecio(precio)}</div>
                                    <small className="venta-wholesale-hint">
                                        {precioMayorista ? `Precio mayorista: ${formatoPrecio(precioMayorista)}` : 'Precio mayorista no definido'}
                                        {' · Al comprar más de 10 productos'}
                                    </small>
                                    <div className="venta-actions">
                                        <button className="venta-add" type="button" disabled={stock === 0} onClick={() => agregarAlCarrito(producto)}>Agregar a venta</button>
                                        {stockBodega > 0 && (
                                            <button className="venta-request" type="button" onClick={() => solicitarProducto(producto)}>Solicitar a bodega</button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <aside className="ventas-panel ventas-cart">
                    <div className="ventas-panel-header">
                        <h2>Carrito de venta</h2>
                        <p>{cantidadProductos} unidad(es) seleccionada(s)</p>
                    </div>
                    <div className="venta-cart-list">
                        {carrito.length === 0 && <div className="venta-empty">El carrito está vacío.</div>}
                        {carrito.map(item => (
                            <div className="venta-cart-item" key={item.id}>
                                <div><strong>{item.nombre}</strong><small>{formatoPrecio(obtenerPrecioCarrito(item))} c/u · Subtotal {formatoPrecio(obtenerPrecioCarrito(item) * item.cantidad)}{item.cantidad > 10 && item.precioMayorista > 0 ? ' · Mayorista aplicado' : ''}</small></div>
                                <input type="number" min="1" max={item.stock} value={item.cantidad} onChange={evento => cambiarCantidad(item.id, evento.target.value)} aria-label={`Cantidad de ${item.nombre}`} />
                                <button className="venta-remove" type="button" onClick={() => eliminarDelCarrito(item.id)} aria-label={`Eliminar ${item.nombre}`}>×</button>
                            </div>
                        ))}
                    </div>
                    <div className="venta-section-title">Solicitud de bodega</div>
                    <select className="venta-priority" value={prioridadSolicitud} onChange={evento => setPrioridadSolicitud(evento.target.value)} aria-label="Prioridad de la solicitud">
                        <option value="Baja">Prioridad baja</option>
                        <option value="Media">Prioridad media</option>
                        <option value="Alta">Prioridad alta</option>
                        <option value="Urgente">Prioridad urgente</option>
                    </select>
                    <div className="venta-cart-list">
                        {solicitudesBodega.length === 0 && <div className="venta-empty">No hay productos solicitados.</div>}
                        {solicitudesBodega.map(item => (
                            <div className="venta-cart-item" key={`solicitud-${item.id}`}>
                                <div><strong>{item.nombre}</strong><small>Disponible: {item.stock}</small></div>
                                <input type="number" min="1" max={item.stock} value={item.cantidad} onChange={evento => cambiarCantidadSolicitud(item.id, evento.target.value)} aria-label={`Cantidad solicitada de ${item.nombre}`} />
                                <button className="venta-remove" type="button" onClick={() => eliminarSolicitud(item.id)} aria-label={`Eliminar solicitud de ${item.nombre}`}>×</button>
                            </div>
                        ))}
                    </div>
                    <button
                        className="venta-ticket-button"
                        type="button"
                        onClick={crearTicketSolicitud}
                        disabled={solicitudEnProceso || solicitudesBodega.length === 0}
                    >
                        {solicitudEnProceso ? 'Enviando solicitud...' : 'Enviar solicitud como ticket'}
                    </button>
                    <div className="venta-cart-total"><span>Total</span><span>Q {total.toFixed(2)}</span></div>
                    <label className="venta-payment" htmlFor="dinero-recibido">
                        Dinero recibido del cliente
                        <input
                            id="dinero-recibido"
                            type="number"
                            min="0"
                            step="0.01"
                            value={dineroRecibido}
                            onChange={evento => setDineroRecibido(evento.target.value)}
                            placeholder="Q 0.00"
                        />
                    </label>
                    <div className={`venta-change ${restante > 0 ? 'pending' : ''}`} aria-live="polite">
                        <span>{restante > 0 ? 'Falta por pagar' : 'Cambio'}</span>
                        <span>Q {(restante > 0 ? restante : cambio).toFixed(2)}</span>
                    </div>
                    {mensaje && <p className="venta-message" role="status">{mensaje}</p>}
                    <button className="venta-finish" type="button" onClick={realizarVenta} disabled={ventaEnProceso}>{ventaEnProceso ? 'Registrando venta...' : 'Realizar venta'}</button>
                </aside>
            </div>
        </section>
    );
}

export default RealizarVentas;
