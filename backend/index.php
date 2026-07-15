<?php

declare(strict_types=1);

// 1. Cargar dependencias y helpers
require_once __DIR__ . '/helpers/utils.php';
require_once __DIR__ . '/helpers/jwt.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/CrudController.php';
require_once __DIR__ . '/router.php';

// 2. Inicializar entorno y base de datos
loadEnv(__DIR__ . '/.env');

// 3. Inicializar Controladores CRUD
$shopping = new CrudController('shopping', ['name', 'quantity', 'category', 'addedBy', 'bought']);
$debts    = new CrudController('debts', ['from', 'to', 'amount', 'description', 'paid', 'paidAt']);
$wishlist = new CrudController('wishlist', ['name', 'price', 'link', 'priority', 'wantedBy', 'achieved']);
$events   = new CrudController('events', ['title', 'date', 'recurringYearly', 'notes', 'createdBy']);
$appoint  = new CrudController('appointments', ['title', 'date', 'time', 'location', 'notes', 'createdBy', 'done']);
$notes    = new CrudController('notes', ['message', 'fromPerson', 'color'], ['from' => 'fromPerson']);

// 4. Configurar el Router
$router = new Router();

// Rutas Públicas y de Utilidad
$router->add('GET', '/api/health', function () {
    sendJson(200, ['ok' => true]);
});

// Rutas de Autenticación
$router->add('GET',  '/api/auth/profiles', [AuthController::class, 'getProfiles']);
$router->add('POST', '/api/auth/login',    [AuthController::class, 'login']);

// Ruta Especial de Deudas (Resumen)
$router->add('GET', '/api/debts/summary/balance', [CrudController::class, 'getDebtsBalance']);

// Rutas para Colección: SHOPPING
$router->add('GET',    '/api/shopping',      [$shopping, 'index']);
$router->add('POST',   '/api/shopping',      [$shopping, 'store']);
$router->add('PUT',    '/api/shopping/{id}', [$shopping, 'update']);
$router->add('DELETE', '/api/shopping/{id}', [$shopping, 'destroy']);

// Rutas para Colección: DEBTS
$router->add('GET',    '/api/debts',      [$debts, 'index']);
$router->add('POST',   '/api/debts',      [$debts, 'store']);
$router->add('PUT',    '/api/debts/{id}', [$debts, 'update']);
$router->add('DELETE', '/api/debts/{id}', [$debts, 'destroy']);

// Rutas para Colección: WISHLIST
$router->add('GET',    '/api/wishlist',      [$wishlist, 'index']);
$router->add('POST',   '/api/wishlist',      [$wishlist, 'store']);
$router->add('PUT',    '/api/wishlist/{id}', [$wishlist, 'update']);
$router->add('DELETE', '/api/wishlist/{id}', [$wishlist, 'destroy']);

// Rutas para Colección: EVENTS
$router->add('GET',    '/api/events',      [$events, 'index']);
$router->add('POST',   '/api/events',      [$events, 'store']);
$router->add('PUT',    '/api/events/{id}', [$events, 'update']);
$router->add('DELETE', '/api/events/{id}', [$events, 'destroy']);

// Rutas para Colección: APPOINTMENTS
$router->add('GET',    '/api/appointments',      [$appoint, 'index']);
$router->add('POST',   '/api/appointments',      [$appoint, 'store']);
$router->add('PUT',    '/api/appointments/{id}', [$appoint, 'update']);
$router->add('DELETE', '/api/appointments/{id}', [$appoint, 'destroy']);

// Rutas para Colección: NOTES
$router->add('GET',    '/api/notes',      [$notes, 'index']);
$router->add('POST',   '/api/notes',      [$notes, 'store']);
$router->add('PUT',    '/api/notes/{id}', [$notes, 'update']);
$router->add('DELETE', '/api/notes/{id}', [$notes, 'destroy']);

// 5. Procesar la Petición
$router->dispatch();
