// src/utils/deleteFile.js
// Removes an uploaded file from disk given its stored path (e.g. '/uploads/123.jpg').
// Never throws - a missing file must not fail the request that triggered the cleanup.
const fs = require('fs/promises');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

const deleteFile = async (storedPath) => {
  if (!storedPath) return;
  // Only the file name is used, so a stored path can never point outside the uploads folder
  const filePath = path.join(UPLOAD_ROOT, path.basename(storedPath));
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`[Upload] Could not delete ${filePath}:`, err.message);
  }
};

module.exports = deleteFile;
