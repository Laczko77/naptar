'use client'

import type { ExerciseAnalytics } from '@/hooks/useAnalytics'

interface ProgressionChartProps {
    exercise: ExerciseAnalytics
    onClose: () => void
}

export default function ProgressionChart({ exercise, onClose }: ProgressionChartProps) {
    const { weeklyData } = exercise
    const maxVolume = Math.max(...weeklyData.map((w) => w.volumeLoad), 1)
    const maxWeight = Math.max(...weeklyData.map((w) => w.maxWeight), 1)

    const categoryConfig = {
        excellent: { color: '#22c55e', label: 'Kiváló', emoji: '🔥' },
        steady: { color: '#3b82f6', label: 'Stabil', emoji: '📈' },
        plateau: { color: '#f59e0b', label: 'Stagnálás', emoji: '⚠️' },
        regression: { color: '#ef4444', label: 'Visszaesés', emoji: '🔻' },
    }
    const cat = categoryConfig[exercise.category]

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
                    maxWidth: '560px',
                    padding: '28px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{exercise.exercise.name}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {exercise.planName} · {exercise.totalSets} szett rögzítve
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            border: '1px solid var(--color-border)', background: 'transparent',
                            color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '14px',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Category Badge */}
                <div style={{
                    padding: '10px 14px', borderRadius: '8px', marginBottom: '20px',
                    background: `${cat.color}15`, border: `1px solid ${cat.color}30`,
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <span style={{ fontSize: '20px' }}>{cat.emoji}</span>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: cat.color }}>
                            {cat.label} · {exercise.improvementPct > 0 ? '+' : ''}{exercise.improvementPct}%
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {exercise.recommendation}
                        </div>
                    </div>
                </div>

                {/* Volume Load Chart */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Heti Volume Load (szett × ism × súly)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end', gap: '4px', height: '80px' }}>
                        {weeklyData.map((w, i) => {
                            const heightPct = (w.volumeLoad / maxVolume) * 100
                            const isLast = i === weeklyData.length - 1
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>
                                        {w.volumeLoad}
                                    </span>
                                    <div
                                        title={`${w.week}: ${w.volumeLoad} VL`}
                                        style={{
                                            width: '100%',
                                            height: `${Math.max(heightPct, 5)}%`,
                                            borderRadius: '4px 4px 0 0',
                                            background: isLast ? cat.color : `${cat.color}40`,
                                            transition: 'height 0.4s ease-out',
                                        }}
                                    />
                                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{w.week}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Weight Trend */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Max. súly trend (kg)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end', gap: '4px', height: '60px' }}>
                        {weeklyData.map((w, i) => {
                            const heightPct = (w.maxWeight / maxWeight) * 100
                            const isLast = i === weeklyData.length - 1
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{w.maxWeight}</span>
                                    <div
                                        style={{
                                            width: '100%',
                                            height: `${Math.max(heightPct, 5)}%`,
                                            borderRadius: '4px 4px 0 0',
                                            background: isLast ? '#818cf8' : 'rgba(129, 140, 248, 0.3)',
                                            transition: 'height 0.4s ease-out',
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                        { label: 'Utolsó súly', value: `${exercise.latestWeight} kg`, color: '#818cf8' },
                        { label: 'Utolsó ism.', value: `${exercise.latestReps}`, color: '#22c55e' },
                        { label: 'Trend', value: `${exercise.improvementPct > 0 ? '+' : ''}${exercise.improvementPct}%`, color: cat.color },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{
                            padding: '10px', borderRadius: '8px', background: 'var(--color-bg-tertiary)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{label}</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color }}>{value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
