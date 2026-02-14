import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = {
    title: 'Admin Dashboard',
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session || !['ADMIN', 'STAFF'].includes((session.user as { role?: string })?.role || '')) {
        redirect('/auth/login?callbackUrl=/admin')
    }

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-main">
                {children}
            </main>
        </div>
    )
}
