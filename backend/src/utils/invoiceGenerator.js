// src/utils/invoiceGenerator.js
// Builds an A4 PDF invoice with pdfkit and returns the document stream (caller pipes it to res or a file).
// Built-in PDF fonts have no ₹ glyph, so amounts are printed as "Rs.".
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Fallbacks when shop_settings isn't available
const ENV_STORE = {
  name: process.env.STORE_NAME || 'ShopEase',
  address: process.env.STORE_ADDRESS || 'Your store address, City - 000000',
  email: process.env.STORE_EMAIL || 'support@shopease.example',
  phone: process.env.STORE_PHONE || '',
  gstin: process.env.STORE_GSTIN || '',
};

const COLOR = { brand: '#ea580c', dark: '#1f2937', muted: '#6b7280', line: '#e5e7eb', zebra: '#f9fafb' };

const money = (v) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const parseAddress = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return { line1: String(raw) }; }
};

// Admin > Contact Us details win; .env values fill any gaps
const storeFrom = (shop) => ({
  name: shop?.shop_name || ENV_STORE.name,
  address: [shop?.address_line, shop?.city, shop?.state, shop?.pincode].filter(Boolean).join(', ') || ENV_STORE.address,
  email: shop?.email || ENV_STORE.email,
  phone: shop?.mobile || ENV_STORE.phone,
  gstin: shop?.gstin || ENV_STORE.gstin,
});

// pdfkit can only embed PNG/JPEG - other formats (webp) are skipped
const logoPath = (logo) => {
  if (!logo || !/\.(png|jpe?g)$/i.test(logo)) return null;
  const file = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads', path.basename(logo));
  return fs.existsSync(file) ? file : null;
};

/**
 * @param order  orders row + customer_name / customer_email
 * @param items  order_items rows
 * @param opts   { paymentMethodName, shop } - payment method display name, shop_settings row
 */
exports.generateInvoicePDF = (order, items, opts = {}) => {
  const STORE = storeFrom(opts.shop);
  const logo = logoPath(opts.shop?.logo);
  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Invoice ${order.order_no}`, Author: STORE.name } });
  const left = 50;
  const right = doc.page.width - 50;
  const width = right - left;

  // ---------- Header band ----------
  doc.rect(0, 0, doc.page.width, 110).fill(COLOR.brand);
  let textLeft = left;
  if (logo) {
    try {
      doc.roundedRect(left, 28, 54, 54, 8).fill('#ffffff');
      doc.image(logo, left + 5, 33, { fit: [44, 44], align: 'center', valign: 'center' });
      textLeft = left + 66;
    } catch { /* unreadable image - print without it */ }
  }
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(24).text(STORE.name, textLeft, 36, { width: 280 - (textLeft - left) });
  doc.font('Helvetica').fontSize(9).text(STORE.address, textLeft, 66, { width: 280 - (textLeft - left) });
  doc.text([STORE.email, STORE.phone].filter(Boolean).join('  |  '), textLeft, 80, { width: 300 });
  if (STORE.gstin) doc.text(`GSTIN: ${STORE.gstin}`, textLeft, 92);

  doc.font('Helvetica-Bold').fontSize(26).text('INVOICE', left, 34, { width, align: 'right' });
  doc.font('Helvetica').fontSize(10)
    .text(`Invoice no: INV-${order.order_no}`, left, 68, { width, align: 'right' })
    .text(`Date: ${fmtDate(order.created_at)}`, left, 82, { width, align: 'right' });

  // ---------- Bill to / Ship to / Order info ----------
  const addr = parseAddress(order.shipping_address);
  const infoTop = 135;
  const col = width / 3;
  const block = (x, title, lines) => {
    doc.fillColor(COLOR.muted).font('Helvetica-Bold').fontSize(8).text(title.toUpperCase(), x, infoTop, { width: col - 10, characterSpacing: 0.5 });
    doc.fillColor(COLOR.dark).font('Helvetica').fontSize(10);
    let y = infoTop + 14;
    lines.filter(Boolean).forEach((l, i) => {
      doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').text(l, x, y, { width: col - 10 });
      y = doc.y + 1;
    });
    return y;
  };
  const y1 = block(left, 'Bill to', [order.customer_name, order.customer_email, addr.phone && `Phone: ${addr.phone}`]);
  const y2 = block(left + col, 'Ship to', [
    order.customer_name, addr.line1, [addr.city, addr.state].filter(Boolean).join(', '), addr.pincode && `PIN ${addr.pincode}`,
  ]);
  const y3 = block(left + col * 2, 'Order', [
    `#${order.order_no}`,
    `Status: ${label(order.status)}`,
    `Payment: ${opts.paymentMethodName || label(order.payment_method)}`,
    `Payment status: ${label(order.payment_status)}`,
  ]);

  // ---------- Items table ----------
  let y = Math.max(y1, y2, y3) + 20;
  const cols = [
    { key: 'n', title: '#', x: left, w: 25, align: 'left' },
    { key: 'name', title: 'Item', x: left + 25, w: width - 25 - 55 - 95 - 100, align: 'left' },
    { key: 'qty', title: 'Qty', x: right - 250, w: 55, align: 'right' },
    { key: 'price', title: 'Price', x: right - 195, w: 95, align: 'right' },
    { key: 'amount', title: 'Amount', x: right - 100, w: 100, align: 'right' },
  ];

  const header = () => {
    doc.rect(left, y, width, 24).fill(COLOR.dark);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    cols.forEach((c) => doc.text(c.title, c.x + (c.align === 'left' ? 6 : 0), y + 8, { width: c.w - 6, align: c.align }));
    y += 24;
  };
  header();

  doc.font('Helvetica').fontSize(10);
  items.forEach((item, i) => {
    const rowH = Math.max(22, doc.heightOfString(item.product_name, { width: cols[1].w - 12 }) + 12);
    if (y + rowH > doc.page.height - 170) { // keep room for totals/footer; continue on a new page
      doc.addPage();
      y = 50;
      header();
      doc.font('Helvetica').fontSize(10);
    }
    if (i % 2 === 1) doc.rect(left, y, width, rowH).fill(COLOR.zebra);
    doc.fillColor(COLOR.dark);
    const cells = {
      n: String(i + 1), name: item.product_name, qty: String(item.quantity),
      price: money(item.price), amount: money(item.subtotal ?? item.price * item.quantity),
    };
    cols.forEach((c) => doc.text(cells[c.key], c.x + (c.align === 'left' ? 6 : 0), y + 6, { width: c.w - 6, align: c.align }));
    y += rowH;
    doc.moveTo(left, y).lineTo(right, y).strokeColor(COLOR.line).lineWidth(0.5).stroke();
  });

  // ---------- Totals ----------
  const subtotal = items.reduce((a, it) => a + Number(it.subtotal ?? it.price * it.quantity), 0);
  const total = Number(order.total_amount);
  // Totals block is ~130pt tall; start a new page if it would run into the footer
  if (y + 140 > doc.page.height - 95) { doc.addPage(); y = 50; }
  y += 12;
  const line = (title, value, bold = false) => {
    doc.fillColor(bold ? COLOR.dark : COLOR.muted).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10);
    doc.text(title, right - 250, y, { width: 140, align: 'right' });
    doc.fillColor(COLOR.dark).text(value, right - 100, y, { width: 100, align: 'right' });
    y += bold ? 20 : 16;
  };
  line('Subtotal', money(subtotal));
  line('Delivery', 'Free');
  if (Math.abs(total - subtotal) >= 0.01) line(total < subtotal ? 'Discount' : 'Adjustments', money(total - subtotal));
  doc.rect(right - 260, y, 260, 30).fill(COLOR.brand);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12)
    .text('Total', right - 250, y + 9, { width: 140, align: 'right' })
    .text(money(total), right - 105, y + 9, { width: 100, align: 'right' });
  y += 44;

  if (order.payment_status === 'paid') {
    doc.save().rotate(-12, { origin: [left + 70, y + 10] });
    doc.roundedRect(left + 10, y - 5, 120, 34, 6).lineWidth(2).strokeColor('#16a34a').stroke();
    doc.fillColor('#16a34a').font('Helvetica-Bold').fontSize(18).text('PAID', left + 10, y + 3, { width: 120, align: 'center' });
    doc.restore();
  }

  // ---------- Footer ----------
  // The footer sits inside the bottom margin; without this pdfkit would push each line onto a new page
  doc.page.margins.bottom = 0;
  const footY = doc.page.height - 90;
  doc.moveTo(left, footY).lineTo(right, footY).strokeColor(COLOR.line).lineWidth(1).stroke();
  doc.fillColor(COLOR.dark).font('Helvetica-Bold').fontSize(11).text(`Thank you for shopping with ${STORE.name}!`, left, footY + 14, { width, align: 'center' });
  doc.fillColor(COLOR.muted).font('Helvetica').fontSize(8)
    .text('This is a computer-generated invoice and does not require a signature.', left, footY + 32, { width, align: 'center' })
    .text(`Questions? Contact ${STORE.email}`, left, footY + 44, { width, align: 'center' });

  doc.end();
  return doc;
};
