# 餐饮订单管理系统

本目录按提示词拆分为两个项目：

- `frontend`：Vite + React + React Router v6 + Tailwind CSS + Framer Motion
- `backend`：Next.js API Routes + MongoDB + Mongoose + SSE

## 运行方式

1. 启动 MongoDB，并在 `backend/.env.local` 中配置：

```env
MONGODB_URI=mongodb://127.0.0.1:27017/order-system
JWT_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_API_URL=http://localhost:4000
```

2. 后端：

```bash
cd backend
npm install
npm run dev
```

默认端口：`http://localhost:4000`

3. 前端：

```bash
cd frontend
npm install
npm run dev
```

默认端口：`http://localhost:3000`

## 已实现功能

- 用户认证：顾客手机号注册/登录，员工账号注册/登录，密码使用 `bcryptjs` 哈希和校验，JWT 鉴权。
- 用户资料：头像 base64 上传、简介编辑、密码修改。
- 菜单：分类列表、菜品列表、员工新增/编辑/上下架。
- 桌位：员工批量生成桌位和二维码 token，顾客可通过 `/scan/:tableId` 进入点餐。
- 购物车：按桌位和顾客隔离，支持添加、修改、删除，聚合同桌购物车。
- 多人协同：`/api/events?room=table-{tableId}` 和 `/api/events?room=staff` 使用 SSE 广播购物车与订单消息。
- 订单：顾客下单，员工查看、筛选、推进状态，状态流转为 `pending -> confirmed -> preparing -> ready -> completed`，支持 `cancelled`。
- 前端体验：浅色/深色主题持久化、全局 toast、页面切换动画、响应式布局。

## 关键 API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET/PUT /api/auth/profile`
- `GET /api/menu/categories`
- `GET/POST /api/menu/items`
- `PUT /api/menu/items/[id]`
- `PATCH /api/menu/items/[id]/available`
- `GET/POST /api/tables`
- `GET /api/tables/[tableId]`
- `GET /api/cart?tableId=xxx`
- `POST /api/cart/add`
- `PUT /api/cart/update`
- `DELETE /api/cart/remove`
- `GET /api/events?room=table-{tableId}`
- `GET /api/events?room=staff`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/[id]`
- `PATCH /api/orders/[id]/status`
- `GET /api/kitchen/orders`
