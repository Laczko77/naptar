'use client'

import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import type { WorkShift } from '@/lib/types'

interface ShiftListProps {
    shifts: WorkShift[]
    onDelete: (id: string) => void
}

export default function ShiftList({ shifts, onDelete }: ShiftListProps) {
    if (shifts.length === 0) {
        return (
            <div
                style={{
                    padding: '40px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                }}
            >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>💼</div>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    Még nincs műszak rögzítve ebben a hónapban.
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Kattints a &quot;+ Műszak&quot; gombra a hozzáadáshoz.
                </p>
            </div>
        )
    }

    // Group shifts by date
    const grouped: Record<string, WorkShift[]> = {}
    shifts.forEach((s) => {
        if (!grouped[s.shift_date]) grouped[s.shift_date] = []
        grouped[s.shift_date].push(s)
    })

    const typeConfig: Record<string, { color: string; emoji: string }> = {
        'délelőtt': { color: '#fbbf24', emoji: '🌅' },
        'délután': { color: '#818cf8', emoji: '☀️' },
        'hétvége': { color: '#22c55e', emoji: '📅' },
    }

    return (
        <div
            style={{
                borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
            }}
        >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Műszakok listája</h3>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {Object.entries(grouped).map(([date, dayShifts]) => (
                    <div key={date}>
                        {/* Date header */}
                        <div
                            style={{
                                padding: '8px 20px',
                                background: 'var(--color-bg-tertiary)',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--color-text-secondary)',
                                textTransform: 'capitalize',
                                borderBottom: '1px solid var(--color-border)',
                            }}
                        >
                            {format(new Date(date + 'T00:00:00'), 'MMMM d. (EEEE)', { locale: hu })}
                        </div>
                        {/* Shifts */}
                        {dayShifts.map((shift) => {
                            const tc = typeConfig[shift.shift_type] || { color: '#9ca3af', emoji: '💼' }
                            return (
                                <div
                                    key={shift.id}
                                    style={{
                                        padding: '12px 20px',
                                        borderBottom: '1px solid rgba(42, 42, 74, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '18px' }}>{tc.emoji}</span>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 600 }}>
                                                {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                                <span style={{ color: tc.color }}>{shift.shift_type}</span>
                                                {' · '}
                                                {shift.duration_hours} óra
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDelete(shift.id)}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            background: 'transparent',
                                            color: '#f87171',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                                    >
                                        Törlés
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}
