'use client'

import { useState } from 'react'
import { useAnalytics, type ExerciseAnalytics } from '@/hooks/useAnalytics'
import ProgressionChart from '@/components/analytics/ProgressionChart'

export default function AnalyticsPage() {
    const [weeks, setWeeks] = useState(6)
    const { analytics, summary, loading } = useAnalytics(weeks)
    const [selectedExercise, setSelectedExercise] = useState<ExerciseAnalytics | null>(null)

    const categoryConfig = {
        excellent: { color: '#22c55e', label: 'Kiváló', emoji: '🔥', bg: 'rgba(34, 197, 94, 0.1)' },
        steady: { color: '#3b82f6', label: 'Stabil', emoji: '📈', bg: 'rgba(59, 130, 246, 0.1)' },
        plateau: { color: '#f59e0b', label: 'Stagnálás', emoji: '⚠️', bg: 'rgba(245, 158, 11, 0.1)' },
        regression: { color: '#ef4444', label: 'Visszaesés', emoji: '🔻', bg: 'rgba(239, 68, 68, 0.1)' },
    }

    return (
        <div>
            {/* Page Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        📊 Statisztika
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Fejlődés nyomon követése és ajánlások
                    </p>
                </div>
                {/* Period Selector */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {[4, 6, 8, 12].map((w) => (
                        <button
                            key={w}
                            onClick={() => setWeeks(w)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: weeks === w ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                                background: weeks === w ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                color: weeks === w ? '#818cf8' : 'var(--color-text-secondary)',
                                fontSize: '12px',
                                fontWeight: weeks === w ? 600 : 400,
                                cursor: 'pointer',
                            }}
                        >
                            {w} hét
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-secondary)' }}>
                    ⏳ Analitika betöltése...
                </div>
            ) : analytics.length === 0 ? (
                <div
                    style={{
                        padding: '60px 40px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Még nincs elég adat</h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Kezdj el rögzíteni szetteket az Edzésnaplóban, és itt megjelennek a statisztikáid!
                    </p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div
                        className="animate-fade-in"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(5, 1fr)',
                            gap: '12px',
                            marginBottom: '24px',
                        }}
                    >
                        {[
                            { label: 'Gyakorlatok', value: summary.total, color: '#818cf8', emoji: '🏋️' },
                            { label: 'Kiváló', value: summary.excellent, color: '#22c55e', emoji: '🔥' },
                            { label: 'Stabil', value: summary.steady, color: '#3b82f6', emoji: '📈' },
                            { label: 'Stagnáló', value: summary.plateau, color: '#f59e0b', emoji: '⚠️' },
                            { label: 'Visszaeső', value: summary.regression, color: '#ef4444', emoji: '🔻' },
                        ].map(({ label, value, color, emoji }) => (
                            <div
                                key={label}
                                style={{
                                    padding: '16px',
                                    borderRadius: 'var(--radius)',
                                    background: 'var(--color-bg-secondary)',
                                    border: '1px solid var(--color-border)',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{emoji}</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color }}>{value}</div>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Average Improvement */}
                    <div
                        style={{
                            padding: '14px 20px',
                            borderRadius: 'var(--radius)',
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                            Átlagos fejlődés az elmúlt {weeks} hétben
                        </span>
                        <span style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: summary.avgImprovement > 0 ? '#22c55e' : summary.avgImprovement < 0 ? '#ef4444' : '#f59e0b',
                        }}>
                            {summary.avgImprovement > 0 ? '+' : ''}{summary.avgImprovement}%
                        </span>
                    </div>

                    {/* Top Performers */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                            🏆 Top fejlődők
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {analytics.filter((a) => a.category === 'excellent' || a.category === 'steady').slice(0, 5).map((a) => {
                                const cat = categoryConfig[a.category]
                                return (
                                    <div
                                        key={a.exercise.id}
                                        onClick={() => setSelectedExercise(a)}
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg-secondary)' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '16px' }}>{cat.emoji}</span>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 600 }}>{a.exercise.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                                    {a.planName} · {a.latestWeight} kg × {a.latestReps}
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: cat.color }}>
                                            +{a.improvementPct}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Needs Attention */}
                    {analytics.some((a) => a.category === 'plateau' || a.category === 'regression') && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                                ⚠️ Figyelmet igényel
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {analytics.filter((a) => a.category === 'plateau' || a.category === 'regression').map((a) => {
                                    const cat = categoryConfig[a.category]
                                    return (
                                        <div
                                            key={a.exercise.id}
                                            onClick={() => setSelectedExercise(a)}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: cat.bg,
                                                border: `1px solid ${cat.color}25`,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${cat.color}50` }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${cat.color}25` }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '14px' }}>{cat.emoji}</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{a.exercise.name}</span>
                                                </div>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: cat.color }}>
                                                    {a.improvementPct > 0 ? '+' : ''}{a.improvementPct}%
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                                {a.recommendation}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* All Exercises Grid */}
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                            📋 Összes gyakorlat
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                            {analytics.map((a) => {
                                const cat = categoryConfig[a.category]
                                return (
                                    <div
                                        key={a.exercise.id}
                                        onClick={() => setSelectedExercise(a)}
                                        style={{
                                            padding: '14px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: 'var(--color-bg-secondary)',
                                            border: '1px solid var(--color-border)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg-secondary)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{a.exercise.name}</span>
                                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: cat.bg, color: cat.color, fontWeight: 600 }}>
                                                {cat.label}
                                            </span>
                                        </div>
                                        {/* Mini chart */}
                                        {a.weeklyData.length > 1 && (
                                            <div style={{ display: 'flex', alignItems: 'end', gap: '2px', height: '30px', marginBottom: '8px' }}>
                                                {a.weeklyData.map((w, i) => {
                                                    const max = Math.max(...a.weeklyData.map((x) => x.volumeLoad), 1)
                                                    return (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                flex: 1,
                                                                height: `${Math.max((w.volumeLoad / max) * 100, 5)}%`,
                                                                borderRadius: '2px 2px 0 0',
                                                                background: i === a.weeklyData.length - 1 ? cat.color : `${cat.color}30`,
                                                            }}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                            <span>{a.latestWeight} kg × {a.latestReps}</span>
                                            <span style={{ color: cat.color, fontWeight: 600 }}>
                                                {a.improvementPct > 0 ? '+' : ''}{a.improvementPct}%
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Progression Chart Modal */}
            {selectedExercise && (
                <ProgressionChart
                    exercise={selectedExercise}
                    onClose={() => setSelectedExercise(null)}
                />
            )}
        </div>
    )
}
