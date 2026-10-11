import React from 'react';

import {
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import Inicio from './pages/inicio.jsx';
import Public from './pages/public.jsx';
import PublicLayout from './pages/publiclayout.jsx';
import Catalogo from './pages/catalogo.jsx';
import Productos from './pages/productos.jsx';
import Login from './pages/login.jsx';
import Usuarios from './pages/usuarios.jsx';
import InventarioTienda from './pages/inventariotienda.jsx';
import InventarioBodega from './pages/inventariobodega.jsx';
import Inventario from './pages/inventario.jsx';
import Reportes from './pages/reportes.jsx';
import Solicitudes from './pages/solicitudes.jsx';
import BodegueroLayout from './pages/bodeguerolayout.jsx';
import PortalBodeguero from './pages/portalbodeguero.jsx';
import Ticket from './pages/ticket.jsx';
import VendedorLayout from './pages/vendedorloyaut.jsx';
import RealizarVentas from './pages/realizarventas.jsx';
import Ventas from './pages/ventas.jsx';
import Compras from './pages/compras.jsx';
import CerrarSesion from './pages/cerrarsesion.jsx';

function SeccionEnConstruccion({ nombre }) {
    return (
        <section className="dashboard-card" style={{ padding: '24px' }}>
            <h2>{nombre}</h2>
            <p>Contenido de {nombre}.</p>
        </section>
    );
}


function App() {

    return (

        <Routes>

            <Route
                path="/"
                element={<Inicio />}
            />

            <Route path="/public" element={<PublicLayout />}>
                <Route index element={<Public embedded />} />

                <Route
                    path="productos"
                    element={<Productos />}
                />

                <Route
                    path="inventario"
                    element={<InventarioTienda />}
                />

                <Route
                    path="inventariobodega"
                    element={<InventarioBodega />}
                />

                <Route
                    path="solicitudes"
                    element={<Solicitudes />}
                />

                <Route
                    path="usuarios"
                    element={<Usuarios />}
                />

                <Route
                    path="informes"
                    element={<Reportes />}
                />

                <Route
                    path="ventas"
                    element={<Ventas />}
                />

                <Route
                    path="compras"
                    element={<Compras />}
                />

                <Route
                    path="configuracion"
                    element={<SeccionEnConstruccion nombre="Configuración" />}
                />
            </Route>

            <Route path="/bodeguero" element={<BodegueroLayout />}>
                <Route index element={<PortalBodeguero />} />
                <Route
                    path="inventario"
                    element={<Inventario />}
                />
                <Route
                    path="solicitudes"
                    element={<Solicitudes soloTickets />}
                />
            </Route>

            <Route path="/vendedor" element={<VendedorLayout />}>
                <Route
                    index
                    element={<RealizarVentas />}
                />
                <Route
                    path="realizarventas"
                    element={<RealizarVentas />}
                />
            </Route>

            <Route
                path="/catalogo"
                element={<Catalogo />}
            />

            <Route
                path="/productos"
                element={<Productos />}
            />

            <Route
                path="/cerrar-sesion"
                element={<CerrarSesion />}
            />
            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/ticket"
                element={<Ticket />}
            />

            <Route
                path="/ventas"
                element={<Ventas />}
            />
            <Route
                path="/usuarios"
                element={<Usuarios />}
            />

            <Route
                path="/inventario"
                element={<InventarioTienda />}
            />

            <Route
                path="/inventariobodega"
                element={<InventarioBodega />}
            />

            <Route
                path="/reportes"
                element={<Reportes />}
            />

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />

        </Routes>

    );

}


export default App;