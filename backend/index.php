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
$shopping = new CrudController('shopping', ['name', 'quantity', 'category', 'addedBy', 'bought', 'imageUrl']);
$debts    = new CrudController('debts', ['from', 'to', 'amount', 'description', 'paid', 'paidAt', 'imageUrl']);
$wishlist = new CrudController('wishlist', ['name', 'price', 'link', 'priority', 'wantedBy', 'achieved', 'imageUrl']);
$events   = new CrudController('events', ['title', 'date', 'recurringYearly', 'notes', 'createdBy', 'imageUrl']);
$appoint  = new CrudController('appointments', ['title', 'date', 'time', 'location', 'notes', 'createdBy', 'done', 'imageUrl']);
$notes    = new CrudController('notes', ['message', 'fromPerson', 'color', 'imageUrl'], ['from' => 'fromPerson']);
$gallery  = new CrudController('gallery', ['title', 'imageUrl', 'description', 'createdBy']);

// 4. Configurar el Router
$router = new Router();

// Rutas Públicas y de Utilidad
$router->add('GET', '/api/health', function () {
    sendJson(200, ['ok' => true]);
});

// Rutas de Autenticación
$router->add('GET',  '/api/auth/profiles', [AuthController::class, 'getProfiles']);
$router->add('POST', '/api/auth/login',    [AuthController::class, 'login']);
$router->add('POST', '/api/media/upload', function () {
    requireAuth();
    if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
        sendError(400, 'No se envió ninguna imagen');
    }

    $url = storeUploadedFile($_FILES['image']);
    if (!$url) {
        sendError(400, 'No se pudo subir la imagen');
    }

    sendJson(200, ['url' => $url]);
});

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

// Rutas para Colección: GALLERY
$router->add('GET',    '/api/gallery',      [$gallery, 'index']);
$router->add('POST',   '/api/gallery',      [$gallery, 'store']);
$router->add('PUT',    '/api/gallery/{id}', [$gallery, 'update']);
$router->add('DELETE', '/api/gallery/{id}', [$gallery, 'destroy']);

// 5. Procesar la Petición
$router->dispatch();
