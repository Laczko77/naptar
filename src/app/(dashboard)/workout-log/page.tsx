'use client'

import { useState, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { useWorkoutPlans, useWorkoutLogs, useExerciseHistory } from '@/hooks/useWorkoutLog'
import { useWorkoutCycle } from '@/hooks/useCalendarData'
import { getCycleDayForDate, getWorkoutTypeInfo } from '@/lib/workout-cycle'
import SetRecorder from '@/components/workout-log/SetRecorder'
import RestTimer from '@/components/workout-log/RestTimer'
import ExerciseHistory from '@/components/workout-log/ExerciseHistory'
import type { Exercise } from '@/lib/types'

export default function WorkoutLogPage() {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [restTimerConfig, setRestTimerConfig] = useState<{ seconds: number } | null>(null)
    const [historyExercise, setHistoryExercise] = useState<Exercise | null>(null)

    const { plans, loading: plansLoading } = useWorkoutPlans()
    const { logs, loading: logsLoading, createLog, deleteLog } = useWorkoutLogs(selectedDate)
    const { cycle } = useWorkoutCycle()
    const { history, loading: historyLoading } = useExerciseHistory(historyExercise?.id || null)

    const isLoading = plansLoading || logsLoading

    // Determine today's workout based on cycle
    const cycleDay = useMemo(() => {
        if (!cycle) return null
        return getCycleDayForDate(new Date(cycle.cycle_start_date), new Date(selectedDate + 'T00:00:00'))
    }, [cycle, selectedDate])

    const workoutInfo = cycleDay ? getWorkoutTypeInfo(cycleDay.workoutType) : null

    // Get relevant workout plan
    const todayPlan = useMemo(() => {
        if (!cycleDay || cycleDay.workoutType === 'REST') return null
        const workoutName = `${cycleDay.workoutType} ${cycleDay.weekType}`
        return plans.find((p) => p.name.toUpperCase() === workoutName.toUpperCase()) || null
    }, [cycleDay, plans])

    const handleSaveSet = useCallback(async (data: {
        exercise_id: string
        set_number: number
        reps_completed: number
        weight_kg: number
        rir_actual: number | null
    }) => {
        await createLog({
            ...data,
            workout_date: selectedDate,
            notes: null,
        })
    }, [createLog, selectedDate])

    const handleDeleteLog = useCallback(async (id: string) => {
        await deleteLog(id)
    }, [deleteLog])

    const handleStartRest = useCallback((seconds: number) => {
        setRestTimerConfig({ seconds })
    }, [])

    // Calculate workout progress
    const workoutProgress = useMemo(() => {
        if (!todayPlan) return null
        const totalSets = todayPlan.exercises.reduce((sum, e) => sum + e.sets, 0)
        const completedSets = logs.length
        return {
            total: totalSets,
            completed: completedSets,
            percent: totalSets > 0 ? Math.min((completedSets / totalSets) * 100, 100) : 0,
        }
    }, [todayPlan, logs])

    return (
        <div>
            {/* Page Title + Date Picker */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        🏋️ Edzésnapló
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Szettek rögzítése és követése
                    </p>
                </div>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text)',
                        fontSize: '13px',
                        outline: 'none',
                    }}
                />
            </div>

            {/* Loading */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)' }}>
                    ⏳ Betöltés...
                </div>
            ) : (
                <>
                    {/* Today's Workout Info */}
                    {cycleDay && workoutInfo && (
                        <div
                            className="animate-fade-in"
                            style={{
                                padding: '16px 20px',
                                borderRadius: 'var(--radius)',
                                background: workoutInfo.bgColor,
                                border: `1px solid ${workoutInfo.borderColor}`,
                                marginBottom: '20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '28px' }}>{workoutInfo.emoji}</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '16px', color: workoutInfo.color }}>
                                        {cycleDay.workoutType} {cycleDay.weekType}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                        {cycleDay.weekNumber}. hét · {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d. (EEEE)', { locale: hu })}
                                    </div>
                                </div>
                            </div>

                            {/* Progress */}
                            {workoutProgress && (
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: workoutInfo.color }}>
                                        {workoutProgress.completed}/{workoutProgress.total}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>szett kész</div>
                                    <div style={{
                                        width: '100px',
                                        height: '4px',
                                        borderRadius: '2px',
                                        background: 'rgba(255,255,255,0.1)',
                                        marginTop: '6px',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            width: `${workoutProgress.percent}%`,
                                            height: '100%',
                                            borderRadius: '2px',
                                            background: workoutInfo.color,
                                            transition: 'width 0.3s',
                                        }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rest Day */}
                    {cycleDay?.workoutType === 'REST' && (
                        <div
                            className="animate-fade-in"
                            style={{
                                padding: '40px',
                                borderRadius: 'var(--radius)',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>😴</div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Pihenőnap</h3>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                Ma regeneráció! Pihenj eleget, egyél jól, és igyál sok vizet. 💧
                            </p>
                        </div>
                    )}

                    {/* No Plan Found */}
                    {cycleDay && cycleDay.workoutType !== 'REST' && !todayPlan && (
                        <div
                            style={{
                                padding: '30px',
                                borderRadius: 'var(--radius)',
                                background: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                textAlign: 'center',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
                            Nem található edzésterv: {cycleDay.workoutType} {cycleDay.weekType}
                        </div>
                    )}

                    {/* Exercise List with Set Recorders */}
                    {todayPlan && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {todayPlan.exercises.map((exercise) => (
                                <div key={exercise.id}>
                                    <SetRecorder
                                        exercise={exercise}
                                        existingLogs={logs}
                                        onSave={handleSaveSet}
                                        onStartRest={handleStartRest}
                                        onDeleteLog={handleDeleteLog}
                                    />
                                    {/* History Button */}
                                    <button
                                        onClick={() => setHistoryExercise(exercise)}
                                        style={{
                                            marginTop: '4px',
                                            width: '100%',
                                            padding: '6px',
                                            borderRadius: '0 0 8px 8px',
                                            border: '1px solid var(--color-border)',
                                            borderTop: 'none',
                                            background: 'var(--color-bg-tertiary)',
                                            color: 'var(--color-text-secondary)',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#818cf8' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                                    >
                                        📊 Előzmények megtekintése
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Rest Timer (floating) */}
            {restTimerConfig && (
                <RestTimer
                    durationSeconds={restTimerConfig.seconds}
                    onComplete={() => {
                        // Optional: play sound or vibrate
                    }}
                    onDismiss={() => setRestTimerConfig(null)}
                />
            )}

            {/* Exercise History Modal */}
            {historyExercise && (
                <ExerciseHistory
                    exerciseName={historyExercise.name}
                    history={history}
                    loading={historyLoading}
                    onClose={() => setHistoryExercise(null)}
                />
            )}
        </div>
    )
}
