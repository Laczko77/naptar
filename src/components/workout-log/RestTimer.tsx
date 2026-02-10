'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface RestTimerProps {
    durationSeconds: number
    onComplete: () => void
    onDismiss: () => void
}

export default function RestTimer({ durationSeconds, onComplete, onDismiss }: RestTimerProps) {
    const [remaining, setRemaining] = useState(durationSeconds)
    const [isRunning, setIsRunning] = useState(true)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)

    // Play a beep using Web Audio API
    const playBeep = useCallback((frequency: number = 800, duration: number = 200, count: number = 1) => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
            }
            const ctx = audioCtxRef.current
            let delay = 0
            for (let i = 0; i < count; i++) {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.frequency.value = frequency
                osc.type = 'sine'
                gain.gain.setValueAtTime(0.3, ctx.currentTime + delay)
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration / 1000)
                osc.start(ctx.currentTime + delay)
                osc.stop(ctx.currentTime + delay + duration / 1000)
                delay += (duration + 100) / 1000
            }
        } catch {
            // Audio not supported
        }
    }, [])

    // Vibrate on mobile
    const vibrate = useCallback((pattern: number[]) => {
        try {
            if (navigator.vibrate) navigator.vibrate(pattern)
        } catch {
            // Vibration not supported
        }
    }, [])

    useEffect(() => {
        if (!isRunning) return

        intervalRef.current = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!)
                    setIsRunning(false)
                    // Completion: triple beep + vibration
                    playBeep(880, 250, 3)
                    vibrate([200, 100, 200, 100, 400])
                    onComplete()
                    return 0
                }
                // Warning beep at 10 seconds
                if (prev === 11) {
                    playBeep(600, 150, 1)
                    vibrate([100])
                }
                return prev - 1
            })
        }, 1000)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isRunning, onComplete, playBeep, vibrate])

    const togglePause = () => setIsRunning(!isRunning)
    const addTime = (sec: number) => setRemaining((prev) => prev + sec)

    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    const progress = ((durationSeconds - remaining) / durationSeconds) * 100

    const progressColor = remaining > 30 ? '#3b82f6' : remaining > 10 ? '#f59e0b' : '#ef4444'

    return (
        <div
            className="animate-fade-in"
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '280px',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
                zIndex: 900,
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⏱️ Pihenő
                </span>
                <button
                    onClick={onDismiss}
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontSize: '12px',
                    }}
                >
                    ✕
                </button>
            </div>

            {/* Circular Timer */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-border)" strokeWidth="6" />
                        <circle
                            cx="50"
                            cy="50"
                            r="44"
                            fill="none"
                            stroke={progressColor}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 44}`}
                            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                        />
                    </svg>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span style={{ fontSize: '28px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: progressColor }}>
                            {minutes}:{seconds.toString().padStart(2, '0')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                <button
                    onClick={togglePause}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text)',
                        fontSize: '12px',
                        cursor: 'pointer',
                    }}
                >
                    {isRunning ? '⏸ Szünet' : '▶ Folytatás'}
                </button>
                <button
                    onClick={() => addTime(30)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                    }}
                >
                    +30s
                </button>
                <button
                    onClick={() => addTime(60)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-secondary)',
                        fontSize: '12px',
                        cursor: 'pointer',
                    }}
                >
                    +60s
                </button>
            </div>

            {/* Skip */}
            <button
                onClick={onDismiss}
                style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#818cf8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                }}
            >
                Kihagyás →
            </button>
        </div>
    )
}
