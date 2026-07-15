<?php

declare(strict_types=1);

function getPdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = (string) env('DB_HOST', '127.0.0.1');
    $dbname = (string) env('DB_NAME', 'hogar');
    $user = (string) env('DB_USER', 'root');
    $pass = (string) env('DB_PASS', '');

    try {
        // Conexión nativa a MySQL
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        sendError(500, 'Error de conexión a la base de datos MySQL: ' . $e->getMessage());
    }

    // Sembrar usuarios iniciales si la tabla 'users' está vacía
    try {
        $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        if ($count === 0) {
            $u1Name = (string) env('USER1_NAME', 'Dilan');
            $u1Pin = (string) env('USER1_PIN', '9013');
            $u2Name = (string) env('USER2_NAME', 'Karen');
            $u2Pin = (string) env('USER2_PIN', '1704');

            $insert = $pdo->prepare('INSERT INTO users (name, pinHash, avatar) VALUES (?, ?, ?)');

            // Dilan
            $insert->execute([
                $u1Name,
                password_hash($u1Pin, PASSWORD_DEFAULT),
                '💙'
            ]);

            // Karen
            $insert->execute([
                $u2Name,
                password_hash($u2Pin, PASSWORD_DEFAULT),
                '🧡'
            ]);
        }
    } catch (PDOException $e) {
        // Silenciar o registrar si la tabla aún no existe por alguna razón
    }

    return $pdo;
}
