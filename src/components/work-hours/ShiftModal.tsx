'use client'

import { useState, useEffect } from 'react'
import { format, getDay } from 'date-fns'
import { hu } from 'date-fns/locale'
import { useConflictDetection, type Conflict } from '@/hooks/useConflictDetection'

interface ShiftModalProps {
    date: Date | null
    onSave: (data: {
        shift_date: string
        start_time: string
        end_time: string
        duration_hours: number
        shift_type: 'délelőtt' | 'délután' | 'hétvége'
    }) => Promise<void>
    onClose: () => void
}

const SHIFT_PRESETS = [
    { label: 'Délelőtt', start: '06:00', end: '14:00', type: 'délelőtt' as const, emoji: '🌅' },
    { label: 'Délután', start: '14:00', end: '22:00', type: 'délután' as const, emoji: '☀️' },
    { label: 'Rövid DE', start: '08:00', end: '12:00', type: 'délelőtt' as const, emoji: '⏰' },
    { label: 'Rövid DU', start: '14:00', end: '18:00', type: 'délután' as const, emoji: '⏰' },
    { label: 'Hétvége', start: '08:00', end: '16:00', type: 'hétvége' as const, emoji: '📅' },
]

function calculateDuration(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const hours = (eh * 60 + em - (sh * 60 + sm)) / 60
    return Math.round(hours * 100) / 100
}

function autoDetectType(date: Date, startTime: string): 'délelőtt' | 'délután' | 'hétvége' {
    const dow = getDay(date)
    if (dow === 0 || dow === 6) return 'hétvége'
    const hour = parseInt(startTime.split(':')[0])
    return hour < 14 ? 'délelőtt' : 'délután'
}

export default function ShiftModal({ date, onSave, onClose }: ShiftModalProps) {
    const [selectedDate, setSelectedDate] = useState(date || new Date())
    const [startTime, setStartTime] = useState('08:00')
    const [endTime, setEndTime] = useState('14:00')
    const [saving, setSaving] = useState(false)
    const [conflicts, setConflicts] = useState<Conflict[]>([])
    const { checkConflicts } = useConflictDetection()
    const currentDate = selectedDate

    // Auto-check conflicts when date/time changes
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (startTime && endTime && startTime < endTime) {
                const result = await checkConflicts(
                    format(currentDate, 'yyyy-MM-dd'),
                    startTime,
                    endTime,
                    'shift'
                )
                setConflicts(result)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [currentDate, startTime, endTime, checkConflicts])

    const duration = calculateDuration(startTime, endTime)
    const shiftType = autoDetectType(currentDate, startTime)

    const handlePresetClick = (preset: typeof SHIFT_PRESETS[number]) => {
        setStartTime(preset.start)
        setEndTime(preset.end)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (duration <= 0) return
        setSaving(true)
        await onSave({
            shift_date: format(currentDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            duration_hours: duration,
            shift_type: shiftType,
        })
        setSaving(false)
        onClose()
    }

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
                    maxWidth: '420px',
                    padding: '28px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
            >
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                    💼 Műszak Hozzáadása
                </h3>

                {/* Date Picker */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                        Dátum
                    </label>
                    <input
                        type="date"
                        value={format(currentDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            if (e.target.value) setSelectedDate(new Date(e.target.value + 'T00:00:00'))
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text)',
                            fontSize: '14px',
                            outline: 'none',
                        }}
                    />
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', textTransform: 'capitalize' }}>
                        {format(currentDate, 'EEEE', { locale: hu })}
                    </p>
                </div>

                {/* Presets */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                        Gyors beállítás
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {SHIFT_PRESETS.map((preset) => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => handlePresetClick(preset)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--color-border)',
                                    background:
                                        startTime === preset.start && endTime === preset.end
                                            ? 'rgba(139, 92, 246, 0.15)'
                                            : 'var(--color-bg-tertiary)',
                                    color:
                                        startTime === preset.start && endTime === preset.end
                                            ? '#a78bfa'
                                            : 'var(--color-text-secondary)',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {preset.emoji} {preset.label}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Time Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                                Kezdés
                            </label>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text)',
                                    fontSize: '14px',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                                Befejezés
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text)',
                                    fontSize: '14px',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    {/* Duration + Type Preview */}
                    <div
                        style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: 'rgba(139, 92, 246, 0.08)',
                            border: '1px solid rgba(139, 92, 246, 0.15)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <span style={{ fontSize: '22px', fontWeight: 700, color: '#a78bfa' }}>{duration > 0 ? duration : '—'}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '4px' }}>óra</span>
                        </div>
                        <span
                            style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background:
                                    shiftType === 'délelőtt'
                                        ? 'rgba(245, 158, 11, 0.15)'
                                        : shiftType === 'délután'
                                            ? 'rgba(99, 102, 241, 0.15)'
                                            : 'rgba(34, 197, 94, 0.15)',
                                color:
                                    shiftType === 'délelőtt'
                                        ? '#fbbf24'
                                        : shiftType === 'délután'
                                            ? '#818cf8'
                                            : '#22c55e',
                                fontSize: '12px',
                                fontWeight: 600,
                            }}
                        >
                            {shiftType}
                        </span>
                    </div>

                    {duration <= 0 && (
                        <p style={{ fontSize: '12px', color: '#f87171' }}>
                            ⚠️ A befejezési időnek a kezdés után kell lennie.
                        </p>
                    )}

                    {/* Conflict Warnings */}
                    {conflicts.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            padding: '12px',
                            borderRadius: '8px',
                            background: conflicts.some(c => c.severity === 'error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            border: `1px solid ${conflicts.some(c => c.severity === 'error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: conflicts.some(c => c.severity === 'error') ? '#ef4444' : '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                ⚠️ Ütközések ({conflicts.length})
                            </div>
                            {conflicts.map((c, i) => (
                                <div key={i} style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span>{c.emoji}</span>
                                    <span>{c.description}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                                color: 'var(--color-text-secondary)',
                                fontSize: '13px',
                                cursor: 'pointer',
                            }}
                        >
                            Mégse
                        </button>
                        <button
                            type="submit"
                            disabled={saving || duration <= 0}
                            className="gradient-accent"
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: saving || duration <= 0 ? 'not-allowed' : 'pointer',
                                opacity: saving || duration <= 0 ? 0.5 : 1,
                            }}
                        >
                            {saving ? 'Mentés...' : 'Mentés'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
