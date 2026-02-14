import { NextResponse } from 'next/server'
import { templateRegistry, type TemplateName } from '@/lib/email/templates'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const template = searchParams.get('template') as TemplateName | null

    if (!template || !templateRegistry[template]) {
        return NextResponse.json(
            { error: 'Invalid template name', available: Object.keys(templateRegistry) },
            { status: 400 }
        )
    }

    const { subject, html } = templateRegistry[template].preview()

    return NextResponse.json({ subject, html })
}
