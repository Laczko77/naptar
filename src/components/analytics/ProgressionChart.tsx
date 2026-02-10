'use client'

import type { ExerciseAnalytics } from '@/hooks/useAnalytics'

interface ProgressionChartProps {
    exercise: ExerciseAnalytics
    onClose: () => void
}

export default function ProgressionChart({ exercise, onClose }: ProgressionChartProps) {
    const { weeklyData } = exercise

    const categoryConfig = {
        excellent: { color: '#22c55e', label: 'Kiváló', emoji: '🔥' },
        steady: { color: '#3b82f6', label: 'Stabil', emoji: '📈' },
        plateau: { color: '#f59e0b', label: 'Stagnálás', emoji: '⚠️' },
        regression: { color: '#ef4444', label: 'Visszaesés', emoji: '🔻' },
    }
    const cat = categoryConfig[exercise.category]

    // SVG line chart dimensions
    const chartW = 460
    const chartH = 120
    const padX = 30
    const padY = 15
    const innerW = chartW - padX * 2
    const innerH = chartH - padY * 2

    // Compute line chart points
    function buildLinePath(values: number[]): { path: string; dots: { x: number; y: number; val: number }[] } {
        if (values.length === 0) return { path: '', dots: [] }
        const minV = Math.min(...values) * 0.9
        const maxV = Math.max(...values) * 1.1
        const range = maxV - minV || 1
        const dots = values.map((v, i) => ({
            x: padX + (values.length > 1 ? (i / (values.length - 1)) * innerW : innerW / 2),
            y: padY + innerH - ((v - minV) / range) * innerH,
            val: v,
        }))
        const path = dots.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ')
        return { path, dots }
    }

    const weightLine = buildLinePath(weeklyData.map((w) => w.avgWeight))
    const repsLine = buildLinePath(weeklyData.map((w) => w.avgReps))
    const volumeLine = buildLinePath(weeklyData.map((w) => w.volumeLoad))

    // Moving average for volume
    function movingAvg(values: number[], window: number = 3): number[] {
        return values.map((_, i) => {
            const start = Math.max(0, i - window + 1)
            const slice = values.slice(start, i + 1)
            return slice.reduce((a, b) => a + b, 0) / slice.length
        })
    }
    const volumeAvgLine = buildLinePath(movingAvg(weeklyData.map((w) => w.volumeLoad)))

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

                {/* Weight + Reps Line Chart */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#818cf8' }}>● Súly (kg)</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e' }}>● Ismétlés</span>
                    </div>
                    <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: '8px', padding: '8px', overflow: 'hidden' }}>
                        <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ display: 'block' }}>
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                                <line key={i} x1={padX} x2={chartW - padX} y1={padY + innerH * (1 - pct)} y2={padY + innerH * (1 - pct)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            ))}

                            {/* Weight line */}
                            <path d={weightLine.path} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            {weightLine.dots.map((d, i) => (
                                <g key={`w${i}`}>
                                    <circle cx={d.x} cy={d.y} r="4" fill="#818cf8" />
                                    <text x={d.x} y={d.y - 8} fill="#818cf8" fontSize="8" textAnchor="middle" fontWeight="600">
                                        {d.val}
                                    </text>
                                </g>
                            ))}

                            {/* Reps line */}
                            <path d={repsLine.path} fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round" />
                            {repsLine.dots.map((d, i) => (
                                <g key={`r${i}`}>
                                    <circle cx={d.x} cy={d.y} r="3" fill="#22c55e" />
                                    <text x={d.x} y={d.y + 14} fill="#22c55e" fontSize="8" textAnchor="middle">
                                        {d.val}
                                    </text>
                                </g>
                            ))}

                            {/* Week labels */}
                            {weeklyData.map((w, i) => {
                                const x = padX + (weeklyData.length > 1 ? (i / (weeklyData.length - 1)) * innerW : innerW / 2)
                                return (
                                    <text key={i} x={x} y={chartH - 2} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">
                                        {w.week}
                                    </text>
                                )
                            })}
                        </svg>
                    </div>
                </div>

                {/* Volume Load Line Chart with Moving Average */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: cat.color }}>● Volume Load</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>── Mozgóátlag</span>
                    </div>
                    <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: '8px', padding: '8px', overflow: 'hidden' }}>
                        <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} style={{ display: 'block' }}>
                            {/* Grid */}
                            {[0, 0.5, 1].map((pct, i) => (
                                <line key={i} x1={padX} x2={chartW - padX} y1={padY + innerH * (1 - pct)} y2={padY + innerH * (1 - pct)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            ))}

                            {/* Moving average line */}
                            <path d={volumeAvgLine.path} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />

                            {/* Volume line */}
                            <path d={volumeLine.path} fill="none" stroke={cat.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            {volumeLine.dots.map((d, i) => (
                                <g key={`v${i}`}>
                                    <circle cx={d.x} cy={d.y} r="4" fill={cat.color} />
                                    <text x={d.x} y={d.y - 8} fill={cat.color} fontSize="8" textAnchor="middle" fontWeight="600">
                                        {d.val}
                                    </text>
                                </g>
                            ))}

                            {/* Week labels */}
                            {weeklyData.map((w, i) => {
                                const x = padX + (weeklyData.length > 1 ? (i / (weeklyData.length - 1)) * innerW : innerW / 2)
                                return (
                                    <text key={i} x={x} y={chartH - 2} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle">
                                        {w.week}
                                    </text>
                                )
                            })}
                        </svg>
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
