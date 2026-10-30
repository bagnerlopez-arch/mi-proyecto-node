import React from 'react';
import { Link, Outlet } from 'react-router-dom';

function Vendedor() {
	return (
		<div className="vendedor-content">
			<header className="vendedor-topbar">
				<strong>Portal del Vendedor</strong>
				<div className="vendedor-topbar-actions">
					<span>🛒 Vendedor</span>
					<Link className="vendedor-logout" to="/cerrar-sesion">Cerrar sesión</Link>
				</div>
			</header>

			<main className="vendedor-main">
				<Outlet />
			</main>

			<style>{`
				.vendedor-content { width: calc(100% - 250px); min-height: 100vh; margin-left: 250px; }
				.vendedor-topbar { height: 65px; position: sticky; top: 0; z-index: 90; display: flex; align-items: center; justify-content: space-between; padding: 0 23px; border-bottom: 1px solid #dbe4ef; background: rgba(255,255,255,.97); color: #11264b; font-size: 12px; }
				.vendedor-topbar-actions { display: flex; align-items: center; gap: 16px; }
				.vendedor-logout { padding: 8px 12px; border: 1px solid #d7e0eb; border-radius: 5px; color: #173459; background: white; text-decoration: none; font-size: 11px; font-weight: 700; }
				.vendedor-logout:hover { color: white; border-color: #145ed6; background: #145ed6; }
				.vendedor-main { min-height: calc(100vh - 65px); padding: 23px; }
				@media (max-width: 900px) { .vendedor-content { width: calc(100% - 78px); margin-left: 78px; } .vendedor-topbar-actions > span { display: none; } .vendedor-topbar { padding: 0 14px; } .vendedor-main { padding: 14px; } }
			`}</style>
		</div>
	);
}

export default Vendedor;
