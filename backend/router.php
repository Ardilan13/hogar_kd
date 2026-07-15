<?php

declare(strict_types=1);

class Router
{
    private array $routes = [];

    public function add(string $method, string $route, callable $handler): void
    {
        // Convertir la ruta simple /api/debts/{id} en una expresión regular
        $routePattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', $route);
        $routePattern = '#^' . $routePattern . '$#';

        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $routePattern,
            'handler' => $handler
        ];
    }

    public function dispatch(): void
    {
        $requestedMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        // Manejo nativo de CORS Preflight
        if ($requestedMethod === 'OPTIONS') {
            sendJson(204, []);
        }

        $rawUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
        $requestedUri = '/' . trim($rawUri, '/');

        foreach ($this->routes as $route) {
            if ($route['method'] === $requestedMethod && preg_match($route['pattern'], $requestedUri, $matches)) {
                // Filtrar solo los parámetros nombrados de la expresión regular
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                call_user_func_array($route['handler'], $params);
                return;
            }
        }

        sendError(404, 'Ruta no encontrada');
    }
}
