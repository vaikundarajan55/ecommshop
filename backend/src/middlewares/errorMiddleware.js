// src/middlewares/errorMiddleware.js
const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);

  // MySQL foreign key violations - send a readable message instead of the raw SQL error
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({ success: false, message: 'This record is still used by other data and cannot be deleted.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({ success: false, message: 'A selected related record (e.g. category) does not exist.' });
  }
  // Multer upload errors (too many files, file too big, wrong type)
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'Each image must be 5 MB or smaller.',
      LIMIT_UNEXPECTED_FILE: 'Too many images - you can upload up to 6 at a time.',
      LIMIT_FILE_COUNT: 'Too many images - you can upload up to 6 at a time.',
    };
    return res.status(400).json({ success: false, message: messages[err.code] || err.message });
  }
  if (err.message?.startsWith('Only image files are allowed')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    // Two saves racing past the controller's duplicate check - the unique index still stops them
    const DUPLICATES = {
      uq_category_name: ['name', 'A category with this name already exists.'],
      uq_subcategory_name: ['name', 'This subcategory name already exists in the selected category.'],
      uq_product_name: ['name', 'A product with this name already exists.'],
      sku: ['sku', 'This SKU is already used by another product.'],
      uq_users_phone: ['phone', 'This mobile number is already registered with another account.'],
      email: ['email', 'This email is already registered.'],
    };
    const key = Object.keys(DUPLICATES).find((k) => err.sqlMessage?.includes(`.${k}'`) || err.sqlMessage?.includes(`'${k}'`));
    if (key) {
      const [field, message] = DUPLICATES[key];
      return res.status(409).json({ success: false, message, errors: { [field]: message } });
    }
    return res.status(409).json({ success: false, message: 'A record with the same name, slug or SKU already exists.' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
