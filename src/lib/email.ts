import nodemailer from 'nodemailer'

const smtpConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    } : undefined,
}

const fromAddress = process.env.SMTP_FROM || 'PrintPro <noreply@printpro.com>'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
    if (!transporter) {
        transporter = nodemailer.createTransport(smtpConfig)
    }
    return transporter
}

export interface EmailOptions {
    to: string
    subject: string
    html: string
    text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options

    // If SMTP is not configured, log to console
    if (!process.env.SMTP_HOST) {
        console.log('═══════════════════════════════════════════')
        console.log('📧 EMAIL (SMTP not configured — logged only)')
        console.log(`   To: ${to}`)
        console.log(`   Subject: ${subject}`)
        console.log('═══════════════════════════════════════════')
        return true
    }

    try {
        const transport = getTransporter()
        await transport.sendMail({
            from: fromAddress,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ''),
        })
        console.log(`📧 Email sent to ${to}: ${subject}`)
        return true
    } catch (error) {
        console.error('Failed to send email:', error)
        return false
    }
}
