'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setMessage(null)
        setLoading(true)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                setMessage('Ellenőrizd az email fiókod a megerősítő linkért!')
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                router.push('/')
                router.refresh()
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg)',
                padding: '20px',
            }}
        >
            <div
                className="animate-fade-in"
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '40px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '8px',
                        }}
                    >
                        💪 FitSchedule Pro
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                        {isSignUp ? 'Új fiók létrehozása' : 'Jelentkezz be a fiókodba'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--color-text-secondary)',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="pelda@email.com"
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text)',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.15s ease',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--color-text-secondary)',
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            Jelszó
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            minLength={6}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text)',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'border-color 0.15s ease',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                        />
                    </div>

                    {error && (
                        <div
                            style={{
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#fca5a5',
                                fontSize: '13px',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {message && (
                        <div
                            style={{
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(34, 197, 94, 0.15)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                color: '#86efac',
                                fontSize: '13px',
                            }}
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="gradient-accent"
                        style={{
                            padding: '12px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {loading ? '...' : isSignUp ? 'Regisztráció' : 'Bejelentkezés'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setError(null)
                            setMessage(null)
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-accent)',
                            fontSize: '13px',
                            cursor: 'pointer',
                        }}
                    >
                        {isSignUp ? 'Már van fiókom - Bejelentkezés' : 'Nincs fiókom - Regisztráció'}
                    </button>
                </div>
            </div>
        </div>
    )
}
