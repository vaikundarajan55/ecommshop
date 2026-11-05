// src/controllers/admin/visitorController.js
// Website visitor log: admin sees visitors by IP address (recording is in website/visitorController)
const { pool } = require('../../config/db');
const { getNetworkIp } = require('../../utils/networkIp');

// One row per IP address (latest first) + summary counts
exports.list = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.ip_address AS ip, g.visits, g.pages, g.first_seen, g.last_seen,
              l.path AS last_path, l.page_name AS last_page_name, l.user_agent, u.name AS user_name, u.email AS user_email
       FROM (
         SELECT ip_address, COUNT(*) AS visits, COUNT(DISTINCT path) AS pages,
                MIN(created_at) AS first_seen, MAX(created_at) AS last_seen, MAX(site_visit_id) AS last_id
         FROM site_visits GROUP BY ip_address
       ) g
       JOIN site_visits l ON l.site_visit_id = g.last_id
       LEFT JOIN users u ON u.user_id = (
         SELECT user_id FROM site_visits WHERE ip_address = g.ip_address AND user_id IS NOT NULL ORDER BY site_visit_id DESC LIMIT 1
       )
       ORDER BY g.last_seen DESC
       LIMIT 1000`
    );
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS total_visits,
              COUNT(DISTINCT ip_address) AS unique_ips,
              COALESCE(SUM(created_at >= CURDATE()), 0) AS today_visits,
              COUNT(DISTINCT CASE WHEN created_at >= CURDATE() THEN ip_address END) AS today_ips
       FROM site_visits`
    );
    res.json({ success: true, data: rows, stats, server_ip: getNetworkIp() });
  } catch (err) { next(err); }
};

// The latest page views across all visitors (IP + page name + URL)
exports.recent = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.site_visit_id, v.ip_address AS ip, v.path, v.page_name, v.user_agent, v.referrer, v.created_at, u.name AS user_name, u.email AS user_email
       FROM site_visits v LEFT JOIN users u ON u.user_id = v.user_id
       ORDER BY v.site_visit_id DESC LIMIT 1000`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// The latest page views from one IP address
exports.byIp = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.site_visit_id, v.ip_address AS ip, v.path, v.page_name, v.user_agent, v.referrer, v.created_at, u.name AS user_name, u.email AS user_email
       FROM site_visits v LEFT JOIN users u ON u.user_id = v.user_id
       WHERE v.ip_address = ? ORDER BY v.site_visit_id DESC LIMIT 200`,
      [req.params.ip]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Delete one IP's history
exports.removeIp = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM site_visits WHERE ip_address = ?', [req.params.ip]);
    res.json({ success: true, message: 'Visitor history deleted' });
  } catch (err) { next(err); }
};

// Clear the whole log
exports.clear = async (req, res, next) => {
  try {
    await pool.query('TRUNCATE TABLE site_visits');
    res.json({ success: true, message: 'Visitor log cleared' });
  } catch (err) { next(err); }
};
