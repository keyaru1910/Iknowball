#!/bin/bash
# ==============================================================================
# Script Rollback / Restore Database PostgreSQL cho iKnowBall (Linux / Docker)
# ==============================================================================

set -e

if [ -z "$1" ]; then
    echo "Sử dụng: ./restore_postgres.sh <đường_dẫn_file_dump>"
    echo "Ví dụ: ./restore_postgres.sh ./infrastructure/backups/iknowball_backup_20260920.dump"
    exit 1
fi

DUMP_FILE="$1"

if [ ! -f "$DUMP_FILE" ]; then
    echo "[LỖI] File không tồn tại: $DUMP_FILE"
    exit 1
fi

DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"iknowball"}
DB_USER=${DB_USER:-"postgres"}

echo "=========================================="
echo "Bắt đầu khôi phục DB: $DB_NAME"
echo "File: $DUMP_FILE"
echo "Host: $DB_HOST:$DB_PORT"
echo "=========================================="

pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists -v "$DUMP_FILE"

echo "[THÀNH CÔNG] Đã khôi phục hoàn tất cơ sở dữ liệu!"
