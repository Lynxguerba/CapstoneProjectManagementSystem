#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
    DB_USERNAME=$(grep '^DB_USERNAME=' .env | cut -d= -f2-)
    DB_PASSWORD=$(grep '^DB_PASSWORD=' .env | cut -d= -f2-)
    DB_DATABASE=$(grep '^DB_DATABASE=' .env | cut -d= -f2-)
fi

usage() {
    cat <<'USAGE'
Usage:
  ./restore.sh <backup_dir_or_label> [--yes]

Examples:
  ./restore.sh backups/2026-04-01_15-48-33 --yes
  ./restore.sh 2026-04-01_15-48-33 --yes
USAGE
}

if [[ $# -lt 1 ]]; then
    usage
    exit 1
fi

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

TARGET_INPUT="$1"
shift || true
AUTO_CONFIRM="false"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --yes)
            AUTO_CONFIRM="true"
            ;;
        *)
            echo "Error: unknown option: $1" >&2
            usage
            exit 1
            ;;
    esac
    shift || true
done

if [[ "$TARGET_INPUT" == backups/* ]]; then
    BACKUP_DIR="$TARGET_INPUT"
else
    BACKUP_DIR="backups/$TARGET_INPUT"
fi

if [[ ! -d "$BACKUP_DIR" ]]; then
    echo "Error: backup directory not found: $BACKUP_DIR" >&2
    exit 1
fi

DB_FILE="$BACKUP_DIR/db.sql"
STORAGE_ARCHIVE="$BACKUP_DIR/storage-app.tar.gz"
CHECKSUM_FILE="$BACKUP_DIR/checksums.sha256"

for required_file in "$DB_FILE" "$STORAGE_ARCHIVE" "$CHECKSUM_FILE"; do
    if [[ ! -f "$required_file" ]]; then
        echo "Error: required backup file missing: $required_file" >&2
        exit 1
    fi
done

if ! command -v mysql >/dev/null 2>&1; then
    echo "Error: mysql client is required." >&2
    exit 1
fi

echo "About to restore from: $BACKUP_DIR"
echo "This will replace:"
echo "  - current database content"
echo "  - current storage/app files"

if [[ "$AUTO_CONFIRM" != "true" ]]; then
    read -r -p "Continue? Type 'restore' to proceed: " CONFIRMATION
    if [[ "$CONFIRMATION" != "restore" ]]; then
        echo "Cancelled."
        exit 1
    fi
fi

echo "[1/6] Verifying backup checksums ..."
sha256sum -c "$CHECKSUM_FILE"

TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"
PRE_RESTORE_DIR="backups/pre_restore_$TIMESTAMP"
mkdir -p "$PRE_RESTORE_DIR"

echo "[2/6] Creating pre-restore database snapshot ..."
mysqldump -h 127.0.0.1 -u"${DB_USERNAME:-root}" -p"${DB_PASSWORD:-}" --single-transaction --routines --triggers --events --no-tablespaces "${DB_DATABASE:-cpms}" > "$PRE_RESTORE_DIR/db.sql"

echo "[3/6] Creating pre-restore storage snapshot ..."
tar -czf "$PRE_RESTORE_DIR/storage-app.tar.gz" storage/app
sha256sum "$PRE_RESTORE_DIR/db.sql" "$PRE_RESTORE_DIR/storage-app.tar.gz" > "$PRE_RESTORE_DIR/checksums.sha256"

echo "[4/6] Restoring database ..."
mysql -h 127.0.0.1 -u"${DB_USERNAME:-root}" -p"${DB_PASSWORD:-}" "${DB_DATABASE:-cpms}" < "$DB_FILE"

echo "[5/6] Restoring storage/app ..."
rm -rf storage/app
tar -xzf "$STORAGE_ARCHIVE"

echo "[6/6] Post-restore quick checks ..."
cat <<'SQL' | mysql -h 127.0.0.1 -u"${DB_USERNAME:-root}" -p"${DB_PASSWORD:-}" "${DB_DATABASE:-cpms}"
SELECT 'users', COUNT(*) FROM users;
SELECT 'program_sets', COUNT(*) FROM program_sets;
SELECT 'groups', COUNT(*) FROM `groups`;
SELECT 'group_members', COUNT(*) FROM group_members;
SQL

echo "Restore completed."
echo "Pre-restore safety snapshot: $PRE_RESTORE_DIR"
