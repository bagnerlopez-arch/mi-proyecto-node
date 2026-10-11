import { Router } from 'express';

import {
    obtenerUsuarios,
    crearUsuario,
    editarUsuario,
    eliminarUsuario,
    obtenerCategorias,
    obtenerUnidades,
    obtenerProductos,
    crearProducto,
    crearPedido,
    crearSolicitudBodega,
    obtenerSolicitudesBodega,
    actualizarEstadoPedido,
    editarProducto,
    eliminarProducto,
    obtenerProductoPorId,
    obtenerReportes,
    obtenerInformacionNegocio,
    registrarVentaMostrador,
    obtenerVentas
} from '../controllers/cliente.controller.js';


const router = Router();


router.get(
    '/usuarios',
    obtenerUsuarios
);


router.post(
    '/usuarios',
    crearUsuario
);


router.put(
    '/usuarios/:id',
    editarUsuario
);


router.delete(
    '/usuarios/:id',
    eliminarUsuario
);


router.get(
    '/categorias',
    obtenerCategorias
);


router.get(
    '/unidades',
    obtenerUnidades
);


router.get(
    '/productos',
    obtenerProductos
);


router.post(
    '/productos',
    crearProducto
);


router.post(
    '/pedidos',
    crearPedido
);


router.get(
    '/ventas',
    obtenerVentas
);
router.post(
    '/ventas',
    registrarVentaMostrador
);
router.post(
    '/solicitudes-bodega',
    crearSolicitudBodega
);


router.get(
    '/solicitudes-bodega',
    obtenerSolicitudesBodega
);


router.patch(
    '/pedidos/:id/estado',
    actualizarEstadoPedido
);


router.put(
    '/productos/:id',
    editarProducto
);


router.delete(
    '/productos/:id',
    eliminarProducto
);


router.get(
    '/productos/:id',
    obtenerProductoPorId
);


router.get(
    '/info',
    obtenerInformacionNegocio
);


router.get(
    '/reportes',
    obtenerReportes
);


export default router;