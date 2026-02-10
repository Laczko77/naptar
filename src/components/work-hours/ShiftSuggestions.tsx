'use client'

import { useState } from 'react'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { hu } from 'date-fns/locale'
import { useShiftSuggestions, type ShiftSuggestion } from '@/hooks/useShiftSuggestions'
import { useWorkoutCycle } from '@/hooks/useCalendarData'

interface ShiftSuggestionsProps {
    onAccept: (suggestion: {
        shift_date: string
        start_time: string
        end_time: string
        duration_hours: number
        shift_type: 'délelőtt' | 'délután' | 'hétvége'
    }) => Promise<void>
}

const priorityConfig = {
    high: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', label: 'Sürgős' },
    medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Ajánlott' },
    low: { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.20)', label: 'Opcionális' },
}

const typeColors: Record<string, { color: string; bg: string }> = {
    'délelőtt': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    'délután': { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    'hétvége': { color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
}

export default function ShiftSuggestions({ onAccept }: ShiftSuggestionsProps) {
    const [weekOffset, setWeekOffset] = useState(0)
    const [accepting, setAccepting] = useState<string | null>(null)
    const [accepted, setAccepted] = useState<Set<string>>(new Set())

    const today = new Date()
    const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 })
    const { cycle } = useWorkoutCycle()
    const { suggestions, loading, refetch } = useShiftSuggestions(
        weekStart,
        cycle?.cycle_start_date || null
    )

    const handleAccept = async (suggestion: ShiftSuggestion) => {
        const key = `${suggestion.date}-${suggestion.startTime}`
        setAccepting(key)
        try {
            await onAccept({
                shift_date: suggestion.date,
                start_time: suggestion.startTime,
                end_time: suggestion.endTime,
                duration_hours: suggestion.durationHours,
                shift_type: suggestion.shiftType,
            })
            setAccepted(prev => new Set(prev).add(key))
            // Refetch suggestions after acceptance
            setTimeout(() => refetch(), 500)
        } finally {
            setAccepting(null)
        }
    }

    const weekEndDate = addWeeks(weekStart, 1)
    const weekLabel = `${format(weekStart, 'MMM d.', { locale: hu })} – ${format(weekEndDate, 'MMM d.', { locale: hu })}`

    return (
        <div
            className="animate-fade-in"
            style={{
                marginTop: '24px',
                borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💡 Műszak Javaslatok
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Optimális időpontok az órarend, edzés és pihenés alapján
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setWeekOffset(w => w - 1)}
                        style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            border: '1px solid var(--color-border)', background: 'transparent',
                            color: 'var(--color-text)', cursor: 'pointer', fontSize: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >←</button>
                    <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
                        {weekLabel}
                    </span>
                    <button
                        onClick={() => setWeekOffset(w => w + 1)}
                        style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            border: '1px solid var(--color-border)', background: 'transparent',
                            color: 'var(--color-text)', cursor: 'pointer', fontSize: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >→</button>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '12px 16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                        ⏳ Javaslatok számítása...
                    </div>
                ) : suggestions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                        ✅ Erre a hétre nincs szabad időszak vagy nincs szükség több műszakra
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {suggestions.map((s, i) => {
                            const key = `${s.date}-${s.startTime}`
                            const isAccepted = accepted.has(key)
                            const isAccepting = accepting === key
                            const pConfig = priorityConfig[s.priority]
                            const tConfig = typeColors[s.shiftType] || typeColors['délelőtt']

                            return (
                                <div
                                    key={key + i}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        background: isAccepted ? 'rgba(34,197,94,0.08)' : pConfig.bg,
                                        border: `1px solid ${isAccepted ? 'rgba(34,197,94,0.3)' : pConfig.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        transition: 'all 0.2s',
                                        opacity: isAccepted ? 0.6 : 1,
                                    }}
                                >
                                    {/* Day info */}
                                    <div style={{ minWidth: '70px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)' }}>
                                            {s.dayName}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                            {format(new Date(s.date + 'T00:00:00'), 'MMM d.', { locale: hu })}
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {s.startTime} – {s.endTime}
                                    </div>

                                    {/* Duration */}
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: pConfig.color, minWidth: '30px' }}>
                                        {s.durationHours}h
                                    </div>

                                    {/* Type badge */}
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: tConfig.bg,
                                        color: tConfig.color,
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {s.shiftType}
                                    </span>

                                    {/* Tags */}
                                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {s.tags.map((tag, j) => (
                                            <span key={j} style={{
                                                fontSize: '10px',
                                                padding: '1px 6px',
                                                borderRadius: '3px',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: 'var(--color-text-secondary)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Reason (tooltip-like) */}
                                    <div style={{
                                        flex: 2,
                                        fontSize: '11px',
                                        color: 'var(--color-text-secondary)',
                                        lineHeight: 1.3,
                                    }}>
                                        {s.reason}
                                    </div>

                                    {/* Accept button */}
                                    <button
                                        onClick={() => handleAccept(s)}
                                        disabled={isAccepted || isAccepting}
                                        style={{
                                            padding: '6px 14px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: isAccepted
                                                ? '#22c55e'
                                                : 'linear-gradient(135deg, #818cf8, #6366f1)',
                                            color: 'white',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: isAccepted ? 'default' : 'pointer',
                                            opacity: isAccepting ? 0.7 : 1,
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {isAccepted ? '✓ Felvéve' : isAccepting ? '...' : '+ Elfogadom'}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Footer hint */}
            {!loading && suggestions.length > 0 && (
                <div style={{
                    padding: '8px 16px',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                    textAlign: 'center',
                }}>
                    Havi cél: 60h (min 8h délelőtt · 8h délután · 8h hétvége) · Heti cél: 12h
                </div>
            )}
        </div>
    )
}
