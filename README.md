# Mau Lam Video - Node.js + PostgreSQL + MongoDB + React

Project da duoc chuyen sang stack moi:
- Backend: `backend-node` (Node.js + Express)
- User/Auth/Order/Payment: PostgreSQL
- Content/Catalog: MongoDB
- Frontend: `frontend-react` (React + Vite)

## Kien truc du lieu

- PostgreSQL (`mlv_node`):
  - `users`
  - `user_bookmarks`
  - `orders`
  - `payments`
  - `referral_uses`
  - `withdrawals`

- MongoDB (`mlv_content`):
  - `gems`
  - `ai_tools`
  - `reviews`
  - `pricing`

## Chay nhanh bang Docker

```bash
docker compose -f docker-compose.node.yml up --build
```

- Backend API: `http://localhost:8080/api`
- Frontend React: `http://localhost:5173`

## Chay local tung service

### 1) Chay Postgres + MongoDB

```bash
docker compose -f docker-compose.node.yml up -d postgres mongo
```

### 2) Chay backend Node

```bash
cd backend-node
cp .env.example .env
npm install
npm run dev
```

### 3) Chay frontend React

```bash
cd frontend-react
cp .env.example .env
npm install
npm run dev
```

## Tai khoan seed

- Admin: `admin@maulamvideo.com / admin123`
- Staff: `staff@maulamvideo.com / staff123`
- Sale: `sale@maulamvideo.com / sale123`
- User: `demo@maulamvideo.com / 123456`

## API chinh

- Health: `GET /api/health`
- Auth: `/api/auth/register`, `/api/auth/login`
- Catalog: `/api/catalog/gems`, `/api/catalog/gems/:slug`, `/api/catalog/ai-tools`, `/api/catalog/ai-tools/:slug`, `/api/catalog/reviews`, `/api/catalog/pricing`
- Profile: `/api/profile/me`, `/api/profile/phone`, `/api/profile/bookmarks/toggle`
- Payments: `/api/payments/create`, `/api/payments/:paymentId`, `/api/payments/:paymentId/confirm`
- Referral: `/api/referral/me`, `/api/referral/code/generate`, `/api/referral/withdraw`
- Admin: `/api/admin/dashboard`, `/api/admin/users`, `/api/admin/orders`, `/api/admin/payments`, `/api/admin/catalog/*`

## Thanh toan

Mac dinh su dung `chuyen khoan ngan hang` + kenh `Zalo/Telegram` chot sale.
Cau hinh trong `backend-node/.env`:

- `BANK_NAME`
- `BANK_ACCOUNT_NAME`
- `BANK_ACCOUNT_NUMBER`
- `BANK_BRANCH`
- `BANK_QR_IMAGE_URL`
- `SALES_ZALO_LINK`
- `SALES_TELEGRAM_LINK`
- `SALES_PHONE`

## Ghi chu

- Stack moi duoc uu tien de phat trien tiep.
