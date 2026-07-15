<?php

declare(strict_types=1);

function ensureColumn(PDO $pdo, string $table, string $column, string $definition): void
{
    $stmt = $pdo->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN {$column} {$definition}");
    }
}

function ensureSchema(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            pinHash VARCHAR(255) NOT NULL,
            avatar VARCHAR(255) NOT NULL,
            color VARCHAR(50) NOT NULL DEFAULT '#A6435A',
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )"
    );

    foreach (['shopping', 'debts', 'wishlist', 'events', 'appointments', 'notes'] as $table) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$table}` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS gallery (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255),
            imageUrl VARCHAR(1024) NOT NULL,
            description TEXT,
            createdBy VARCHAR(255),
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )"
    );

    ensureColumn($pdo, 'shopping', 'name', 'VARCHAR(255) NOT NULL DEFAULT ""');
    ensureColumn($pdo, 'shopping', 'quantity', 'VARCHAR(100) DEFAULT ""');
    ensureColumn($pdo, 'shopping', 'category', 'VARCHAR(100) DEFAULT "Mercado"');
    ensureColumn($pdo, 'shopping', 'addedBy', 'VARCHAR(255) DEFAULT ""');
    ensureColumn($pdo, 'shopping', 'bought', 'TINYINT(1) NOT NULL DEFAULT 0');
    ensureColumn($pdo, 'shopping', 'imageUrl', 'VARCHAR(1024) DEFAULT NULL');

    ensureColumn($pdo, 'debts', 'from', 'VARCHAR(255) NOT NULL DEFAULT ""');
    ensureColumn($pdo, 'debts', 'to', 'VARCHAR(255) NOT NULL DEFAULT ""');
    ensureColumn($pdo, 'debts', 'amount', 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00');
    ensureColumn($pdo, 'debts', 'description', 'TEXT');
    ensureColumn($pdo, 'debts', 'paid', 'TINYINT(1) NOT NULL DEFAULT 0');
    ensureColumn($pdo, 'debts', 'paidAt', 'TIMESTAMP NULL DEFAULT NULL');
    ensureColumn($pdo, 'debts', 'imageUrl', 'VARCHAR(1024) DEFAULT NULL');

    ensureColumn($pdo, 'wishlist', 'name', 'VARCHAR(255) NOT NULL DEFAULT ""');
    ensureColumn($pdo, 'wishlist', 'price', 'DECIMAL(10, 2) DEFAULT NULL');
    ensureColumn($pdo, 'wishlist', 'link', 'VARCHAR(512) DEFAULT NULL');
    ensureColumn($pdo, 'wishlist', 'priority', 'VARCHAR(50) NOT NULL DEFAULT "media"');
    ensureColumn($pdo, 'wishlist', 'wantedBy', 'VARCHAR(255) DEFAULT ""');
    ensureColumn($pdo, 'wishlist', 'achieved', 'TINYINT(1) NOT NULL DEFAULT 0');
    ensureColumn($pdo, 'wishlist', 'imageUrl', 'VARCHAR(1024) DEFAULT NULL');

    ensureColumn($pdo, 'events', 'title', 'VARCHAR(255) NOT NULL DEFAULT ""');
    ensureColumn($pdo, 'events', 'date', 'DATE NOT NULL');
    ensureColumn($pdo, 'events', 'recurringYearly', 'TINYINT(1) NOT NULL DEFAULT 1');
    ensureColumn($pdo, 'events', 'notes', 'TEXT');
    ensureColumn($pdo, 'events', 'createdBy', 'VARCHAR(255) DEFAULT ""');
    ensureColumn($pdo, 'events', 'imageUrl', 'VARCHAR(1024) DEFAULT NULL');

    ensureColumn($pdo, 'appointments', 'title', 'VARCHAR(255) NOT NULL DEFAULT ""');
    ensureColumn($pdo, 'appointments', 'date', 'DATE NOT NULL');
    ensureColumn($pdo, 'appointments', 'time', 'TIME DEFAULT NULL');
    ensureColumn($pdo, 'appointments', 'location', 'VARCHAR(255) DEFAULT NULL');
    ensureColumn($pdo, 'appointments', 'notes', 'TEXT');
    ensureColumn($pdo, 'appointments', 'createdBy', 'VARCHAR(255) DEFAULT ""');
    ensureColumn($pdo, 'appointments', 'done', 'TINYINT(1) NOT NULL DEFAULT 0');
    ensureColumn($pdo, 'appointments', 'imageUrl', 'VARCHAR(1024) DEFAULT NULL');

    ensureColumn($pdo, 'notes', 'message', 'TEXT NOT NULL');
    ensureColumn($pdo, 'notes', 'fromPerson', 'VARCHAR(255) DEFAULT ""');
    ensureColumn($pdo, 'notes', 'color', 'VARCHAR(50) DEFAULT NULL');
    ensureColumn($pdo, 'notes', 'imageUrl', 'VARCHAR(1024) DEFAULT NULL');
}

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
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        sendError(500, 'Error de conexión a la base de datos MySQL: ' . $e->getMessage());
    }

    ensureSchema($pdo);

    try {
        $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        if ($count === 0) {
            $u1Name = (string) env('USER1_NAME', 'Dilan');
            $u1Pin = (string) env('USER1_PIN', '9013');
            $u2Name = (string) env('USER2_NAME', 'Karen');
            $u2Pin = (string) env('USER2_PIN', '1704');

            $insert = $pdo->prepare('INSERT INTO users (name, pinHash, avatar, color) VALUES (?, ?, ?, ?)');

            $insert->execute([
                $u1Name,
                password_hash($u1Pin, PASSWORD_DEFAULT),
                '💙',
                '#A6435A'
            ]);

            $insert->execute([
                $u2Name,
                password_hash($u2Pin, PASSWORD_DEFAULT),
                '🧡',
                '#6B8F71'
            ]);
        }
    } catch (PDOException $e) {
        // Silenciar o registrar si la tabla aún no existe por alguna razón
    }

    return $pdo;
}
