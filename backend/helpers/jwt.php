<?php

declare(strict_types=1);

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string
{
    return base64_decode(strtr($data, '-_', '+/'), true) ?: '';
}

function signJwt(array $payload): string
{
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $secret = (string) env('JWT_SECRET', 'dev-secret');
    $now = time();
    $payload = array_merge([
        'iat' => $now,
        'exp' => $now + (60 * 60 * 24 * 30),
    ], $payload);

    $encodedHeader = base64UrlEncode(json_encode($header, JSON_UNESCAPED_UNICODE));
    $encodedPayload = base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $signature = hash_hmac('sha256', "$encodedHeader.$encodedPayload", $secret, true);

    return "$encodedHeader.$encodedPayload." . base64UrlEncode($signature);
}

function verifyJwt(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $signature] = $parts;
    $secret = (string) env('JWT_SECRET', 'dev-secret');
    $expectedSignature = base64UrlEncode(hash_hmac('sha256', "$header.$payload", $secret, true));

    if (!hash_equals($expectedSignature, $signature)) return null;

    $decodedPayload = json_decode(base64UrlDecode($payload), true);
    if (!is_array($decodedPayload) || ($decodedPayload['exp'] ?? 0) < time()) {
        return null;
    }

    return $decodedPayload;
}

function getCurrentUser(): ?array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/', $header, $matches)) {
        return null;
    }
    return verifyJwt($matches[1]);
}

function requireAuth(): array
{
    $user = getCurrentUser();
    if (!$user) {
        sendError(401, 'No autorizado');
    }
    return $user;
}
