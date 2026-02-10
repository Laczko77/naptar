'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useMemo } from 'react'
import type { WorkoutLog, WorkoutPlan, Exercise } from '@/lib/types'
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns'

const supabase = createClient()

export type ProgressionCategory = 'excellent' | 'steady' | 'plateau' | 'regression'

export interface ExerciseAnalytics {
    exercise: Exercise
    planName: string
    weeklyData: { week: string; avgWeight: number; avgReps: number; volumeLoad: number; maxWeight: number }[]
    category: ProgressionCategory
    improvementPct: number
    recommendation: string
    totalSets: number
    latestWeight: number
    latestReps: number
}

export function useAnalytics(weeks: number = 6) {
    const [analytics, setAnalytics] = useState<ExerciseAnalytics[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setLoading(false); return }

            // Fetch plans + exercises
            const { data: plans } = await supabase
                .from('workout_plan')
                .select('*')
                .eq('user_id', user.id)

            if (!plans) { setLoading(false); return }

            const { data: exercises } = await supabase
                .from('exercises')
                .select('*')
                .in('workout_plan_id', plans.map((p) => p.id))
                .order('order_index')

            if (!exercises) { setLoading(false); return }

            // Fetch logs for last N weeks
            const since = format(subWeeks(new Date(), weeks), 'yyyy-MM-dd')
            const { data: logs } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('workout_date', since)
                .order('workout_date')
                .order('set_number')

            if (!logs) { setLoading(false); return }

            // Analyze each exercise
            const results: ExerciseAnalytics[] = exercises.map((exercise) => {
                const plan = plans.find((p) => p.id === exercise.workout_plan_id)
                const exLogs = logs.filter((l) => l.exercise_id === exercise.id)

                // Group by week
                const weekMap: Record<string, WorkoutLog[]> = {}
                exLogs.forEach((log) => {
                    const d = new Date(log.workout_date + 'T00:00:00')
                    const ws = format(startOfWeek(d, { weekStartsOn: 1 }), 'MM.dd')
                    if (!weekMap[ws]) weekMap[ws] = []
                    weekMap[ws].push(log)
                })

                const weeklyData = Object.entries(weekMap).map(([week, wLogs]) => {
                    const weights = wLogs.map((l) => Number(l.weight_kg) || 0)
                    const reps = wLogs.map((l) => Number(l.reps_completed) || 0)
                    const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0
                    const avgReps = reps.length > 0 ? reps.reduce((a, b) => a + b, 0) / reps.length : 0
                    const volumeLoad = wLogs.reduce((sum, l) => sum + (Number(l.weight_kg) || 0) * (Number(l.reps_completed) || 0), 0)
                    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0
                    return { week, avgWeight: Math.round(avgWeight * 10) / 10, avgReps: Math.round(avgReps * 10) / 10, volumeLoad: Math.round(volumeLoad), maxWeight }
                })

                // Calculate trend (simple linear regression on volume)
                let category: ProgressionCategory = 'plateau'
                let improvementPct = 0
                if (weeklyData.length >= 2) {
                    const first = weeklyData[0].volumeLoad
                    const last = weeklyData[weeklyData.length - 1].volumeLoad
                    if (first > 0) {
                        improvementPct = Math.round(((last - first) / first) * 100)
                    }
                    if (improvementPct > 10) category = 'excellent'
                    else if (improvementPct > 0) category = 'steady'
                    else if (improvementPct === 0) category = 'plateau'
                    else category = 'regression'
                }

                // Generate recommendation
                const recommendation = getRecommendation(category, exercise.name)

                const latest = exLogs[exLogs.length - 1]

                return {
                    exercise,
                    planName: plan?.name || '',
                    weeklyData,
                    category,
                    improvementPct,
                    recommendation,
                    totalSets: exLogs.length,
                    latestWeight: Number(latest?.weight_kg) || 0,
                    latestReps: Number(latest?.reps_completed) || 0,
                }
            }).filter((a) => a.totalSets > 0) // Only show exercises with data

            // Sort: best progression first
            results.sort((a, b) => b.improvementPct - a.improvementPct)
            setAnalytics(results)
            setLoading(false)
        }
        fetch()
    }, [weeks])

    // Summary stats
    const summary = useMemo(() => {
        const total = analytics.length
        const excellent = analytics.filter((a) => a.category === 'excellent').length
        const steady = analytics.filter((a) => a.category === 'steady').length
        const plateau = analytics.filter((a) => a.category === 'plateau').length
        const regression = analytics.filter((a) => a.category === 'regression').length
        const avgImprovement = total > 0 ? Math.round(analytics.reduce((s, a) => s + a.improvementPct, 0) / total) : 0
        return { total, excellent, steady, plateau, regression, avgImprovement }
    }, [analytics])

    return { analytics, summary, loading }
}

function getRecommendation(category: ProgressionCategory, name: string): string {
    switch (category) {
        case 'excellent':
            return `🔥 Kiváló fejlődés! A ${name} gyakorlatnál töretlenül nő a terhelés. Tartsd fenn az iramot!`
        case 'steady':
            return `📈 Stabil fejlődés. Lassan de biztosan haladsz a ${name} gyakorlatban. Próbálj minden héten egy kicsivel többet!`
        case 'plateau':
            return `⚠️ Stagnálás a ${name} gyakorlatban. Próbálj változtatni: más szettszám, tempó, vagy RIR csökkentés.`
        case 'regression':
            return `🔻 Visszaesés a ${name} gyakorlatban. Ellenőrizd a regenerációt, alvást, vagy fontold meg a deload hetet.`
    }
}
