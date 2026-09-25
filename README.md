# Ecommerce Platform — Website + Admin Panel

A full-stack ecommerce project: separate **admin** and **website** React/Vite/Tailwind
frontends, a Node.js (Express, MVC pattern) backend with Socket.IO real-time order
tracking and MySQL (incl. stored procedures), and a Python AI microservice that
predicts delivery windows and flags order-tracking anomalies.

## Folder Structure
```
ecommerce-project/
├── frontend/
│   ├── admin/          # React + Vite + Tailwind — admin panel
│   └── website/        # React + Vite + Tailwind — customer-facing storefront
├── backend/
│   ├── src/             # Express app: config, controllers, models, routes, middlewares, sockets, utils
│   └── database/        # schema.sql, procedures.sql, seed.sql
├── python-ai-service/   # FastAPI service: delivery prediction + anomaly detection
└── docs/                 # Setup guide, API docs, DB schema notes
```

## Stack
- **Frontend (admin + website):** React 18, Vite, Tailwind CSS, Redux Toolkit, Axios, Socket.IO client
- **Backend:** Node.js, Express (MVC), Socket.IO, MySQL (mysql2), JWT auth, Multer uploads, PDFKit invoices
- **Database:** MySQL 8+ with stored procedures for listing/reporting
- **AI service:** Python, FastAPI, scikit-learn-ready (ships with a heuristic fallback model)

## Admin Panel Pages
Login, Dashboard, Category, Subcategory, Product, Order List (status update + live
tracking + invoice download), Order Report (date/status/payment filters), User List,
Change Password, Logout.

## Website Pages
Home, About, Product List, Product View, Cart, Checkout, Payment, Success, Failure,
Login, Register, Dashboard (live order tracking), Profile, Change Password,
Forgot Password, Forgot-Change Password.

## Real-time order tracking
Socket.IO rooms: the website joins `order_<id>` on the dashboard; the admin joins
`admin_room`. When admin updates an order's status, the customer sees it update live,
and the AI service is asked to flag anomalies on that transition.

## AI order tracking
On order creation, the Node backend calls the Python service's `/predict/delivery`
endpoint to get an estimated delivery date + delay risk, stored against the order's
tracking history and shown to the customer. On every status change, `/track/anomaly`
is called to flag irregular transitions. The predictor ships with a transparent
rule-based fallback so it works immediately — swap in a trained model later (see
`python-ai-service/model/README.md`).

## Getting Started
See `docs/SETUP_GUIDE.md` for step-by-step install/run instructions,
`docs/API_DOCUMENTATION.md` for all REST endpoints and Socket.IO events, and
`docs/DATABASE_SCHEMA.md` for the schema + stored procedures.

## Notes / Next Steps
- Wire a real email provider (nodemailer/SES) into `authController.forgotPassword` to
  actually send the reset link — it currently returns the token directly for testing.
- Add payment gateway integration (Razorpay/Stripe) in the `Payment.jsx` page and a
  corresponding backend webhook to replace the demo `cod/card/upi/netbanking` selector.
- Train a real scikit-learn model for the Python service using historical
  `orders` + `order_tracking` data, then point `MODEL_PATH` at it.
- Add rate limiting, request validation (express-validator is already a dependency),
  and refresh tokens for production hardening.
