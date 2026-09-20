#!/bin/bash
# ==============================================================================
# Script Backup Database PostgreSQL cho iKnowBall (Môi trường Linux / Docker)
# ==============================================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"iknowball"}
DB_USER=${DB_USER:-"postgres"}
BACKUP_DIR=${BACKUP_DIR:-"./infrastructure/backups"}

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/iknowball_backup_${TIMESTAMP}.dump"

echo "=========================================="
echo "Bắt đầu backup Database: $DB_NAME"
echo "Thời gian: $TIMESTAMP"
echo "Host: $DB_HOST:$DB_PORT"
echo "File: $BACKUP_FILE"
echo "=========================================="

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b -v -f "$BACKUP_FILE" "$DB_NAME"

echo "[THÀNH CÔNG] Đã tạo bản sao lưu tại $BACKUP_FILE"

# Xóa các bản backup cũ hơn 14 ngày để tiết kiệm dung lượng
find "$BACKUP_DIR" -type f -name "iknowball_backup_*.dump" -mtime +14 -exec rm {} \;
echo "Đã dọn dẹp các bản backup cũ hơn 14 ngày."
