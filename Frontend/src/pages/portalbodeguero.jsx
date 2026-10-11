import React from 'react';

function PortalBodeguero() {
	return (
		<section className="portal-bodeguero">
			<style>{`
				.portal-bodeguero h1 { margin: 0; color: #102a54; font-size: 25px; }
				.portal-bodeguero p { margin: 8px 0 20px; color: #718097; font-size: 12px; }
				.portal-inventory { overflow: hidden; border: 1px solid #dce4ee; border-radius: 9px; background: white; }
				.portal-inventory-header { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px; border-bottom: 1px solid #edf1f6; }
				.portal-inventory-header strong { color: #153462; font-size: 14px; }
				.portal-inventory-header span { color: #718097; font-size: 10px; }
				.portal-inventory-table { width: 100%; border-collapse: collapse; font-size: 11px; }
				.portal-inventory-table th { padding: 10px 14px; color: #42536b; background: #f4f7fa; font-size: 10px; text-align: left; }
				.portal-inventory-table td { padding: 12px 14px; border-bottom: 1px solid #edf0f4; color: #33455f; }
				.portal-stock { color: #188b52; font-weight: 700; }
				.portal-stock.low { color: #b87900; }
				.portal-stock.critical { color: #d94141; }
				@media (max-width: 600px) { .portal-inventory { overflow-x: auto; } .portal-inventory-table { min-width: 560px; } }
			`}</style>
			<h1>Inventario de Bodega</h1>
			<p>Consulta las existencias disponibles para preparar los pedidos de la tienda.</p>
			<section className="portal-inventory">
				<div className="portal-inventory-header">
					<strong>Existencias actuales</strong>
					<span>Última actualización: 22/09/2026</span>
				</div>
				<table className="portal-inventory-table">
					<thead>
						<tr>
							<th>Producto</th>
							<th>Ubicación</th>
							<th>Stock actual</th>
							<th>Stock mínimo</th>
							<th>Estado</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>Vasos Plásticos #10</td><td>Bodega Central</td><td>320</td><td>200</td><td className="portal-stock">Disponible</td></tr>
						<tr><td>Platos Plásticos #9</td><td>Bodega Central</td><td>180</td><td>150</td><td className="portal-stock">Disponible</td></tr>
						<tr><td>Tazones Plásticos 16 oz</td><td>Bodega Central</td><td>75</td><td>120</td><td className="portal-stock low">Stock bajo</td></tr>
						<tr><td>Cubiertos Plásticos</td><td>Bodega Central</td><td>45</td><td>100</td><td className="portal-stock critical">Crítico</td></tr>
						<tr><td>Bolsas Negras 24x32</td><td>Bodega Central</td><td>500</td><td>300</td><td className="portal-stock">Disponible</td></tr>
					</tbody>
				</table>
			</section>
		</section>
	);
}

export default PortalBodeguero;
