<?php

declare(strict_types=1);

class CrudController
{
    private string $table;
    private array $allowedFields;
    private array $fieldMap;

    public function __construct(string $table, array $allowedFields, array $fieldMap = [])
    {
        $this->table = $table;
        $this->allowedFields = $allowedFields;
        $this->fieldMap = $fieldMap;
    }

    public function index(): void
    {
        requireAuth();
        $pdo = getPdo();
        // Ordenamos directamente usando la columna nativa createdAt de MySQL
        $stmt = $pdo->query('SELECT * FROM ' . quoteIdentifier($this->table) . ' ORDER BY createdAt DESC');
        $rows = $stmt->fetchAll();
        sendJson(200, array_map('normalizeRow', $rows));
    }

    public function show(string $id): void
    {
        requireAuth();
        $item = $this->findItem($id);
        if (!$item) sendError(404, 'No encontrado');
        sendJson(200, $item);
    }

    public function store(): void
    {
        requireAuth();
        $body = readJsonBody();
        $pdo = getPdo();

        $columns = [];
        $values = [];

        // Filtramos los campos válidos enviados por el cliente
        $storageFields = normalizeBodyForStorage($body, $this->allowedFields, $this->fieldMap);
        foreach ($storageFields as $field => $value) {
            $columns[] = $field;
            $values[] = $value;
        }

        $placeholders = implode(', ', array_fill(0, count($columns), '?'));
        $quotedColumns = implode(', ', array_map('quoteIdentifier', $columns));

        // Insertamos sin forzar id, createdAt ni updatedAt (MySQL se encarga)
        $stmt = $pdo->prepare('INSERT INTO ' . quoteIdentifier($this->table) . " ($quotedColumns) VALUES ($placeholders)");
        $stmt->execute($values);

        // Obtenemos el ID auto-incrementado generado por MySQL
        $id = $pdo->lastInsertId();

        sendJson(201, $this->findItem($id));
    }

    public function update(string $id): void
    {
        requireAuth();
        $body = readJsonBody();
        $pdo = getPdo();

        $storageFields = normalizeBodyForStorage($body, $this->allowedFields, $this->fieldMap);
        $updates = [];
        $values = [];

        foreach ($storageFields as $field => $value) {
            $updates[] = quoteIdentifier($field) . ' = ?';
            $values[] = $value;
        }

        if (empty($updates)) {
            sendJson(200, $this->findItem($id));
        }

        $values[] = $id;

        // Nota: No actualizamos 'updatedAt' a mano; MySQL lo hace por su regla ON UPDATE CURRENT_TIMESTAMP
        $stmt = $pdo->prepare('UPDATE ' . quoteIdentifier($this->table) . ' SET ' . implode(', ', $updates) . ' WHERE id = ?');
        $stmt->execute($values);

        $updatedItem = $this->findItem($id);
        if (!$updatedItem) sendError(404, 'No encontrado');

        sendJson(200, $updatedItem);
    }

    public function destroy(string $id): void
    {
        requireAuth();
        $pdo = getPdo();
        $stmt = $pdo->prepare('DELETE FROM ' . quoteIdentifier($this->table) . ' WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            sendError(404, 'No encontrado');
        }
        sendJson(200, ['ok' => true]);
    }

    // Ruta especial de Balance de Deudas
    public static function getDebtsBalance(): void
    {
        requireAuth();
        $pdo = getPdo();
        $debts = $pdo->query('SELECT * FROM debts WHERE paid = 0')->fetchAll(PDO::FETCH_ASSOC);
        $balance = [];

        foreach ($debts as $debt) {
            $amount = (float) ($debt['amount'] ?? 0);
            $from = (string) ($debt['from'] ?? '');
            $to = (string) ($debt['to'] ?? '');

            if ($from !== '') $balance[$from] = ($balance[$from] ?? 0) - $amount;
            if ($to !== '')   $balance[$to]   = ($balance[$to] ?? 0) + $amount;
        }
        sendJson(200, $balance);
    }

    private function findItem(string $id): ?array
    {
        $pdo = getPdo();
        $stmt = $pdo->prepare('SELECT * FROM ' . quoteIdentifier($this->table) . ' WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? normalizeRow($row) : null;
    }
}
