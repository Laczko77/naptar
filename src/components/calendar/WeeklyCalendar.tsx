'use client'

import { useMemo } from 'react'
import {
    addDays,
    addWeeks,
    subWeeks,
    startOfWeek,
    isSameDay,
    format,
    getDay,
    isWeekend,
} from 'date-fns'
import { hu } from 'date-fns/locale'
import { getCycleDayForDate, getWorkoutTypeInfo } from '@/lib/workout-cycle'
import type {
    ScheduleEvent,
    WorkShift,
    FriendScheduleEntry,
    FriendNightShift,
} from '@/lib/types'

interface WeeklyCalendarProps {
    currentWeek: Date // any date in the target week
    onWeekChange: (date: Date) => void
    cycleStartDate: Date | null
    events: ScheduleEvent[]
    shifts: WorkShift[]
    friendSchedule: FriendScheduleEntry[]
    nightShifts: FriendNightShift[]
    onDayClick: (date: Date) => void
    onAddEvent: (date: Date) => void
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 06:00 – 22:00

function timeToY(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return (h - 6 + (m || 0) / 60) // relative to 06:00
}

const eventColors: Record<string, { bg: string; border: string; text: string }> = {
    workout: { bg: 'rgba(34,197,94,0.2)', border: '#22c55e', text: '#4ade80' },
    girlfriend: { bg: 'rgba(236,72,153,0.2)', border: '#ec4899', text: '#f472b6' },
    cooking: { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b', text: '#fbbf24' },
    other: { bg: 'rgba(107,114,128,0.2)', border: '#6b7280', text: '#9ca3af' },
}

export default function WeeklyCalendar({
    currentWeek,
    onWeekChange,
    cycleStartDate,
    events,
    shifts,
    friendSchedule,
    nightShifts,
    onDayClick,
    onAddEvent,
}: WeeklyCalendarProps) {
    const today = new Date()
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

    const eventsByDate = useMemo(() => {
        const map: Record<string, ScheduleEvent[]> = {}
        events.forEach((e) => { if (!map[e.event_date]) map[e.event_date] = []; map[e.event_date].push(e) })
        return map
    }, [events])

    const shiftsByDate = useMemo(() => {
        const map: Record<string, WorkShift[]> = {}
        shifts.forEach((s) => { if (!map[s.shift_date]) map[s.shift_date] = []; map[s.shift_date].push(s) })
        return map
    }, [shifts])

    const nightShiftsByDate = useMemo(() => {
        const map: Record<string, FriendNightShift> = {}
        nightShifts.forEach((ns) => { map[ns.night_shift_date] = ns })
        return map
    }, [nightShifts])

    const HOUR_HEIGHT = 48 // px per hour
    const TOTAL_HEIGHT = HOURS.length * HOUR_HEIGHT

    return (
        <div>
            {/* Week Navigation */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '20px',
            }}>
                <button
                    onClick={() => onWeekChange(subWeeks(currentWeek, 1))}
                    style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid var(--color-border)', background: 'transparent',
                        color: 'var(--color-text)', cursor: 'pointer', fontSize: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >←</button>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        {format(weekStart, 'MMM d.', { locale: hu })} – {format(addDays(weekStart, 6), 'MMM d.', { locale: hu })}
                    </h2>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {format(weekStart, 'yyyy')}
                    </span>
                </div>
                <button
                    onClick={() => onWeekChange(addWeeks(currentWeek, 1))}
                    style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid var(--color-border)', background: 'transparent',
                        color: 'var(--color-text)', cursor: 'pointer', fontSize: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >→</button>
            </div>

            {/* Day Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', gap: '1px' }}>
                <div /> {/* time gutter */}
                {days.map((day) => {
                    const isToday = isSameDay(day, today)
                    const isWknd = isWeekend(day)
                    const dateStr = format(day, 'yyyy-MM-dd')
                    let cycleDay = null
                    let wInfo = null
                    if (cycleStartDate) {
                        cycleDay = getCycleDayForDate(cycleStartDate, day)
                        wInfo = getWorkoutTypeInfo(cycleDay.workoutType)
                    }
                    const prevDay = format(addDays(day, -1), 'yyyy-MM-dd')
                    const sleeping = !!nightShiftsByDate[prevDay]
                    const hasNight = !!nightShiftsByDate[dateStr]

                    return (
                        <div
                            key={dateStr}
                            onClick={() => onDayClick(day)}
                            style={{
                                textAlign: 'center', padding: '8px 4px',
                                cursor: 'pointer',
                                borderRadius: '8px 8px 0 0',
                                background: isToday ? 'rgba(99,102,241,0.08)' : 'transparent',
                                borderBottom: isToday ? '2px solid #818cf8' : '1px solid var(--color-border)',
                                transition: 'all 0.15s',
                            }}
                        >
                            <div style={{
                                fontSize: '10px', fontWeight: 600,
                                color: isWknd ? 'rgba(168,85,247,0.6)' : 'var(--color-text-secondary)',
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                                marginBottom: '2px',
                            }}>
                                {format(day, 'EEE', { locale: hu })}
                            </div>
                            <div style={{
                                fontSize: '18px', fontWeight: isToday ? 800 : 600,
                                color: isToday ? '#818cf8' : 'var(--color-text)',
                                width: isToday ? '32px' : undefined,
                                height: isToday ? '32px' : undefined,
                                borderRadius: isToday ? '50%' : undefined,
                                background: isToday ? 'rgba(99,102,241,0.15)' : undefined,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {format(day, 'd')}
                            </div>
                            <div style={{
                                display: 'flex', gap: '3px', justifyContent: 'center',
                                alignItems: 'center', marginTop: '4px', minHeight: '16px',
                            }}>
                                {wInfo && cycleDay && (
                                    <span style={{
                                        fontSize: '9px', fontWeight: 700,
                                        padding: '1px 5px', borderRadius: '3px',
                                        background: wInfo.bgColor, color: wInfo.color,
                                    }}>
                                        {cycleDay.workoutType === 'REST' ? 'R' : `${cycleDay.workoutType[0]}${cycleDay.weekType}`}
                                    </span>
                                )}
                                {sleeping && <span style={{ fontSize: '10px' }}>😴</span>}
                                {hasNight && <span style={{ fontSize: '10px' }}>🌙</span>}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Timeline Grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', gap: '0',
                position: 'relative', overflowY: 'auto', maxHeight: '600px',
                border: '1px solid var(--color-border)', borderRadius: '0 0 10px 10px',
                background: 'var(--color-surface)',
            }}>
                {/* Time Labels */}
                <div style={{ position: 'relative', height: `${TOTAL_HEIGHT}px` }}>
                    {HOURS.map((hour) => (
                        <div
                            key={hour}
                            style={{
                                position: 'absolute',
                                top: `${(hour - 6) * HOUR_HEIGHT}px`,
                                right: '8px',
                                fontSize: '10px',
                                fontWeight: 500,
                                color: 'var(--color-text-secondary)',
                                lineHeight: '1',
                                transform: 'translateY(-5px)',
                            }}
                        >
                            {String(hour).padStart(2, '0')}:00
                        </div>
                    ))}
                </div>

                {/* Day Columns */}
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const isToday = isSameDay(day, today)
                    const dayEvents = eventsByDate[dateStr] || []
                    const dayShifts = shiftsByDate[dateStr] || []
                    const dayOfWeek = ((getDay(day) + 6) % 7)
                    const friendClasses = friendSchedule.filter(f => f.day_of_week === dayOfWeek)

                    return (
                        <div
                            key={dateStr}
                            style={{
                                position: 'relative',
                                height: `${TOTAL_HEIGHT}px`,
                                borderLeft: '1px solid var(--color-border)',
                                background: isToday ? 'rgba(99,102,241,0.03)' : 'transparent',
                            }}
                            onClick={() => onAddEvent(day)}
                        >
                            {/* Hour grid lines */}
                            {HOURS.map((hour) => (
                                <div
                                    key={hour}
                                    style={{
                                        position: 'absolute',
                                        top: `${(hour - 6) * HOUR_HEIGHT}px`,
                                        left: 0, right: 0,
                                        height: '1px',
                                        background: 'var(--color-border)',
                                        opacity: 0.5,
                                    }}
                                />
                            ))}

                            {/* Current time indicator */}
                            {isToday && (() => {
                                const now = new Date()
                                const currentHour = now.getHours() + now.getMinutes() / 60
                                if (currentHour >= 6 && currentHour <= 22) {
                                    const top = (currentHour - 6) * HOUR_HEIGHT
                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            top: `${top}px`, left: 0, right: 0,
                                            height: '2px', background: '#ef4444',
                                            zIndex: 10,
                                        }}>
                                            <div style={{
                                                position: 'absolute', left: '-4px', top: '-3px',
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                background: '#ef4444',
                                            }} />
                                        </div>
                                    )
                                }
                                return null
                            })()}

                            {/* Friend classes (background blocks) */}
                            {friendClasses.map((cls, ci) => {
                                const top = timeToY(cls.start_time) * HOUR_HEIGHT
                                const height = (timeToY(cls.end_time) - timeToY(cls.start_time)) * HOUR_HEIGHT
                                return (
                                    <div
                                        key={`fc-${ci}`}
                                        style={{
                                            position: 'absolute',
                                            top: `${top}px`, left: '2px', right: '2px',
                                            height: `${Math.max(height, 12)}px`,
                                            background: 'rgba(239,68,68,0.06)',
                                            borderLeft: '2px solid rgba(239,68,68,0.3)',
                                            borderRadius: '3px',
                                            padding: '2px 4px',
                                            fontSize: '8px', color: '#f87171',
                                            overflow: 'hidden',
                                            zIndex: 1,
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {cls.event_name}
                                    </div>
                                )
                            })}

                            {/* Work shifts */}
                            {dayShifts.map((shift) => {
                                const top = timeToY(shift.start_time) * HOUR_HEIGHT
                                const height = (timeToY(shift.end_time) - timeToY(shift.start_time)) * HOUR_HEIGHT
                                return (
                                    <div
                                        key={shift.id}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            top: `${top}px`, left: '4px', right: '4px',
                                            height: `${Math.max(height, 18)}px`,
                                            background: 'rgba(139,92,246,0.15)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            borderLeft: '3px solid #8b5cf6',
                                            borderRadius: '4px',
                                            padding: '3px 5px',
                                            fontSize: '9px', fontWeight: 600,
                                            color: '#a78bfa',
                                            zIndex: 3,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div>💼 {shift.start_time?.slice(0, 5)}–{shift.end_time?.slice(0, 5)}</div>
                                        {height > 30 && (
                                            <div style={{ fontSize: '8px', opacity: 0.7, marginTop: '1px' }}>
                                                {shift.duration_hours}h · {shift.shift_type}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Events */}
                            {dayEvents.map((evt) => {
                                if (!evt.start_time || !evt.end_time) return null
                                const top = timeToY(evt.start_time) * HOUR_HEIGHT
                                const height = (timeToY(evt.end_time) - timeToY(evt.start_time)) * HOUR_HEIGHT
                                const col = eventColors[evt.event_type] || eventColors.other
                                return (
                                    <div
                                        key={evt.id}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            position: 'absolute',
                                            top: `${top}px`, left: '4px', right: '4px',
                                            height: `${Math.max(height, 18)}px`,
                                            background: col.bg,
                                            border: `1px solid ${col.border}33`,
                                            borderLeft: `3px solid ${col.border}`,
                                            borderRadius: '4px',
                                            padding: '3px 5px',
                                            fontSize: '9px', fontWeight: 600,
                                            color: col.text,
                                            zIndex: 4,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {evt.title || evt.event_type}
                                        {height > 25 && (
                                            <div style={{ fontSize: '8px', opacity: 0.7 }}>
                                                {evt.start_time?.slice(0, 5)}–{evt.end_time?.slice(0, 5)}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
