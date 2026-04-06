# Deploy VPS (Docker Compose)

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

## 2) Upload code lên VPS

```bash
git clone <REPO_URL> app
cd app
```

## 3) Tạo file biến môi trường production

```bash
cp .env.vps.example .env.vps
nano .env.vps
```

Bắt buộc sửa:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- Thông tin ngân hàng/sale nếu cần

## 4) Chạy production stack

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

Kiểm tra:

```bash
docker compose -f docker-compose.vps.yml ps
docker compose -f docker-compose.vps.yml logs -f backend
```

## 5) Mở firewall

```bash
sudo ufw allow 80/tcp
sudo ufw enable
```

Ứng dụng sẽ truy cập qua:
- `http://<IP_VPS>`

## Ghi chú SSL (HTTPS)

Bản compose này đang chạy HTTP (port 80).
Nếu cần HTTPS + domain, có thể thêm Caddy/Nginx SSL ở bước tiếp theo.

## CI/CD GitHub Actions

Repo đã có sẵn:
- `.github/workflows/ci.yml`
- `.github/workflows/cd-vps.yml`

### CI
- Chạy khi push/PR:
1. Backend syntax check.
2. Frontend build.

### CD VPS
- Tự deploy khi CI `success` trên `main/master`.
- Có thể bấm tay bằng `workflow_dispatch`.

### Secrets cần tạo trong GitHub (Settings -> Secrets and variables -> Actions)

Bắt buộc:
- `VPS_HOST`: IP hoặc domain VPS.
- `VPS_USER`: user SSH (ví dụ `root` hoặc `ubuntu`).
- `VPS_SSH_KEY`: private key SSH (PEM/OpenSSH).
- `VPS_REPO_URL`: URL clone repo (SSH/HTTPS).
- `VPS_ENV_FILE`: toàn bộ nội dung file `.env.vps` (multi-line).

Khuyến nghị:
- `VPS_PORT`: port SSH (mặc định 22).
- `VPS_APP_DIR`: thư mục app trên VPS (mặc định `/opt/tm-software-ai`).
- `VPS_SSH_KNOWN_HOSTS`: output của `ssh-keyscan` để tăng bảo mật host key.

Ví dụ tạo `known_hosts`:

```bash
ssh-keyscan -p 22 <IP_VPS>
```

Copy output vào secret `VPS_SSH_KNOWN_HOSTS`.
