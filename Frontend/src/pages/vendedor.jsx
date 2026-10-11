import React from 'react';
import { Outlet } from 'react-router-dom';

function Vendedor() {
	return (
		<div className="vendedor-content">
			<header className="vendedor-topbar">
				<strong>Portal del Vendedor</strong>
				<span>🛒 Vendedor</span>
			</header>

			<main className="vendedor-main">
				<Outlet />
			</main>

			<style>{`
				.vendedor-content { width: calc(100% - 250px); min-height: 100vh; margin-left: 250px; }
				.vendedor-topbar { height: 65px; position: sticky; top: 0; z-index: 90; display: flex; align-items: center; justify-content: space-between; padding: 0 23px; border-bottom: 1px solid #dbe4ef; background: rgba(255,255,255,.97); color: #11264b; font-size: 12px; }
				.vendedor-main { min-height: calc(100vh - 65px); padding: 23px; }
				@media (max-width: 900px) { .vendedor-content { width: calc(100% - 78px); margin-left: 78px; } .vendedor-topbar span { display: none; } }
			`}</style>
		</div>
	);
}

export default Vendedor;
