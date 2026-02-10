'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import type { WorkShift, FriendScheduleEntry, ScheduleEvent } from '@/lib/types'
import { getCycleDayForDate, type WorkoutType, getWorkoutTypeInfo } from '@/lib/workout-cycle'
import {
    format,
    addDays,
    endOfWeek,
    getDay,
} from 'date-fns'

const supabase = createClient()

export interface WorkoutSuggestion {
    date: string          // yyyy-MM-dd
    dayName: string       // Hétfő, Kedd, ...
    workoutType: WorkoutType  // PUSH, PULL, LEGS
    weekType: 'A' | 'B'
    suggestedStartTime: string  // HH:mm
    suggestedEndTime: string    // HH:mm
    reason: string
    tags: string[]
    confidence: 'ideal' | 'good' | 'limited'  // how good the time slot is
}

interface TimeSlot {
    start: number  // hours from midnight
    end: number
}

const DAY_NAMES = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat']
const WORKOUT_DURATION = 2.5 // hours
const EVENT_BUFFER = 0.5 // 30 min buffer around events for commute/prep
const FRIEND_SLEEP_START = 5  // after night shift, friend sleeps 05:00
const FRIEND_SLEEP_END = 14   // until ~14:00

function timeToHours(time: string): number {
    const [h, m] = time.split(':').map(Number)
    return h + (m || 0) / 60
}

function hoursToTime(h: number): string {
    const hours = Math.floor(h)
    const mins = Math.round((h - hours) * 60)
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function subtractSlots(free: TimeSlot, busy: TimeSlot[]): TimeSlot[] {
    let slots: TimeSlot[] = [free]
    for (const b of busy) {
        const next: TimeSlot[] = []
        for (const s of slots) {
            if (b.end <= s.start || b.start >= s.end) {
                next.push(s)
            } else {
                if (s.start < b.start) next.push({ start: s.start, end: b.start })
                if (s.end > b.end) next.push({ start: b.end, end: s.end })
            }
        }
        slots = next
    }
    return slots.filter(s => (s.end - s.start) >= WORKOUT_DURATION)
}

export function useWorkoutSuggestions(weekStartDate: Date, cycleStartDate: string | null) {
    const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([])
    const [loading, setLoading] = useState(true)
    const [version, setVersion] = useState(0)

    const weekKey = format(weekStartDate, 'yyyy-MM-dd')

    useEffect(() => {
        const weekStart = new Date(weekKey + 'T00:00:00')
        let cancelled = false

        async function generate() {
            setLoading(true)
            if (!cycleStartDate) {
                if (!cancelled) { setSuggestions([]); setLoading(false) }
                return
            }
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user || cancelled) { if (!cancelled) setLoading(false); return }

                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
                const wkStart = weekKey
                const wkEnd = format(weekEnd, 'yyyy-MM-dd')

                const [friendRes, shiftsRes, eventsRes, nightShiftsRes] = await Promise.all([
                    supabase.from('friend_schedule').select('*').eq('user_id', user.id),
                    supabase.from('work_shifts').select('*').eq('user_id', user.id)
                        .gte('shift_date', wkStart).lte('shift_date', wkEnd),
                    supabase.from('schedule_events').select('*').eq('user_id', user.id)
                        .gte('event_date', wkStart).lte('event_date', wkEnd),
                    supabase.from('friend_night_shifts').select('*').eq('user_id', user.id)
                        .gte('night_shift_date', format(addDays(weekStart, -1), 'yyyy-MM-dd'))
                        .lte('night_shift_date', wkEnd),
                ])

                if (cancelled) return

                const friendSchedule: FriendScheduleEntry[] = friendRes.data || []
                const weekShifts: WorkShift[] = shiftsRes.data || []
                const weekEvents: ScheduleEvent[] = eventsRes.data || []
                const nightShifts = nightShiftsRes.data || []

                const allSuggestions: WorkoutSuggestion[] = []

                for (let i = 0; i < 7; i++) {
                    const day = addDays(weekStart, i)
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const jsDay = getDay(day)
                    const friendDow = jsDay === 0 ? 6 : jsDay - 1
                    const dayNameStr = DAY_NAMES[jsDay]

                    // Check if this is a workout day
                    const cycleDay = getCycleDayForDate(
                        new Date(cycleStartDate + 'T00:00:00'),
                        new Date(dateStr + 'T00:00:00')
                    )
                    if (cycleDay.workoutType === 'REST') continue

                    // ─── Gather busy periods ────────────
                    const busySlots: (TimeSlot & { label?: string })[] = []

                    // 1. Work shifts
                    const dayShifts = weekShifts.filter(s => s.shift_date === dateStr)
                    for (const shift of dayShifts) {
                        busySlots.push({
                            start: timeToHours(shift.start_time),
                            end: timeToHours(shift.end_time),
                            label: `Műszak (${shift.shift_type})`,
                        })
                    }

                    // 2. Events (girlfriend, cooking, etc.) — with buffer
                    const dayEvents = weekEvents.filter(e => e.event_date === dateStr)
                    for (const evt of dayEvents) {
                        if (evt.start_time && evt.end_time) {
                            busySlots.push({
                                start: Math.max(timeToHours(evt.start_time) - EVENT_BUFFER, 0),
                                end: Math.min(timeToHours(evt.end_time) + EVENT_BUFFER, 24),
                                label: evt.title || evt.event_type,
                            })
                        }
                    }

                    // 3. Already has a workout event scheduled? → skip entirely
                    const hasWorkoutEvent = dayEvents.some(e => e.event_type === 'workout')
                    if (hasWorkoutEvent) continue

                    // 4. Friend's classes — block as busy but also use for scoring
                    const friendClasses = friendSchedule.filter(f => f.day_of_week === friendDow)
                    for (const fc of friendClasses) {
                        busySlots.push({
                            start: timeToHours(fc.start_time),
                            end: timeToHours(fc.end_time),
                            label: `Barát órája`,
                        })
                    }

                    // 5. Friend night shift → sleeping 05:00–14:00, block as busy
                    const prevDateStr = format(addDays(day, -1), 'yyyy-MM-dd')
                    const friendSleptToday = nightShifts.some(
                        (ns: any) => ns.night_shift_date === prevDateStr
                    )
                    if (friendSleptToday) {
                        busySlots.push({
                            start: FRIEND_SLEEP_START,
                            end: FRIEND_SLEEP_END,
                            label: 'Barát alszik (éjszakai)',
                        })
                    }

                    // ─── Calculate free slots ────────────
                    // Workout window: 07:00 - 21:00
                    const dayWindow: TimeSlot = { start: 7, end: 21 }
                    const freeSlots = subtractSlots(dayWindow, busySlots)

                    if (freeSlots.length === 0) continue

                    // ─── Score candidate start times within free slots ────────────
                    // Instead of scoring the whole slot, generate candidate starts
                    // every hour so the best time within a large slot wins.
                    interface ScoredSlot {
                        start: number
                        end: number
                        score: number
                        tags: string[]
                        reasons: string[]
                    }

                    const scoredSlots: ScoredSlot[] = []

                    for (const slot of freeSlots) {
                        // Generate candidate start times every hour within slot
                        const candidates: number[] = []
                        for (let t = slot.start; t + WORKOUT_DURATION <= slot.end; t += 1) {
                            candidates.push(t)
                        }
                        // Also add half-hour candidates for key times
                        for (const t of [9.5, 10, 10.5, 14, 14.5, 15]) {
                            if (t >= slot.start && t + WORKOUT_DURATION <= slot.end && !candidates.includes(t)) {
                                candidates.push(t)
                            }
                        }
                        candidates.sort((a, b) => a - b)

                        for (const candidateStart of candidates) {
                            let score = 50 // base score
                            const tags: string[] = []
                            const reasons: string[] = []

                            // Prefer after friend's last class (train together!)
                            if (friendClasses.length > 0) {
                                const lastClassEnd = Math.max(...friendClasses.map(c => timeToHours(c.end_time)))
                                const firstClassStart = Math.min(...friendClasses.map(c => timeToHours(c.start_time)))

                                if (candidateStart >= lastClassEnd && candidateStart <= lastClassEnd + 1) {
                                    score += 30
                                    tags.push('👫 Baráttal együtt')
                                    reasons.push('Barát órái után – együtt edzhettek')
                                } else if (candidateStart >= lastClassEnd) {
                                    score += 15
                                    tags.push('📚 Órák után')
                                } else if (candidateStart + WORKOUT_DURATION <= firstClassStart) {
                                    score += 5
                                    tags.push('🌅 Óra előtt')
                                }
                            } else {
                                // No classes today → more flexibility
                                if (!friendSleptToday) {
                                    tags.push('👫 Barát szabad')
                                    score += 20
                                }
                            }

                            // If friend is sleeping (night shift), prefer afternoon
                            if (friendSleptToday) {
                                if (candidateStart >= 14) {
                                    score += 25
                                    tags.push('🌙 Barát felébredt')
                                    reasons.push('Barát éjszakai után – 14:00 utáni edzés ideális')
                                } else {
                                    score -= 20
                                    tags.push('😴 Barát alszik')
                                    reasons.push('Barát még alszik – egyedül edzés')
                                }
                            }

                            // Prefer mid-morning (10:00–11:00) or early afternoon (14:00–16:00)
                            if (candidateStart >= 10 && candidateStart <= 11) {
                                score += 15
                                reasons.push('Optimális időpont: délelőtt')
                            } else if (candidateStart >= 9 && candidateStart < 10) {
                                score += 8
                                reasons.push('Jó időpont: kora délelőtt')
                            } else if (candidateStart >= 14 && candidateStart <= 16) {
                                score += 12
                                reasons.push('Optimális időpont: kora délután')
                            } else if (candidateStart >= 18) {
                                score += 3
                            }

                            // Penalize very early or very late
                            if (candidateStart < 9) score -= 15
                            if (candidateStart >= 19) score -= 15

                            scoredSlots.push({
                                start: candidateStart,
                                end: candidateStart + WORKOUT_DURATION,
                                score,
                                tags,
                                reasons,
                            })
                        }
                    }

                    // Pick the best slot
                    scoredSlots.sort((a, b) => b.score - a.score)
                    const best = scoredSlots[0]
                    if (!best) continue

                    // Determine confidence level
                    let confidence: 'ideal' | 'good' | 'limited' = 'limited'
                    if (best.score >= 70) confidence = 'ideal'
                    else if (best.score >= 40) confidence = 'good'

                    // Calculate suggested workout time within the slot
                    const workoutStart = best.start
                    const workoutEnd = workoutStart + WORKOUT_DURATION

                    const reason = best.reasons.length > 0
                        ? best.reasons.join(' · ')
                        : 'Szabad időszak a napirendben'

                    const suggestion: WorkoutSuggestion = {
                        date: dateStr,
                        dayName: dayNameStr.charAt(0).toUpperCase() + dayNameStr.slice(1),
                        workoutType: cycleDay.workoutType,
                        weekType: cycleDay.weekType,
                        suggestedStartTime: hoursToTime(workoutStart),
                        suggestedEndTime: hoursToTime(workoutEnd),
                        reason,
                        tags: best.tags,
                        confidence,
                    }

                    allSuggestions.push(suggestion)
                }

                if (!cancelled) {
                    setSuggestions(allSuggestions)
                    setLoading(false)
                }
            } catch (err: any) {
                if (err?.name === 'AbortError' || err?.message?.includes('aborted')) return
                console.error('Workout suggestion error:', err)
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
