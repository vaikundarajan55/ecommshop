# API Documentation

Base URL: `http://localhost:5000/api`
Auth: `Authorization: Bearer <JWT>` header (obtained from `/auth/login`).

## Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /auth/register | Public | Customer registration |
| POST | /auth/login | Public | Shared login (admin/staff/customer) |
| POST | /auth/forgot-password | Public | Generates a reset token |
| POST | /auth/forgot-change-password | Public | Resets password using token |
| POST | /auth/change-password | Auth | Change password while logged in |
| GET  | /auth/me | Auth | Current user profile |
| PUT  | /auth/profile | Auth | Update name/phone |

## Categories
| Method | Endpoint | Access |
|---|---|---|
| GET | /categories | Public |
| GET | /categories/:id | Public |
| POST | /categories | Admin (multipart: name, status, image) |
| PUT | /categories/:id | Admin |
| DELETE | /categories/:id | Admin |

## Subcategories
Same pattern under `/subcategories`, with `category_id` in the body.

## Products
| Method | Endpoint | Access |
|---|---|---|
| GET | /products?categoryId=&subcategoryId=&search=&status=&minPrice=&maxPrice=&page=&limit= | Public |
| GET | /products/:id | Public |
| POST | /products | Admin (multipart: up to 6 `images`) |
| PUT | /products/:id | Admin |
| DELETE | /products/:id | Admin |

## Orders
| Method | Endpoint | Access | Notes |
|---|---|---|---|
| POST | /orders | Customer | Places order; triggers AI delivery prediction + admin socket event |
| GET | /orders/my | Customer | Logged-in user's own orders |
| GET | /orders/:id | Auth | Order detail + items + tracking history |
| GET | /orders/:id/invoice | Auth | Streams a PDF invoice |
| GET | /orders?status=&dateFrom=&dateTo=&search=&page=&limit= | Admin | Filterable order list |
| GET | /orders/reports/summary?dateFrom=&dateTo=&status=&groupBy=day\|status\|payment_method | Admin | Order report |
| PUT | /orders/:id/status | Admin | Updates status, pushes Socket.IO event to customer + admin room, runs AI anomaly check |
| PUT | /orders/:id/payment | Admin | Updates payment status/transaction ref |

## Users
| Method | Endpoint | Access |
|---|---|---|
| GET | /users?role=&status=&search=&page=&limit= | Admin |
| GET | /users/:id | Admin |
| PUT | /users/:id/status | Admin (active/inactive/blocked) |

## Socket.IO Events
- Client emits `join_order_room` (orderId) → receives `order_status_updated`
- Admin emits `join_admin_room` → receives `new_order`, `order_status_updated`

## AI Service (called server-to-server by the Node backend, not by the frontend directly)
Base URL: `http://localhost:8000`
- `POST /predict/delivery` — `{ order_id, shipping_pincode, item_count, total_amount, order_hour }` → `{ predicted_delivery_date, estimated_days, delay_risk, confidence }`
- `POST /track/anomaly` — `{ order_id, new_status }` → `{ is_anomaly, reason }`
