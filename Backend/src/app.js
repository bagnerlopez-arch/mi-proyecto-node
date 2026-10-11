import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import clienteRoutes from './routes/cliente.routes.js';

import {
    comprobarConexion,
    pool
} from './config/db.js';

const app = express();

const PORT = Number(process.env.PORT) || 3000;


// ========================================
// CARPETA PUBLIC
// ========================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(
    __dirname,
    '..',
    'public'
);


// ========================================
// MIDDLEWARE
// ========================================

app.use(
    express.json({
        limit: '10mb'
    })
);

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(publicPath)
);

app.use(
    '/api/cliente',
    clienteRoutes
);


// ========================================
// RUTA DE PRUEBA
// ========================================

app.get('/api/estado', (req, res) => {

    res.json({
        sistema: 'Comercial San Cristóbal',
        estado: 'Funcionando'
    });

});


// ========================================
// INICIAR SERVIDOR
// ========================================

async function iniciarServidor() {

    try {

        console.log('');
        console.log('Iniciando Comercial San Cristóbal...');

        await comprobarConexion();

        app.listen(PORT, () => {

            console.log('');
            console.log('====================================');
            console.log('   COMERCIAL SAN CRISTÓBAL');
            console.log('====================================');
            console.log('');

            console.log(
                `Servidor funcionando en: http://localhost:${PORT}`
            );

            console.log('');

        });

    } catch (error) {

        console.error('');
        console.error(
            '❌ No se pudo iniciar el sistema.'
        );

        console.error(
            'Detalle:',
            error.message
        );

        process.exit(1);

    }

}

iniciarServidor();


// ========================================
// CERRAR SERVIDOR
// ========================================

process.on('SIGINT', async () => {

    console.log(
        '\nCerrando servidor...'
    );

    await pool.end();

    process.exit(0);

});