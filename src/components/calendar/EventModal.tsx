'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

interface EventModalProps {
    date: Date
    onSave: (data: {
        event_type: 'workout' | 'girlfriend' | 'cooking' | 'other'
        event_date: string
        start_time: string
        end_time: string
        title: string
        description: string
    }) => Promise<void>
    onClose: () => void
}

const EVENT_TYPES = [
    { value: 'girlfriend', label: 'Barátnő', emoji: '💕', color: '#ec4899' },
    { value: 'cooking', label: 'Főzés', emoji: '🍳', color: '#f59e0b' },
    { value: 'workout', label: 'Edzés', emoji: '🏋️', color: '#3b82f6' },
    { value: 'other', label: 'Egyéb', emoji: '📌', color: '#6b7280' },
] as const

export default function EventModal({ date, onSave, onClose }: EventModalProps) {
    const [eventType, setEventType] = useState<'workout' | 'girlfriend' | 'cooking' | 'other'>('other')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('10:00')
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        await onSave({
            event_type: eventType,
            event_date: format(date, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            title,
            description,
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
                    maxWidth: '440px',
                    padding: '28px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
            >
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                    Új Esemény
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px', textTransform: 'capitalize' }}>
                    {format(date, 'yyyy. MMMM d. (EEEE)', { locale: hu })}
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Event Type Selector */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                            Típus
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                            {EVENT_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setEventType(type.value)}
                                    style={{
                                        padding: '10px 6px',
                                        borderRadius: '8px',
                                        border: eventType === type.value
                                            ? `2px solid ${type.color}`
                                            : '1px solid var(--color-border)',
                                        background: eventType === type.value
                                            ? `${type.color}15`
                                            : 'var(--color-bg-tertiary)',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: eventType === type.value ? 600 : 400,
                                        color: eventType === type.value ? type.color : 'var(--color-text-secondary)',
                                        textAlign: 'center',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>{type.emoji}</div>
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                            Megnevezés
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="pl. Vacsora, Mozi, stb."
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
                            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                        />
                    </div>

                    {/* Time Range */}
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

                    {/* Description */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                            Megjegyzés (opcionális)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Részletek..."
                            rows={2}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text)',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'vertical',
                            }}
                        />
                    </div>

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
                            disabled={saving}
                            className="gradient-accent"
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '8px',
                                border: 'none',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: saving ? 'wait' : 'pointer',
                                opacity: saving ? 0.7 : 1,
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
