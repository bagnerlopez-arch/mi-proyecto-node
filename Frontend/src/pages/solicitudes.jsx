import React, { useEffect, useMemo, useState } from 'react';

function mapearSolicitud(solicitud, mostrarAtendidas = false) {
	return {
		id: solicitud.numero_solicitud,
		productos: solicitud.productos,
		ubicacion: solicitud.ubicacion_destino,
		prioridad: solicitud.prioridad,
		estado: mostrarAtendidas && solicitud.aceptado
			? 'Atendida'
			: solicitud.estado,
		solicitante: solicitud.solicitante,
		fecha: new Date(solicitud.creado_en).toLocaleDateString('es-GT'),
		notas: solicitud.notas || 'Sin observaciones.',
		enviado: solicitud.enviado,
		aceptado: solicitud.aceptado
	};
}

function Solicitudes({ soloTickets = false }) {
	const [solicitudes, setSolicitudes] = useState([]);
	const [productosDisponibles, setProductosDisponibles] = useState([]);
	const [filtro, setFiltro] = useState('Todas');
	const [busqueda, setBusqueda] = useState('');
	const [mensaje, setMensaje] = useState('');
	const [cargandoProductos, setCargandoProductos] = useState(!soloTickets);
	const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
	const [actualizandoAceptacion, setActualizandoAceptacion] = useState('');
	const [productosSolicitud, setProductosSolicitud] = useState([]);
	const [siguienteProductoId, setSiguienteProductoId] = useState(2);
	const [formulario, setFormulario] = useState({
		ubicacion: 'Tienda principal',
		prioridad: 'Media',
		notas: ''
	});

	useEffect(() => {
		let activo = true;

		async function cargarSolicitudes() {
			try {
				const respuesta = await fetch('/api/cliente/solicitudes-bodega');
				if (!respuesta.ok) {
					throw new Error('No se pudieron cargar las solicitudes.');
				}
				const datos = await respuesta.json();
				if (!activo) return;
				setSolicitudes(datos.map(solicitud => (
					mapearSolicitud(solicitud, !soloTickets)
				)));
			} catch (errorCarga) {
				if (activo) setMensaje(errorCarga.message);
			}
		}

		cargarSolicitudes();
		const intervalo = window.setInterval(cargarSolicitudes, 10000);
		return () => {
			activo = false;
			window.clearInterval(intervalo);
		};
	}, []);

	useEffect(() => {
		if (soloTickets) return undefined;

		let activo = true;

		async function cargarProductos() {
			try {
				const respuesta = await fetch('/api/cliente/productos');
				const datos = await respuesta.json();
				if (!respuesta.ok) {
					throw new Error(datos.error || 'No se pudieron cargar los productos de bodega.');
				}

				const productos = datos
					.filter(producto => Number(producto.bodega_stock) > 0)
					.map(producto => ({
						id: Number(producto.producto_id),
						nombre: producto.nombre,
						stock: Number(producto.bodega_stock)
					}));

				if (!activo) return;
				setProductosDisponibles(productos);
				if (productos.length > 0) {
					setProductosSolicitud([{
						id: 1,
						productoId: productos[0].id,
						cantidad: 1
					}]);
				}
			} catch (errorCarga) {
				if (activo) setMensaje(errorCarga.message);
			} finally {
				if (activo) setCargandoProductos(false);
			}
		}

		cargarProductos();
		return () => {
			activo = false;
		};
	}, [soloTickets]);

	const solicitudesVisibles = useMemo(() => {
		const texto = busqueda.trim().toLowerCase();

		return solicitudes.filter(solicitud => {
			const coincideEstado = filtro === 'Todas'
				|| solicitud.estado === filtro;
			const nombresProductos = solicitud.productos
				? solicitud.productos.map(item => item.producto).join(' ')
				: solicitud.producto;
			const coincideTexto = !texto
				|| `${solicitud.id} ${nombresProductos} ${solicitud.ubicacion}`
					.toLowerCase()
					.includes(texto);

			return coincideEstado && coincideTexto;
		});
	}, [busqueda, filtro, solicitudes]);

	function cambiarCampo(evento) {
		const { name, value } = evento.target;
		setFormulario(anterior => ({ ...anterior, [name]: value }));
	}

	function cambiarProducto(id, campo, valor) {
		setProductosSolicitud(anterior => anterior.map(item => (
			item.id === id
				? { ...item, [campo]: Number(valor) }
				: item
		)));
	}

	function agregarProducto() {
		const productoDisponible = productosDisponibles.find(producto => (
			!productosSolicitud.some(item => item.productoId === producto.id)
		));

		if (!productoDisponible) {
			setMensaje('Ya agregaste todos los productos disponibles en bodega.');
			return;
		}

		setProductosSolicitud(anterior => [
			...anterior,
			{
				id: siguienteProductoId,
				productoId: productoDisponible.id,
				cantidad: 1
			}
		]);
		setSiguienteProductoId(anterior => anterior + 1);
	}

	function eliminarProducto(id) {
		if (productosSolicitud.length === 1) {
			setMensaje('El ticket debe contener al menos un producto.');
			return;
		}

		setProductosSolicitud(anterior => anterior.filter(item => item.id !== id));
	}

	async function crearSolicitud(evento) {
		evento.preventDefault();
		setMensaje('');

		if (productosSolicitud.length === 0 || productosSolicitud.some(item => !item.productoId || item.cantidad < 1)) {
			setMensaje('Selecciona un producto e indica una cantidad válida en cada línea.');
			return;
		}

		try {
			setEnviandoSolicitud(true);
			const respuesta = await fetch('/api/cliente/solicitudes-bodega', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productos: productosSolicitud.map(item => ({
						producto_id: item.productoId,
						cantidad: item.cantidad
					})),
					ubicacion: formulario.ubicacion,
					prioridad: formulario.prioridad,
					solicitante: 'Administrador',
					notas: formulario.notas
				})
			});
			const datos = await respuesta.json();
			if (!respuesta.ok) {
				throw new Error(datos.error || 'No se pudo enviar la solicitud.');
			}

			const solicitud = mapearSolicitud(datos);
			setSolicitudes(anterior => [solicitud, ...anterior]);
			setProductosSolicitud(productosDisponibles.length > 0
				? [{ id: 1, productoId: productosDisponibles[0].id, cantidad: 1 }]
				: []);
			setFormulario(anterior => ({ ...anterior, notas: '' }));
			setMensaje(`La solicitud ${solicitud.id} fue enviada correctamente a bodega.`);
		} catch (errorSolicitud) {
			setMensaje(errorSolicitud.message);
		} finally {
			setEnviandoSolicitud(false);
		}
	}

	async function cambiarAceptacion(solicitud, aceptado) {
		setActualizandoAceptacion(solicitud.id);
		setMensaje('');

		try {
			const respuesta = await fetch(
				`/api/cliente/solicitudes-bodega/${encodeURIComponent(solicitud.id)}/aceptacion`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ aceptado })
				}
			);
			const datos = await respuesta.json();
			if (!respuesta.ok) {
				throw new Error(datos.error || 'No se pudo actualizar el ticket.');
			}

			setSolicitudes(anterior => anterior.map(item => (
				item.id === solicitud.id
					? { ...item, aceptado: datos.aceptado, estado: datos.estado }
					: item
			)));
			setMensaje(datos.aceptado
				? `Ticket ${solicitud.id} aceptado. En proceso de preparación de los productos.`
				: `Se quitó la aceptación del ticket ${solicitud.id}.`);
		} catch (errorActualizacion) {
			setMensaje(errorActualizacion.message);
		} finally {
			setActualizandoAceptacion('');
		}
	}

	const pendientes = solicitudes.filter(solicitud => solicitud.estado === 'Pendiente').length;
	const preparacion = solicitudes.filter(solicitud => solicitud.estado === 'En preparación').length;
	const atendidas = solicitudes.filter(solicitud => solicitud.estado === 'Atendida').length;
	const productosSeleccionados = new Set(productosSolicitud.map(item => item.productoId));

	return (
		<div className="solicitudes-page">
			<style>{`
				.solicitudes-page { color: #173459; }
				.solicitudes-heading { display: flex; justify-content: space-between; gap: 20px; align-items: flex-end; margin-bottom: 22px; }
				.solicitudes-heading h1 { margin: 0; color: #102a54; font-size: 25px; }
				.solicitudes-heading p { margin: 7px 0 0; color: #718097; font-size: 12px; }
				.solicitudes-grid { display: grid; grid-template-columns: minmax(280px, .8fr) minmax(0, 1.6fr); gap: 16px; align-items: start; }
				.solicitudes-grid.solo-tickets { display: block; }
				.solicitud-panel { border: 1px solid #dce4ee; border-radius: 9px; background: white; box-shadow: 0 2px 7px rgba(31,64,105,.04); }
				.solicitud-panel-header { padding: 16px 18px; border-bottom: 1px solid #edf1f6; }
				.solicitud-panel-header h2 { margin: 0; color: #153462; font-size: 14px; }
				.solicitud-panel-header p { margin: 5px 0 0; color: #7a889b; font-size: 10px; }
				.solicitud-form { display: grid; gap: 13px; padding: 18px; }
				.solicitud-field { display: grid; gap: 5px; }
				.solicitud-field label { color: #42536b; font-size: 10px; font-weight: 700; }
				.solicitud-field input, .solicitud-field select, .solicitud-field textarea, .solicitud-toolbar input, .solicitud-toolbar select { width: 100%; padding: 9px 10px; border: 1px solid #d7e0eb; border-radius: 5px; color: #233e63; background: white; font-size: 11px; }
				.solicitud-field textarea { min-height: 72px; resize: vertical; }
				.solicitud-products { display: grid; gap: 9px; }
				.solicitud-product-row { display: grid; grid-template-columns: minmax(0, 1fr) 75px 30px; gap: 6px; align-items: end; }
				.solicitud-product-row select, .solicitud-product-row input { width: 100%; padding: 9px 7px; border: 1px solid #d7e0eb; border-radius: 5px; color: #233e63; background: white; font-size: 10px; }
				.solicitud-remove { width: 30px; height: 32px; border: 1px solid #f0caca; border-radius: 5px; color: #c34242; background: #fff5f5; cursor: pointer; font-size: 16px; }
				.solicitud-add { padding: 8px 10px; border: 1px dashed #8fb3df; border-radius: 5px; color: #1d64cb; background: #f5f9ff; cursor: pointer; font-size: 10px; font-weight: 700; }
				.solicitud-button { padding: 10px 14px; border: 0; border-radius: 5px; color: white; background: #145ed6; cursor: pointer; font-size: 11px; font-weight: 700; }
				.solicitud-button:hover { background: #0d4eaf; }
				.solicitud-button:disabled { opacity: .6; cursor: not-allowed; }
				.solicitud-message { margin: 0; padding: 9px 11px; border-radius: 5px; color: #176c49; background: #e4f6ed; font-size: 10px; }
				.solicitud-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
				.solicitud-stat { padding: 13px 15px; border: 1px solid #dce4ee; border-radius: 8px; background: white; }
				.solicitud-stat small { display: block; color: #718097; font-size: 10px; }
				.solicitud-stat strong { display: block; margin-top: 6px; color: #102a54; font-size: 21px; }
				.solicitud-toolbar { display: grid; grid-template-columns: 1fr 150px; gap: 9px; padding: 14px 18px; border-bottom: 1px solid #edf1f6; }
				.solicitud-list { display: grid; gap: 10px; padding: 14px; }
				.solicitud-ticket { padding: 14px; border: 1px solid #e1e8f0; border-left: 4px solid #2879da; border-radius: 6px; background: #fff; }
				.solicitud-ticket-top, .solicitud-ticket-meta, .solicitud-ticket-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
				.solicitud-ticket-top strong { color: #153462; font-size: 12px; }
				.solicitud-ticket-products { display: grid; gap: 4px; margin: 10px 0; color: #52657d; font-size: 10px; }
				.solicitud-ticket-top small, .solicitud-ticket-meta, .solicitud-ticket p { color: #718097; font-size: 10px; }
				.solicitud-ticket p { margin: 10px 0; }
				.solicitud-ticket-meta { justify-content: flex-start; flex-wrap: wrap; }
				.solicitud-ticket-checks { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; }
				.solicitud-ticket-check { display: inline-flex; align-items: center; gap: 6px; color: #52657d; font-size: 10px; }
				.solicitud-ticket-check input { accent-color: #16803c; }
				.solicitud-ticket-check.done { color: #147748; font-weight: 700; }
				.solicitud-badge { padding: 4px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; }
				.solicitud-badge.pendiente { color: #996400; background: #fff1d5; }
				.solicitud-badge.preparacion { color: #175eaa; background: #e0efff; }
				.solicitud-badge.atendida { color: #147748; background: #ddf4e8; }
				.solicitud-badge.cancelada { color: #b13e3e; background: #ffe4e4; }
				.solicitud-prioridad { color: #d34c2e; font-size: 9px; font-weight: 700; }
				.solicitud-prioridad.urgente { padding: 4px 7px; border-radius: 10px; color: #a51f1f; background: #ffe1e1; }
				.solicitud-action { padding: 6px 8px; border: 1px solid #cbd8e7; border-radius: 4px; color: #1d5da9; background: white; cursor: pointer; font-size: 9px; }
				.solicitud-action:hover { background: #f2f7ff; }
				.solicitud-empty { padding: 28px 12px; color: #718097; text-align: center; font-size: 11px; }
				@media (max-width: 900px) { .solicitudes-grid { grid-template-columns: 1fr; } }
				@media (max-width: 600px) { .solicitudes-heading { display: block; } .solicitud-summary { grid-template-columns: 1fr; } .solicitud-toolbar { grid-template-columns: 1fr; } .solicitud-product-row { grid-template-columns: minmax(0, 1fr) 62px 30px; } .solicitud-ticket-top, .solicitud-ticket-actions { align-items: flex-start; flex-direction: column; } }
			`}</style>

			<div className="solicitudes-heading">
				<div>
					<h1>{soloTickets ? 'Tickets de Solicitudes' : 'Solicitudes a Bodega'}</h1>
					<p>{soloTickets ? 'Revisa y gestiona los tickets enviados por la tienda.' : 'Crea tickets para pedir productos y coordinar su traslado a la tienda.'}</p>
				</div>
			</div>
			{mensaje && <p className="solicitud-message" role="status">{mensaje}</p>}

			<div className={`solicitudes-grid ${soloTickets ? 'solo-tickets' : ''}`}>
				{!soloTickets && (
				<section className="solicitud-panel">
					<div className="solicitud-panel-header">
						<h2>Nueva solicitud</h2>
						<p>El bodeguero recibirá los detalles del pedido.</p>
					</div>
					<form className="solicitud-form" onSubmit={crearSolicitud}>
						<div className="solicitud-field">
							<label>Productos disponibles en bodega</label>
							<div className="solicitud-products">
								{productosSolicitud.map(item => (
									<div className="solicitud-product-row" key={item.id}>
										<select value={item.productoId} onChange={evento => cambiarProducto(item.id, 'productoId', evento.target.value)} aria-label="Producto solicitado">
											{productosDisponibles.map(producto => (
												<option
													key={producto.id}
													value={producto.id}
													disabled={producto.id !== item.productoId && productosSeleccionados.has(producto.id)}
												>
													{producto.nombre} · {producto.stock} disponibles
												</option>
											))}
										</select>
										<input type="number" min="1" max={productosDisponibles.find(producto => producto.id === item.productoId)?.stock} value={item.cantidad} onChange={evento => cambiarProducto(item.id, 'cantidad', evento.target.value)} aria-label="Cantidad solicitada" />
										<button className="solicitud-remove" type="button" onClick={() => eliminarProducto(item.id)} aria-label="Eliminar producto">×</button>
									</div>
								))}
								{cargandoProductos && <span>Cargando productos de bodega...</span>}
								{!cargandoProductos && productosDisponibles.length === 0 && <span>No hay productos con existencias disponibles en bodega.</span>}
								{productosDisponibles.length > productosSolicitud.length && (
									<button className="solicitud-add" type="button" onClick={agregarProducto}>+ Agregar otro producto</button>
								)}
							</div>
						</div>
						<div className="solicitud-field">
							<label htmlFor="ubicacion">Tienda destino</label>
							<select id="ubicacion" name="ubicacion" value="Negocio Local" disabled>
								<option>Negocio Local</option>
							</select>
						</div>
						<div className="solicitud-field">
							<label htmlFor="prioridad">Prioridad</label>
							<select id="prioridad" name="prioridad" value={formulario.prioridad} onChange={cambiarCampo}>
								<option>Baja</option>
								<option>Media</option>
								<option>Alta</option>
								<option>Urgente</option>
							</select>
						</div>
						<div className="solicitud-field">
							<label htmlFor="notas">Notas para el bodeguero</label>
							<textarea id="notas" name="notas" value={formulario.notas} onChange={cambiarCampo} placeholder="Indica detalles del traslado o empaque." />
						</div>
						<button className="solicitud-button" type="submit" disabled={enviandoSolicitud || cargandoProductos || productosDisponibles.length === 0}>
							{enviandoSolicitud ? 'Enviando...' : 'Crear ticket de solicitud'}
						</button>
					</form>
				</section>
				)}

				<section>
					<div className="solicitud-summary">
						<div className="solicitud-stat"><small>Pendientes</small><strong>{pendientes}</strong></div>
						<div className="solicitud-stat"><small>En preparación</small><strong>{preparacion}</strong></div>
						<div className="solicitud-stat"><small>Atendidas</small><strong>{atendidas}</strong></div>
					</div>
					<div className="solicitud-panel">
						<div className="solicitud-panel-header">
							<h2>Tickets de abastecimiento</h2>
							<p>Seguimiento de solicitudes enviadas a bodega.</p>
						</div>
						<div className="solicitud-toolbar">
							<input value={busqueda} onChange={evento => setBusqueda(evento.target.value)} placeholder="Buscar por ticket, producto o tienda" aria-label="Buscar solicitudes" />
							<select value={filtro} onChange={evento => setFiltro(evento.target.value)} aria-label="Filtrar solicitudes">
								<option>Todas</option>
								<option>Pendiente</option>
								<option>En preparación</option>
								<option>Atendida</option>
								<option>Cancelada</option>
							</select>
						</div>
						<div className="solicitud-list">
							{solicitudesVisibles.length === 0 && <div className="solicitud-empty">No hay tickets que coincidan con el filtro.</div>}
							{solicitudesVisibles.map(solicitud => {
								const claseEstado = solicitud.estado.toLowerCase().replace(' ', '-');
								const productosTicket = solicitud.productos || [
									{ producto: solicitud.producto, cantidad: solicitud.cantidad }
								];
								return (
									<article className="solicitud-ticket" key={solicitud.id}>
										<div className="solicitud-ticket-top">
											<strong>{solicitud.id} · {productosTicket.length} producto(s)</strong>
											<small>{solicitud.fecha} · {solicitud.solicitante}</small>
										</div>
										<div className="solicitud-ticket-products">
											{productosTicket.map((item, index) => (
												<span key={`${solicitud.id}-${item.producto}-${index}`}>
													{item.cantidad} × {item.producto}
												</span>
											))}
										</div>
										<p>{solicitud.notas}</p>
										<div className="solicitud-ticket-meta">
											<span>{productosTicket.reduce((total, item) => total + Number(item.cantidad), 0)} unidades</span>
											<span>Destino: {solicitud.ubicacion}</span>
											<span className={`solicitud-prioridad ${solicitud.prioridad === 'Urgente' ? 'urgente' : ''}`}>
												{solicitud.prioridad === 'Urgente' ? 'URGENTE' : `Prioridad ${solicitud.prioridad}`}
											</span>
											<span className={`solicitud-badge ${claseEstado}`}>{solicitud.estado}</span>
										</div>
										<div className="solicitud-ticket-checks">
											<label className="solicitud-ticket-check">
												<input type="checkbox" checked={Boolean(solicitud.enviado)} disabled readOnly />
												Ticket enviado
											</label>
											<label className={`solicitud-ticket-check ${solicitud.aceptado ? 'done' : ''}`}>
												<input
													type="checkbox"
													checked={Boolean(solicitud.aceptado)}
													disabled={!soloTickets || actualizandoAceptacion === solicitud.id}
													onChange={evento => cambiarAceptacion(solicitud, evento.target.checked)}
												/>
												{soloTickets ? 'Ticket aceptado' : 'Solicitud atendida'}
											</label>
										</div>
									</article>
								);
							})}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

export default Solicitudes;
