'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useCallback } from 'react'
import type { ScheduleEvent, WorkShift, FriendScheduleEntry, FriendNightShift } from '@/lib/types'
import { format, getDay, subDays } from 'date-fns'

const supabase = createClient()

export interface Conflict {
    type: 'shift' | 'event' | 'friend_class' | 'friend_sleeping'
    severity: 'warning' | 'error'
    description: string
    emoji: string
}

interface TimeSlot {
    start: string // HH:mm
    end: string   // HH:mm
}

function timesOverlap(a: TimeSlot, b: TimeSlot): boolean {
    return a.start < b.end && a.end > b.start
}

export function useConflictDetection() {
    const [checking, setChecking] = useState(false)

    const checkConflicts = useCallback(async (
        date: string,       // yyyy-MM-dd
        startTime: string,  // HH:mm
        endTime: string,    // HH:mm
        type: 'event' | 'shift',
        excludeId?: string, // exclude current item when editing
    ): Promise<Conflict[]> => {
        setChecking(true)
        const conflicts: Conflict[] = []

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return []

            const newSlot: TimeSlot = { start: startTime, end: endTime }

            // 1. Check against existing work shifts
            const { data: shifts } = await supabase
                .from('work_shifts')
                .select('*')
                .eq('user_id', user.id)
                .eq('shift_date', date)

            if (shifts) {
                for (const shift of shifts) {
                    if (excludeId && shift.id === excludeId) continue
                    if (timesOverlap(newSlot, { start: shift.start_time, end: shift.end_time })) {
                        conflicts.push({
                            type: 'shift',
                            severity: 'error',
                            description: `Ütközik egy műszakkal (${shift.start_time.slice(0, 5)} - ${shift.end_time.slice(0, 5)})`,
                            emoji: '💼',
                        })
                    }
                }
            }

            // 2. Check against existing events
            const { data: events } = await supabase
                .from('schedule_events')
                .select('*')
                .eq('user_id', user.id)
                .eq('event_date', date)

            if (events) {
                for (const event of events) {
                    if (excludeId && event.id === excludeId) continue
                    if (timesOverlap(newSlot, { start: event.start_time, end: event.end_time })) {
                        const label = event.title || (event.event_type === 'workout' ? 'Edzés' : event.event_type === 'girlfriend' ? 'Barátnő' : event.event_type === 'cooking' ? 'Főzés' : 'Esemény')
                        conflicts.push({
                            type: 'event',
                            severity: 'warning',
                            description: `Ütközik: "${label}" (${event.start_time.slice(0, 5)} - ${event.end_time.slice(0, 5)})`,
                            emoji: event.event_type === 'workout' ? '🏋️' : event.event_type === 'girlfriend' ? '❤️' : event.event_type === 'cooking' ? '🍳' : '📌',
                        })
                    }
                }
            }

            // 3. Check against friend's university schedule
            const dateObj = new Date(date + 'T00:00:00')
            const dayOfWeek = getDay(dateObj)
            // Convert JS Sunday=0 to our Monday=0 format
            const friendDow = dayOfWeek === 0 ? 6 : dayOfWeek - 1

            const { data: friendClasses } = await supabase
                .from('friend_schedule')
                .select('*')
                .eq('user_id', user.id)
                .eq('day_of_week', friendDow)

            if (friendClasses && type === 'event') {
                // Only warn about friend conflicts for events (especially workouts)
                for (const fc of friendClasses) {
                    if (!fc.is_available && timesOverlap(newSlot, { start: fc.start_time, end: fc.end_time })) {
                        conflicts.push({
                            type: 'friend_class',
                            severity: 'warning',
                            description: `Barát órája: "${fc.event_name}" (${fc.start_time.slice(0, 5)} - ${fc.end_time.slice(0, 5)})`,
                            emoji: '🎓',
                        })
                    }
                }
            }

            // 4. Check friend night shift (previous day → morning blocked)
            const prevDate = format(subDays(dateObj, 1), 'yyyy-MM-dd')
            const { data: nightShifts } = await supabase
                .from('friend_night_shifts')
                .select('*')
                .eq('user_id', user.id)
                .eq('night_shift_date', prevDate)

            if (nightShifts && nightShifts.length > 0 && type === 'event') {
                const sleepEnd = nightShifts[0].sleep_until || '14:00'
                if (timesOverlap(newSlot, { start: '07:00', end: sleepEnd })) {
                    conflicts.push({
                        type: 'friend_sleeping',
                        severity: 'warning',
                        description: `Barát alszik éjszakai műszak után (07:00 - ${sleepEnd.slice(0, 5)})`,
                        emoji: '😴',
                    })
                }
            }
        } finally {
            setChecking(false)
        }

        return conflicts
    }, [])

    return { checkConflicts, checking }
}
