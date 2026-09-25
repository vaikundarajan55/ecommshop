// src/controllers/dashboardController.js
// Admin dashboard: entity counts, today's orders, last-7-days and last-12-months order stats - one request
const { pool } = require('../config/db');

// Revenue ignores orders that never turned into money
const REVENUE_SQL = "SUM(CASE WHEN status IN ('cancelled','returned') THEN 0 ELSE total_amount END)";

// 'YYYY-MM-DD' / 'YYYY-MM' arithmetic done in UTC so the server's timezone can't shift a day
const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const addMonths = (ym, n) => {
  const d = new Date(`${ym}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
};

exports.summary = async (req, res, next) => {
  try {
    // "Today" comes from MySQL so it matches DATE(created_at) below
    const [[{ today }]] = await pool.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");

    const [[counts]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM categories)                      AS categories,
        (SELECT COUNT(*) FROM subcategories)                   AS subcategories,
        (SELECT COUNT(*) FROM products)                        AS products,
        (SELECT COUNT(*) FROM users WHERE role = 'customer')   AS users,
        (SELECT COUNT(*) FROM orders)                          AS orders
    `);

    const [todayOrders] = await pool.query(
      `SELECT o.id, o.order_no, o.total_amount, o.payment_method, o.payment_status, o.status, o.created_at,
              u.name AS customer_name, u.email AS customer_email,
              (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       JOIN users u ON u.id = o.user_id
       WHERE DATE(o.created_at) = ?
       ORDER BY o.created_at DESC`,
      [today]
    );

    const weekStart = addDays(today, -6);
    const [dayRows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS orders, ${REVENUE_SQL} AS revenue
       FROM orders
       WHERE created_at >= ?
       GROUP BY day`,
      [weekStart]
    );

    const thisMonth = today.slice(0, 7);
    const yearStart = addMonths(thisMonth, -11);
    const [monthRows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS orders, ${REVENUE_SQL} AS revenue
       FROM orders
       WHERE created_at >= ?
       GROUP BY month`,
      [`${yearStart}-01`]
    );

    // Fill gaps so every day / month is present, even with zero orders
    const byDay = Object.fromEntries(dayRows.map((r) => [r.day, r]));
    const dayWise = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart, i);
      return { date: day, orders: Number(byDay[day]?.orders || 0), revenue: Number(byDay[day]?.revenue || 0) };
    });

    const byMonth = Object.fromEntries(monthRows.map((r) => [r.month, r]));
    const monthWise = Array.from({ length: 12 }, (_, i) => {
      const month = addMonths(yearStart, i);
      return { month, orders: Number(byMonth[month]?.orders || 0), revenue: Number(byMonth[month]?.revenue || 0) };
    });

    res.json({
      success: true,
      data: {
        today,
        counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Number(v)])),
        todayOrders,
        dayWise,
        monthWise,
      },
    });
  } catch (err) { next(err); }
};
