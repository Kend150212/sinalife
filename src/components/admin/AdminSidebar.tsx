'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    FolderTree,
    DollarSign,
    Users,
    BarChart3,
    Mail,
    Settings,
    UserCog,
    LogOut,
    Printer,
} from 'lucide-react'

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/pricing', label: 'Markup & Pricing', icon: DollarSign },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/emails', label: 'Email Templates', icon: Mail },
    { href: '/admin/users', label: 'Staff / Users', icon: UserCog },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar() {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    return (
        <aside className="admin-sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <Link href="/admin" className="sidebar-logo-link">
                    <Printer size={28} />
                    <span>Admin Panel</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <Link href="/" className="sidebar-nav-item" target="_blank">
                    <Package size={20} />
                    <span>View Store</span>
                </Link>
                <button className="sidebar-nav-item" onClick={() => { }}>
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
