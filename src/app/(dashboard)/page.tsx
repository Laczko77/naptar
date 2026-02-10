'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkoutCycle } from '@/hooks/useCalendarData'
import { getCycleDayForDate, getWorkoutTypeInfo } from '@/lib/workout-cycle'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { hu } from 'date-fns/locale'
import type { WorkShift, ScheduleEvent, FriendNightShift } from '@/lib/types'

const supabase = createClient()

export default function DashboardPage() {
    const [userName, setUserName] = useState('')
    const [weekShifts, setWeekShifts] = useState<WorkShift[]>([])
    const [monthShifts, setMonthShifts] = useState<WorkShift[]>([])
    const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>([])
    const [nightShifts, setNightShifts] = useState<FriendNightShift[]>([])
    const [loading, setLoading] = useState(true)
    const { cycle } = useWorkoutCycle()

    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserName(user.email?.split('@')[0] || 'Felhasználó')

            const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
            const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd')

            const [weekRes, monthRes, eventsRes, nightRes] = await Promise.all([
                supabase.from('work_shifts').select('*').eq('user_id', user.id).gte('shift_date', weekStart).lte('shift_date', weekEnd),
                supabase.from('work_shifts').select('*').eq('user_id', user.id).gte('shift_date', monthStart).lte('shift_date', monthEnd),
                supabase.from('schedule_events').select('*').eq('user_id', user.id).eq('event_date', todayStr),
                supabase.from('friend_night_shifts').select('*').eq('user_id', user.id).gte('night_shift_date', todayStr).order('night_shift_date').limit(10),
            ])

            setWeekShifts(weekRes.data || [])
            setMonthShifts(monthRes.data || [])
            setTodayEvents(eventsRes.data || [])
            setNightShifts(nightRes.data || [])
            setLoading(false)
        }
        fetch()
    }, [])

    // Workout cycle info
    const cycleDay = useMemo(() => {
        if (!cycle) return null
        return getCycleDayForDate(new Date(cycle.cycle_start_date), today)
    }, [cycle])

    const workoutInfo = cycleDay ? getWorkoutTypeInfo(cycleDay.workoutType) : null

    // Calculated stats
    const weeklyHours = useMemo(() =>
        weekShifts.reduce((sum, s) => sum + (Number(s.duration_hours) || 0), 0), [weekShifts])
    const monthlyHours = useMemo(() =>
        monthShifts.reduce((sum, s) => sum + (Number(s.duration_hours) || 0), 0), [monthShifts])
    const monthlyProgress = Math.min((monthlyHours / 60) * 100, 100)

    if (loading) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius)' }} />
                ))}
            </div>
        )
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Welcome */}
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                    Szia, {userName}! 👋
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'capitalize' }}>
                    {format(today, 'yyyy. MMMM d. (EEEE)', { locale: hu })}
                </p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {/* Today's Workout */}
                <div className="glass" style={{ padding: '18px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Mai Edzés
                    </div>
                    {cycleDay && workoutInfo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '28px' }}>{workoutInfo.emoji}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '16px', color: workoutInfo.color }}>
                                    {cycleDay.workoutType === 'REST' ? 'Pihenőnap' : `${cycleDay.workoutType} ${cycleDay.weekType}`}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    {cycleDay.weekNumber}. hét
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Ciklus betöltése...</div>
                    )}
                </div>

                {/* Weekly Hours */}
                <div className="glass" style={{ padding: '18px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Heti Munkaidő
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: weeklyHours >= 12 ? '#22c55e' : '#818cf8' }}>
                            {Math.round(weeklyHours * 10) / 10}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>/ 15 óra</span>
                    </div>
                    <div style={{ marginTop: '8px', height: '4px', borderRadius: '2px', background: 'var(--color-bg-tertiary)', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min((weeklyHours / 15) * 100, 100)}%`,
                            height: '100%', borderRadius: '2px',
                            background: weeklyHours >= 15 ? '#22c55e' : '#6366f1',
                            transition: 'width 0.5s ease-out',
                        }} />
                    </div>
                </div>

                {/* Monthly Hours */}
                <div className="glass" style={{ padding: '18px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Havi Munkaidő
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: monthlyProgress >= 100 ? '#22c55e' : monthlyProgress >= 50 ? '#3b82f6' : '#f59e0b' }}>
                            {Math.round(monthlyHours)}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>/ 60 óra</span>
                    </div>
                    <div style={{ marginTop: '8px', height: '4px', borderRadius: '2px', background: 'var(--color-bg-tertiary)', overflow: 'hidden' }}>
                        <div style={{
                            width: `${monthlyProgress}%`,
                            height: '100%', borderRadius: '2px',
                            background: monthlyProgress >= 100 ? '#22c55e' : monthlyProgress >= 50 ? '#3b82f6' : '#f59e0b',
                            transition: 'width 0.5s ease-out',
                        }} />
                    </div>
                </div>

                {/* Cycle Progress */}
                <div className="glass" style={{ padding: '18px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Edzésciklus
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {(['PUSH', 'PULL', 'LEGS', 'REST'] as const).map((type) => {
                            const info = getWorkoutTypeInfo(type)
                            const isActive = cycleDay?.workoutType === type
                            return (
                                <div
                                    key={type}
                                    style={{
                                        flex: 1, padding: '6px 4px', borderRadius: '6px', textAlign: 'center',
                                        fontSize: '10px', fontWeight: 700,
                                        background: isActive ? `${info.color}25` : 'var(--color-bg-tertiary)',
                                        color: isActive ? info.color : 'var(--color-text-secondary)',
                                        border: isActive ? `1px solid ${info.color}40` : '1px solid transparent',
                                    }}
                                >
                                    {info.emoji} {type}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Two Column: Today Events + Night Shifts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Today's Events */}
                <div className="glass" style={{ padding: '18px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        📅 Mai programok
                    </div>
                    {todayEvents.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            Nincs beütemezett program mára.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {todayEvents.map((event) => {
                                const typeColors: Record<string, string> = { workout: '#3b82f6', girlfriend: '#ec4899', cooking: '#f59e0b', other: '#6b7280' }
                                return (
                                    <div key={event.id} style={{
                                        padding: '8px 12px', borderRadius: '6px',
                                        background: `${typeColors[event.event_type] || '#6b7280'}15`,
                                        borderLeft: `3px solid ${typeColors[event.event_type] || '#6b7280'}`,
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600 }}>{event.title || event.event_type}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                            {event.start_time?.slice(0, 5)} – {event.end_time?.slice(0, 5)}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Night Shifts */}
                <div className="glass" style={{ padding: '18px', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        🌙 Barát éjszakái
                    </div>
                    {nightShifts.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            Nincs rögzített éjszakai műszak.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {nightShifts.slice(0, 5).map((ns) => (
                                <div key={ns.id} style={{
                                    padding: '6px 10px', borderRadius: '6px',
                                    background: 'rgba(30, 58, 95, 0.3)', fontSize: '12px',
                                    display: 'flex', justifyContent: 'space-between',
                                }}>
                                    <span>🌙 {format(new Date(ns.night_shift_date + 'T00:00:00'), 'MMM d. (EEE)', { locale: hu })}</span>
                                    <span style={{ color: '#93c5fd' }}>😴 másnap DE</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="glass" style={{
                padding: '14px 20px', borderRadius: 'var(--radius)',
                display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '12px',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Havi műszakok</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{monthShifts.length}</div>
                </div>
                <div style={{ width: '1px', background: 'var(--color-border)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Hátralévő</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b' }}>{Math.max(Math.round(60 - monthlyHours), 0)}h</div>
                </div>
                <div style={{ width: '1px', background: 'var(--color-border)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Éjszakák</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#93c5fd' }}>{nightShifts.length}</div>
                </div>
            </div>
        </div>
    )
}
