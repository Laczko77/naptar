'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import type {
    WorkoutCycleState,
    ScheduleEvent,
    WorkShift,
    FriendScheduleEntry,
    FriendNightShift,
} from '@/lib/types'
import { format, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns'

const supabase = createClient()

// ─── Workout Cycle ───────────────────────────

export function useWorkoutCycle() {
    const [cycle, setCycle] = useState<WorkoutCycleState | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchCycle = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('workout_cycle')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!error && data) setCycle(data)
        setLoading(false)
    }, [])

    useEffect(() => { fetchCycle() }, [fetchCycle])

    return { cycle, loading, refetch: fetchCycle }
}

// ─── Schedule Events ─────────────────────────

export function useScheduleEvents(monthDate: Date) {
    const [events, setEvents] = useState<ScheduleEvent[]>([])
    const [loading, setLoading] = useState(true)

    const fetchEvents = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const start = format(subDays(startOfMonth(monthDate), 7), 'yyyy-MM-dd')
        const end = format(addDays(endOfMonth(monthDate), 7), 'yyyy-MM-dd')

        const { data, error } = await supabase
            .from('schedule_events')
            .select('*')
            .eq('user_id', user.id)
            .gte('event_date', start)
            .lte('event_date', end)
            .order('event_date')
            .order('start_time')

        if (!error && data) setEvents(data)
        setLoading(false)
    }, [monthDate])

    useEffect(() => { fetchEvents() }, [fetchEvents])

    const createEvent = async (event: Omit<ScheduleEvent, 'id' | 'user_id' | 'created_at'>) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('schedule_events')
            .insert({ ...event, user_id: user.id })
            .select()
            .single()

        if (!error && data) {
            setEvents((prev) => [...prev, data].sort((a, b) => a.event_date.localeCompare(b.event_date)))
        }
        return { data, error }
    }

    const updateEvent = async (id: string, updates: Partial<ScheduleEvent>) => {
        const { data, error } = await supabase
            .from('schedule_events')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (!error && data) {
            setEvents((prev) => prev.map((e) => (e.id === id ? data : e)))
        }
        return { data, error }
    }

    const deleteEvent = async (id: string) => {
        const { error } = await supabase
            .from('schedule_events')
            .delete()
            .eq('id', id)

        if (!error) {
            setEvents((prev) => prev.filter((e) => e.id !== id))
        }
        return { error }
    }

    return { events, loading, createEvent, updateEvent, deleteEvent, refetch: fetchEvents }
}

// ─── Work Shifts ─────────────────────────────

export function useWorkShifts(monthDate: Date) {
    const [shifts, setShifts] = useState<WorkShift[]>([])
    const [loading, setLoading] = useState(true)

    const fetchShifts = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const start = format(subDays(startOfMonth(monthDate), 7), 'yyyy-MM-dd')
        const end = format(addDays(endOfMonth(monthDate), 7), 'yyyy-MM-dd')

        const { data, error } = await supabase
            .from('work_shifts')
            .select('*')
            .eq('user_id', user.id)
            .gte('shift_date', start)
            .lte('shift_date', end)
            .order('shift_date')

        if (!error && data) setShifts(data)
        setLoading(false)
    }, [monthDate])

    useEffect(() => { fetchShifts() }, [fetchShifts])

    return { shifts, loading, refetch: fetchShifts }
}

// ─── Friend Schedule ─────────────────────────

export function useFriendSchedule() {
    const [schedule, setSchedule] = useState<FriendScheduleEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('friend_schedule')
                .select('*')
                .eq('user_id', user.id)
                .order('day_of_week')
                .order('start_time')

            if (!error && data) setSchedule(data)
            setLoading(false)
        }
        fetch()
    }, [])

    return { schedule, loading }
}

// ─── Friend Night Shifts ─────────────────────

export function useFriendNightShifts(monthDate: Date) {
    const [nightShifts, setNightShifts] = useState<FriendNightShift[]>([])
    const [loading, setLoading] = useState(true)

    const fetchNightShifts = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const start = format(subDays(startOfMonth(monthDate), 7), 'yyyy-MM-dd')
        const end = format(addDays(endOfMonth(monthDate), 7), 'yyyy-MM-dd')

        const { data, error } = await supabase
            .from('friend_night_shifts')
            .select('*')
            .eq('user_id', user.id)
            .gte('night_shift_date', start)
            .lte('night_shift_date', end)
            .order('night_shift_date')

        if (!error && data) setNightShifts(data)
        setLoading(false)
    }, [monthDate])

    useEffect(() => { fetchNightShifts() }, [fetchNightShifts])

    const createNightShift = async (nightShiftDate: string, notes?: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('friend_night_shifts')
            .insert({
                user_id: user.id,
                night_shift_date: nightShiftDate,
                notes: notes || null,
            })
            .select()
            .single()

        if (!error && data) {
            setNightShifts((prev) => [...prev, data].sort((a, b) => a.night_shift_date.localeCompare(b.night_shift_date)))
        }
        return { data, error }
    }

    const deleteNightShift = async (id: string) => {
        const { error } = await supabase
            .from('friend_night_shifts')
            .delete()
            .eq('id', id)

        if (!error) {
            setNightShifts((prev) => prev.filter((ns) => ns.id !== id))
        }
        return { error }
    }

    return { nightShifts, loading, createNightShift, deleteNightShift, refetch: fetchNightShifts }
}
