'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import type { WorkShift } from '@/lib/types'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    subDays,
    parseISO,
    differenceInCalendarDays,
} from 'date-fns'

const supabase = createClient()

export function useWorkShiftsCRUD(monthDate: Date) {
    const [shifts, setShifts] = useState<WorkShift[]>([])
    const [loading, setLoading] = useState(true)

    const fetchShifts = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
        const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')

        const { data, error } = await supabase
            .from('work_shifts')
            .select('*')
            .eq('user_id', user.id)
            .gte('shift_date', start)
            .lte('shift_date', end)
            .order('shift_date')
            .order('start_time')

        if (!error && data) setShifts(data)
        setLoading(false)
    }, [monthDate])

    useEffect(() => { fetchShifts() }, [fetchShifts])

    const createShift = async (shift: {
        shift_date: string
        start_time: string
        end_time: string
        duration_hours: number
        shift_type: 'délelőtt' | 'délután' | 'hétvége'
    }) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('work_shifts')
            .insert({ ...shift, user_id: user.id })
            .select()
            .single()

        if (!error && data) {
            setShifts((prev) => [...prev, data].sort((a, b) => a.shift_date.localeCompare(b.shift_date)))
        }
        return { data, error }
    }

    const updateShift = async (id: string, updates: Partial<WorkShift>) => {
        const { data, error } = await supabase
            .from('work_shifts')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (!error && data) {
            setShifts((prev) => prev.map((s) => (s.id === id ? data : s)))
        }
        return { data, error }
    }

    const deleteShift = async (id: string) => {
        const { error } = await supabase
            .from('work_shifts')
            .delete()
            .eq('id', id)

        if (!error) {
            setShifts((prev) => prev.filter((s) => s.id !== id))
        }
        return { error }
    }

    // ─── Stats ─────────────────────────────────

    const stats = useMemo(() => {
        const totalHours = shifts.reduce((sum, s) => sum + (Number(s.duration_hours) || 0), 0)
        const monthlyTarget = 60

        const byType: Record<string, number> = { 'délelőtt': 0, 'délután': 0, 'hétvége': 0 }
        shifts.forEach((s) => {
            if (s.shift_type && byType[s.shift_type] !== undefined) {
                byType[s.shift_type] += Number(s.duration_hours) || 0
            }
        })

        // Weekly breakdown
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)
        const weeks: { weekLabel: string; hours: number; startDate: Date }[] = []
        let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 })

        while (weekStart <= monthEnd) {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
            const weekShifts = shifts.filter((s) => {
                const d = s.shift_date
                return d >= format(weekStart, 'yyyy-MM-dd') && d <= format(weekEnd, 'yyyy-MM-dd')
            })
            const weekHours = weekShifts.reduce((sum, s) => sum + (Number(s.duration_hours) || 0), 0)
            weeks.push({
                weekLabel: `${format(weekStart, 'MM.dd')} - ${format(weekEnd, 'MM.dd')}`,
                hours: weekHours,
                startDate: weekStart,
            })
            weekStart = addDays(weekEnd, 1)
        }

        return {
            totalHours,
            monthlyTarget,
            progress: Math.min((totalHours / monthlyTarget) * 100, 100),
            remaining: Math.max(monthlyTarget - totalHours, 0),
            byType,
            weeks,
            shiftCount: shifts.length,
        }
    }, [shifts, monthDate])

    return { shifts, loading, stats, createShift, updateShift, deleteShift, refetch: fetchShifts }
}
