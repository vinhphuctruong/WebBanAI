# Deploy VPS (Docker Only – 4 Port: 22, 80, 443, ICMP)

> Toàn bộ hệ thống chạy bằng Docker Compose. Không cần PM2.
> Chỉ cần mở 4 port: **SSH (22)**, **HTTP (80)**, **HTTPS (443)**, **ICMP**.
> Tất cả service (Postgres, MongoDB, Backend, Frontend) nằm trong Docker network nội bộ, không expose port ra ngoài.

## Kiến trúc

```
Internet ──▶ Port 80/443 ──▶ Nginx Proxy (container)
                                  │
                       ┌──────────┴──────────┐
                       │                     │
                 Frontend:80           Backend:8080
                 (container)           (container)
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                        Postgres:5432           MongoDB:27017
                        (container)             (container)
```

## 1) Chuẩn bị VPS

- Ubuntu 22.04+ khuyến nghị
- Cài Docker + Compose plugin

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 2) Firewall (chỉ mở 4 port)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 3) Upload code lên VPS

```bash
git clone <REPO_URL> /opt/tm-software-ai
cd /opt/tm-software-ai
```

## 4) Tạo file biến môi trường

```bash
cp .env.vps.example .env.vps
nano .env.vps
```

**Bắt buộc sửa:**
- `POSTGRES_PASSWORD` → mật khẩu mạnh
- `JWT_SECRET` → chuỗi random 32+ ký tự
- `APP_BASE_URL` → `http://aivideo.vinhphucdev.id.vn`
- `API_BASE_URL` → `http://aivideo.vinhphucdev.id.vn`
- Các URL callback VNPay/MoMo nếu dùng payment

## 5) Chạy stack (một lệnh duy nhất)

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

## 6) Kiểm tra

```bash
# Xem tất cả container đang chạy
docker compose -f docker-compose.vps.yml ps

# Xem log backend
docker compose -f docker-compose.vps.yml logs -f backend

# Xem log proxy (nginx)
docker compose -f docker-compose.vps.yml logs -f proxy

# Kiểm tra health
docker compose -f docker-compose.vps.yml ps --format "table {{.Name}}\t{{.Status}}"
```

## 7) Truy cập

- `http://aivideo.vinhphucdev.id.vn` → Frontend
- `http://aivideo.vinhphucdev.id.vn/api/` → Backend API

## Các lệnh quản trị hay dùng

```bash
# Restart tất cả
docker compose -f docker-compose.vps.yml restart

# Restart riêng backend
docker compose -f docker-compose.vps.yml restart backend

# Cập nhật code mới
cd /opt/tm-software-ai
git pull
docker compose -f docker-compose.vps.yml up -d --build

# Dọn image cũ
docker image prune -f

# Xem dung lượng Docker
docker system df
```

## Xử lý lỗi thường gặp

### ERR_CONNECTION_REFUSED
1. Kiểm tra container đang chạy: `docker compose -f docker-compose.vps.yml ps`
2. Kiểm tra DNS đã trỏ về IP VPS chưa: `nslookup aivideo.vinhphucdev.id.vn`
3. Kiểm tra firewall: `sudo ufw status`
4. Xem log nginx: `docker compose -f docker-compose.vps.yml logs proxy`

### Backend lỗi DB
1. Kiểm tra Postgres health: `docker compose -f docker-compose.vps.yml logs postgres`
2. Kiểm tra MongoDB health: `docker compose -f docker-compose.vps.yml logs mongo`

## CI/CD GitHub Actions

### Secrets cần tạo (Settings → Secrets → Actions)

**Bắt buộc:**
- `VPS_HOST`: IP hoặc domain VPS
- `VPS_USER`: user SSH (vd: `root`)
- `VPS_SSH_KEY`: private key SSH (PEM/OpenSSH)
- `VPS_REPO_URL`: URL clone repo
- `VPS_ENV_FILE`: toàn bộ nội dung file `.env.vps`

**Tùy chọn:**
- `VPS_PORT`: port SSH (mặc định 22)
- `VPS_APP_DIR`: thư mục app (mặc định `/opt/tm-software-ai`)
- `VPS_SSH_KNOWN_HOSTS`: output `ssh-keyscan` 
