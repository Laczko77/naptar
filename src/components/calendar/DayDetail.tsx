'use client'

import { format, getDay } from 'date-fns'
import { hu } from 'date-fns/locale'
import { getCycleDayForDate, getWorkoutTypeInfo } from '@/lib/workout-cycle'
import type {
    ScheduleEvent,
    WorkShift,
    FriendScheduleEntry,
    FriendNightShift,
} from '@/lib/types'

interface DayDetailProps {
    date: Date
    cycleStartDate: Date | null
    events: ScheduleEvent[]
    shifts: WorkShift[]
    friendClasses: FriendScheduleEntry[]
    nightShift: FriendNightShift | null
    friendSleeping: boolean
    onAddEvent: () => void
    onAddNightShift: () => void
    onDeleteEvent: (id: string) => void
    onDeleteNightShift: (id: string) => void
    onClose: () => void
}

export default function DayDetail({
    date,
    cycleStartDate,
    events,
    shifts,
    friendClasses,
    nightShift,
    friendSleeping,
    onAddEvent,
    onAddNightShift,
    onDeleteEvent,
    onDeleteNightShift,
    onClose,
}: DayDetailProps) {
    const cycleDay = cycleStartDate ? getCycleDayForDate(cycleStartDate, date) : null
    const workoutInfo = cycleDay ? getWorkoutTypeInfo(cycleDay.workoutType) : null
    const dayOfWeek = ((getDay(date) + 6) % 7) // Mon=0

    return (
        <div
            className="animate-slide-in glass"
            style={{
                padding: '20px',
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', textTransform: 'capitalize' }}>
                        {format(date, 'EEEE', { locale: hu })}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {format(date, 'yyyy. MMMM d.', { locale: hu })}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontSize: '14px',
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Workout Badge */}
            {workoutInfo && cycleDay && (
                <div
                    style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: workoutInfo.bgColor,
                        border: `1px solid ${workoutInfo.borderColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <span style={{ fontSize: '24px' }}>{workoutInfo.emoji}</span>
                    <div>
                        <div style={{ fontWeight: 700, color: workoutInfo.color, fontSize: '15px' }}>
                            {cycleDay.workoutType} {cycleDay.weekType}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {cycleDay.weekNumber}. hét · {cycleDay.workoutType === 'REST' ? 'Pihenőnap' : 'Edzésnap'}
                        </div>
                    </div>
                </div>
            )}

            {/* Friend Sleeping Warning */}
            {friendSleeping && (
                <div
                    style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(147, 197, 253, 0.1)',
                        border: '1px solid rgba(147, 197, 253, 0.2)',
                        fontSize: '13px',
                        color: '#93c5fd',
                    }}
                >
                    ⚠️ <strong>Barát alszik (07:00-14:00)</strong> — éjszakai műszak után. Délelőtt NEM lehet edzés!
                    <br />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                        💡 Ideális délelőtti munkaidő!
                    </span>
                </div>
            )}

            {/* Night Shift */}
            {nightShift && (
                <div
                    style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(30, 58, 95, 0.4)',
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#60a5fa' }}>
                            🌙 Barát éjszakai műszakja
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {nightShift.start_time?.slice(0, 5)} – {nightShift.end_time?.slice(0, 5)} (másnap)
                        </div>
                    </div>
                    <button
                        onClick={() => onDeleteNightShift(nightShift.id)}
                        style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: '11px',
                        }}
                    >
                        Törlés
                    </button>
                </div>
            )}

            {/* Friend Classes */}
            {friendClasses.length > 0 && (
                <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ❌ Barát Órái
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {friendClasses.map((fc) => (
                            <div
                                key={fc.id}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    border: '1px solid rgba(239, 68, 68, 0.15)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span style={{ fontSize: '13px', color: '#f87171' }}>{fc.event_name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    {fc.start_time?.slice(0, 5)} – {fc.end_time?.slice(0, 5)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Events */}
            {events.length > 0 && (
                <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Események
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {events.map((evt) => {
                            const typeColors: Record<string, { bg: string; text: string; emoji: string }> = {
                                girlfriend: { bg: 'rgba(236, 72, 153, 0.1)', text: '#f472b6', emoji: '💕' },
                                cooking: { bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', emoji: '🍳' },
                                workout: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', emoji: '🏋️' },
                                other: { bg: 'rgba(107, 114, 128, 0.1)', text: '#9ca3af', emoji: '📌' },
                            }
                            const c = typeColors[evt.event_type] || typeColors.other

                            return (
                                <div
                                    key={evt.id}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        background: c.bg,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <span style={{ fontSize: '13px', color: c.text }}>
                                            {c.emoji} {evt.title || evt.event_type}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                                            {evt.start_time?.slice(0, 5)} – {evt.end_time?.slice(0, 5)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => onDeleteEvent(evt.id)}
                                        style={{
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            background: 'transparent',
                                            color: '#f87171',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Work Shifts */}
            {shifts.length > 0 && (
                <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        💼 Műszakok
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {shifts.map((shift) => (
                            <div
                                key={shift.id}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span style={{ fontSize: '13px', color: '#a78bfa' }}>
                                    {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    {shift.duration_hours}h · {shift.shift_type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                    onClick={onAddEvent}
                    className="gradient-accent"
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    + Esemény
                </button>
                {!nightShift && (
                    <button
                        onClick={onAddNightShift}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(96, 165, 250, 0.3)',
                            background: 'rgba(30, 58, 95, 0.3)',
                            color: '#60a5fa',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        🌙 Éjszaka
                    </button>
                )}
            </div>
        </div>
    )
}
