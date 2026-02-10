'use client'

import { useState, useEffect } from 'react'
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

// Bottom nav shows only the 5 most important items
const bottomNavItems = navItems.filter((item) => item.href !== '/settings')

export default function Sidebar() {
    const pathname = usePathname()
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Close mobile menu on navigation
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    // Desktop Sidebar
    if (!isMobile) {
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

    // Mobile: Hamburger + Overlay + Bottom Nav
    return (
        <>
            {/* Mobile Header Bar */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '52px',
                    background: 'var(--color-bg-secondary)',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    zIndex: 800,
                }}
            >
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {mobileOpen ? '✕' : '☰'}
                </button>
                <span
                    style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    💪 FitSchedule Pro
                </span>
                <div style={{ width: '36px' }} /> {/* spacer */}
            </div>

            {/* Overlay Menu */}
            {mobileOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        top: '52px',
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 790,
                    }}
                    onClick={() => setMobileOpen(false)}
                >
                    <div
                        className="animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '260px',
                            height: 'calc(100vh - 52px)',
                            background: 'var(--color-bg-secondary)',
                            borderRight: '1px solid var(--color-border)',
                            padding: '16px 12px',
                            overflowY: 'auto',
                        }}
                    >
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
                                            padding: '12px 14px',
                                            borderRadius: 'var(--radius-sm)',
                                            textDecoration: 'none',
                                            fontSize: '15px',
                                            fontWeight: isActive ? 600 : 400,
                                            color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                                            background: isActive ? 'var(--color-surface-hover)' : 'transparent',
                                        }}
                                    >
                                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: 'var(--color-bg-secondary)',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    zIndex: 800,
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {bottomNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '2px',
                                textDecoration: 'none',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                transition: 'all 0.15s',
                            }}
                        >
                            <span style={{
                                fontSize: '22px',
                                filter: isActive ? 'none' : 'grayscale(0.5)',
                                opacity: isActive ? 1 : 0.6,
                            }}>
                                {item.icon}
                            </span>
                            <span style={{
                                fontSize: '9px',
                                fontWeight: isActive ? 700 : 400,
                                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            }}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '2px',
                                        width: '20px',
                                        height: '3px',
                                        borderRadius: '2px',
                                        background: 'var(--color-accent)',
                                    }}
                                />
                            )}
                        </Link>
                    )
                })}
            </div>
        </>
    )
}
