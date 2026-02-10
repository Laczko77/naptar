'use client'

import { useState } from 'react'
import { format, startOfWeek, addWeeks } from 'date-fns'
import { hu } from 'date-fns/locale'
import { useWorkoutSuggestions, type WorkoutSuggestion } from '@/hooks/useWorkoutSuggestions'
import { useWorkoutCycle } from '@/hooks/useCalendarData'
import { getWorkoutTypeInfo, type WorkoutType } from '@/lib/workout-cycle'

interface WorkoutSuggestionsProps {
    onSchedule?: (suggestion: WorkoutSuggestion) => Promise<void> | void
}

const confidenceConfig = {
    ideal: { color: '#22c55e', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)', label: 'Ideális' },
    good: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', label: 'Jó' },
    limited: { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.20)', label: 'Korlátozott' },
}

export default function WorkoutSuggestions({ onSchedule }: WorkoutSuggestionsProps) {
    const [weekOffset, setWeekOffset] = useState(0)

    const today = new Date()
    const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 })
    const { cycle } = useWorkoutCycle()
    const { suggestions, loading, refetch } = useWorkoutSuggestions(
        weekStart,
        cycle?.cycle_start_date || null
    )

    const weekEndDate = addWeeks(weekStart, 1)
    const weekLabel = `${format(weekStart, 'MMM d.', { locale: hu })} – ${format(weekEndDate, 'MMM d.', { locale: hu })}`

    return (
        <div
            className="animate-fade-in"
            style={{
                marginTop: '20px',
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
                        🏋️ Edzés Időpont Javaslatok
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        Optimális edzésidőpontok műszakok, barát óráinak és pihenésnek alapján
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
                        😴 Ezen a héten nincs edzésnap (csak pihenőnapok) vagy nincs ciklus beállítva
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {suggestions.map((s, i) => {
                            const wInfo = getWorkoutTypeInfo(s.workoutType)
                            const cConfig = confidenceConfig[s.confidence]
                            const isScheduled = s.tags.includes('✅ Már beütemezve')

                            return (
                                <div
                                    key={`${s.date}-${i}`}
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        background: isScheduled ? 'rgba(34,197,94,0.06)' : cConfig.bg,
                                        border: `1px solid ${isScheduled ? 'rgba(34,197,94,0.2)' : cConfig.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        transition: 'all 0.2s',
                                        opacity: isScheduled ? 0.7 : 1,
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

                                    {/* Workout type badge */}
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: wInfo.bgColor,
                                        color: wInfo.color,
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        border: `1px solid ${wInfo.borderColor}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {wInfo.emoji} {wInfo.label} {s.weekType}
                                    </span>

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
                                        {s.suggestedStartTime} – {s.suggestedEndTime}
                                    </div>

                                    {/* Confidence badge */}
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: cConfig.bg,
                                        color: cConfig.color,
                                        textTransform: 'uppercase',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {cConfig.label}
                                    </span>

                                    {/* Tags */}
                                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {s.tags.map((tag, j) => (
                                            <span key={j} style={{
                                                fontSize: '10px',
                                                padding: '1px 6px',
                                                borderRadius: '3px',
                                                background: tag.startsWith('✅') ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                                                color: tag.startsWith('✅') ? '#22c55e' : 'var(--color-text-secondary)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Reason */}
                                    <div style={{
                                        flex: 2,
                                        fontSize: '11px',
                                        color: 'var(--color-text-secondary)',
                                        lineHeight: 1.3,
                                    }}>
                                        {s.reason}
                                    </div>

                                    {/* Schedule button */}
                                    {onSchedule && !isScheduled && (
                                        <button
                                            onClick={async () => {
                                                if (onSchedule) {
                                                    await onSchedule(s)
                                                    refetch()
                                                }
                                            }}
                                            style={{
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                background: `linear-gradient(135deg, ${wInfo.color}, ${wInfo.color}dd)`,
                                                color: 'white',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            + Beütemez
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            {!loading && suggestions.length > 0 && (
                <div style={{
                    padding: '8px 16px',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '16px',
                }}>
                    <span>Push → Pull → Legs → Rest ciklus</span>
                    <span>·</span>
                    <span>~2.5 óra / edzés</span>
                    <span>·</span>
                    <span>Barát órarendjéhez igazítva</span>
                </div>
            )}
        </div>
    )
}
