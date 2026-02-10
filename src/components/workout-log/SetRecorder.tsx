'use client'

import { useState } from 'react'
import type { Exercise, WorkoutLog } from '@/lib/types'

interface SetRecorderProps {
    exercise: Exercise
    existingLogs: WorkoutLog[]
    onSave: (data: {
        exercise_id: string
        set_number: number
        reps_completed: number
        weight_kg: number
        rir_actual: number | null
    }) => Promise<void>
    onStartRest: (seconds: number) => void
    onDeleteLog: (id: string) => void
}

export default function SetRecorder({
    exercise,
    existingLogs,
    onSave,
    onStartRest,
    onDeleteLog,
}: SetRecorderProps) {
    const exerciseLogs = existingLogs
        .filter((l) => l.exercise_id === exercise.id)
        .sort((a, b) => a.set_number - b.set_number)

    const nextSetNumber = exerciseLogs.length + 1
    const lastLog = exerciseLogs[exerciseLogs.length - 1]

    const [reps, setReps] = useState(lastLog?.reps_completed?.toString() || '')
    const [weight, setWeight] = useState(lastLog?.weight_kg?.toString() || '')
    const [rir, setRir] = useState(lastLog?.rir_actual?.toString() || '')
    const [saving, setSaving] = useState(false)

    const allSetsComplete = exerciseLogs.length >= exercise.sets

    const handleSave = async () => {
        if (!reps || !weight) return
        setSaving(true)
        await onSave({
            exercise_id: exercise.id,
            set_number: nextSetNumber,
            reps_completed: parseInt(reps),
            weight_kg: parseFloat(weight),
            rir_actual: rir ? parseInt(rir) : null,
        })
        setSaving(false)
        // Auto-start rest timer
        if (exercise.rest_seconds) {
            onStartRest(exercise.rest_seconds)
        }
    }

    return (
        <div
            style={{
                padding: '16px',
                borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
            }}
        >
            {/* Exercise Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700 }}>{exercise.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {exercise.sets} × {exercise.reps} · RIR {exercise.rir ?? '–'} · Pihenő {exercise.rest_seconds}s
                    </p>
                </div>
                <span
                    style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: allSetsComplete ? 'rgba(34, 197, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: allSetsComplete ? '#22c55e' : '#818cf8',
                    }}
                >
                    {exerciseLogs.length}/{exercise.sets}
                </span>
            </div>

            {/* Completed Sets Table */}
            {exerciseLogs.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 1fr 60px 40px',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: 'var(--color-text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            padding: '0 4px 6px',
                        }}
                    >
                        <span>Szett</span>
                        <span>Súly</span>
                        <span>Ism.</span>
                        <span>RIR</span>
                        <span></span>
                    </div>
                    {exerciseLogs.map((log) => (
                        <div
                            key={log.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 1fr 1fr 60px 40px',
                                gap: '4px',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                fontSize: '13px',
                                alignItems: 'center',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{log.set_number}</span>
                            <span style={{ fontWeight: 600 }}>{log.weight_kg} kg</span>
                            <span>{log.reps_completed} ism</span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>{log.rir_actual ?? '–'}</span>
                            <button
                                onClick={() => onDeleteLog(log.id)}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    opacity: 0.5,
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#f87171' }}
                                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* New Set Input */}
            {!allSetsComplete && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '3px' }}>
                            Súly (kg)
                        </label>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="0"
                            step="0.5"
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text)',
                                fontSize: '14px',
                                outline: 'none',
                                textAlign: 'center',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '3px' }}>
                            Ismétlés
                        </label>
                        <input
                            type="number"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            placeholder="0"
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text)',
                                fontSize: '14px',
                                outline: 'none',
                                textAlign: 'center',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                        />
                    </div>
                    <div style={{ width: '60px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '3px' }}>
                            RIR
                        </label>
                        <input
                            type="number"
                            value={rir}
                            onChange={(e) => setRir(e.target.value)}
                            placeholder="–"
                            min="0"
                            max="5"
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text)',
                                fontSize: '14px',
                                outline: 'none',
                                textAlign: 'center',
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || !reps || !weight}
                        className="gradient-accent"
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: saving || !reps || !weight ? 'not-allowed' : 'pointer',
                            opacity: saving || !reps || !weight ? 0.5 : 1,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {saving ? '...' : `${nextSetNumber}. szett ✓`}
                    </button>
                </div>
            )}

            {/* All Sets Complete */}
            {allSetsComplete && (
                <div style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: '#22c55e',
                    fontWeight: 600,
                }}>
                    ✅ Minden szett teljesítve!
                </div>
            )}
        </div>
    )
}
