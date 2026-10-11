import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const crearIcono = (simbolo) => function Icono({ size = 16, className = "", style, ...props }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", width: size, height: size, fontSize: Math.max(11, size * 0.9), lineHeight: 1, ...style }}
      {...props}
    >
      {simbolo}
    </span>
  );
};

const BarChart3 = crearIcono("▥");
const Search = crearIcono("⌕");
const Filter = crearIcono("☷");
const RotateCcw = crearIcono("↻");
const Download = crearIcono("↓");
const Plus = crearIcono("+");
const Eye = crearIcono("◉");
const FileText = crearIcono("▤");
const MoreVertical = crearIcono("⋮");
const CalendarDays = crearIcono("▦");
const User = crearIcono("●");
const Phone = crearIcono("☎");
const Package = crearIcono("▣");
const CreditCard = crearIcono("▱");
const ShoppingCart = crearIcono("🛒");
const DollarSign = crearIcono("Q");
const Receipt = crearIcono("▧");
const Clock = crearIcono("◷");
const X = crearIcono("×");
const ChevronLeft = crearIcono("‹");
const ChevronRight = crearIcono("›");
const CheckCircle2 = crearIcono("✓");
const AlertCircle = crearIcono("!");
const XCircle = crearIcono("×");
const Truck = crearIcono("▰");
const Store = crearIcono("⌂");
const moneda = (valor) =>
  `Q ${Number(valor).toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function normalizarVenta(registro) {
  const fecha = new Date(registro.fecha_venta);
  const estadoPorCodigo = {
    COMPLETADA: "Completada",
    PENDIENTE: "Pendiente",
    ANULADA: "Anulada",
    DEVUELTA: "Devuelta",
  };
  const pagoPorCodigo = {
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
    TRANSFERENCIA: "Transferencia",
    DEPOSITO: "Depósito",
    CREDITO: "Crédito",
  };
  const vendedor = registro.vendedor || "No registrado";
  const detalleProductos = (Array.isArray(registro.detalles) ? registro.detalles : []).map((detalle) => ({
    nombre: detalle.producto || "Producto",
    cantidad: Number(detalle.cantidad) || 0,
    precio: Number(detalle.precio_unitario) || 0,
  }));
  const iniciales = vendedor.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0].toUpperCase()).join("") || "NV";

  return {
    id: `V-${String(registro.venta_id).padStart(6, "0")}`,
    fechaISO: fecha.toISOString(),
    fecha: fecha.toLocaleDateString("es-GT"),
    hora: fecha.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }),
    cliente: registro.cliente || "Consumidor Final",
    telefono: registro.telefono || "Sin teléfono",
    productos: Number(registro.unidades) || detalleProductos.reduce((suma, producto) => suma + producto.cantidad, 0),
    total: Number(registro.total) || 0,
    metodoPago: pagoPorCodigo[registro.tipo_pago] || registro.tipo_pago || "Sin especificar",
    estado: estadoPorCodigo[registro.estado] || registro.estado || "Pendiente",
    realizadaPor: vendedor,
    iniciales,
    entrega: "Retiro en Tienda",
    envio: 0,
    detalleProductos,
  };
}
function EstadoBadge({ estado }) {
  const configuracion = {
    Completada: {
      icono: CheckCircle2,
      clase: "estado-completada",
    },
    Pendiente: {
      icono: AlertCircle,
      clase: "estado-pendiente",
    },
    Anulada: {
      icono: XCircle,
      clase: "estado-anulada",
    },
    Devuelta: {
      icono: XCircle,
      clase: "estado-anulada",
    },
  };

  const config = configuracion[estado] || configuracion.Pendiente;
  const Icon = config.icono;

  return (
    <span className={`estado-badge ${config.clase}`}>
      <Icon size={14} />
      {estado}
    </span>
  );
}

export default function Ventas() {
  const navigate = useNavigate();
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [pagoFiltro, setPagoFiltro] = useState("Todos");
  const [fechaFiltro, setFechaFiltro] = useState("Todas");
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(true);
  const [pagina, setPagina] = useState(1);
  const ventasPorPagina = 8;
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [comprobanteVenta, setComprobanteVenta] = useState(null);

  useEffect(() => {
    let activo = true;
    async function cargarVentas() {
      try {
        const respuesta = await fetch("/api/cliente/ventas");
        const datos = await respuesta.json().catch(() => []);
        if (!respuesta.ok) throw new Error(datos.error || "No se pudieron cargar las ventas.");
        const lista = Array.isArray(datos) ? datos.map(normalizarVenta) : [];
        if (!activo) return;
        setVentas(lista);
        setVentaSeleccionada(lista[0] || null);
        setError("");
      } catch (errorCarga) {
        if (activo) setError(errorCarga.message || "No se pudieron cargar las ventas.");
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargarVentas();
    return () => { activo = false; };
  }, []);

  const ventasFiltradas = useMemo(() => {
    const hoy = new Date();
    const inicioRango = new Date(hoy);
    inicioRango.setHours(0, 0, 0, 0);
    if (fechaFiltro === "Últimos 7 días") inicioRango.setDate(inicioRango.getDate() - 6);
    if (fechaFiltro === "Últimos 30 días") inicioRango.setDate(inicioRango.getDate() - 29);

    return ventas.filter((venta) => {
      const texto = busqueda.toLowerCase().trim();
      const coincideBusqueda = !texto
        || venta.id.toLowerCase().includes(texto)
        || venta.cliente.toLowerCase().includes(texto)
        || venta.realizadaPor.toLowerCase().includes(texto);
      const coincideEstado = estadoFiltro === "Todos" || venta.estado === estadoFiltro;
      const coincidePago = pagoFiltro === "Todos" || venta.metodoPago === pagoFiltro;
      const fechaVenta = new Date(venta.fechaISO);
      let coincideFecha = true;
      if (!Number.isNaN(fechaVenta.getTime())) {
        if (fechaFiltro === "Este mes") {
          coincideFecha = fechaVenta.getMonth() === hoy.getMonth() && fechaVenta.getFullYear() === hoy.getFullYear();
        } else if (fechaFiltro === "Este año") {
          coincideFecha = fechaVenta.getFullYear() === hoy.getFullYear();
        } else if (fechaFiltro === "Últimos 7 días" || fechaFiltro === "Últimos 30 días") {
          coincideFecha = fechaVenta >= inicioRango && fechaVenta <= hoy;
        }
      }
      return coincideBusqueda && coincideEstado && coincidePago && coincideFecha;
    });
  }, [ventas, busqueda, estadoFiltro, pagoFiltro, fechaFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(ventasFiltradas.length / ventasPorPagina));
  const inicio = (pagina - 1) * ventasPorPagina;
  const ventasPagina = ventasFiltradas.slice(inicio, inicio + ventasPorPagina);
  const ventasCompletadas = ventas.filter((venta) => venta.estado === "Completada");
  const ventasPendientes = ventas.filter((venta) => venta.estado === "Pendiente");
  const ahora = new Date();
  const ventasCompletadasMes = ventasCompletadas.filter((venta) => {
    const fecha = new Date(venta.fechaISO);
    return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
  });
  const ventasDelMes = ventasCompletadasMes.reduce((total, venta) => total + venta.total, 0);
  const ticketPromedio = ventasCompletadasMes.length > 0 ? ventasDelMes / ventasCompletadasMes.length : 0;

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstadoFiltro("Todos");
    setPagoFiltro("Todos");
    setFechaFiltro("Todas");
    setPagina(1);
  };

  const seleccionarVenta = (venta) => {
    setVentaSeleccionada(venta);
    setMostrarDetalle(true);
    setMenuAbierto(null);
  };

  const verVenta = (venta) => {
    seleccionarVenta(venta);
  };

  const verComprobante = (venta) => {
    setComprobanteVenta(venta);
    setMenuAbierto(null);
  };

  const escaparHtml = (valor) => String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[caracter]);

  const descargarComprobante = (venta) => {
    const filasProductos = venta.detalleProductos.map((producto) => `
      <tr>
        <td>${escaparHtml(producto.nombre)}</td>
        <td>${producto.cantidad}</td>
        <td>Q ${Number(producto.precio).toFixed(2)}</td>
        <td>Q ${(Number(producto.precio) * Number(producto.cantidad)).toFixed(2)}</td>
      </tr>
    `).join("");
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comprobante ${escaparHtml(venta.id)}</title><style>body{font:14px Arial,sans-serif;color:#18345a;max-width:760px;margin:40px auto;padding:24px}h1{margin:0;color:#123b78}p{color:#61748e}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:10px;border-bottom:1px solid #dce5ef}th{background:#f2f6fb}.total{text-align:right;font-size:20px;font-weight:bold}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px}.meta strong{display:block;color:#123b78}@media print{body{margin:0}}</style></head><body><h1>Comercial San Cristóbal</h1><p>Comprobante de venta ${escaparHtml(venta.id)}</p><div class="meta"><div><strong>Fecha</strong>${escaparHtml(venta.fecha)} ${escaparHtml(venta.hora)}</div><div><strong>Vendedor</strong>${escaparHtml(venta.realizadaPor)}</div><div><strong>Cliente</strong>${escaparHtml(venta.cliente)}</div><div><strong>Pago</strong>${escaparHtml(venta.metodoPago)}</div></div><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>${filasProductos}</tbody></table><div class="total">Total: ${escaparHtml(moneda(venta.total))}</div><p>Estado: ${escaparHtml(venta.estado)}</p></body></html>`;
    const archivo = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `comprobante-${venta.id}.html`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
    setMenuAbierto(null);
  };
  const nuevaVenta = () => navigate("/vendedor/realizarventas");

  const exportarVentas = () => {
    const encabezados = ["Venta", "Fecha", "Hora", "Cliente", "Productos", "Total", "Método de pago", "Estado", "Realizada por"];
    const filas = ventasFiltradas.map((venta) => [
      venta.id, venta.fecha, venta.hora, venta.cliente, venta.productos,
      venta.total.toFixed(2), venta.metodoPago, venta.estado, venta.realizadaPor,
    ]);
    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map((dato) => `"${String(dato).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF", contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "ventas_comercial_san_cristobal.csv";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) setPagina(nuevaPagina);
  };
  return (
    <div className="ventas-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .ventas-page {
          min-height: calc(100vh - 70px);
          background: #f5f8fc;
          color: #173b73;
          padding: 28px 30px 35px;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .ventas-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          gap: 20px;
        }

        .ventas-title-container {
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }

        .ventas-title-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #e6f0ff;
          color: #1764d6;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ventas-title {
          margin: 0;
          font-size: 30px;
          line-height: 1.15;
          color: #123b78;
          font-weight: 800;
        }

        .ventas-subtitle {
          margin: 7px 0 0;
          color: #7183a3;
          font-size: 15px;
        }

        .ventas-header-actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          border: none;
          border-radius: 9px;
          height: 42px;
          padding: 0 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          transition: 0.2s ease;
        }

        .btn-primary {
          background: #0969e8;
          color: white;
          box-shadow: 0 5px 14px rgba(9, 105, 232, 0.2);
        }

        .btn-primary:hover {
          background: #075dcc;
          transform: translateY(-1px);
        }

        .btn-outline {
          background: white;
          color: #16437e;
          border: 1px solid #cbdcf3;
        }

        .btn-outline:hover {
          background: #f1f6fd;
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .metric-card {
          background: white;
          border: 1px solid #e2ebf6;
          border-radius: 10px;
          padding: 17px;
          min-height: 120px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 3px 12px rgba(32, 73, 122, 0.04);
        }

        .metric-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-blue {
          color: #1764d6;
          background: #e2efff;
        }

        .metric-green {
          color: #11a875;
          background: #e0f8ef;
        }

        .metric-purple {
          color: #7547db;
          background: #eee8ff;
        }

        .metric-orange {
          color: #e49a20;
          background: #fff0d7;
        }

        .metric-label {
          color: #244a7e;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .metric-value {
          color: #10376e;
          font-size: 21px;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .metric-change {
          font-size: 12px;
          color: #8495ae;
        }

        .metric-change strong {
          color: #0ba576;
          margin-right: 5px;
        }

        .filter-card {
          background: white;
          border: 1px solid #e0e9f4;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 17px;
          display: grid;
          grid-template-columns: minmax(240px, 1.8fr) 1fr 1fr 1fr auto auto;
          gap: 10px;
          align-items: center;
        }

        .search-box {
          height: 42px;
          border: 1px solid #cbdcf0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          gap: 9px;
          background: white;
        }

        .search-box svg {
          color: #6c87ad;
          flex-shrink: 0;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          color: #244a7e;
          font-size: 13px;
          background: transparent;
        }

        .search-box input::placeholder {
          color: #8da0bb;
        }

        .select-box {
          position: relative;
        }

        .select-box select {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #cbdcf0;
          border-radius: 8px;
          background: white;
          color: #385984;
          outline: none;
          font-size: 13px;
          cursor: pointer;
        }

        .filter-btn {
          height: 42px;
          border: none;
          border-radius: 8px;
          background: #0969e8;
          color: white;
          padding: 0 18px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 700;
          cursor: pointer;
        }

        .clear-btn {
          height: 42px;
          border: 1px solid #d7e2ef;
          border-radius: 8px;
          background: white;
          color: #47658c;
          padding: 0 14px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 600;
          cursor: pointer;
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 250px;
          gap: 14px;
          align-items: start;
        }

        .table-card {
          background: white;
          border: 1px solid #e0e9f4;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 3px 12px rgba(32, 73, 122, 0.035);
        }

        .table-header {
          height: 58px;
          padding: 0 18px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #e6edf6;
        }

        .table-header h2 {
          margin: 0;
          font-size: 16px;
          color: #123c78;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 980px;
        }

        thead {
          background: #f5f8fc;
        }

        th {
          text-align: left;
          color: #315580;
          font-size: 11px;
          font-weight: 800;
          padding: 13px 10px;
          white-space: nowrap;
          border-bottom: 1px solid #e2eaf4;
        }

        td {
          padding: 12px 10px;
          color: #526e95;
          font-size: 12px;
          border-bottom: 1px solid #edf2f7;
          vertical-align: middle;
        }

        tbody tr {
          cursor: pointer;
          transition: 0.15s ease;
        }

        tbody tr:hover {
          background: #f8fbff;
        }

        tbody tr.selected {
          background: #eef6ff;
        }

        .venta-id {
          color: #0b60d6;
          font-weight: 800;
        }

        .fecha-cell {
          white-space: nowrap;
          color: #4d6890;
        }

        .fecha-cell strong {
          display: block;
          color: #34557f;
          font-weight: 700;
        }

        .cliente-cell {
          min-width: 145px;
        }

        .cliente-nombre {
          display: block;
          color: #173e77;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .cliente-phone {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #7890ae;
          font-size: 11px;
        }

        .productos-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .total-cell {
          color: #173f79;
          font-weight: 800;
          white-space: nowrap;
        }

        .pago-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .pago-icon {
          width: 25px;
          height: 25px;
          border-radius: 6px;
          background: #eef5ff;
          color: #1764d6;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .estado-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 20px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .estado-completada {
          color: #079568;
          background: #dcf7eb;
        }

        .estado-pendiente {
          color: #c67a08;
          background: #fff0cf;
        }

        .estado-anulada {
          color: #d83242;
          background: #ffe0e3;
        }

        .vendedor {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 125px;
        }

        .avatar {
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: #0b69dd;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .vendedor span {
          font-size: 11px;
          color: #34567f;
          font-weight: 600;
        }

        .acciones {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .icon-btn {
          width: 30px;
          height: 30px;
          border: 1px solid #dce6f1;
          background: white;
          color: #1a5da9;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .icon-btn:hover {
          background: #eef5ff;
          border-color: #bfd5ef;
        }

        .more-container {
          position: relative;
        }

        .more-menu {
          position: absolute;
          z-index: 30;
          right: 0;
          top: 35px;
          width: 145px;
          background: white;
          border: 1px solid #dce7f3;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(25, 58, 96, 0.15);
          padding: 5px;
        }

        .more-menu button {
          width: 100%;
          border: none;
          background: transparent;
          padding: 9px;
          text-align: left;
          border-radius: 6px;
          cursor: pointer;
          color: #36567f;
          font-size: 12px;
        }

        .more-menu button:hover {
          background: #f0f6fd;
        }

        .pagination {
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          color: #6c82a1;
          font-size: 12px;
        }

        .pagination-controls {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .page-btn {
          width: 30px;
          height: 30px;
          border: 1px solid #d7e3ef;
          border-radius: 7px;
          background: white;
          color: #466488;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-btn:hover {
          background: #f0f6ff;
        }

        .page-btn.active {
          background: #0969e8;
          border-color: #0969e8;
          color: white;
          font-weight: 700;
        }

        .page-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .detail-card {
          background: white;
          border: 1px solid #e0e9f4;
          border-radius: 10px;
          overflow: hidden;
          position: sticky;
          top: 20px;
          box-shadow: 0 3px 12px rgba(32, 73, 122, 0.035);
        }

        .detail-header {
          padding: 15px;
          border-bottom: 1px solid #e7eef6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .detail-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #21487e;
          font-weight: 800;
        }

        .close-detail {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          background: #f2f6fb;
          color: #6b82a0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .detail-body {
          padding: 15px;
        }

        .detail-id-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 13px;
        }

        .detail-id {
          color: #123c78;
          font-size: 19px;
          font-weight: 800;
        }

        .detail-section {
          padding: 13px 0;
          border-bottom: 1px solid #edf2f7;
        }

        .detail-section:last-child {
          border-bottom: none;
        }

        .detail-line {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-bottom: 10px;
          color: #617c9f;
          font-size: 11px;
        }

        .detail-line:last-child {
          margin-bottom: 0;
        }

        .detail-line svg {
          color: #3978c8;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .detail-line strong {
          display: block;
          color: #234a7e;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .detail-product-box {
          background: #f7faff;
          border: 1px solid #e1ebf6;
          border-radius: 8px;
          padding: 11px;
        }

        .detail-product-title {
          color: #20477b;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 9px;
        }

        .product-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 7px;
          color: #557193;
          font-size: 10px;
        }

        .product-row:last-child {
          margin-bottom: 0;
        }

        .product-price {
          color: #234878;
          font-weight: 700;
          white-space: nowrap;
        }

        .detail-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          color: #567292;
          font-size: 11px;
        }

        .detail-total strong {
          color: #123d79;
          font-size: 16px;
        }

        .detail-main-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          color: #123d79;
          font-size: 13px;
          font-weight: 800;
        }

        .detail-main-total strong {
          font-size: 17px;
        }

        .detail-full-btn {
          width: 100%;
          height: 38px;
          border-radius: 7px;
          border: 1px solid #cbdff4;
          background: white;
          color: #145cb5;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 13px;
        }

        .detail-full-btn:hover {
          background: #eef6ff;
        }
        .receipt-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 20px; background: rgba(13, 31, 55, 0.55); }
        .receipt-modal { width: min(620px, 100%); max-height: min(85vh, 780px); overflow: auto; padding: 24px; border-radius: 14px; background: #fff; box-shadow: 0 24px 70px rgba(13, 31, 55, 0.3); }
        .receipt-modal-header, .receipt-modal-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .receipt-modal-header h2 { margin: 0; color: #123c78; }
        .receipt-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
        .receipt-meta div { color: #526e95; }
        .receipt-meta strong { display: block; color: #173b73; }
        .receipt-table { min-width: 0; }
        .receipt-total { margin: 18px 0; text-align: right; font-size: 20px; font-weight: 800; color: #123c78; }
        .receipt-modal-actions { justify-content: flex-end; }
        .receipt-action-btn { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; font-weight: 700; }
        .receipt-close-btn { background: #edf2f8; color: #315580; }
        .receipt-download-btn { display: inline-flex; align-items: center; gap: 7px; background: #1764d6; color: white; }

        @media (max-width: 1250px) {
          .filter-card {
            grid-template-columns: 1fr 1fr 1fr;
          }

          .search-box {
            grid-column: span 3;
          }

          .main-grid {
            grid-template-columns: 1fr;
          }

          .detail-card {
            position: static;
          }
        }

        @media (max-width: 900px) {
          .metric-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .ventas-page {
            padding: 20px;
          }

          .ventas-header {
            flex-direction: column;
          }

          .filter-card {
            grid-template-columns: 1fr 1fr;
          }

          .search-box {
            grid-column: span 2;
          }
        }

        @media (max-width: 600px) {
          .metric-grid {
            grid-template-columns: 1fr;
          }

          .filter-card {
            grid-template-columns: 1fr;
          }

          .search-box {
            grid-column: auto;
          }

          .ventas-header-actions {
            width: 100%;
          }

          .ventas-header-actions .btn {
            flex: 1;
          }

          .ventas-title {
            font-size: 24px;
          }

          .pagination {
            flex-direction: column;
            gap: 10px;
            padding: 12px;
          }
        }
      `}</style>

      {/* =====================================================
          ENCABEZADO
      ====================================================== */}

      <div className="ventas-header">
        <div className="ventas-title-container">
          <div className="ventas-title-icon">
            <BarChart3 size={27} />
          </div>

          <div>
            <h1 className="ventas-title">Ventas</h1>

            <p className="ventas-subtitle">
              Consulta y administra todas las ventas realizadas en el sistema.
            </p>
          </div>
        </div>

        <div className="ventas-header-actions">
          <button className="btn btn-primary" onClick={nuevaVenta}>
            <Plus size={18} />
            Nueva venta
          </button>

          <button className="btn btn-outline" onClick={exportarVentas}>
            <Download size={17} />
            Exportar
          </button>
        </div>
      </div>

      {/* =====================================================
          TARJETAS RESUMEN
      ====================================================== */}

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon metric-blue">
            <DollarSign size={26} />
          </div>

          <div>
            <div className="metric-label">Ventas del mes</div>

            <div className="metric-value">
              {moneda(ventasDelMes)}
            </div>

            <div className="metric-change">
              Ventas completadas este mes
              
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-green">
            <Receipt size={26} />
          </div>

          <div>
            <div className="metric-label">Transacciones</div>

            <div className="metric-value">
              {ventasCompletadasMes.length}
            </div>

            <div className="metric-change">
              Ventas completadas este mes
              
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-purple">
            <ShoppingCart size={26} />
          </div>

          <div>
            <div className="metric-label">Ticket promedio</div>

            <div className="metric-value">
              {moneda(ticketPromedio)}
            </div>

            <div className="metric-change">
              Promedio de ventas del mes
              
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-orange">
            <Clock size={26} />
          </div>

          <div>
            <div className="metric-label">Ventas pendientes</div>

            <div className="metric-value">
              {ventasPendientes.length}
            </div>

            <div className="metric-change">
              Requieren atención
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTROS
      ====================================================== */}

      <div className="filter-card">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar por número de venta, cliente o vendedor..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
          />
        </div>

        <div className="select-box">
          <select
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value);
              setPagina(1);
            }}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Completada">Completadas</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Anulada">Anuladas</option>
            <option value="Devuelta">Devueltas</option>
          </select>
        </div>

        <div className="select-box">
          <select
            value={pagoFiltro}
            onChange={(e) => {
              setPagoFiltro(e.target.value);
              setPagina(1);
            }}
          >
            <option value="Todos">Todos los pagos</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Depósito">Depósito</option>
            <option value="Crédito">Crédito</option>
          </select>
        </div>

        <div className="select-box">
          <select
            value={fechaFiltro}
            onChange={(e) => { setFechaFiltro(e.target.value); setPagina(1); }}
          >
            <option value="Todas">Todas las fechas</option>
            <option>Este mes</option>
            <option>Últimos 7 días</option>
            <option>Últimos 30 días</option>
            <option>Este año</option>
          </select>
        </div>

        <button className="filter-btn" onClick={() => setPagina(1)}>
          <Filter size={16} />
          Filtrar
        </button>

        <button className="clear-btn" onClick={limpiarFiltros}>
          <RotateCcw size={15} />
          Limpiar
        </button>
      </div>

      {/* =====================================================
          TABLA + DETALLE
      ====================================================== */}

      <div className="main-grid">
        <div className="table-card">
          <div className="table-header">
            <h2>
              <FileText size={18} />
              Historial de ventas
            </h2>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th># Venta</th>
                  <th>Fecha y hora</th>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Método de pago</th>
                  <th>Estado</th>
                  <th>Realizada por</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {ventasPagina.length > 0 ? (
                  ventasPagina.map((venta) => (
                    <tr
                      key={venta.id}
                      className={
                        ventaSeleccionada?.id === venta.id
                          ? "selected"
                          : ""
                      }
                      onClick={() => verVenta(venta)}
                    >
                      <td>
                        <span className="venta-id">
                          {venta.id}
                        </span>
                      </td>

                      <td className="fecha-cell">
                        <strong>{venta.fecha}</strong>
                        {venta.hora}
                      </td>

                      <td className="cliente-cell">
                        <span className="cliente-nombre">
                          {venta.cliente}
                        </span>

                        <span className="cliente-phone">
                          <Phone size={11} />
                          {venta.telefono}
                        </span>
                      </td>

                      <td>
                        <div className="productos-cell">
                          <Package size={15} />
                          {venta.productos} productos
                        </div>
                      </td>

                      <td className="total-cell">
                        {moneda(venta.total)}
                      </td>

                      <td>
                        <div className="pago-cell">
                          <span className="pago-icon">
                            <CreditCard size={13} />
                          </span>

                          {venta.metodoPago}
                        </div>
                      </td>

                      <td>
                        <EstadoBadge estado={venta.estado} />
                      </td>

                      <td>
                        <div className="vendedor">
                          <div className="avatar">
                            {venta.iniciales}
                          </div>

                          <span>{venta.realizadaPor}</span>
                        </div>
                      </td>

                      <td>
                        <div
                          className="acciones"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="icon-btn"
                            title="Ver venta"
                            onClick={() => verVenta(venta)}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            className="icon-btn"
                            title="Ver comprobante"
                            onClick={() => verComprobante(venta)}
                          >
                            <FileText size={15} />
                          </button>

                          <div className="more-container">
                            <button
                              className="icon-btn"
                              title="Más opciones"
                              onClick={() =>
                                setMenuAbierto(
                                  menuAbierto === venta.id
                                    ? null
                                    : venta.id
                                )
                              }
                            >
                              <MoreVertical size={15} />
                            </button>

                            {menuAbierto === venta.id && (
                              <div className="more-menu">
                                <button type="button" onClick={() => descargarComprobante(venta)}>
                                  Descargar comprobante
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      style={{
                        textAlign: "center",
                        padding: "45px",
                        color: "#758ba8",
                      }}
                    >
                      {cargando ? "Cargando ventas..." : error || (ventas.length === 0 ? "Todavía no hay ventas registradas." : "No se encontraron ventas con los filtros seleccionados.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              PAGINACIÓN
          ================================================== */}

          <div className="pagination">
            <span>
              Mostrando{" "}
              {ventasPagina.length === 0 ? 0 : inicio + 1} a{" "}
              {Math.min(
                inicio + ventasPagina.length,
                ventasFiltradas.length
              )}{" "}
              de {ventasFiltradas.length} ventas
            </span>

            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={pagina === 1}
                onClick={() => cambiarPagina(pagina - 1)}
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from(
                { length: totalPaginas },
                (_, index) => index + 1
              )
                .slice(0, 5)
                .map((numero) => (
                  <button
                    key={numero}
                    className={`page-btn ${
                      pagina === numero ? "active" : ""
                    }`}
                    onClick={() => cambiarPagina(numero)}
                  >
                    {numero}
                  </button>
                ))}

              <button
                className="page-btn"
                disabled={pagina === totalPaginas}
                onClick={() => cambiarPagina(pagina + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================
            DETALLE DE VENTA
        ==================================================== */}

        {mostrarDetalle && ventaSeleccionada && (
          <aside className="detail-card">
            <div className="detail-header">
              <div className="detail-header-title">
                <FileText size={16} />
                Detalle de venta
              </div>

              <button
                className="close-detail"
                onClick={() => setMostrarDetalle(false)}
              >
                <X size={15} />
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-id-row">
                <span className="detail-id">
                  {ventaSeleccionada.id}
                </span>

                <EstadoBadge
                  estado={ventaSeleccionada.estado}
                />
              </div>

              <div className="detail-section">
                <div className="detail-line">
                  <CalendarDays size={15} />

                  <div>
                    <strong>Fecha y hora</strong>
                    {ventaSeleccionada.fecha} -{" "}
                    {ventaSeleccionada.hora}
                  </div>
                </div>

                <div className="detail-line">
                  <User size={15} />

                  <div>
                    <strong>Cliente</strong>
                    {ventaSeleccionada.cliente}
                    <br />
                    {ventaSeleccionada.telefono}
                  </div>
                </div>

                <div className="detail-line">
                  <User size={15} />

                  <div>
                    <strong>Realizada por</strong>
                    {ventaSeleccionada.realizadaPor}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-product-box">
                  <div className="detail-product-title">
                    Productos ({ventaSeleccionada.productos})
                  </div>

                  {ventaSeleccionada.detalleProductos.map(
                    (producto, index) => (
                      <div
                        className="product-row"
                        key={index}
                      >
                        <span>
                          {producto.nombre} ×{" "}
                          {producto.cantidad}
                        </span>

                        <span className="product-price">
                          {moneda(
                            producto.precio *
                              producto.cantidad
                          )}
                        </span>
                      </div>
                    )
                  )}

                  <div className="detail-total">
                    <span>Subtotal</span>
                    <span>
                      {moneda(
                        ventaSeleccionada.total -
                          ventaSeleccionada.envio
                      )}
                    </span>
                  </div>

                  <div className="detail-total">
                    <span>Envío</span>
                    <span>
                      {moneda(ventaSeleccionada.envio)}
                    </span>
                  </div>

                  <div className="detail-main-total">
                    <span>Total</span>
                    <strong>
                      {moneda(ventaSeleccionada.total)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-line">
                  <CreditCard size={15} />

                  <div>
                    <strong>Método de pago</strong>
                    {ventaSeleccionada.metodoPago}
                  </div>
                </div>

                <div className="detail-line">
                  {ventaSeleccionada.entrega ===
                  "Retiro en Tienda" ? (
                    <Store size={15} />
                  ) : (
                    <Truck size={15} />
                  )}

                  <div>
                    <strong>Entrega</strong>
                    {ventaSeleccionada.entrega}
                  </div>
                </div>
              </div>

              <button
                className="detail-full-btn"
                onClick={() => verComprobante(ventaSeleccionada)}
              >
                <Eye size={15} />
                Ver comprobante
              </button>
            </div>
          </aside>
        )}

        {comprobanteVenta && (
          <div className="receipt-overlay" onClick={() => setComprobanteVenta(null)}>
            <section className="receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title" onClick={(e) => e.stopPropagation()}>
              <div className="receipt-modal-header">
                <h2 id="receipt-title">Comprobante de venta</h2>
                <button type="button" className="receipt-action-btn receipt-close-btn" aria-label="Cerrar comprobante" onClick={() => setComprobanteVenta(null)}><X size={16} /></button>
              </div>
              <p><strong>{comprobanteVenta.id}</strong> · {comprobanteVenta.fecha} {comprobanteVenta.hora}</p>
              <div className="receipt-meta">
                <div><strong>Vendedor</strong>{comprobanteVenta.realizadaPor}</div>
                <div><strong>Cliente</strong>{comprobanteVenta.cliente}</div>
                <div><strong>Método de pago</strong>{comprobanteVenta.metodoPago}</div>
                <div><strong>Estado</strong>{comprobanteVenta.estado}</div>
              </div>
              <div className="table-wrapper">
                <table className="receipt-table">
                  <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
                  <tbody>{comprobanteVenta.detalleProductos.map((producto, index) => (
                    <tr key={`${producto.nombre}-${index}`}><td>{producto.nombre}</td><td>{producto.cantidad}</td><td>{moneda(producto.precio)}</td><td>{moneda(producto.precio * producto.cantidad)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="receipt-total">Total: {moneda(comprobanteVenta.total)}</div>
              <div className="receipt-modal-actions">
                <button type="button" className="receipt-action-btn receipt-close-btn" onClick={() => setComprobanteVenta(null)}>Cerrar</button>
                <button type="button" className="receipt-action-btn receipt-download-btn" onClick={() => descargarComprobante(comprobanteVenta)}><Download size={15} />Descargar comprobante</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}