#!/bin/bash
# ============================================================
# init-ssl.sh — Lấy chứng chỉ SSL Let's Encrypt lần đầu
# Chạy 1 lần duy nhất trên VPS, sau đó tự động renew
# ============================================================
set -euo pipefail

DOMAIN="aivideo.vinhphucdev.id.vn"
EMAIL="admin@vinhphucdev.id.vn"     # Đổi email nếu cần
COMPOSE_FILE="docker-compose.vps.yml"

echo "========================================"
echo "  SSL Setup cho $DOMAIN"
echo "========================================"

# Bước 1: Dừng stack cũ nếu đang chạy
echo "[1/5] Dừng containers cũ..."
docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# Bước 2: Dùng nginx config tạm (không cần SSL cert)
echo "[2/5] Khởi động Nginx tạm để xác thực domain..."
cp deploy/nginx.vps.conf deploy/nginx.vps.conf.bak
cp deploy/nginx.init-ssl.conf deploy/nginx.vps.conf

# Chỉ chạy proxy container
docker compose -f "$COMPOSE_FILE" up -d proxy

# Đợi nginx sẵn sàng
sleep 3

# Bước 3: Lấy cert từ Let's Encrypt
echo "[3/5] Đang lấy chứng chỉ SSL từ Let's Encrypt..."
docker compose -f "$COMPOSE_FILE" run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

# Bước 4: Khôi phục nginx config SSL đầy đủ
echo "[4/5] Khôi phục Nginx config SSL đầy đủ..."
cp deploy/nginx.vps.conf.bak deploy/nginx.vps.conf
rm -f deploy/nginx.vps.conf.bak

# Bước 5: Khởi động toàn bộ stack
echo "[5/5] Khởi động toàn bộ stack với HTTPS..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo ""
echo "========================================"
echo "  ✅ SSL đã cài xong!"
echo "  🌐 https://$DOMAIN"
echo "  🔄 Cert tự động renew mỗi 12 giờ"
echo "========================================"
