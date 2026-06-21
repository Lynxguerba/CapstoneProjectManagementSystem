#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

usage() {
    cat <<'USAGE'
Usage:
  ./backup.sh [label]

Examples:
  ./backup.sh
  ./backup.sh before_restore_2026-04-01
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

if ! command -v docker >/dev/null 2>&1 && ! command -v mysqldump >/dev/null 2>&1; then
    echo "Error: docker or mysqldump is required." >&2
    exit 1
fi

if [[ ! -f docker-compose.yml && ! -f .env ]]; then
    echo "Error: docker-compose.yml or .env not found in $ROOT_DIR" >&2
    exit 1
fi

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
LABEL="${1:-$TIMESTAMP}"
BACKUP_DIR="backups/$LABEL"

if [[ -e "$BACKUP_DIR" ]]; then
    echo "Error: backup directory already exists: $BACKUP_DIR" >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[1/5] Backing up database to $BACKUP_DIR/db.sql ..."
if command -v docker >/dev/null 2>&1 && docker compose ps --services 2>/dev/null | grep -q "^db$"; then
    docker compose exec -T db sh -lc 'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" --single-transaction --routines --triggers --events --no-tablespaces "$MYSQL_DATABASE"' > "$BACKUP_DIR/db.sql"
else
    # Fallback to local mysqldump using .env variables
    DB_HOST=$(grep '^DB_HOST=' .env | cut -d '=' -f2- | tr -d '"'\''\r' || echo "127.0.0.1")
    DB_PORT=$(grep '^DB_PORT=' .env | cut -d '=' -f2- | tr -d '"'\''\r' || echo "3306")
    DB_DATABASE=$(grep '^DB_DATABASE=' .env | cut -d '=' -f2- | tr -d '"'\''\r' || echo "cpms")
    DB_USERNAME=$(grep '^DB_USERNAME=' .env | cut -d '=' -f2- | tr -d '"'\''\r' || echo "root")
    DB_PASSWORD=$(grep '^DB_PASSWORD=' .env | cut -d '=' -f2- | tr -d '"'\''\r' || echo "")
    
    mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USERNAME" -p"$DB_PASSWORD" --single-transaction --routines --triggers --events --no-tablespaces "$DB_DATABASE" > "$BACKUP_DIR/db.sql"
fi

echo "[2/5] Backing up storage/app to $BACKUP_DIR/storage-app.tar.gz ..."
tar -czf "$BACKUP_DIR/storage-app.tar.gz" storage/app

if [[ -f .env ]]; then
    echo "[3/5] Backing up .env to $BACKUP_DIR/.env.backup ..."
    cp .env "$BACKUP_DIR/.env.backup"
else
    echo "[3/5] Skipping .env backup (.env not found)."
fi

echo "[4/5] Writing checksums ..."
sha256sum "$BACKUP_DIR/db.sql" "$BACKUP_DIR/storage-app.tar.gz" > "$BACKUP_DIR/checksums.sha256"

echo "[5/5] Verifying checksums ..."
sha256sum -c "$BACKUP_DIR/checksums.sha256"

echo "Backup completed: $BACKUP_DIR"

