import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { templateRegistry, type TemplateName } from '@/lib/email/templates'

export async function POST(request: Request) {
    try {
        const { template, to } = await request.json()

        if (!template || !to) {
            return NextResponse.json(
                { error: 'template and to are required' },
                { status: 400 }
            )
        }

        const templateName = template as TemplateName
        if (!templateRegistry[templateName]) {
            return NextResponse.json(
                { error: 'Invalid template name', available: Object.keys(templateRegistry) },
                { status: 400 }
            )
        }

        const { subject, html } = templateRegistry[templateName].preview()

        const success = await sendEmail({ to, subject, html })

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, message: `Test email sent to ${to}` })
    } catch (error) {
        console.error('Send email error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
