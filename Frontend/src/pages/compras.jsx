import React, { useEffect, useMemo, useState } from "react";

export default function Compras() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [productoDetalle, setProductoDetalle] = useState(null);
  const cargarProductos = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch("/api/cliente/productos");
      const datos = await respuesta.json().catch(() => []);
      if (!respuesta.ok) throw new Error(datos.error || "No se pudo cargar el inventario.");
      const lista = (Array.isArray(datos) ? datos : []).map((item) => ({
        id: Number(item.producto_id), codigo: `P${String(item.producto_id).padStart(4, "0")}`,
        producto: item.nombre || "Producto sin nombre", categoria: item.categoria || "Sin categoría",
        proveedor: "Solicitud interna a bodega", stockActual: Number(item.tienda_stock || 0),
        stockMinimo: Number(item.tienda_minimo || 0), stockMaximo: Number(item.tienda_maximo || 0),
        unidad: item.unidad_medida || item.unidad_simbolo || "Unidad", precio: Number(item.precio_venta || 0),
      }));
      setProductos(lista);
      setError("");
    } catch (errorCarga) { setError(errorCarga.message || "No se pudo cargar el inventario."); }
    finally { setCargando(false); }
  };
  const [busqueda, setBusqueda] = useState("");
  const [filtroPrioridad, setFiltroPrioridad] = useState("Todos");
  useEffect(() => { cargarProductos(); }, []);

  // =========================================================
  // ESTADO DEL PRODUCTO
  // =========================================================

  const obtenerEstado = (producto) => {
    if (producto.stockActual === 0) {
      return "Agotado";
    }

    if (producto.stockActual < producto.stockMinimo) {
      return "Stock Bajo";
    }

    return "Disponible";
  };

  const obtenerPrioridad = (producto) => {
    if (producto.stockActual === 0) {
      return "Crítica";
    }

    if (producto.stockActual <= producto.stockMinimo * 0.5) {
      return "Alta";
    }

    if (producto.stockActual < producto.stockMinimo) {
      return "Media";
    }

    return "Normal";
  };

  const cantidadSugerida = (producto) => {
    return Math.max(producto.stockMaximo - producto.stockActual, producto.stockMinimo - producto.stockActual, 1);
  };

  // =========================================================
  // PRODUCTOS QUE NECESITAN ABASTECIMIENTO
  // =========================================================

  const productosAbastecimiento = useMemo(() => productos
    .filter((producto) => producto.stockActual === 0 || producto.stockActual < producto.stockMinimo)
    .sort((a, b) => a.stockActual - b.stockActual), [productos]);

  // =========================================================
  // FILTROS
  // =========================================================

  const productosFiltrados = useMemo(() => {
    return productosAbastecimiento.filter((producto) => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        producto.producto.toLowerCase().includes(texto) ||
        producto.codigo.toLowerCase().includes(texto) ||
        producto.proveedor.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto);

      const prioridad = obtenerPrioridad(producto);

      const coincidePrioridad =
        filtroPrioridad === "Todos" ||
        prioridad === filtroPrioridad;

      return coincideBusqueda && coincidePrioridad;
    });
  }, [productosAbastecimiento, busqueda, filtroPrioridad]);

  // =========================================================
  // RESUMEN
  // =========================================================

  const productosBajos = productos.filter(
    (producto) =>
      producto.stockActual > 0 &&
      producto.stockActual < producto.stockMinimo
  ).length;

  const productosAgotados = productos.filter(
    (producto) => producto.stockActual === 0
  ).length;

  const proveedores = new Set(
    productosAbastecimiento.map((producto) => producto.proveedor)
  ).size;

  const totalUnidadesSolicitadas = productosAbastecimiento.reduce(
    (total, producto) => total + cantidadSugerida(producto),
    0
  );

  // RENDER
  // =========================================================

  return (
    <>
      <style>{`
        /* =====================================================
           COMPRAS - COMERCIAL SAN CRISTÓBAL
           ===================================================== */

        .compras-container {
          width: 100%;
          min-height: 100vh;
          padding: 30px 35px 45px;
          box-sizing: border-box;
          background: #f5f8fd;
          color: #172b4d;
          font-family: Arial, Helvetica, sans-serif;
        }

        .compras-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .compras-title h1 {
          margin: 0;
          font-size: 29px;
          font-weight: 700;
          color: #102a56;
        }

        .compras-title p {
          margin: 7px 0 0;
          color: #7183a3;
          font-size: 14px;
        }

        .btn-nuevo-pedido {
          border: none;
          background: linear-gradient(135deg, #1168e8, #0757cc);
          color: white;
          padding: 13px 21px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(19, 101, 224, 0.18);
          transition: 0.2s ease;
        }

        .btn-nuevo-pedido:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(19, 101, 224, 0.25);
        }

        /* TARJETAS */

        .compras-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e4eaf4;
          border-radius: 12px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 3px 12px rgba(30, 67, 112, 0.04);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .stat-icon.warning {
          background: #fff3dc;
        }

        .stat-icon.danger {
          background: #ffe8eb;
        }

        .stat-icon.provider {
          background: #e7f0ff;
        }

        .stat-icon.order {
          background: #e8f8f0;
        }

        .stat-content span {
          display: block;
          font-size: 12px;
          color: #7a8ca9;
          margin-bottom: 5px;
        }

        .stat-content strong {
          font-size: 22px;
          color: #172d56;
        }

        /* CONTENEDOR PRINCIPAL */

        .compras-panel {
          background: white;
          border: 1px solid #e1e8f3;
          border-radius: 13px;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(30, 67, 112, 0.05);
        }

        /* TOOLBAR */

        .compras-toolbar {
          padding: 17px;
          border-bottom: 1px solid #e8edf5;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 260px;
          position: relative;
        }

        .search-box span {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #7890b3;
          font-size: 16px;
        }

        .search-box input {
          width: 100%;
          height: 43px;
          border: 1px solid #d9e3f1;
          border-radius: 8px;
          padding: 0 14px 0 40px;
          box-sizing: border-box;
          outline: none;
          color: #20385f;
          font-size: 13px;
        }

        .search-box input:focus {
          border-color: #1870e8;
          box-shadow: 0 0 0 3px rgba(24, 112, 232, 0.08);
        }

        .select-filtro {
          height: 43px;
          min-width: 155px;
          border: 1px solid #d9e3f1;
          background: white;
          border-radius: 8px;
          padding: 0 12px;
          color: #37527a;
          outline: none;
        }

        .btn-filtrar {
          height: 43px;
          padding: 0 17px;
          border: 1px solid #d9e3f1;
          border-radius: 8px;
          background: white;
          color: #244b7c;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-filtrar:hover {
          background: #f5f8fd;
        }
        /* TABLA */

        .tabla-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .compras-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        .compras-table thead {
          background: #f6f9fd;
        }

        .compras-table th {
          text-align: left;
          padding: 14px 12px;
          font-size: 11px;
          text-transform: uppercase;
          color: #63799d;
          letter-spacing: 0.2px;
          font-weight: 700;
          border-bottom: 1px solid #e3eaf4;
        }

        .compras-table td {
          padding: 13px 12px;
          border-bottom: 1px solid #edf1f6;
          font-size: 12px;
          color: #405b82;
          vertical-align: middle;
        }

        .compras-table tbody tr:hover {
          background: #f9fbfe;
        }
.producto-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .producto-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #edf4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
        }

        .producto-nombre {
          font-weight: 700;
          color: #213d68;
          margin-bottom: 3px;
        }

        .producto-codigo {
          font-size: 11px;
          color: #8495af;
        }

        .proveedor {
          font-weight: 600;
          color: #425d83;
        }

        .stock-numero {
          font-weight: 700;
          color: #203a62;
        }

        .stock-minimo {
          color: #7388a6;
        }

        .stock-critico {
          color: #e63950;
          font-weight: 800;
        }

        .stock-bajo {
          color: #e99013;
          font-weight: 800;
        }

        .cantidad-sugerida {
          color: #1168e8;
          font-weight: 800;
          background: #edf5ff;
          border-radius: 6px;
          padding: 6px 9px;
          display: inline-block;
        }

        .estado {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 20px;
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 700;
        }

        .estado::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .estado-critico {
          color: #e6314b;
          background: #ffe9ed;
        }

        .estado-alto {
          color: #d97800;
          background: #fff1db;
        }

        .estado-medio {
          color: #d99016;
          background: #fff5df;
        }

        .estado-normal {
          color: #159466;
          background: #e6f7ef;
        }

        .btn-ver {
          border: 1px solid #d8e3f2;
          background: white;
          color: #1d5eb2;
          padding: 7px 10px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 12px;
        }

        .btn-ver:hover {
          background: #edf5ff;
        }
        .alerta-stock { margin: 0 0 22px; overflow: hidden; border: 1px solid #f0d6a4; border-radius: 15px; background: #fff; box-shadow: 0 8px 24px rgba(52, 77, 112, .06); }
        .alerta-stock-cabecera { display: flex; align-items: center; gap: 14px; padding: 18px 22px; background: linear-gradient(110deg, #fff8e9 0%, #fffdf8 74%); border-bottom: 1px solid #f4e8d1; }
        .alerta-stock-icono { display: grid; place-items: center; width: 42px; height: 42px; flex: 0 0 auto; border: 1px solid #f0d6a4; border-radius: 12px; background: #fff0cd; color: #a95b09; font-size: 22px; font-weight: 800; }
        .alerta-stock-titulo { flex: 1; min-width: 0; }
        .alerta-stock-titulo strong { display: block; color: #45361e; font-size: 15px; letter-spacing: -.1px; }
        .alerta-stock-titulo p { margin: 5px 0 0; color: #81745d; font-size: 12px; }
        .alerta-stock-contador { flex: 0 0 auto; padding: 7px 10px; border: 1px solid #f0d6a4; border-radius: 20px; background: #fff; color: #8e5a0b; font-size: 11px; font-weight: 800; }
        .alerta-stock-lista { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 10px; margin: 0; padding: 16px; list-style: none; }
        .alerta-stock-lista li { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 12px 13px; border: 1px solid #e9edf3; border-radius: 11px; background: #fff; transition: border-color .16s ease, transform .16s ease, box-shadow .16s ease; }
        .alerta-stock-lista li:hover { border-color: #d4dfed; transform: translateY(-1px); box-shadow: 0 5px 14px rgba(35, 59, 93, .06); }
        .alerta-stock-numero { display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 auto; border-radius: 9px; background: #f1f5fa; color: #647893; font-size: 12px; font-weight: 800; }
        .alerta-stock-info { flex: 1; min-width: 0; }
        .alerta-stock-info strong { display: block; overflow: hidden; color: #243b5d; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
        .alerta-stock-info small { display: block; margin-top: 4px; color: #7d8da4; font-size: 11px; }
        .alerta-stock-medidor { height: 4px; margin-top: 8px; overflow: hidden; border-radius: 8px; background: #edf1f6; }
        .alerta-stock-medidor span { display: block; height: 100%; border-radius: inherit; background: #e5a33a; }
        .alerta-stock-nivel { flex: 0 0 auto; padding: 6px 8px; border-radius: 7px; background: #fff5e5; color: #a05c07; font-size: 10px; font-weight: 800; white-space: nowrap; }
        .alerta-stock-nivel.agotado { background: #fff0f0; color: #bd3f45; }
        @media (max-width: 600px) { .alerta-stock-cabecera { align-items: flex-start; padding: 15px; } .alerta-stock-contador { margin-left: auto; } .alerta-stock-lista { grid-template-columns: 1fr; padding: 12px; } }
        .detalle-overlay { position: fixed; inset: 0; z-index: 1100; display: grid; place-items: center; padding: 20px; background: rgba(13, 31, 55, .55); }
        .detalle-modal { width: min(500px, 100%); padding: 24px; border: 1px solid #e2eaf4; border-radius: 16px; background: #fff; box-shadow: 0 24px 70px rgba(13, 31, 55, .28); }
        .detalle-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid #e9eef5; }
        .detalle-modal-header h2 { margin: 0; color: #173b73; font-size: 20px; }
        .detalle-modal-header p { margin: 6px 0 0; color: #8292a9; font-size: 12px; }
        .detalle-cerrar { border: 0; border-radius: 8px; padding: 7px 10px; background: #f1f5fa; color: #49617f; cursor: pointer; }
        .detalle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
        .detalle-dato { padding: 13px; border: 1px solid #e8eef6; border-radius: 10px; background: #f9fbfe; }
        .detalle-dato span { display: block; margin-bottom: 5px; color: #8091a9; font-size: 11px; }
        .detalle-dato strong { color: #234674; font-size: 15px; }
        .detalle-footer { display: flex; justify-content: flex-end; gap: 9px; padding-top: 15px; border-top: 1px solid #e9eef5; }
        .btn-ver { border-color: #bfd3ec; border-radius: 8px; padding: 8px 12px; color: #145cb5; font-weight: 700; transition: .18s ease; }
        .btn-ver:hover { border-color: #145cb5; background: #eaf3ff; transform: translateY(-1px); }

        /* FOOTER TABLA */

        .tabla-footer {
          padding: 14px 17px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #7185a4;
          font-size: 12px;
        }

        .paginacion {
          display: flex;
          gap: 5px;
        }

        .pagina {
          width: 32px;
          height: 32px;
          border: 1px solid #dbe4f1;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          color: #476388;
        }

        .pagina.activa {
          background: #1168e8;
          border-color: #1168e8;
          color: white;
          font-weight: 700;
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {
          .compras-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .compras-container {
            padding: 20px 15px;
          }

          .compras-header {
            flex-direction: column;
          }

          .compras-stats {
            grid-template-columns: 1fr;
          }
}
      `}</style>

      <div className="compras-container">

        {/* =====================================================
            ENCABEZADO
            ===================================================== */}

        <div className="compras-header">
          <div className="compras-title">
            <h1>Abastecimiento y Compras</h1>
            <p>
              Consulta los productos con bajo inventario y prioriza su reposición.
            </p>
          </div>
        </div>

        {/* =====================================================
            TARJETAS DE RESUMEN
            ===================================================== */}

        <div className="compras-stats">

          <div className="stat-card">
            <div className="stat-icon warning">
              ⚠️
            </div>

            <div className="stat-content">
              <span>Productos con stock bajo</span>
              <strong>{productosBajos}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon danger">
              ⛔
            </div>

            <div className="stat-content">
              <span>Productos agotados</span>
              <strong>{productosAgotados}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon order">
              📦
            </div>

            <div className="stat-content">
              <span>Unidades sugeridas</span>
              <strong>
                {totalUnidadesSolicitadas.toLocaleString()}
              </strong>
            </div>
          </div>

        </div>

        {productosAbastecimiento.length > 0 && (
          <section className="alerta-stock" role="status" aria-live="polite">
            <div className="alerta-stock-cabecera">
              <span className="alerta-stock-icono" aria-hidden="true">!</span>
              <div className="alerta-stock-titulo">
                <strong>Atención: productos bajos o agotados</strong>
                <p>Revisa primero los productos con menos existencias.</p>
              </div>
              <span className="alerta-stock-contador">{productosAbastecimiento.length} {productosAbastecimiento.length === 1 ? "producto" : "productos"}</span>
            </div>
            <ol className="alerta-stock-lista">
              {productosAbastecimiento.map((producto, index) => {
                const porcentajeStock = Math.min((producto.stockActual / Math.max(producto.stockMinimo, 1)) * 100, 100);
                const agotado = producto.stockActual === 0;
                return (
                  <li key={producto.id}>
                    <span className="alerta-stock-numero">{index + 1}</span>
                    <div className="alerta-stock-info">
                      <strong title={producto.producto}>{producto.producto}</strong>
                      <small>{producto.stockActual} de {producto.stockMinimo} {producto.unidad} · mínimo requerido</small>
                      <div className="alerta-stock-medidor" aria-label={`${Math.round(porcentajeStock)}% del stock mínimo`}>
                        <span style={{ width: `${porcentajeStock}%`, background: agotado ? "#d9535d" : undefined }} />
                      </div>
                    </div>
                    <span className={`alerta-stock-nivel ${agotado ? "agotado" : ""}`}>{agotado ? "Agotado" : "Stock bajo"}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
        {/* =====================================================
            PANEL PRINCIPAL
            ===================================================== */}

        <div className="compras-panel">

          {/* FILTROS */}

          <div className="compras-toolbar">

            <div className="search-box">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Buscar producto, código o proveedor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <select
              className="select-filtro"
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
            >
              <option value="Todos">Todas las prioridades</option>
              <option value="Crítica">Crítica</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
            </select>

            <button
              className="btn-filtrar"
              onClick={() => {
                setBusqueda("");
                setFiltroPrioridad("Todos");
              }}
            >
              ↻ Limpiar filtros
            </button>

          </div>
          {error && <div role="alert" style={{ padding: "12px 18px", color: "#b42318" }}>{error} <button type="button" onClick={cargarProductos}>Reintentar</button></div>}

          {/* TABLA */}

          <div className="tabla-wrapper">

            <table className="compras-table">

              <thead>

                <tr>

                  <th>Producto</th>

                  <th>Categoría</th>
                  <th>Stock actual</th>

                  <th>Stock mínimo</th>

                  <th>Cantidad sugerida</th>

                  <th>Prioridad</th>

                  <th>Acciones</th>

                </tr>

              </thead>

              <tbody>

                {productosFiltrados.length > 0 ? (

                  productosFiltrados.map((producto) => {

                    const prioridad = obtenerPrioridad(producto);

                    return (

                      <tr key={producto.id}>

                        <td>

                          <div className="producto-info">

                            <div className="producto-icon">
                              📦
                            </div>

                            <div>
                              <div className="producto-nombre">
                                {producto.producto}
                              </div>

                              <div className="producto-codigo">
                                Código: {producto.codigo}
                              </div>
                            </div>

                          </div>

                        </td>

                        <td>
                          {producto.categoria}
                        </td>
<td>

                          <span
                            className={
                              producto.stockActual === 0
                                ? "stock-critico"
                                : "stock-bajo"
                            }
                          >
                            {producto.stockActual}
                          </span>

                          <div style={{ fontSize: "10px", marginTop: "3px" }}>
                            {producto.unidad}
                          </div>

                        </td>

                        <td>
                          <span className="stock-minimo">
                            {producto.stockMinimo}
                          </span>
                        </td>

                        <td>

                          <span className="cantidad-sugerida">
                            +{cantidadSugerida(producto)}
                          </span>

                        </td>

                        <td>

                          <span
                            className={`estado ${
                              prioridad === "Crítica"
                                ? "estado-critico"
                                : prioridad === "Alta"
                                ? "estado-alto"
                                : "estado-medio"
                            }`}
                          >
                            {prioridad}
                          </span>

                        </td>

                        <td>

                          <button type="button" className="btn-ver" onClick={() => setProductoDetalle(producto)}>Ver detalle</button>

                        </td>

                      </tr>

                    );

                  })

                ) : (

                  <tr>

                    <td
                      colSpan="7"
                      style={{
                        textAlign: "center",
                        padding: "45px",
                        color: "#7890ae",
                      }}
                    >
                      {cargando ? "Cargando inventario..." : "No hay productos bajos o agotados con estos filtros."}
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* FOOTER */}

          <div className="tabla-footer">

            <span>
              Mostrando {productosFiltrados.length} de{" "}
              {productosAbastecimiento.length} productos que requieren
              abastecimiento
            </span>

            <div className="paginacion">

              <button className="pagina">
                ‹
              </button>

              <button className="pagina activa">
                1
              </button>

              <button className="pagina">
                2
              </button>

              <button className="pagina">
                ›
              </button>

            </div>

          </div>

        </div>

      {productoDetalle && (
        <div className="detalle-overlay" onClick={() => setProductoDetalle(null)}>
          <section className="detalle-modal" role="dialog" aria-modal="true" aria-labelledby="detalle-producto-titulo" onClick={(e) => e.stopPropagation()}>
            <div className="detalle-modal-header">
              <div><h2 id="detalle-producto-titulo">{productoDetalle.producto}</h2><p>Código {productoDetalle.codigo} · {productoDetalle.categoria}</p></div>
              <button type="button" className="detalle-cerrar" onClick={() => setProductoDetalle(null)}>Cerrar</button>
            </div>
            <div className="detalle-grid">
              <div className="detalle-dato"><span>Stock disponible</span><strong>{productoDetalle.stockActual} {productoDetalle.unidad}</strong></div>
              <div className="detalle-dato"><span>Stock mínimo</span><strong>{productoDetalle.stockMinimo}</strong></div>
              <div className="detalle-dato"><span>Prioridad</span><strong>{obtenerPrioridad(productoDetalle)}</strong></div>
              <div className="detalle-dato"><span>Cantidad sugerida</span><strong>+{cantidadSugerida(productoDetalle)}</strong></div>
            </div>
            <div className="detalle-footer">
              <button type="button" className="btn-filtrar" onClick={() => setProductoDetalle(null)}>Cerrar</button>
            </div>
          </section>
        </div>
      )}
      </div>
    </>
  );
}