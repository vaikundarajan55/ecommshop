// src/controllers/admin/aboutController.js
// The About page is a single row (about_page_id = 1): admin can only update it, never create or delete.
const { pool } = require('../../config/db');
const deleteFile = require('../../utils/deleteFile');

const getAbout = async () => (await pool.query('SELECT * FROM about_page WHERE about_page_id = 1'))[0][0];
const t = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

exports.update = async (req, res, next) => {
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const existing = await getAbout();
    if (!existing) {
      if (image) await deleteFile(image);
      return res.status(404).json({ success: false, message: 'About page not set up - run migration 003' });
    }
    const title = t(req.body.title);
    if (!title) {
      if (image) await deleteFile(image);
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    await pool.query(
      `UPDATE about_page SET title = ?, subtitle = ?, heading = ?, content = ?, mission = ?, vision = ?,
         image = COALESCE(?, image) WHERE about_page_id = 1`,
      [title, t(req.body.subtitle), t(req.body.heading), t(req.body.content), t(req.body.mission), t(req.body.vision), image]
    );
    if (image && existing.image) await deleteFile(existing.image);
    res.json({ success: true, message: 'About page updated', data: await getAbout() });
  } catch (err) {
    if (image) await deleteFile(image);
    next(err);
  }
};
