'use client'

interface HoursProgressProps {
    totalHours: number
    monthlyTarget: number
    progress: number
    remaining: number
    byType: Record<string, number>
    weeks: { weekLabel: string; hours: number }[]
    shiftCount: number
}

export default function HoursProgress({
    totalHours,
    monthlyTarget,
    progress,
    remaining,
    byType,
    weeks,
    shiftCount,
}: HoursProgressProps) {
    const progressColor = progress >= 100 ? '#22c55e' : progress >= 75 ? '#3b82f6' : progress >= 50 ? '#f59e0b' : '#ef4444'

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Main Progress Circle */}
            <div
                style={{
                    padding: '24px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                }}
            >
                {/* Circular progress */}
                <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke={progressColor}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 52}`}
                            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                        />
                    </svg>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span style={{ fontSize: '28px', fontWeight: 800, color: progressColor }}>
                            {Math.round(totalHours)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            / {monthlyTarget} óra
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                        Havi Összesítés
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>Teljesítve</span>
                            <span style={{ fontWeight: 600, color: progressColor }}>{Math.round(progress)}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>Hátralévő</span>
                            <span style={{ fontWeight: 600 }}>{Math.round(remaining)} óra</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>Műszakok száma</span>
                            <span style={{ fontWeight: 600 }}>{shiftCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Type Breakdown */}
            <div
                style={{
                    padding: '20px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                }}
            >
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                    Típus szerinti bontás
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {([
                        { key: 'délelőtt', label: '🌅 Délelőtt', color: '#fbbf24' },
                        { key: 'délután', label: '☀️ Délután', color: '#818cf8' },
                        { key: 'hétvége', label: '📅 Hétvége', color: '#22c55e' },
                    ] as const).map(({ key, label, color }) => {
                        const hours = byType[key] || 0
                        const pct = totalHours > 0 ? (hours / totalHours) * 100 : 0
                        return (
                            <div key={key}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                                    <span>{label}</span>
                                    <span style={{ fontWeight: 600, color }}>{Math.round(hours * 10) / 10} óra</span>
                                </div>
                                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--color-border)', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${pct}%`,
                                            borderRadius: '3px',
                                            background: color,
                                            transition: 'width 0.5s ease-out',
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Weekly Breakdown */}
            <div
                style={{
                    padding: '20px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                }}
            >
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                    Heti bontás
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {weeks.map((week, i) => {
                        const weekTarget = 15 // ~15h/week for 60h/month
                        const weekPct = Math.min((week.hours / weekTarget) * 100, 100)
                        return (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{week.weekLabel}</span>
                                    <span style={{ fontWeight: 600 }}>
                                        {Math.round(week.hours * 10) / 10}
                                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}> / {weekTarget}h</span>
                                    </span>
                                </div>
                                <div style={{ height: '5px', borderRadius: '3px', background: 'var(--color-border)', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${weekPct}%`,
                                            borderRadius: '3px',
                                            background: week.hours >= weekTarget ? '#22c55e' : '#6366f1',
                                            transition: 'width 0.5s ease-out',
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
