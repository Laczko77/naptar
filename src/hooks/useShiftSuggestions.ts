'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { WorkShift, FriendScheduleEntry, ScheduleEvent } from '@/lib/types'
import { getCycleDayForDate } from '@/lib/workout-cycle'
import {
    format,
    addDays,
    startOfWeek,
    endOfWeek,
    getDay,
    isWeekend,
    startOfMonth,
    endOfMonth,
} from 'date-fns'

const supabase = createClient()

export interface ShiftSuggestion {
    date: string          // yyyy-MM-dd
    dayName: string       // Hétfő, Kedd, ...
    startTime: string     // HH:mm
    endTime: string       // HH:mm
    durationHours: number
    shiftType: 'délelőtt' | 'délután' | 'hétvége'
    priority: 'high' | 'medium' | 'low'
    reason: string
    tags: string[]        // e.g. ['barát alszik', 'edzés után']
}

interface TimeSlot {
    start: number  // hours from midnight (e.g. 9.5 = 09:30)
    end: number
}

const DAY_NAMES = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']

function timeToHours(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return h + (m || 0) / 60
}

function hoursToTime(h: number): string {
    const hours = Math.floor(h)
    const mins = Math.round((h - hours) * 60)
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function getOverlap(a: TimeSlot, b: TimeSlot): TimeSlot | null {
    const start = Math.max(a.start, b.start)
    const end = Math.min(a.end, b.end)
    return start < end ? { start, end } : null
}

function subtractSlots(free: TimeSlot, busy: TimeSlot[]): TimeSlot[] {
    let slots: TimeSlot[] = [free]
    for (const b of busy) {
        const next: TimeSlot[] = []
        for (const s of slots) {
            if (b.end <= s.start || b.start >= s.end) {
                next.push(s) // no overlap
            } else {
                if (s.start < b.start) next.push({ start: s.start, end: b.start })
                if (s.end > b.end) next.push({ start: b.end, end: s.end })
            }
        }
        slots = next
    }
    return slots.filter(s => (s.end - s.start) >= 0.25) // min 15 min
}

export function useShiftSuggestions(weekStartDate: Date, cycleStartDate: string | null) {
    const [suggestions, setSuggestions] = useState<ShiftSuggestion[]>([])
    const [loading, setLoading] = useState(true)
    const [version, setVersion] = useState(0)

    // Stabilize the date as a string key to prevent infinite re-renders
    // (Date objects are always new references)
    const weekKey = format(weekStartDate, 'yyyy-MM-dd')

    useEffect(() => {
        const weekStart = new Date(weekKey + 'T00:00:00')
        let cancelled = false

        async function generate() {
            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user || cancelled) { if (!cancelled) setLoading(false); return }

                // Fetch all needed data in parallel
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
                const monthStart = format(startOfMonth(weekStart), 'yyyy-MM-dd')
                const monthEnd = format(endOfMonth(weekStart), 'yyyy-MM-dd')
                const wkStart = weekKey
                const wkEnd = format(weekEnd, 'yyyy-MM-dd')

                const [friendRes, shiftsRes, eventsRes, nightShiftsRes, monthShiftsRes] = await Promise.all([
                    supabase.from('friend_schedule').select('*').eq('user_id', user.id),
                    supabase.from('work_shifts').select('*').eq('user_id', user.id)
                        .gte('shift_date', wkStart).lte('shift_date', wkEnd),
                    supabase.from('schedule_events').select('*').eq('user_id', user.id)
                        .gte('event_date', wkStart).lte('event_date', wkEnd),
                    supabase.from('friend_night_shifts').select('*').eq('user_id', user.id)
                        .gte('night_shift_date', format(addDays(weekStart, -1), 'yyyy-MM-dd'))
                        .lte('night_shift_date', wkEnd),
                    supabase.from('work_shifts').select('*').eq('user_id', user.id)
                        .gte('shift_date', monthStart).lte('shift_date', monthEnd),
                ])

                if (cancelled) return

                const friendSchedule: FriendScheduleEntry[] = friendRes.data || []
                const weekShifts: WorkShift[] = shiftsRes.data || []
                const weekEvents: ScheduleEvent[] = eventsRes.data || []
                const nightShifts = nightShiftsRes.data || []
                const monthShifts: WorkShift[] = monthShiftsRes.data || []

                // Monthly stats for priority calculation
                const monthlyByType = { délelőtt: 0, délután: 0, hétvége: 0 }
                const monthlyTotal = monthShifts.reduce((sum, s) => {
                    const h = Number(s.duration_hours) || 0
                    if (s.shift_type && monthlyByType[s.shift_type as keyof typeof monthlyByType] !== undefined) {
                        monthlyByType[s.shift_type as keyof typeof monthlyByType] += h
                    }
                    return sum + h
                }, 0)

                // Weekly hours already scheduled
                const weeklyHours = weekShifts.reduce((sum, s) => sum + (Number(s.duration_hours) || 0), 0)

                const allSuggestions: ShiftSuggestion[] = []

                // Process each day of the week (Monday to Sunday)
                for (let i = 0; i < 7; i++) {
                    const day = addDays(weekStart, i)
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const jsDay = getDay(day) // 0=Sun, 1=Mon, ...
                    const friendDow = jsDay === 0 ? 6 : jsDay - 1
                    const dayNameStr = DAY_NAMES[jsDay]
                    const isWknd = isWeekend(day)

                    const dayShifts = weekShifts.filter(s => s.shift_date === dateStr)

                    // ─── Gather busy periods ────────────
                    const busySlots: (TimeSlot & { label?: string })[] = []

                    // 1. Friend's university classes
                    const friendClasses = friendSchedule.filter(f => f.day_of_week === friendDow)
                    for (const cls of friendClasses) {
                        busySlots.push({
                            start: timeToHours(cls.start_time),
                            end: timeToHours(cls.end_time),
                            label: `Barát: ${cls.event_name}`,
                        })
                    }

                    // 2. Friend night shift (previous day) → sleeping 07:00-14:00
                    const prevDateStr = format(addDays(day, -1), 'yyyy-MM-dd')
                    const friendSleptToday = nightShifts.some(
                        (ns: any) => ns.night_shift_date === prevDateStr
                    )

                    // 3. Workout time (if not REST day)
                    let workoutSlot: TimeSlot | null = null
                    if (cycleStartDate) {
                        const cycleDay = getCycleDayForDate(
                            new Date(cycleStartDate + 'T00:00:00'),
                            new Date(dateStr + 'T00:00:00')
                        )
                        if (cycleDay.workoutType !== 'REST') {
                            let workoutStart = 10
                            if (friendSleptToday) {
                                workoutStart = 15
                            } else if (friendClasses.length > 0) {
                                const lastClassEnd = Math.max(...friendClasses.map(c => timeToHours(c.end_time)))
                                workoutStart = lastClassEnd + 0.5
                                if (workoutStart > 19) workoutStart = 9
                            }
                            workoutSlot = { start: workoutStart, end: workoutStart + 2.5 }
                            busySlots.push({ ...workoutSlot, label: `Edzés (${cycleDay.workoutType} ${cycleDay.weekType})` })
                        }
                    }

                    // 4. Existing shifts
                    for (const shift of dayShifts) {
                        busySlots.push({
                            start: timeToHours(shift.start_time),
                            end: timeToHours(shift.end_time),
                            label: 'Már beütemezett műszak',
                        })
                    }

                    // 5. Events (girlfriend, cooking, etc.)
                    const dayEvents = weekEvents.filter(e => e.event_date === dateStr)
                    for (const evt of dayEvents) {
                        if (evt.start_time && evt.end_time) {
                            busySlots.push({
                                start: timeToHours(evt.start_time),
                                end: timeToHours(evt.end_time),
                                label: evt.title || evt.event_type,
                            })
                        }
                    }

                    // ─── Calculate free slots ────────────
                    const dayWindow: TimeSlot = { start: 6, end: 22 }
                    const freeSlots = subtractSlots(dayWindow, busySlots)

                    // ─── Generate shift suggestions from free slots ────────────
                    for (const slot of freeSlots) {
                        const duration = slot.end - slot.start
                        if (duration < 2) continue

                        let shiftType: 'délelőtt' | 'délután' | 'hétvége'
                        if (isWknd) {
                            shiftType = 'hétvége'
                        } else if (slot.start < 12) {
                            shiftType = 'délelőtt'
                        } else {
                            shiftType = 'délután'
                        }

                        const suggestedDuration = Math.min(duration, 6)
                        const endHour = slot.start + suggestedDuration

                        const typeNeeded = 8 - (monthlyByType[shiftType] || 0)
                        const weeklyNeeded = 12 - weeklyHours
                        const monthlyNeeded = 60 - monthlyTotal

                        let priority: 'high' | 'medium' | 'low' = 'low'
                        const tags: string[] = []
                        const reasons: string[] = []

                        if (monthlyNeeded > 20) {
                            priority = 'high'
                            reasons.push(`Havi célhoz még ${Math.round(monthlyNeeded)}h kell`)
                        } else if (weeklyNeeded > 4) {
                            priority = 'high'
                            reasons.push(`Heti célhoz még ${Math.round(weeklyNeeded)}h kell`)
                        } else if (typeNeeded > 2) {
                            priority = 'medium'
                            reasons.push(`${shiftType} típusból még ${Math.round(typeNeeded)}h kell`)
                        }

                        if (friendSleptToday && slot.start < 14) {
                            priority = 'high'
                            tags.push('🌙 Barát alszik')
                            reasons.push('Ideális munkaidő: barát alszik, nem lehet edzés')
                        }

                        if (workoutSlot && slot.start > workoutSlot.end) {
                            tags.push('🏋️ Edzés után')
                        }

                        if (friendClasses.length > 0) {
                            const lastEnd = Math.max(...friendClasses.map(c => timeToHours(c.end_time)))
                            if (slot.start >= lastEnd) {
                                tags.push('📚 Órák után')
                            }
                        }

                        if (dayShifts.length > 0) continue

                        const reason = reasons.length > 0
                            ? reasons.join(' · ')
                            : 'Szabad időszak a napirendben'

                        allSuggestions.push({
                            date: dateStr,
                            dayName: dayNameStr.charAt(0).toUpperCase() + dayNameStr.slice(1),
                            startTime: hoursToTime(slot.start),
                            endTime: hoursToTime(endHour),
                            durationHours: Math.round(suggestedDuration * 10) / 10,
                            shiftType,
                            priority,
                            reason,
                            tags,
                        })
                    }
                }

                // Sort by priority then date
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                allSuggestions.sort((a, b) => {
                    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
                    if (pDiff !== 0) return pDiff
                    return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
                })

                if (!cancelled) {
                    setSuggestions(allSuggestions.slice(0, 10))
                    setLoading(false)
                }
            } catch (err: any) {
                // Ignore AbortError from React Strict Mode double-rendering
                if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
                    return
                }
                console.error('Shift suggestion error:', err)
                if (!cancelled) setLoading(false)
            }
        }

        generate()
        return () => { cancelled = true }
    }, [weekKey, cycleStartDate, version])

    const refetch = useCallback(() => {
        setVersion(v => v + 1)
    }, [])

    return { suggestions, loading, refetch }
}
