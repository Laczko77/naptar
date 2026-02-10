'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/calendar', label: 'Naptár', icon: '📅' },
    { href: '/workout-log', label: 'Edzésnapló', icon: '🏋️' },
    { href: '/work-hours', label: 'Munkaidő', icon: '💼' },
    { href: '/analytics', label: 'Statisztika', icon: '📈' },
    { href: '/settings', label: 'Beállítások', icon: '⚙️' },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside
            style={{
                width: '260px',
                minHeight: '100vh',
                background: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 12px',
                gap: '4px',
            }}
        >
            <div
                style={{
                    padding: '0 12px 24px',
                    borderBottom: '1px solid var(--color-border)',
                    marginBottom: '16px',
                }}
            >
                <h1
                    style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px',
                    }}
                >
                    💪 FitSchedule Pro
                </h1>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Edzés & Munka Ütemező
                </p>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-sm)',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                                background: isActive ? 'var(--color-surface-hover)' : 'transparent',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'var(--color-surface)'
                                    e.currentTarget.style.color = 'var(--color-text)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.color = 'var(--color-text-secondary)'
                                }
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{item.icon}</span>
                            {item.label}
                            {isActive && (
                                <div
                                    style={{
                                        marginLeft: 'auto',
                                        width: '4px',
                                        height: '20px',
                                        borderRadius: '2px',
                                        background: 'var(--color-accent)',
                                    }}
                                />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div style={{ marginTop: 'auto', padding: '12px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                <p>FitSchedule Pro v1.0</p>
            </div>
        </aside>
    )
}
