import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

function PublicLayout() {
    const location = useLocation();
    const fechaActual = new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    const menu = [
        { nombre: 'Dashboard', icono: '⌂', ruta: '/public' },
        { nombre: 'Productos', icono: '◇', ruta: '/public/productos' },
        { nombre: 'Inventario', icono: '⬡', ruta: '/public/inventario' },
        { nombre: 'Solicitudes', icono: '📋', ruta: '/public/solicitudes' },
        { nombre: 'Ventas', icono: '🛒', ruta: '/public/ventas' },
        { nombre: 'Compras', icono: '▣', ruta: '/public/compras' },
        { nombre: 'Informes y Reportes', icono: '▥', ruta: '/public/informes' },
        { nombre: 'Usuarios', icono: '♙', ruta: '/public/usuarios' },
        { nombre: 'Cerrar sesión', icono: '↪', ruta: '/cerrar-sesion' }
    ];

    return (
        <div className="public-layout">
            <aside className="public-sidebar">
                <Link to="/public" className="public-sidebar-logo">
<img
                    src="/logo-comercial-san-cristobal.png"
                    alt="Logotipo Comercial San Cristóbal"
                    style={{ width: '220px', maxWidth: '100%', height: '84px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '8px', padding: '3px' }}
                />
</Link>

                <div className="public-sidebar-user">
                    <span className="public-user-avatar">👤</span>
                    <span>
                        <strong>Administrador</strong>
                        <small>admin@sancristobal.com</small>
                        <small className="public-online">● En línea</small>
                    </span>
                </div>

                <nav className="public-sidebar-menu">
                    {menu.map(item => (
                        <Link
                            key={item.nombre}
                            to={item.ruta}
                            className={
                                location.pathname === item.ruta
                                    ? 'activo'
                                    : ''
                            }
                        >
                            <span className="public-menu-icon">{item.icono}</span>
                            <span>{item.nombre}</span>
                        </Link>
                    ))}
                </nav>

                <div className="public-sidebar-footer">
                    <strong>Comercial San Cristóbal</strong>
                    <small>© 2026 Todos los derechos reservados.</small>
                </div>
            </aside>

            <div className="public-content">
                <header className="public-topbar">
                    <span className="public-topbar-title">Panel Administrativo</span>
                    <div className="public-topbar-user">
                        <span>📅 {fechaActual}</span>
                        <span>👤 Administrador</span>
                    </div>
                </header>

                <main className="public-main">
                    <Outlet />
                </main>
            </div>

            <style>{`
                .public-layout {
                    min-height: 100vh;
                    display: flex;
                    background: #f4f8fd;
                    color: #152542;
                    font-family: Arial, Helvetica, sans-serif;
                }

                .public-sidebar {
                    width: 250px;
                    min-height: 100vh;
                    position: fixed;
                    inset: 0 auto 0 0;
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                    color: white;
                    background: linear-gradient(180deg, #063782 0%, #032b69 52%, #062b64 100%);
                }

                .public-sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 27px 22px 20px;
                    color: white;
                    text-decoration: none;
                }

                .public-logo-icon {
                    font-size: 32px;
                }

                .public-logo-text {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.02;
                }

                .public-logo-text strong {
                    font-size: 17px;
                }

                .public-logo-text small {
                    margin-top: 6px;
                    color: #d5e6ff;
                    font-size: 10px;
                }

                .public-sidebar-user {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 13px 22px 20px;
                }

                .public-sidebar-user > span:last-child {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .public-sidebar-user strong {
                    font-size: 12px;
                }

                .public-sidebar-user small {
                    margin-top: 4px;
                    color: #d5e4fb;
                    font-size: 9px;
                }

                .public-user-avatar {
                    width: 48px;
                    height: 48px;
                    display: grid;
                    flex: 0 0 48px;
                    place-items: center;
                    border-radius: 50%;
                    color: #06347b;
                    background: white;
                    font-size: 26px;
                }

                .public-online {
                    color: #74e692 !important;
                }

                .public-sidebar-menu {
                    display: grid;
                    gap: 4px;
                    padding: 6px 12px;
                }

                .public-sidebar-menu a {
                    min-height: 45px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 0 15px;
                    border-radius: 6px;
                    color: #e1ebfb;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 700;
                }

                .public-sidebar-menu a:hover,
                .public-sidebar-menu a.activo {
                    color: white;
                    background: #145ed6;
                }

                .public-menu-icon {
                    width: 24px;
                    text-align: center;
                    font-size: 19px;
                }

                .public-sidebar-footer {
                    margin-top: auto;
                    padding: 24px 22px;
                    border-top: 1px solid rgba(255,255,255,.15);
                }

                .public-sidebar-footer strong,
                .public-sidebar-footer small {
                    display: block;
                }

                .public-sidebar-footer strong {
                    font-size: 10px;
                }

                .public-sidebar-footer small {
                    margin-top: 7px;
                    color: #cfe0f7;
                    font-size: 9px;
                }

                .public-content {
                    width: calc(100% - 250px);
                    min-height: 100vh;
                    margin-left: 250px;
                }

                .public-topbar {
                    height: 65px;
                    position: sticky;
                    top: 0;
                    z-index: 90;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 23px;
                    border-bottom: 1px solid #dbe4ef;
                    background: rgba(255,255,255,.97);
                }

                .public-topbar-title {
                    color: #11264b;
                    font-size: 16px;
                    font-weight: 800;
                }

                .public-topbar-user {
                    display: flex;
                    gap: 26px;
                    color: #344866;
                    font-size: 11px;
                    font-weight: 700;
                }

                .public-main {
                    min-height: calc(100vh - 65px);
                    padding: 23px;
                }

                @media (max-width: 900px) {
                    .public-sidebar {
                        width: 78px;
                    }

                    .public-logo-text,
                    .public-sidebar-user > span:last-child,
                    .public-sidebar-menu a > span:last-child,
                    .public-sidebar-footer,
                    .public-topbar-user {
                        display: none;
                    }

                    .public-sidebar-logo,
                    .public-sidebar-user {
                        justify-content: center;
                        padding-left: 0;
                        padding-right: 0;
                    }

                    .public-sidebar-menu {
                        padding-left: 8px;
                        padding-right: 8px;
                    }

                    .public-sidebar-menu a {
                        justify-content: center;
                        padding: 0;
                    }

                    .public-content {
                        width: calc(100% - 78px);
                        margin-left: 78px;
                    }
                }
            `}</style>
        </div>
    );
}

export default PublicLayout;
