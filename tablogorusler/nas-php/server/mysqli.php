<?php
declare(strict_types=1);
// A small adapter keeps the application's existing query and transaction code intact.
final class NasStatement {
    private mysqli_result|false $result = false;
    public function __construct(private mysqli_stmt $statement) {}
    public function execute(array $values=[]): bool {
        $success=$this->statement->execute($values);
        $this->result=$this->statement->get_result();
        return $success;
    }
    public function fetch(): array|false { return $this->result ? ($this->result->fetch_assoc() ?? false) : false; }
    public function fetchAll(): array { return $this->result ? $this->result->fetch_all(MYSQLI_ASSOC) : []; }
    public function fetchColumn(int $column=0): mixed {
        $row=$this->result ? $this->result->fetch_row() : null;
        return $row[$column] ?? false;
    }
}
final class NasDatabase {
    private bool $transaction=false;
    public function __construct(private mysqli $connection) {}
    public function prepare(string $query): NasStatement { return new NasStatement($this->connection->prepare($query)); }
    public function exec(string $query): void {
        $this->connection->multi_query($query);
        do {
            $result=$this->connection->store_result();
            if ($result) $result->free();
            if (!$this->connection->more_results()) break;
        } while ($this->connection->next_result());
    }
    public function beginTransaction(): void { $this->connection->begin_transaction(); $this->transaction=true; }
    public function commit(): void { $this->connection->commit(); $this->transaction=false; }
    public function rollBack(): void { $this->connection->rollback(); $this->transaction=false; }
    public function inTransaction(): bool { return $this->transaction; }
    public function lastInsertId(): string { return (string)$this->connection->insert_id; }
}
