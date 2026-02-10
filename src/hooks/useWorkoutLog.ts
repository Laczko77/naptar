'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import type { WorkoutPlan, Exercise, WorkoutLog } from '@/lib/types'

const supabase = createClient()

// ─── Workout Plans + Exercises ───────────────

export function useWorkoutPlans() {
    const [plans, setPlans] = useState<(WorkoutPlan & { exercises: Exercise[] })[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: plansData } = await supabase
                .from('workout_plan')
                .select('*')
                .eq('user_id', user.id)
                .order('week_type')
                .order('order_in_cycle')

            if (!plansData) { setLoading(false); return }

            const { data: exercisesData } = await supabase
                .from('exercises')
                .select('*')
                .in('workout_plan_id', plansData.map((p) => p.id))
                .order('order_index')

            const combined = plansData.map((plan) => ({
                ...plan,
                exercises: (exercisesData || []).filter((e) => e.workout_plan_id === plan.id),
            }))

            setPlans(combined)
            setLoading(false)
        }
        fetch()
    }, [])

    return { plans, loading }
}

// ─── Workout Logs ────────────────────────────

export function useWorkoutLogs(date?: string) {
    const [logs, setLogs] = useState<WorkoutLog[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        let query = supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('workout_date', { ascending: false })
            .order('created_at', { ascending: true })

        if (date) {
            query = query.eq('workout_date', date)
        } else {
            query = query.limit(200)
        }

        const { data, error } = await query
        if (!error && data) setLogs(data)
        setLoading(false)
    }, [date])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    const createLog = async (log: {
        exercise_id: string
        workout_date: string
        set_number: number
        reps_completed: number
        weight_kg: number
        rir_actual: number | null
        notes: string | null
    }) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase
            .from('workout_logs')
            .insert({ ...log, user_id: user.id })
            .select()
            .single()

        if (!error && data) {
            setLogs((prev) => [...prev, data])
        }
        return { data, error }
    }

    const deleteLog = async (id: string) => {
        const { error } = await supabase
            .from('workout_logs')
            .delete()
            .eq('id', id)

        if (!error) {
            setLogs((prev) => prev.filter((l) => l.id !== id))
        }
        return { error }
    }

    return { logs, loading, createLog, deleteLog, refetch: fetchLogs }
}

// ─── Exercise History ────────────────────────

export function useExerciseHistory(exerciseId: string | null) {
    const [history, setHistory] = useState<WorkoutLog[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!exerciseId) { setHistory([]); return }

        const fetch = async () => {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', user.id)
                .eq('exercise_id', exerciseId)
                .order('workout_date', { ascending: false })
                .order('set_number')
                .limit(50)

            if (data) setHistory(data)
            setLoading(false)
        }
        fetch()
    }, [exerciseId])

    return { history, loading }
}
