// src/utils/emailTemplates.js
// HTML emails with inline styles (email clients ignore <style> blocks and external CSS).
// Every value that came from a user or the database is escaped.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rupees = (v) => `&#8377;${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const siteUrl = () => (process.env.CLIENT_WEBSITE_URL || 'http://localhost:5174').replace(/\/$/, '');

const button = (href, label) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#ea580c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 26px;border-radius:999px;font-size:14px">${esc(label)}</a>`;

function layout({ shop, preheader, heading, body }) {
  const name = esc(shop?.shop_name || 'Our Store');
  const contact = [shop?.email, shop?.mobile].filter(Boolean).map(esc).join(' &middot; ');
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
    <tr><td style="background:linear-gradient(135deg,#be123c,#c2410c,#b45309);background-color:#c2410c;padding:28px 32px;color:#ffffff">
      <div style="font-size:20px;font-weight:700">${name}</div>
      <div style="font-size:26px;font-weight:700;margin-top:14px">${esc(heading)}</div>
    </td></tr>
    <tr><td style="padding:28px 32px;font-size:15px;line-height:1.6">${body}</td></tr>
    <tr><td style="padding:18px 32px;background:#fafafa;font-size:12px;color:#6b7280;text-align:center">
      ${name}${contact ? `<br>${contact}` : ''}<br>You received this email because of activity on your account.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

exports.welcome = ({ user, shop }) => {
  const shopName = shop?.shop_name || 'our store';
  return {
    subject: `Welcome to ${shopName}, ${user.name}!`,
    text: `Hi ${user.name},\n\nYour account at ${shopName} is ready. You can now shop, track orders live and download invoices.\n\nStart shopping: ${siteUrl()}/products\n\nThanks for joining us!`,
    html: layout({
      shop,
      preheader: `Your ${shopName} account is ready`,
      heading: 'Welcome aboard!',
      body: `
        <p>Hi <strong>${esc(user.name)}</strong>,</p>
        <p>Thanks for registering with <strong>${esc(shopName)}</strong>. Your account is ready to use.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fff7ed;border-radius:12px;margin:18px 0">
          <tr><td style="padding:16px 20px;font-size:14px">
            <div style="color:#6b7280">Registered email</div>
            <div style="font-weight:600">${esc(user.email)}</div>
          </td></tr>
        </table>
        <p>With your account you can:</p>
        <ul style="padding-left:20px;margin:0 0 20px">
          <li>Check out faster with saved details</li>
          <li>Track your orders live</li>
          <li>Download invoices any time</li>
        </ul>
        <p style="text-align:center;margin:26px 0">${button(`${siteUrl()}/products`, 'Start shopping')}</p>
        <p style="font-size:13px;color:#6b7280">If you didn't create this account, please contact us.</p>`,
    }),
  };
};

// order: row from OrderModel.getById (+ customer_name/email); items: order_items rows
exports.orderPlaced = ({ order, items, shop, paymentMethodName, predictedDelivery }) => {
  const paid = order.payment_status === 'paid';
  const addr = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address || '{}') : order.shipping_address || {};
  const address = [addr.line1, addr.city, addr.state].filter(Boolean).join(', ') + (addr.pincode ? ` - ${addr.pincode}` : '');
  const placed = new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const eta = predictedDelivery ? new Date(predictedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : null;
  const method = paymentMethodName || order.payment_method;

  const rows = items.map((i) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6">${esc(i.product_name)} <span style="color:#6b7280">&times; ${Number(i.quantity)}</span></td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap">${rupees(i.subtotal)}</td>
    </tr>`).join('');

  return {
    subject: `Order confirmed: #${order.order_no}${paid ? ' (paid)' : ''}`,
    text: [
      `Hi ${order.customer_name},`, '',
      `Thank you for your order #${order.order_no} placed on ${placed}.`,
      ...items.map((i) => `- ${i.product_name} x${i.quantity}: Rs.${Number(i.subtotal).toFixed(2)}`),
      `Total: Rs.${Number(order.total_amount).toFixed(2)}`,
      `Payment: ${method} - ${paid ? `Paid${order.transaction_ref ? ` (ID ${order.transaction_ref})` : ''}` : 'Pay on delivery'}`,
      `Deliver to: ${address}`,
      eta ? `Estimated delivery: ${eta}` : '', '',
      `Track your order: ${siteUrl()}/my-orders`,
    ].filter((l) => l !== null).join('\n'),
    html: layout({
      shop,
      preheader: `We've received your order #${order.order_no}`,
      heading: paid ? 'Payment received - order confirmed' : 'Your order is confirmed',
      body: `
        <p>Hi <strong>${esc(order.customer_name)}</strong>,</p>
        <p>Thank you for shopping with us! We've received your order and will start preparing it right away.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fff7ed;border-radius:12px;margin:18px 0;font-size:14px">
          <tr>
            <td style="padding:14px 20px"><div style="color:#6b7280">Order no</div><div style="font-weight:600">#${esc(order.order_no)}</div></td>
            <td style="padding:14px 20px"><div style="color:#6b7280">Placed on</div><div style="font-weight:600">${esc(placed)}</div></td>
          </tr>
          <tr>
            <td style="padding:0 20px 14px"><div style="color:#6b7280">Payment</div><div style="font-weight:600">${esc(method)}</div></td>
            <td style="padding:0 20px 14px"><div style="color:#6b7280">Status</div>
              <div style="font-weight:600;color:${paid ? '#047857' : '#b45309'}">${paid ? 'Paid' : 'Pay on delivery'}</div></td>
          </tr>
          ${paid && order.transaction_ref ? `<tr><td colspan="2" style="padding:0 20px 14px"><div style="color:#6b7280">Payment ID</div><div style="font-family:Consolas,monospace;font-size:13px">${esc(order.transaction_ref)}</div></td></tr>` : ''}
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px">
          ${rows}
          <tr>
            <td style="padding:10px 0;color:#6b7280">Delivery</td>
            <td style="padding:10px 0;text-align:right;color:#047857">Free</td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-weight:700;font-size:16px">Total${paid ? ' paid' : ''}</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;font-size:16px">${rupees(order.total_amount)}</td>
          </tr>
        </table>
        <p style="margin:18px 0 4px;color:#6b7280;font-size:13px">Delivering to</p>
        <p style="margin:0">${esc(address)}${addr.phone ? `<br>Phone: ${esc(addr.phone)}` : ''}</p>
        ${eta ? `<p style="margin:14px 0 0">Estimated delivery: <strong>${esc(eta)}</strong></p>` : ''}
        <p style="text-align:center;margin:26px 0 6px">${button(`${siteUrl()}/my-orders`, 'Track your order')}</p>`,
    }),
  };
};

exports.passwordReset = ({ user, link, shop }) => ({
  subject: 'Reset your password',
  text: `Hi ${user.name},\n\nUse this link to set a new password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
  html: layout({
    shop,
    preheader: 'Your password reset link (valid for 1 hour)',
    heading: 'Reset your password',
    body: `
      <p>Hi <strong>${esc(user.name)}</strong>,</p>
      <p>We received a request to reset your password. The link below is valid for <strong>1 hour</strong>.</p>
      <p style="text-align:center;margin:26px 0">${button(link, 'Set a new password')}</p>
      <p style="font-size:13px;color:#6b7280">If you didn't ask for this, you can ignore this email - your password won't change.</p>`,
  }),
});
