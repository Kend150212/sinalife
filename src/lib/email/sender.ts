/**
 * Email Service
 * SMTP sender with template rendering and merge tag support
 */

import nodemailer from 'nodemailer'
import prisma from '@/lib/db'

interface EmailOptions {
    to: string
    subject?: string
    html?: string
    text?: string
}

interface TemplateEmailOptions {
    to: string
    templateSlug: string
    variables: Record<string, string>
}

/**
 * Create SMTP transporter from site settings
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
    // Try to get SMTP settings from DB first
    const smtpSettings = await prisma.siteSetting.findUnique({
        where: { key: 'smtp' },
    })

    const config = smtpSettings?.value as Record<string, string> | null

    return nodemailer.createTransport({
        host: config?.host || process.env.SMTP_HOST,
        port: parseInt(config?.port || process.env.SMTP_PORT || '587'),
        secure: (config?.secure || process.env.SMTP_SECURE) === 'true',
        auth: {
            user: config?.user || process.env.SMTP_USER,
            pass: config?.pass || process.env.SMTP_PASS,
        },
    })
}

/**
 * Get sender info from settings
 */
async function getSenderInfo(): Promise<{ name: string; email: string }> {
    const brandSettings = await prisma.siteSetting.findUnique({
        where: { key: 'branding' },
    })

    const brand = brandSettings?.value as Record<string, string> | null

    return {
        name: brand?.siteName || process.env.SMTP_FROM_NAME || 'Print Shop',
        email: brand?.fromEmail || process.env.SMTP_FROM_EMAIL || 'noreply@example.com',
    }
}

/**
 * Render template by replacing merge tags
 * Tags format: {{ variable_name }}
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g')
        rendered = rendered.replace(regex, value)
    }
    return rendered
}

/**
 * Wrap HTML content in the site's email layout
 */
async function wrapInLayout(htmlContent: string): Promise<string> {
    const brandSettings = await prisma.siteSetting.findUnique({
        where: { key: 'branding' },
    })
    const brand = brandSettings?.value as Record<string, string> | null
    const siteName = brand?.siteName || 'Print Shop'
    const logoUrl = brand?.logoLight || ''
    const primaryColor = brand?.primaryColor || '#1a73e8'

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:${primaryColor};padding:24px;text-align:center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${siteName}" style="max-height:40px;"/>` : `<h1 style="color:#ffffff;margin:0;font-size:24px;">${siteName}</h1>`}
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 24px;">
              ${htmlContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                &copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Send an email using a template
 */
export async function sendTemplateEmail(options: TemplateEmailOptions): Promise<boolean> {
    try {
        const template = await prisma.emailTemplate.findUnique({
            where: { slug: options.templateSlug },
        })

        if (!template || !template.enabled) {
            console.warn(`Email template "${options.templateSlug}" not found or disabled`)
            return false
        }

        const renderedSubject = renderTemplate(template.subject, options.variables)
        const renderedHtml = renderTemplate(template.htmlBody, options.variables)
        const renderedText = template.textBody ? renderTemplate(template.textBody, options.variables) : undefined

        const wrappedHtml = await wrapInLayout(renderedHtml)
        const sender = await getSenderInfo()
        const transporter = await getTransporter()

        await transporter.sendMail({
            from: `"${sender.name}" <${sender.email}>`,
            to: options.to,
            subject: renderedSubject,
            html: wrappedHtml,
            text: renderedText,
        })

        return true
    } catch (error) {
        console.error('Failed to send email:', error)
        return false
    }
}

/**
 * Send a raw email (no template)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        const sender = await getSenderInfo()
        const transporter = await getTransporter()

        const html = options.html ? await wrapInLayout(options.html) : undefined

        await transporter.sendMail({
            from: `"${sender.name}" <${sender.email}>`,
            to: options.to,
            subject: options.subject,
            html,
            text: options.text,
        })

        return true
    } catch (error) {
        console.error('Failed to send email:', error)
        return false
    }
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection(): Promise<{ success: boolean; error?: string }> {
    try {
        const transporter = await getTransporter()
        await transporter.verify()
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}
