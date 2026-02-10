'use client'

import type { WorkoutLog } from '@/lib/types'
import { format } from 'date-fns'

interface ExerciseHistoryProps {
    exerciseName: string
    history: WorkoutLog[]
    loading: boolean
    onClose: () => void
}

export default function ExerciseHistory({ exerciseName, history, loading, onClose }: ExerciseHistoryProps) {
    // Group by date
    const grouped: Record<string, WorkoutLog[]> = {}
    history.forEach((log) => {
        if (!grouped[log.workout_date]) grouped[log.workout_date] = []
        grouped[log.workout_date].push(log)
    })
    const dates = Object.keys(grouped).sort().reverse()

    // Calculate progression
    const getMaxWeight = (logs: WorkoutLog[]) => Math.max(...logs.map((l) => Number(l.weight_kg) || 0))
    const maxWeights = dates.map((d) => ({ date: d, max: getMaxWeight(grouped[d]) }))
    const overallMax = maxWeights.length > 0 ? Math.max(...maxWeights.map((m) => m.max)) : 0

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                className="animate-fade-in"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '520px',
                    maxHeight: '80vh',
                    padding: '28px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>📊 {exerciseName}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            Előzmények · Max: {overallMax} kg
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'transparent',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                        ⏳ Betöltés...
                    </div>
                ) : dates.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                        Még nincs rögzített szett ehhez a gyakorlathoz.
                    </div>
                ) : (
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {/* Mini Bar Chart */}
                        {maxWeights.length > 1 && (
                            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'var(--color-bg-tertiary)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                    Súly trend (max/edzés)
                                </div>
                                <div style={{ display: 'flex', alignItems: 'end', gap: '3px', height: '50px' }}>
                                    {maxWeights.slice(-12).reverse().map((mw, i) => {
                                        const heightPct = overallMax > 0 ? (mw.max / overallMax) * 100 : 0
                                        return (
                                            <div
                                                key={i}
                                                title={`${mw.date}: ${mw.max} kg`}
                                                style={{
                                                    flex: 1,
                                                    height: `${Math.max(heightPct, 5)}%`,
                                                    borderRadius: '3px 3px 0 0',
                                                    background: i === 0 ? '#6366f1' : 'rgba(99, 102, 241, 0.3)',
                                                    transition: 'height 0.3s',
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* History by Date */}
                        {dates.slice(0, 10).map((date) => (
                            <div key={date} style={{ marginBottom: '12px' }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: '6px',
                                    padding: '4px 0',
                                    borderBottom: '1px solid var(--color-border)',
                                }}>
                                    {format(new Date(date + 'T00:00:00'), 'yyyy.MM.dd.')}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px', gap: '4px', fontSize: '13px' }}>
                                    {grouped[date].sort((a, b) => a.set_number - b.set_number).map((log) => (
                                        <div
                                            key={log.id}
                                            style={{
                                                display: 'contents',
                                            }}
                                        >
                                            <span style={{ color: 'var(--color-text-secondary)' }}>{log.set_number}.</span>
                                            <span style={{ fontWeight: 600 }}>{log.weight_kg} kg</span>
                                            <span>{log.reps_completed} ism</span>
                                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                                                RIR {log.rir_actual ?? '–'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
