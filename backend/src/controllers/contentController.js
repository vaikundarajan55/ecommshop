// src/controllers/contentController.js
// Builds list/create/update/delete handlers for an image-backed content model (banners, testimonials).
const deleteFile = require('../utils/deleteFile');

const trimOrNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

module.exports = function makeContentController({ Model, label, clean }) {
  const uploaded = (req) => (req.file ? `/uploads/${req.file.filename}` : null);

  const fail = async (req, res, status, message) => {
    if (req.file) await deleteFile(uploaded(req));
    return res.status(status).json({ success: false, message });
  };

  return {
    // Website: active items only
    listActive: async (req, res, next) => {
      try { res.json({ success: true, data: await Model.list({ activeOnly: true }) }); } catch (err) { next(err); }
    },

    // Admin: everything
    listAll: async (req, res, next) => {
      try { res.json({ success: true, data: await Model.list() }); } catch (err) { next(err); }
    },

    create: async (req, res, next) => {
      try {
        const { data, error } = clean(req.body, trimOrNull);
        if (error) return fail(req, res, 400, error);
        const id = await Model.create({ ...data, image: uploaded(req) });
        res.status(201).json({ success: true, message: `${label} created`, data: { id } });
      } catch (err) {
        if (req.file) await deleteFile(uploaded(req));
        next(err);
      }
    },

    update: async (req, res, next) => {
      try {
        const existing = await Model.getById(req.params.id);
        if (!existing) return fail(req, res, 404, `${label} not found`);
        const { data, error } = clean(req.body, trimOrNull);
        if (error) return fail(req, res, 400, error);
        const image = uploaded(req);
        await Model.update(existing.id, { ...data, image });
        if (image && existing.image) await deleteFile(existing.image); // replaced -> remove old file
        res.json({ success: true, message: `${label} updated` });
      } catch (err) {
        if (req.file) await deleteFile(uploaded(req));
        next(err);
      }
    },

    remove: async (req, res, next) => {
      try {
        const existing = await Model.getById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: `${label} not found` });
        await Model.remove(existing.id);
        await deleteFile(existing.image);
        res.json({ success: true, message: `${label} deleted` });
      } catch (err) { next(err); }
    },
  };
};
