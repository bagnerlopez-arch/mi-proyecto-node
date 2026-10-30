import React, { useEffect, useState } from 'react';

function Ticket() {
    const [tickets, setTickets] = useState([]);
    const [filtro, setFiltro] = useState('Todas');
    const [busqueda, setBusqueda] = useState('');
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [actualizandoAceptacion, setActualizandoAceptacion] = useState('');

    useEffect(() => {
        let activo = true;

        async function actualizarTickets() {
            try {
                const respuesta = await fetch('/api/cliente/solicitudes-bodega');
                if (!respuesta.ok) throw new Error('No se pudieron cargar los tickets de bodega.');
                const solicitudes = await respuesta.json();
                if (!activo) return;
                setTickets(solicitudes.map(solicitud => ({
                    id: solicitud.numero_solicitud,
                    productos: solicitud.productos,
                    ubicacion: solicitud.ubicacion_destino,
                    prioridad: solicitud.prioridad,
                    estado: solicitud.estado,
                    solicitante: solicitud.solicitante,
                    fecha: new Date(solicitud.creado_en).toLocaleDateString('es-GT'),
                    notas: solicitud.notas || 'Sin observaciones.',
                    enviado: solicitud.enviado,
                    aceptado: solicitud.aceptado
                })));
                setError('');
            } catch (errorCarga) {
                if (activo) {
                    setError(errorCarga.message || 'No se pudieron cargar los tickets de bodega.');
                }
            }
        }

        actualizarTickets();
        const intervalo = window.setInterval(actualizarTickets, 10000);
        return () => {
            activo = false;
            window.clearInterval(intervalo);
        };
    }, []);

    async function cambiarAceptacion(ticket, aceptado) {
        setActualizandoAceptacion(ticket.id);
        setError('');

        try {
            const respuesta = await fetch(
                `/api/cliente/solicitudes-bodega/${encodeURIComponent(ticket.id)}/aceptacion`,
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

            setTickets(anterior => anterior.map(item => (
                item.id === ticket.id
                    ? { ...item, aceptado: datos.aceptado, estado: datos.estado }
                    : item
            )));
            setMensaje(datos.aceptado
                ? `Ticket ${ticket.id} aceptado. En proceso de preparación de los productos.`
                : `Se quitó la aceptación del ticket ${ticket.id}.`);
        } catch (errorActualizacion) {
            setError(errorActualizacion.message || 'No se pudo actualizar el ticket.');
        } finally {
            setActualizandoAceptacion('');
        }
    }

    const ticketsVisibles = tickets.filter(ticket => {
        const productos = ticket.productos || [
            { producto: ticket.producto, cantidad: ticket.cantidad }
        ];
        const nombres = productos.map(item => item.producto).join(' ');
        const texto = `${ticket.id} ${nombres} ${ticket.ubicacion}`.toLowerCase();
        const coincideBusqueda = texto.includes(busqueda.trim().toLowerCase());
        const coincideFiltro = filtro === 'Todas' || ticket.estado === filtro;
        return coincideBusqueda && coincideFiltro;
    });

    return (
        <section className="ticket-page">
            <style>{`
                .ticket-page { color: #173459; }
                .ticket-heading h1 { margin: 0; color: #102a54; font-size: 25px; }
                .ticket-heading p { margin: 7px 0 22px; color: #718097; font-size: 12px; }
                .ticket-panel { overflow: hidden; border: 1px solid #dce4ee; border-radius: 9px; background: white; box-shadow: 0 2px 7px rgba(31,64,105,.04); }
                .ticket-toolbar { display: grid; grid-template-columns: 1fr 160px; gap: 10px; padding: 15px 18px; border-bottom: 1px solid #edf1f6; }
                .ticket-toolbar input, .ticket-toolbar select { width: 100%; padding: 9px 10px; border: 1px solid #d7e0eb; border-radius: 5px; color: #233e63; background: white; font-size: 11px; }
                .ticket-list { display: grid; gap: 10px; padding: 15px; }
                .ticket-card { padding: 15px; border: 1px solid #e1e8f0; border-left: 4px solid #2879da; border-radius: 6px; }
                .ticket-card-header, .ticket-card-meta { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
                .ticket-card-header strong { color: #153462; font-size: 12px; }
                .ticket-card-header small, .ticket-card-meta, .ticket-card-notes { color: #718097; font-size: 10px; }
                .ticket-products { display: grid; gap: 4px; margin: 11px 0; color: #52657d; font-size: 10px; }
                .ticket-card-notes { margin: 10px 0; }
                .ticket-card-meta { justify-content: flex-start; flex-wrap: wrap; }
                .ticket-checks { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; }
                .ticket-check { display: inline-flex; align-items: center; gap: 6px; color: #52657d; font-size: 10px; }
                .ticket-check input { accent-color: #16803c; }
                .ticket-message { margin: 0 15px; padding: 10px 12px; border: 1px solid #a8dfbf; border-radius: 6px; color: #125c36; background: #e4f6ed; font-size: 11px; font-weight: 700; }
                .ticket-badge { padding: 4px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; }
                .ticket-badge.pendiente { color: #996400; background: #fff1d5; }
                .ticket-badge.en-preparación { color: #175eaa; background: #e0efff; }
                .ticket-badge.atendida { color: #147748; background: #ddf4e8; }
                .ticket-badge.cancelada { color: #b13e3e; background: #ffe4e4; }
                .ticket-priority { color: #d34c2e; font-size: 9px; font-weight: 700; }
                .ticket-priority.urgent { padding: 4px 7px; border-radius: 10px; color: #a51f1f; background: #ffe1e1; }
                .ticket-empty { padding: 30px; color: #718097; text-align: center; font-size: 11px; }
                @media (max-width: 600px) { .ticket-toolbar { grid-template-columns: 1fr; } .ticket-card-header { align-items: flex-start; flex-direction: column; } }
            `}</style>

            <div className="ticket-heading">
                <h1>Tickets de Solicitudes</h1>
                <p>Solicitudes creadas desde la tienda para preparar productos en bodega.</p>
            </div>

            <div className="ticket-panel">
                <div className="ticket-toolbar">
                    <input
                        value={busqueda}
                        onChange={evento => setBusqueda(evento.target.value)}
                        placeholder="Buscar por ticket, producto o tienda"
                        aria-label="Buscar tickets"
                    />
                    <select value={filtro} onChange={evento => setFiltro(evento.target.value)} aria-label="Filtrar tickets">
                        <option>Todas</option>
                        <option>Pendiente</option>
                        <option>En preparación</option>
                        <option>Atendida</option>
                        <option>Cancelada</option>
                    </select>
                </div>

                {error && <div className="ticket-empty" role="status">{error}</div>}
                {mensaje && <div className="ticket-message" role="status" aria-live="polite">{mensaje}</div>}

                <div className="ticket-list">
                    {ticketsVisibles.length === 0 && (
                        <div className="ticket-empty">No hay tickets que coincidan con la búsqueda.</div>
                    )}
                    {ticketsVisibles.map(ticket => {
                        const productos = ticket.productos || [
                            { producto: ticket.producto, cantidad: ticket.cantidad }
                        ];
                        const claseEstado = ticket.estado.toLowerCase().replace(' ', '-');
                        const total = productos.reduce((suma, item) => suma + Number(item.cantidad), 0);

                        return (
                            <article className="ticket-card" key={ticket.id}>
                                <div className="ticket-card-header">
                                    <strong>{ticket.id} · {productos.length} producto(s)</strong>
                                    <small>{ticket.fecha} · {ticket.solicitante}</small>
                                </div>
                                <div className="ticket-products">
                                    {productos.map((item, index) => (
                                        <span key={`${ticket.id}-${item.producto}-${index}`}>
                                            {item.cantidad} × {item.producto}
                                        </span>
                                    ))}
                                </div>
                                <p className="ticket-card-notes">{ticket.notas}</p>
                                <div className="ticket-card-meta">
                                    <span>{total} unidades</span>
                                    <span>Destino: {ticket.ubicacion}</span>
                                    <span className={`ticket-priority ${ticket.prioridad === 'Urgente' ? 'urgent' : ''}`}>
                                        {ticket.prioridad === 'Urgente' ? 'URGENTE' : `Prioridad ${ticket.prioridad}`}
                                    </span>
                                    <span className={`ticket-badge ${claseEstado}`}>{ticket.estado}</span>
                                </div>
                                <div className="ticket-checks">
                                    <label className="ticket-check">
                                        <input type="checkbox" checked={Boolean(ticket.enviado)} disabled readOnly />
                                        Ticket enviado
                                    </label>
                                    <label className="ticket-check">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(ticket.aceptado)}
                                            disabled={actualizandoAceptacion === ticket.id}
                                            onChange={evento => cambiarAceptacion(ticket, evento.target.checked)}
                                        />
                                        Ticket aceptado
                                    </label>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default Ticket;
