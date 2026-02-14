'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import './account.css'

const navItems = [
    { href: '/account', label: 'Profile', icon: '👤' },
    { href: '/account/orders', label: 'Orders', icon: '📦' },
    { href: '/account/addresses', label: 'Addresses', icon: '📍' },
    { href: '/account/settings', label: 'Settings', icon: '⚙️' },
]

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    return (
        <div className="account-layout">
            <aside className="account-sidebar">
                <h2>My Account</h2>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`account-sidebar-link ${pathname === item.href ? 'active' : ''}`}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
                <div className="account-signout">
                    <button onClick={() => signOut({ callbackUrl: '/' })}>
                        <span>🚪</span>
                        Sign Out
                    </button>
                </div>
            </aside>
            <div className="account-content">
                {children}
            </div>
        </div>
    )
}
