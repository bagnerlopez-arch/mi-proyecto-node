import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Vendedor from './vendedor.jsx';

function VendedorLayout() {
    const location = useLocation();

    return (
        <div className="vendedor-layout">
            <aside className="vendedor-sidebar">
                <Link to="/vendedor" className="vendedor-logo">
<img
                    src="/logo-comercial-san-cristobal.png"
                    alt="Logotipo Comercial San Cristóbal"
                    style={{ width: '220px', maxWidth: '100%', height: '84px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '8px', padding: '3px' }}
                />
</Link>
                <div className="vendedor-user">
                    <span className="vendedor-avatar">🛒</span>
                    <span>
                        <strong>Vendedor</strong>
                        <small>vendedor1</small>
                        <small className="vendedor-online">● En línea</small>
                    </span>
                </div>
                <nav className="vendedor-menu">
                    <Link
                        to="/vendedor/realizarventas"
                        className={location.pathname === '/vendedor/realizarventas' ? 'activo' : ''}
                    >
                        <span>🛒</span>
                        <span>Realizar ventas</span>
                    </Link>
                </nav>
                <div className="vendedor-footer">
                    <strong>Acceso de Ventas</strong>
                    <small>Catálogo y carrito de tienda</small>
                </div>
            </aside>
            <Vendedor />
            <style>{`
                .vendedor-layout { min-height: 100vh; display: flex; color: #173459; background: #f4f8fd; font-family: Arial, Helvetica, sans-serif; }
                .vendedor-sidebar { width: 250px; min-height: 100vh; position: fixed; inset: 0 auto 0 0; z-index: 100; display: flex; flex-direction: column; color: white; background: linear-gradient(180deg, #063782 0%, #032b69 52%, #062b64 100%); }
                .vendedor-logo { display: flex; align-items: center; gap: 12px; padding: 27px 22px 20px; color: white; text-decoration: none; }
                .vendedor-logo-icon { font-size: 32px; }
                .vendedor-logo > span:last-child, .vendedor-user > span:last-child { display: flex; flex-direction: column; }
                .vendedor-logo strong { font-size: 17px; line-height: 1.02; }
                .vendedor-logo small, .vendedor-user small { margin-top: 5px; color: #d5e6ff; font-size: 10px; }
                .vendedor-user { display: flex; align-items: center; gap: 12px; padding: 13px 22px 20px; }
                .vendedor-user strong { font-size: 12px; }
                .vendedor-avatar { width: 48px; height: 48px; display: grid; flex: 0 0 48px; place-items: center; border-radius: 50%; background: white; font-size: 24px; }
                .vendedor-online { color: #74e692 !important; }
                .vendedor-menu { display: grid; gap: 4px; padding: 6px 12px; }
                .vendedor-menu a { min-height: 45px; display: flex; align-items: center; gap: 14px; padding: 0 15px; border-radius: 6px; color: #e1ebfb; text-decoration: none; font-size: 12px; font-weight: 700; }
                .vendedor-menu a:hover, .vendedor-menu a.activo { color: white; background: #145ed6; }
                .vendedor-menu a span:first-child { width: 24px; text-align: center; font-size: 19px; }
                .vendedor-footer { margin-top: auto; padding: 24px 22px; border-top: 1px solid rgba(255,255,255,.15); }
                .vendedor-footer strong, .vendedor-footer small { display: block; }
                .vendedor-footer strong { font-size: 10px; }
                .vendedor-footer small { margin-top: 7px; color: #cfe0f7; font-size: 9px; }
                @media (max-width: 900px) { .vendedor-sidebar { width: 78px; } .vendedor-logo > span:last-child, .vendedor-user > span:last-child, .vendedor-menu a > span:last-child, .vendedor-footer { display: none; } .vendedor-logo, .vendedor-user { justify-content: center; padding-left: 0; padding-right: 0; } .vendedor-menu { padding-left: 8px; padding-right: 8px; } .vendedor-menu a { justify-content: center; padding: 0; } }
            `}</style>
        </div>
    );
}

export default VendedorLayout;
