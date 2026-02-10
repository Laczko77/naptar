'use client'

import { format, getDaysInMonth, startOfMonth, differenceInCalendarDays } from 'date-fns'
import { hu } from 'date-fns/locale'

interface WorkHoursForecastProps {
    totalHours: number
    monthlyTarget: number
    byType: Record<string, number>
    currentMonth: Date
}

export default function WorkHoursForecast({ totalHours, monthlyTarget, byType, currentMonth }: WorkHoursForecastProps) {
    const today = new Date()
    const monthStart = startOfMonth(currentMonth)
    const daysInMonth = getDaysInMonth(currentMonth)
    const daysPassed = Math.max(1, differenceInCalendarDays(today, monthStart) + 1)
    const daysRemaining = Math.max(0, daysInMonth - daysPassed)

    // Check if we're viewing current month
    const isCurrentMonth = format(today, 'yyyy-MM') === format(currentMonth, 'yyyy-MM')

    // Forecast calculation
    const dailyRate = totalHours / daysPassed
    const forecastedTotal = isCurrentMonth
        ? Math.round((dailyRate * daysInMonth) * 10) / 10
        : totalHours

    const forecastPct = Math.round((forecastedTotal / monthlyTarget) * 100)
    const hoursNeeded = Math.max(0, Math.round((monthlyTarget - totalHours) * 10) / 10)
    const dailyNeeded = daysRemaining > 0 ? Math.round((hoursNeeded / daysRemaining) * 10) / 10 : 0

    // Status determination
    let status: { label: string; color: string; emoji: string; bg: string }
    if (!isCurrentMonth) {
        status = totalHours >= monthlyTarget
            ? { label: 'Teljesítve', color: '#22c55e', emoji: '✅', bg: 'rgba(34, 197, 94, 0.1)' }
            : { label: 'Nem teljesült', color: '#ef4444', emoji: '❌', bg: 'rgba(239, 68, 68, 0.1)' }
    } else if (forecastedTotal >= monthlyTarget) {
        status = { label: 'Jó úton haladsz!', color: '#22c55e', emoji: '✅', bg: 'rgba(34, 197, 94, 0.1)' }
    } else if (forecastPct >= 80) {
        status = { label: 'Kicsit lassabb, de elérhető', color: '#f59e0b', emoji: '⚡', bg: 'rgba(245, 158, 11, 0.1)' }
    } else {
        status = { label: 'Több műszakra lesz szükség!', color: '#ef4444', emoji: '⚠️', bg: 'rgba(239, 68, 68, 0.1)' }
    }

    // Type minimums (8h each: délelőtt, délután, hétvége)
    const typeMinimum = 8
    const types = [
        { key: 'délelőtt', label: 'Délelőtt', emoji: '🌅', hours: byType['délelőtt'] || 0 },
        { key: 'délután', label: 'Délután', emoji: '☀️', hours: byType['délután'] || 0 },
        { key: 'hétvége', label: 'Hétvége', emoji: '📅', hours: byType['hétvége'] || 0 },
    ]

    return (
        <div
            className="animate-fade-in"
            style={{
                marginTop: '20px',
                padding: '20px',
                borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
            }}
        >
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📈 Előrejelzés
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                    {format(currentMonth, 'MMMM', { locale: hu })}
                </span>
            </h3>

            {/* Main Forecast */}
            <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: status.bg,
                border: `1px solid ${status.color}30`,
                marginBottom: '16px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: status.color }}>
                        {status.emoji} {status.label}
                    </span>
                    {isCurrentMonth && (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {daysRemaining} nap hátra
                        </span>
                    )}
                </div>

                {isCurrentMonth && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>Becsült havi összeg:</span>
                            <span style={{ fontWeight: 700, color: status.color }}>
                                {forecastedTotal}h / {monthlyTarget}h
                            </span>
                        </div>

                        {/* Forecast bar */}
                        <div style={{
                            height: '6px',
                            borderRadius: '3px',
                            background: 'rgba(255,255,255,0.1)',
                            marginBottom: '8px',
                        }}>
                            <div style={{
                                width: `${Math.min(forecastPct, 100)}%`,
                                height: '100%',
                                borderRadius: '3px',
                                background: status.color,
                                transition: 'width 0.5s ease',
                            }} />
                        </div>

                        {hoursNeeded > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                💡 Még <strong style={{ color: 'var(--color-text)' }}>{hoursNeeded}h</strong> kell → napi{' '}
                                <strong style={{ color: 'var(--color-text)' }}>{dailyNeeded}h</strong> átlag
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Type Breakdown */}
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                Típusonkénti minimum ({typeMinimum}h)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                {types.map((t) => {
                    const pct = Math.min(Math.round((t.hours / typeMinimum) * 100), 100)
                    const ok = t.hours >= typeMinimum
                    return (
                        <div key={t.key} style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '8px',
                            background: 'var(--color-bg-tertiary)',
                            border: '1px solid var(--color-border)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '14px', marginBottom: '4px' }}>{t.emoji}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: ok ? '#22c55e' : '#f59e0b' }}>
                                {t.hours}h
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                                / {typeMinimum}h
                            </div>
                            {/* Mini bar */}
                            <div style={{
                                height: '3px',
                                borderRadius: '2px',
                                background: 'rgba(255,255,255,0.08)',
                                marginTop: '6px',
                            }}>
                                <div style={{
                                    width: `${pct}%`,
                                    height: '100%',
                                    borderRadius: '2px',
                                    background: ok ? '#22c55e' : '#f59e0b',
                                }} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
