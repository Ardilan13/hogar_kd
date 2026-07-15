<?php
declare(strict_types=1);

$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
  foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (str_starts_with(trim($line), '#')) {
      continue;
    }
    [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
    $key = trim($key);
    $value = trim($value);
    if ($key !== '') {
      $_ENV[$key] = $value;
      putenv($key . '=' . $value);
    }
  }
}

function env(string $key, mixed $default = null): mixed {
  return $_ENV[$key] ?? getenv($key) ?: $default;
}

function sendJson(int $status, array $payload): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function sendError(int $status, string $message): void {
  sendJson($status, ['error' => $message]);
}

function readJsonBody(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || trim($raw) === '') {
    return [];
  }
  $decoded = json_decode($raw, true);
  return is_array($decoded) ? $decoded : [];
}

function getRequestPath(): string {
  $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
  return '/' . trim($uri, '/');
}

function getRouteSegments(): array {
  $path = preg_replace('#/+#', '/', getRequestPath()) ?? '/';
  return array_values(array_filter(explode('/', trim($path, '/')), static fn ($part) => $part !== ''));
}

function base64UrlEncode(string $data): string {
  return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
  return base64_decode(strtr($data, '-_', '+/'), true) ?: '';
}

function signJwt(array $payload): string {
  $header = ['alg' => 'HS256', 'typ' => 'JWT'];
  $secret = (string) env('JWT_SECRET', 'dev-secret');
  $now = time();
  $payload = array_merge([
    'iat' => $now,
    'exp' => $now + 60 * 60 * 24 * 30,
  ], $payload);
  $encodedHeader = base64UrlEncode(json_encode($header, JSON_UNESCAPED_UNICODE));
  $encodedPayload = base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE));
  $signature = hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $secret, true);
  return $encodedHeader . '.' . $encodedPayload . '.' . base64UrlEncode($signature);
}

function verifyJwt(string $token): ?array {
  $parts = explode('.', $token);
  if (count($parts) !== 3) {
    return null;
  }
  [$header, $payload, $signature] = $parts;
  $secret = (string) env('JWT_SECRET', 'dev-secret');
  $expectedSignature = base64UrlEncode(hash_hmac('sha256', $header . '.' . $payload, $secret, true));
  if (!hash_equals($expectedSignature, $signature)) {
    return null;
  }
  $decodedPayload = json_decode(base64UrlDecode($payload), true);
  if (!is_array($decodedPayload)) {
    return null;
  }
  if (($decodedPayload['exp'] ?? 0) < time()) {
    return null;
  }
  return $decodedPayload;
}

function getCurrentUser(): ?array {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (!preg_match('/Bearer\s+(.+)/', $header, $matches)) {
    return null;
  }
  return verifyJwt($matches[1]);
}

function requireAuth(): array {
  $user = getCurrentUser();
  if (!$user) {
    sendError(401, 'No autorizado');
  }
  return $user;
}

function normalizeRow(array $row): array {
  foreach (['bought', 'paid', 'achieved', 'done', 'recurringYearly'] as $field) {
    if (array_key_exists($field, $row)) {
      $row[$field] = (bool) (int) $row[$field];
    }
  }
  foreach (['amount', 'price'] as $field) {
    if (array_key_exists($field, $row) && $row[$field] !== null && $row[$field] !== '') {
      $row[$field] = (float) $row[$field];
    }
  }
  if (array_key_exists('fromPerson', $row) && !array_key_exists('from', $row)) {
    $row['from'] = $row['fromPerson'];
  }
  return $row;
}

function quoteIdentifier(string $identifier): string {
  return '"' . str_replace('"', '""', $identifier) . '"';
}

function normalizeBodyForStorage(array $body, array $allowedFields, array $fieldMap = []): array {
  $normalized = [];
  foreach ($allowedFields as $field) {
    if (array_key_exists($field, $body)) {
      $normalized[$field] = $body[$field];
    }
  }
  foreach ($fieldMap as $inputField => $storageField) {
    if (array_key_exists($inputField, $body) && !array_key_exists($storageField, $normalized)) {
      $normalized[$storageField] = $body[$inputField];
    }
  }
  return $normalized;
}

function getPdo(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) {
    return $pdo;
  }

  $dbPath = (string) env('DB_PATH', __DIR__ . '/database/app.sqlite');
  $dbDir = dirname($dbPath);
  if (!is_dir($dbDir)) {
    mkdir($dbDir, 0777, true);
  }

  $pdo = new PDO('sqlite:' . $dbPath);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

  $schemaFile = __DIR__ . '/database/schema.sql';
  if (!file_exists($schemaFile)) {
    throw new RuntimeException('No se encontro el archivo de esquema SQL');
  }

  $sql = file_get_contents($schemaFile);
  foreach (preg_split('/;\s*(?:\r?\n|$)/', $sql) as $statement) {
    $statement = trim($statement);
    if ($statement === '') {
      continue;
    }
    $pdo->exec($statement);
  }

  $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
  if ($count === 0) {
    $u1Name = (string) env('USER1_NAME', 'Persona 1');
    $u1Pin = (string) env('USER1_PIN', '1234');
    $u2Name = (string) env('USER2_NAME', 'Persona 2');
    $u2Pin = (string) env('USER2_PIN', '5678');

    $insert = $pdo->prepare('INSERT INTO users (id, name, pinHash, avatar, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
    $insert->execute([
      bin2hex(random_bytes(4)),
      $u1Name,
      password_hash($u1Pin, PASSWORD_DEFAULT),
      '💜',
      gmdate('c'),
      gmdate('c'),
    ]);
    $insert->execute([
      bin2hex(random_bytes(4)),
      $u2Name,
      password_hash($u2Pin, PASSWORD_DEFAULT),
      '💙',
      gmdate('c'),
      gmdate('c'),
    ]);
  }

  return $pdo;
}

function listCollection(string $table): array {
  $pdo = getPdo();
  $stmt = $pdo->query('SELECT * FROM ' . quoteIdentifier($table) . ' ORDER BY datetime(createdAt) DESC');
  $rows = $stmt->fetchAll();
  return array_map('normalizeRow', $rows);
}

function findCollectionItem(string $table, string $id): ?array {
  $pdo = getPdo();
  $stmt = $pdo->prepare('SELECT * FROM ' . quoteIdentifier($table) . ' WHERE id = ?');
  $stmt->execute([$id]);
  $row = $stmt->fetch();
  return $row ? normalizeRow($row) : null;
}

function createCollectionItem(string $table, array $body, array $allowedFields, array $fieldMap = []): array {
  $pdo = getPdo();
  $columns = ['id', 'createdAt', 'updatedAt'];
  $values = [bin2hex(random_bytes(6)), gmdate('c'), gmdate('c')];
  $storageFields = normalizeBodyForStorage($body, $allowedFields, $fieldMap);

  foreach ($storageFields as $field => $value) {
    $columns[] = $field;
    $values[] = $value;
  }

  $placeholders = implode(', ', array_fill(0, count($columns), '?'));
  $quotedColumns = implode(', ', array_map('quoteIdentifier', $columns));
  $stmt = $pdo->prepare('INSERT INTO ' . quoteIdentifier($table) . ' (' . $quotedColumns . ') VALUES (' . $placeholders . ')');
  $stmt->execute($values);

  return findCollectionItem($table, $values[0]) ?? [];
}

function updateCollectionItem(string $table, string $id, array $body, array $allowedFields, array $fieldMap = []): ?array {
  $pdo = getPdo();
  $updates = [];
  $values = [];
  $storageFields = normalizeBodyForStorage($body, $allowedFields, $fieldMap);

  foreach ($storageFields as $field => $value) {
    $updates[] = quoteIdentifier($field) . ' = ?';
    $values[] = $value;
  }

  if ($updates === []) {
    return findCollectionItem($table, $id);
  }

  $values[] = gmdate('c');
  $values[] = $id;
  $stmt = $pdo->prepare('UPDATE ' . quoteIdentifier($table) . ' SET ' . implode(', ', $updates) . ', updatedAt = ? WHERE id = ?');
  $stmt->execute($values);

  return findCollectionItem($table, $id);
}

function deleteCollectionItem(string $table, string $id): bool {
  $pdo = getPdo();
  $stmt = $pdo->prepare('DELETE FROM ' . quoteIdentifier($table) . ' WHERE id = ?');
  return $stmt->execute([$id]) && $stmt->rowCount() > 0;
}

function handleCrudRoutes(string $collection, string $table, array $allowedFields, array $fieldMap = []): void {
  $segments = getRouteSegments();
  $resource = $segments[1] ?? null;
  $id = $segments[2] ?? null;

  if ($resource !== $collection) {
    return;
  }

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendJson(204, []);
  }

  requireAuth();

  if ($_SERVER['REQUEST_METHOD'] === 'GET' && $id === null) {
    sendJson(200, listCollection($table));
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST' && $id === null) {
    $body = readJsonBody();
    sendJson(201, createCollectionItem($table, $body, $allowedFields, $fieldMap));
  }

  if ($_SERVER['REQUEST_METHOD'] === 'PUT' && $id !== null) {
    $body = readJsonBody();
    $updated = updateCollectionItem($table, $id, $body, $allowedFields, $fieldMap);
    if ($updated === null) {
      sendError(404, 'No encontrado');
    }
    sendJson(200, $updated);
  }

  if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && $id !== null) {
    if (!deleteCollectionItem($table, $id)) {
      sendError(404, 'No encontrado');
    }
    sendJson(200, ['ok' => true]);
  }

  sendError(405, 'Metodo no permitido');
}

$segments = getRouteSegments();
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  sendJson(204, []);
}

if (count($segments) >= 2 && $segments[0] === 'api' && $segments[1] === 'health') {
  sendJson(200, ['ok' => true]);
}

if (count($segments) >= 2 && $segments[0] === 'api' && $segments[1] === 'auth') {
  $pdo = getPdo();
  $path = $segments[2] ?? null;

  if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === 'profiles') {
    $users = $pdo->query('SELECT id, name, avatar FROM users ORDER BY createdAt ASC')->fetchAll(PDO::FETCH_ASSOC);
    sendJson(200, array_map('normalizeRow', $users));
  }

  if ($_SERVER['REQUEST_METHOD'] === 'POST' && $path === 'login') {
    $body = readJsonBody();
    $userId = $body['userId'] ?? null;
    $pin = $body['pin'] ?? null;
    if (!$userId || !$pin) {
      sendError(400, 'Selecciona un perfil e ingresa el PIN');
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user || !password_verify((string) $pin, (string) $user['pinHash'])) {
      sendError(401, 'PIN incorrecto');
    }

    $token = signJwt(['id' => $user['id'], 'name' => $user['name']]);
    sendJson(200, [
      'token' => $token,
      'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'avatar' => $user['avatar'],
      ],
    ]);
  }

  sendError(404, 'Ruta de auth no encontrada');
}

if (count($segments) >= 2 && $segments[0] === 'api' && $segments[1] === 'debts') {
  $path = $segments[2] ?? null;
  if ($_SERVER['REQUEST_METHOD'] === 'GET' && $path === 'summary' && ($segments[3] ?? null) === 'balance') {
    requireAuth();
    $pdo = getPdo();
    $debts = $pdo->query('SELECT * FROM debts WHERE paid = 0')->fetchAll(PDO::FETCH_ASSOC);
    $balance = [];
    foreach ($debts as $debt) {
      $amount = (float) ($debt['amount'] ?? 0);
      $from = (string) ($debt['from'] ?? '');
      $to = (string) ($debt['to'] ?? '');
      if ($from !== '') {
        $balance[$from] = ($balance[$from] ?? 0) - $amount;
      }
      if ($to !== '') {
        $balance[$to] = ($balance[$to] ?? 0) + $amount;
      }
    }
    sendJson(200, $balance);
  }
}

handleCrudRoutes('shopping', 'shopping', ['name', 'quantity', 'category', 'addedBy', 'bought']);
handleCrudRoutes('debts', 'debts', ['from', 'to', 'amount', 'description', 'paid', 'paidAt']);
handleCrudRoutes('wishlist', 'wishlist', ['name', 'price', 'link', 'priority', 'wantedBy', 'achieved']);
handleCrudRoutes('events', 'events', ['title', 'date', 'recurringYearly', 'notes', 'createdBy']);
handleCrudRoutes('appointments', 'appointments', ['title', 'date', 'time', 'location', 'notes', 'createdBy', 'done']);
handleCrudRoutes('notes', 'notes', ['message', 'fromPerson', 'color'], ['from' => 'fromPerson']);

sendError(404, 'Ruta no encontrada');
