// Email template system — renders inline-CSS HTML emails
// Each template is a function that takes data and returns { subject, html }

export interface EmailTemplate {
  subject: string
  html: string
}

const brandColor = '#2563eb'
const bgColor = '#f8fafc'
const cardBg = '#ffffff'
const textColor = '#1e293b'
const mutedColor = '#64748b'
const borderColor = '#e2e8f0'

function layout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${bgColor};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${textColor};line-height:1.6;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${bgColor};padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<!-- Logo -->
<tr><td align="center" style="padding-bottom:32px;">
<span style="font-size:28px;font-weight:700;color:${brandColor};letter-spacing:-0.5px;">🖨️ PrintPro</span>
</td></tr>
<!-- Card -->
<tr><td style="background:${cardBg};border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
${content}
</td></tr>
<!-- Footer -->
<tr><td align="center" style="padding-top:32px;color:${mutedColor};font-size:13px;">
<p style="margin:0 0 8px;">© ${new Date().getFullYear()} PrintPro. All rights reserved.</p>
<p style="margin:0;">Questions? Contact <a href="mailto:support@printpro.com" style="color:${brandColor};">support@printpro.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function button(text: string, url: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td align="center">
<a href="${url}" style="display:inline-block;background:${brandColor};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">${text}</a>
</td></tr>
</table>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${borderColor};margin:24px 0;">`
}

// ─── Template 1: Welcome ──────────────────────────────────────

export function welcomeEmail(data: { name: string; loginUrl?: string }): EmailTemplate {
  const { name, loginUrl = 'http://localhost:3000/auth/login' } = data
  return {
    subject: 'Welcome to PrintPro! 🎉',
    html: layout('Welcome to PrintPro', `
<h1 style="margin:0 0 16px;font-size:24px;color:${textColor};">Welcome, ${name}!</h1>
<p style="color:${mutedColor};font-size:15px;">Thank you for joining PrintPro. We're excited to help you create stunning print products for your business or personal projects.</p>
<p style="color:${mutedColor};font-size:15px;">Here's what you can do:</p>
<ul style="color:${mutedColor};font-size:15px;padding-left:20px;">
<li>Browse our premium product catalog</li>
<li>Customize with your own designs</li>
<li>Get fast, reliable printing & shipping</li>
</ul>
${button('Start Shopping', loginUrl)}
<p style="color:${mutedColor};font-size:13px;text-align:center;">If you didn't create this account, please ignore this email.</p>
`),
  }
}

// ─── Template 2: Order Confirmation ───────────────────────────

export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export function orderConfirmationEmail(data: {
  name: string
  orderId: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  orderUrl?: string
}): EmailTemplate {
  const { name, orderId, items, subtotal, shipping, total, orderUrl } = data
  const itemRows = items.map(i => `
<tr>
<td style="padding:8px 0;color:${textColor};font-size:14px;border-bottom:1px solid ${borderColor};">${i.name}</td>
<td style="padding:8px 0;text-align:center;color:${mutedColor};font-size:14px;border-bottom:1px solid ${borderColor};">${i.quantity}</td>
<td style="padding:8px 0;text-align:right;color:${textColor};font-size:14px;border-bottom:1px solid ${borderColor};">$${i.price.toFixed(2)}</td>
</tr>`).join('')

  return {
    subject: `Order Confirmed — #${orderId}`,
    html: layout('Order Confirmed', `
<h1 style="margin:0 0 8px;font-size:24px;color:${textColor};">Order Confirmed! ✅</h1>
<p style="color:${mutedColor};font-size:15px;">Hi ${name}, your order <strong>#${orderId}</strong> has been received and is being processed.</p>
${divider()}
<table width="100%" cellpadding="0" cellspacing="0">
<tr style="color:${mutedColor};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">
<td style="padding:8px 0;border-bottom:2px solid ${borderColor};">Item</td>
<td style="padding:8px 0;text-align:center;border-bottom:2px solid ${borderColor};">Qty</td>
<td style="padding:8px 0;text-align:right;border-bottom:2px solid ${borderColor};">Price</td>
</tr>
${itemRows}
</table>
<table width="100%" style="margin-top:16px;">
<tr><td style="color:${mutedColor};font-size:14px;padding:4px 0;">Subtotal</td><td style="text-align:right;font-size:14px;padding:4px 0;">$${subtotal.toFixed(2)}</td></tr>
<tr><td style="color:${mutedColor};font-size:14px;padding:4px 0;">Shipping</td><td style="text-align:right;font-size:14px;padding:4px 0;">$${shipping.toFixed(2)}</td></tr>
<tr><td style="font-weight:700;font-size:16px;padding:8px 0;border-top:2px solid ${borderColor};">Total</td><td style="text-align:right;font-weight:700;font-size:16px;padding:8px 0;border-top:2px solid ${borderColor};">$${total.toFixed(2)}</td></tr>
</table>
${orderUrl ? button('View Order', orderUrl) : ''}
<p style="color:${mutedColor};font-size:13px;text-align:center;">You'll receive another email when your order ships.</p>
`),
  }
}

// ─── Template 3: Order Shipped ────────────────────────────────

export function orderShippedEmail(data: {
  name: string
  orderId: string
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
}): EmailTemplate {
  const { name, orderId, trackingNumber, trackingUrl, carrier } = data
  return {
    subject: `Your Order #${orderId} Has Shipped! 📦`,
    html: layout('Order Shipped', `
<h1 style="margin:0 0 8px;font-size:24px;color:${textColor};">Your Order is on its Way! 📦</h1>
<p style="color:${mutedColor};font-size:15px;">Hi ${name}, great news — your order <strong>#${orderId}</strong> has been shipped.</p>
${divider()}
${carrier ? `<p style="font-size:14px;margin:8px 0;"><strong>Carrier:</strong> <span style="color:${mutedColor};">${carrier}</span></p>` : ''}
${trackingNumber ? `<p style="font-size:14px;margin:8px 0;"><strong>Tracking #:</strong> <span style="color:${mutedColor};">${trackingNumber}</span></p>` : ''}
${trackingUrl ? button('Track Shipment', trackingUrl) : ''}
<p style="color:${mutedColor};font-size:13px;text-align:center;">Delivery usually takes 3-5 business days.</p>
`),
  }
}

// ─── Template 4: Order Delivered ──────────────────────────────

export function orderDeliveredEmail(data: {
  name: string
  orderId: string
  reviewUrl?: string
}): EmailTemplate {
  const { name, orderId, reviewUrl } = data
  return {
    subject: `Order #${orderId} Delivered! 🎉`,
    html: layout('Order Delivered', `
<h1 style="margin:0 0 8px;font-size:24px;color:${textColor};">Order Delivered! 🎉</h1>
<p style="color:${mutedColor};font-size:15px;">Hi ${name}, your order <strong>#${orderId}</strong> has been delivered. We hope you love your products!</p>
${divider()}
<p style="color:${mutedColor};font-size:15px;">Had a great experience? We'd love to hear about it.</p>
${reviewUrl ? button('Leave a Review', reviewUrl) : ''}
<p style="color:${mutedColor};font-size:13px;text-align:center;">If you have any issues with your order, please contact our support team.</p>
`),
  }
}

// ─── Template 5: Password Reset ──────────────────────────────

export function passwordResetEmail(data: {
  name: string
  resetUrl: string
  expiresIn?: string
}): EmailTemplate {
  const { name, resetUrl, expiresIn = '1 hour' } = data
  return {
    subject: 'Reset Your Password — PrintPro',
    html: layout('Password Reset', `
<h1 style="margin:0 0 8px;font-size:24px;color:${textColor};">Reset Your Password</h1>
<p style="color:${mutedColor};font-size:15px;">Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.</p>
${button('Reset Password', resetUrl)}
<p style="color:${mutedColor};font-size:13px;text-align:center;">This link expires in ${expiresIn}. If you didn't request this, you can safely ignore it.</p>
`),
  }
}

// ─── Template 6: Order Status Update ─────────────────────────

export function orderStatusEmail(data: {
  name: string
  orderId: string
  status: string
  message?: string
  orderUrl?: string
}): EmailTemplate {
  const { name, orderId, status, message, orderUrl } = data

  const statusColors: Record<string, string> = {
    PROCESSING: '#f59e0b',
    PRINTED: '#8b5cf6',
    SHIPPED: '#3b82f6',
    DELIVERED: '#22c55e',
    CANCELLED: '#ef4444',
  }
  const statusColor = statusColors[status] || brandColor

  return {
    subject: `Order #${orderId} — ${status.charAt(0) + status.slice(1).toLowerCase()}`,
    html: layout('Order Update', `
<h1 style="margin:0 0 8px;font-size:24px;color:${textColor};">Order Status Update</h1>
<p style="color:${mutedColor};font-size:15px;">Hi ${name}, your order <strong>#${orderId}</strong> has been updated.</p>
${divider()}
<table width="100%"><tr><td align="center">
<span style="display:inline-block;background:${statusColor}15;color:${statusColor};padding:8px 24px;border-radius:20px;font-weight:600;font-size:14px;">${status}</span>
</td></tr></table>
${message ? `<p style="color:${mutedColor};font-size:15px;margin-top:16px;">${message}</p>` : ''}
${orderUrl ? button('View Order Details', orderUrl) : ''}
`),
  }
}

// ─── Template 7: Email Verification ──────────────────────────

export function emailVerificationEmail(data: {
  name: string
  verifyUrl: string
}): EmailTemplate {
  const { name, verifyUrl } = data
  return {
    subject: 'Verify Your Email — PrintPro',
    html: layout('Verify Email', `
<h1 style="margin:0 0 8px;font-size:24px;color:${textColor};">Verify Your Email</h1>
<p style="color:${mutedColor};font-size:15px;">Hi ${name}, please verify your email address by clicking the button below.</p>
${button('Verify Email', verifyUrl)}
<p style="color:${mutedColor};font-size:13px;text-align:center;">If you didn't create a PrintPro account, you can safely ignore this email.</p>
`),
  }
}

// ─── Template 8: Promotional ─────────────────────────────────

export function promotionalEmail(data: {
  name?: string
  headline: string
  body: string
  ctaText?: string
  ctaUrl?: string
  imageUrl?: string
}): EmailTemplate {
  const { name, headline, body, ctaText, ctaUrl, imageUrl } = data
  return {
    subject: headline,
    html: layout(headline, `
${imageUrl ? `<img src="${imageUrl}" alt="" style="width:100%;border-radius:8px;margin-bottom:24px;" />` : ''}
<h1 style="margin:0 0 8px;font-size:24px;color:${textColor};">${headline}</h1>
${name ? `<p style="color:${mutedColor};font-size:15px;">Hi ${name},</p>` : ''}
<p style="color:${mutedColor};font-size:15px;">${body}</p>
${ctaText && ctaUrl ? button(ctaText, ctaUrl) : ''}
<p style="color:${mutedColor};font-size:11px;text-align:center;">You received this because you're subscribed to PrintPro updates. <a href="#" style="color:${brandColor};">Unsubscribe</a></p>
`),
  }
}

// ─── Template Registry ───────────────────────────────────────

export const templateRegistry = {
  welcome: {
    name: 'Welcome Email',
    description: 'Sent to new customers after registration',
    preview: () => welcomeEmail({ name: 'John Doe' }),
  },
  orderConfirmation: {
    name: 'Order Confirmation',
    description: 'Sent after successful payment',
    preview: () => orderConfirmationEmail({
      name: 'John Doe',
      orderId: 'ORD-001',
      items: [
        { name: 'Premium Business Cards (500)', quantity: 1, price: 49.00 },
        { name: 'Standard Flyers (8.5×11)', quantity: 2, price: 89.00 },
      ],
      subtotal: 138.00,
      shipping: 12.99,
      total: 150.99,
    }),
  },
  orderShipped: {
    name: 'Order Shipped',
    description: 'Sent when order status changes to shipped',
    preview: () => orderShippedEmail({
      name: 'John Doe',
      orderId: 'ORD-001',
      carrier: 'UPS',
      trackingNumber: '1Z999AA10123456784',
      trackingUrl: 'https://ups.com/track',
    }),
  },
  orderDelivered: {
    name: 'Order Delivered',
    description: 'Sent when order is marked as delivered',
    preview: () => orderDeliveredEmail({ name: 'John Doe', orderId: 'ORD-001' }),
  },
  passwordReset: {
    name: 'Password Reset',
    description: 'Sent when user requests a password reset',
    preview: () => passwordResetEmail({
      name: 'John Doe',
      resetUrl: 'http://localhost:3000/auth/reset-password?token=abc123',
    }),
  },
  orderStatus: {
    name: 'Order Status Update',
    description: 'Sent when order status changes',
    preview: () => orderStatusEmail({
      name: 'John Doe',
      orderId: 'ORD-001',
      status: 'PROCESSING',
      message: 'Your order is being prepared for printing.',
    }),
  },
  emailVerification: {
    name: 'Email Verification',
    description: 'Sent to verify email address',
    preview: () => emailVerificationEmail({
      name: 'John Doe',
      verifyUrl: 'http://localhost:3000/auth/verify?token=abc123',
    }),
  },
  promotional: {
    name: 'Promotional Email',
    description: 'Marketing email sent by admin',
    preview: () => promotionalEmail({
      name: 'John Doe',
      headline: '🎨 Summer Sale — 20% Off All Products!',
      body: 'For a limited time, enjoy 20% off our entire catalog. From business cards to banners, make your brand stand out this summer.',
      ctaText: 'Shop Now',
      ctaUrl: 'http://localhost:3000/products',
    }),
  },
}

export type TemplateName = keyof typeof templateRegistry
