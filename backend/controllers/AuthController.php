<?php

declare(strict_types=1);

class AuthController
{
    public static function getProfiles(): void
    {
        $pdo = getPdo();
        $users = $pdo->query('SELECT id, name, avatar FROM users ORDER BY createdAt ASC')->fetchAll(PDO::FETCH_ASSOC);
        sendJson(200, array_map('normalizeRow', $users));
    }

    public static function login(): void
    {
        $body = readJsonBody();
        $userId = $body['userId'] ?? null;
        $pin = $body['pin'] ?? null;

        if (!$userId || !$pin) {
            sendError(400, 'Selecciona un perfil e ingresa el PIN');
        }

        $pdo = getPdo();
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
}
