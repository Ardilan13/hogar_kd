<?php

declare(strict_types=1);

// Cargar variables de entorno manualmente desde .env
function loadEnv(string $path): void
{
    if (!file_exists($path)) return;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        $key = trim($key);
        $value = trim($value);
        if ($key !== '') {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

function env(string $key, mixed $default = null): mixed
{
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

function sendJson(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sendError(int $status, string $message): void
{
    sendJson($status, ['error' => $message]);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function normalizeRow(array $row): array
{
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

function quoteIdentifier(string $identifier): string
{
    return '`' . str_replace('`', '``', $identifier) . '`';
}

function normalizeBodyForStorage(array $body, array $allowedFields, array $fieldMap = []): array
{
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

function ensureUploadsDirectory(): string
{
    $dir = __DIR__ . '/../uploads';
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    return $dir;
}

function storeUploadedFile(array $file): ?string
{
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        return null;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($mime, $allowed, true)) {
        return null;
    }

    $originalName = pathinfo($file['name'] ?? 'image', PATHINFO_FILENAME);
    $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '', $originalName) ?: 'image';
    $extension = pathinfo($file['name'] ?? 'image', PATHINFO_EXTENSION);
    $extension = $extension !== '' ? $extension : 'jpg';
    $filename = $safeName . '-' . uniqid('', true) . '.' . strtolower($extension);
    $target = ensureUploadsDirectory() . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $target)) {
        return null;
    }

    return '/api/uploads/' . $filename;
}
