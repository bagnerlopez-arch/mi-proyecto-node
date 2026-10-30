import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

function BodegueroLayout() {
	const location = useLocation();

	const menu = [
		{ nombre: 'Inventario', icono: '⬡', ruta: '/bodeguero/inventario' },
		{ nombre: 'Solicitudes', icono: '📋', ruta: '/bodeguero/solicitudes' },
		{ nombre: 'Tienda', icono: '🏪', deshabilitado: true }
	];

	return (
		<div className="bodeguero-layout">
			<aside className="bodeguero-sidebar">
				<Link to="/bodeguero" className="bodeguero-logo">
<img
                    src="/logo-comercial-san-cristobal.png"
                    alt="Logotipo Comercial San Cristóbal"
                    style={{ width: '220px', maxWidth: '100%', height: '84px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '8px', padding: '3px' }}
                />
</Link>

				<div className="bodeguero-user">
					<span className="bodeguero-avatar">📦</span>
					<span>
						<strong>Bodeguero</strong>
						<small>bodeguero</small>
						<small className="bodeguero-online">● En línea</small>
					</span>
				</div>

				<nav className="bodeguero-menu">
					{menu.map(item => item.deshabilitado ? (
						<div className="bodeguero-menu-disabled" key={item.nombre} aria-disabled="true">
							<span>{item.icono}</span>
							<span>{item.nombre}</span>
						</div>
					) : (
						<Link
							key={item.nombre}
							to={item.ruta}
							className={location.pathname === item.ruta ? 'activo' : ''}
						>
							<span>{item.icono}</span>
							<span>{item.nombre}</span>
						</Link>
					))}
				</nav>

				<div className="bodeguero-footer">
					<strong>Acceso de Bodega</strong>
					<small>Gestión de inventario y solicitudes</small>
				</div>
			</aside>

			<div className="bodeguero-content">
				<header className="bodeguero-topbar">
					<strong>Portal del Bodeguero</strong>
					<div className="bodeguero-topbar-actions">
						<span>📦 Bodeguero</span>
						<Link className="bodeguero-logout" to="/cerrar-sesion">Cerrar sesión</Link>
					</div>
				</header>
				<main className="bodeguero-main">
					<Outlet />
				</main>
			</div>

			<style>{`
				.bodeguero-layout { min-height: 100vh; display: flex; color: #173459; background: #f4f8fd; font-family: Arial, Helvetica, sans-serif; }
				.bodeguero-sidebar { width: 250px; min-height: 100vh; position: fixed; inset: 0 auto 0 0; z-index: 100; display: flex; flex-direction: column; color: white; background: linear-gradient(180deg, #063782 0%, #032b69 52%, #062b64 100%); }
				.bodeguero-logo { display: flex; align-items: center; gap: 12px; padding: 27px 22px 20px; color: white; text-decoration: none; }
				.bodeguero-logo-icon { font-size: 32px; }
				.bodeguero-logo > span:last-child, .bodeguero-user > span:last-child { display: flex; flex-direction: column; }
				.bodeguero-logo strong { font-size: 17px; line-height: 1.02; }
				.bodeguero-logo small, .bodeguero-user small { margin-top: 6px; color: #d5e6ff; font-size: 10px; }
				.bodeguero-user { display: flex; align-items: center; gap: 12px; padding: 13px 22px 20px; }
				.bodeguero-user strong { font-size: 12px; }
				.bodeguero-user small { margin-top: 4px; }
				.bodeguero-avatar { width: 48px; height: 48px; display: grid; flex: 0 0 48px; place-items: center; border-radius: 50%; background: white; font-size: 25px; }
				.bodeguero-online { color: #74e692 !important; }
				.bodeguero-menu { display: grid; gap: 4px; padding: 6px 12px; }
				.bodeguero-menu a { min-height: 45px; display: flex; align-items: center; gap: 14px; padding: 0 15px; border-radius: 6px; color: #e1ebfb; text-decoration: none; font-size: 12px; font-weight: 700; }
				.bodeguero-menu a:hover, .bodeguero-menu a.activo { color: white; background: #145ed6; }
				.bodeguero-menu a > span:first-child, .bodeguero-menu-disabled > span:first-child { width: 24px; text-align: center; font-size: 19px; }
				.bodeguero-menu-disabled { min-height: 45px; display: flex; align-items: center; gap: 14px; padding: 0 15px; border-radius: 6px; color: #8793a5; background: rgba(255,255,255,.06); cursor: not-allowed; font-size: 12px; font-weight: 700; }
				.bodeguero-footer { margin-top: auto; padding: 24px 22px; border-top: 1px solid rgba(255,255,255,.15); }
				.bodeguero-footer strong, .bodeguero-footer small { display: block; }
				.bodeguero-footer strong { font-size: 10px; }
				.bodeguero-footer small { margin-top: 7px; color: #cfe0f7; font-size: 9px; }
				.bodeguero-content { width: calc(100% - 250px); min-height: 100vh; margin-left: 250px; }
				.bodeguero-topbar { height: 65px; position: sticky; top: 0; z-index: 90; display: flex; align-items: center; justify-content: space-between; padding: 0 23px; border-bottom: 1px solid #dbe4ef; background: rgba(255,255,255,.97); color: #11264b; font-size: 12px; }
				.bodeguero-topbar-actions { display: flex; align-items: center; gap: 16px; }
				.bodeguero-logout { padding: 8px 12px; border: 1px solid #d7e0eb; border-radius: 5px; color: #173459; background: white; text-decoration: none; font-size: 11px; font-weight: 700; }
				.bodeguero-logout:hover { color: white; border-color: #145ed6; background: #145ed6; }
				.bodeguero-main { min-height: calc(100vh - 65px); padding: 23px; }
				@media (max-width: 900px) { .bodeguero-sidebar { width: 78px; } .bodeguero-logo > span:last-child, .bodeguero-user > span:last-child, .bodeguero-menu a > span:last-child, .bodeguero-menu-disabled > span:last-child, .bodeguero-footer, .bodeguero-topbar-actions > span { display: none; } .bodeguero-logo, .bodeguero-user { justify-content: center; padding-left: 0; padding-right: 0; } .bodeguero-menu { padding-left: 8px; padding-right: 8px; } .bodeguero-menu a, .bodeguero-menu-disabled { justify-content: center; padding: 0; } .bodeguero-content { width: calc(100% - 78px); margin-left: 78px; } .bodeguero-topbar { padding: 0 14px; } .bodeguero-main { padding: 14px; } }
			`}</style>
		</div>
	);
}

export default BodegueroLayout;
