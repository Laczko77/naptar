'use client'

import { useMemo } from 'react'
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    format,
    getDay,
    isWeekend,
} from 'date-fns'
import { hu } from 'date-fns/locale'
import { getCycleDayForDate, getWorkoutTypeInfo, type WorkoutType } from '@/lib/workout-cycle'
import type {
    ScheduleEvent,
    WorkShift,
    FriendScheduleEntry,
    FriendNightShift,
} from '@/lib/types'

interface MonthlyCalendarProps {
    currentMonth: Date
    onMonthChange: (date: Date) => void
    cycleStartDate: Date | null
    events: ScheduleEvent[]
    shifts: WorkShift[]
    friendSchedule: FriendScheduleEntry[]
    nightShifts: FriendNightShift[]
    onDayClick: (date: Date) => void
    onAddEvent: (date: Date) => void
}

const DAY_NAMES = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']

export default function MonthlyCalendar({
    currentMonth,
    onMonthChange,
    cycleStartDate,
    events,
    shifts,
    friendSchedule,
    nightShifts,
    onDayClick,
    onAddEvent,
}: MonthlyCalendarProps) {
    const today = new Date()

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
        const days: Date[] = []
        let day = calStart
        while (day <= calEnd) {
            days.push(day)
            day = addDays(day, 1)
        }
        return days
    }, [currentMonth])

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

    const getFriendClassCount = (dayOfWeek: number) =>
        friendSchedule.filter((fs) => fs.day_of_week === dayOfWeek).length

    const isFriendSleeping = (date: Date) => {
        const prevDay = format(addDays(date, -1), 'yyyy-MM-dd')
        return !!nightShiftsByDate[prevDay]
    }

    const weeks = useMemo(() => {
        const w: Date[][] = []
        for (let i = 0; i < calendarDays.length; i += 7) {
            w.push(calendarDays.slice(i, i + 7))
        }
        return w
    }, [calendarDays])

    return (
        <div>
            {/* Month Navigation */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '20px',
            }}>
                <button
                    onClick={() => onMonthChange(subMonths(currentMonth, 1))}
                    style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid var(--color-border)', background: 'transparent',
                        color: 'var(--color-text)', cursor: 'pointer', fontSize: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >←</button>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px',
                        textTransform: 'capitalize',
                    }}>
                        {format(currentMonth, 'MMMM', { locale: hu })}
                    </h2>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {format(currentMonth, 'yyyy')}
                    </span>
                </div>
                <button
                    onClick={() => onMonthChange(addMonths(currentMonth, 1))}
                    style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid var(--color-border)', background: 'transparent',
                        color: 'var(--color-text)', cursor: 'pointer', fontSize: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >→</button>
            </div>

            {/* Day Names Header */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                marginBottom: '4px',
            }}>
                {DAY_NAMES.map((name, i) => (
                    <div
                        key={name}
                        style={{
                            textAlign: 'center', fontSize: '11px', fontWeight: 600,
                            color: i >= 5 ? 'rgba(168,85,247,0.6)' : 'var(--color-text-secondary)',
                            padding: '6px 0', textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}
                    >
                        {name}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                        {week.map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd')
                            const isCurrentMonth = isSameMonth(day, currentMonth)
                            const isCurrentDay = isSameDay(day, today)
                            const dayOfWeek = ((getDay(day) + 6) % 7)
                            const dayEvents = eventsByDate[dateStr] || []
                            const dayShifts = shiftsByDate[dateStr] || []
                            const dayNightShift = nightShiftsByDate[dateStr]
                            const friendClassCount = getFriendClassCount(dayOfWeek)
                            const sleeping = isFriendSleeping(day)
                            const isWknd = isWeekend(day)

                            let cycleDay = null
                            let workoutInfo = null
                            if (cycleStartDate) {
                                cycleDay = getCycleDayForDate(cycleStartDate, day)
                                workoutInfo = getWorkoutTypeInfo(cycleDay.workoutType)
                            }

                            // Categorize events
                            const hasWorkout = dayEvents.some(e => e.event_type === 'workout')
                            const hasGirlfriend = dayEvents.some(e => e.event_type === 'girlfriend')
                            const hasOther = dayEvents.some(e => e.event_type !== 'workout' && e.event_type !== 'girlfriend')
                            const hasShift = dayShifts.length > 0

                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => onDayClick(day)}
                                    style={{
                                        minHeight: '80px',
                                        padding: '6px 8px',
                                        borderRadius: '10px',
                                        background: isCurrentDay
                                            ? 'rgba(99, 102, 241, 0.08)'
                                            : sleeping
                                                ? 'rgba(99, 102, 241, 0.03)'
                                                : 'transparent',
                                        border: isCurrentDay
                                            ? '2px solid rgba(99, 102, 241, 0.5)'
                                            : '1px solid transparent',
                                        opacity: isCurrentMonth ? 1 : 0.25,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        position: 'relative',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isCurrentDay) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isCurrentDay) {
                                            e.currentTarget.style.background = sleeping
                                                ? 'rgba(99, 102, 241, 0.03)' : 'transparent'
                                        }
                                    }}
                                >
                                    {/* Day Number + Workout type */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        marginBottom: '6px',
                                    }}>
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: isCurrentDay ? 800 : 600,
                                            color: isCurrentDay
                                                ? '#818cf8'
                                                : isWknd
                                                    ? 'rgba(168,85,247,0.7)'
                                                    : 'var(--color-text)',
                                            width: isCurrentDay ? '26px' : undefined,
                                            height: isCurrentDay ? '26px' : undefined,
                                            display: isCurrentDay ? 'flex' : undefined,
                                            alignItems: isCurrentDay ? 'center' : undefined,
                                            justifyContent: isCurrentDay ? 'center' : undefined,
                                            borderRadius: isCurrentDay ? '50%' : undefined,
                                            background: isCurrentDay ? 'rgba(99, 102, 241, 0.15)' : undefined,
                                        }}>
                                            {format(day, 'd')}
                                        </span>

                                        {/* Workout type — small colored dot with letter */}
                                        {workoutInfo && cycleDay && cycleDay.workoutType !== 'REST' && (
                                            <span style={{
                                                fontSize: '9px', fontWeight: 800,
                                                color: workoutInfo.color,
                                                letterSpacing: '-0.3px',
                                            }}>
                                                {cycleDay.workoutType[0]}{cycleDay.weekType}
                                            </span>
                                        )}
                                        {cycleDay && cycleDay.workoutType === 'REST' && (
                                            <span style={{
                                                fontSize: '8px', color: 'var(--color-text-secondary)',
                                                opacity: 0.5,
                                            }}>
                                                R
                                            </span>
                                        )}
                                    </div>

                                    {/* Shift time (compact) */}
                                    {dayShifts.length > 0 && (
                                        <div style={{
                                            fontSize: '9px', fontWeight: 600,
                                            color: '#a78bfa',
                                            marginBottom: '3px',
                                            display: 'flex', alignItems: 'center', gap: '3px',
                                        }}>
                                            <span style={{
                                                width: '4px', height: '4px', borderRadius: '50%',
                                                background: '#8b5cf6', flexShrink: 0,
                                            }} />
                                            {dayShifts[0].start_time?.slice(0, 5)}–{dayShifts[0].end_time?.slice(0, 5)}
                                        </div>
                                    )}

                                    {/* Sleeping indicator */}
                                    {sleeping && isCurrentMonth && (
                                        <div style={{
                                            fontSize: '8px', color: '#93c5fd',
                                            marginBottom: '2px', opacity: 0.8,
                                        }}>
                                            😴
                                        </div>
                                    )}

                                    {/* Night shift */}
                                    {dayNightShift && (
                                        <div style={{
                                            fontSize: '8px', color: '#60a5fa',
                                            marginBottom: '2px', opacity: 0.8,
                                        }}>
                                            🌙
                                        </div>
                                    )}

                                    {/* Event dots row */}
                                    {(hasWorkout || hasGirlfriend || hasOther || (friendClassCount > 0 && isCurrentMonth)) && (
                                        <div style={{
                                            display: 'flex', gap: '3px', alignItems: 'center',
                                            flexWrap: 'wrap', marginTop: 'auto',
                                        }}>
                                            {hasWorkout && <span style={{
                                                width: '5px', height: '5px', borderRadius: '50%',
                                                background: '#22c55e',
                                            }} />}
                                            {hasGirlfriend && <span style={{
                                                width: '5px', height: '5px', borderRadius: '50%',
                                                background: '#ec4899',
                                            }} />}
                                            {hasOther && <span style={{
                                                width: '5px', height: '5px', borderRadius: '50%',
                                                background: '#f59e0b',
                                            }} />}
                                            {hasShift && <span style={{
                                                width: '5px', height: '5px', borderRadius: '50%',
                                                background: '#8b5cf6',
                                            }} />}
                                            {friendClassCount > 0 && isCurrentMonth && (
                                                <span style={{
                                                    fontSize: '8px', color: '#f87171',
                                                    fontWeight: 600, opacity: 0.7,
                                                }}>
                                                    {friendClassCount}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>

            {/* Compact Legend */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '10px',
                padding: '10px 0', marginTop: '8px',
                justifyContent: 'center',
                fontSize: '10px', color: 'var(--color-text-secondary)',
            }}>
                {[
                    { color: '#3b82f6', label: 'Push' },
                    { color: '#22c55e', label: 'Pull' },
                    { color: '#f97316', label: 'Legs' },
                    { color: '#8b5cf6', label: 'Műszak' },
                    { color: '#ec4899', label: 'Barátnő' },
                    { color: '#f59e0b', label: 'Esemény' },
                ].map(({ color, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{
                            width: '6px', height: '6px', borderRadius: '50%', background: color,
                        }} />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    )
}
