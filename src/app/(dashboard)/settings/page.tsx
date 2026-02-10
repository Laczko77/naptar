'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkoutCycle } from '@/hooks/useCalendarData'
import { format } from 'date-fns'
import type { FriendScheduleEntry } from '@/lib/types'

const supabase = createClient()

const DAY_NAMES = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']

export default function SettingsPage() {
    const [user, setUser] = useState<{ email: string; id: string } | null>(null)
    const [friendSchedule, setFriendSchedule] = useState<FriendScheduleEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [savingMsg, setSavingMsg] = useState('')
    const { cycle } = useWorkoutCycle()

    // Cycle edit state
    const [cycleStartDate, setCycleStartDate] = useState('')

    useEffect(() => {
        const fetch = async () => {
            const { data: { user: u } } = await supabase.auth.getUser()
            if (!u) return
            setUser({ email: u.email || '', id: u.id })

            // Fetch friend schedule
            const { data: fs } = await supabase
                .from('friend_schedule')
                .select('*')
                .eq('user_id', u.id)
                .order('day_of_week')
                .order('start_time')

            setFriendSchedule(fs || [])

            if (cycle) {
                setCycleStartDate(cycle.cycle_start_date)
            }

            setLoading(false)
        }
        fetch()
    }, [cycle])

    const showMsg = (msg: string) => {
        setSavingMsg(msg)
        setTimeout(() => setSavingMsg(''), 2000)
    }

    const handleSaveCycleStart = async () => {
        if (!user || !cycleStartDate) return
        const { error } = await supabase
            .from('workout_cycle')
            .update({ cycle_start_date: cycleStartDate })
            .eq('user_id', user.id)

        showMsg(error ? '❌ Hiba történt' : '✅ Ciklus mentve')
    }

    const handleAddFriendClass = async (dayOfWeek: number) => {
        if (!user) return
        const { data, error } = await supabase
            .from('friend_schedule')
            .insert({
                user_id: user.id,
                day_of_week: dayOfWeek,
                start_time: '14:00',
                end_time: '16:00',
                is_available: false,
                event_name: 'Új óra',
            })
            .select()
            .single()

        if (!error && data) {
            setFriendSchedule((prev) => [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week))
            showMsg('✅ Óra hozzáadva')
        }
    }

    const handleDeleteFriendClass = async (id: string) => {
        await supabase.from('friend_schedule').delete().eq('id', id)
        setFriendSchedule((prev) => prev.filter((f) => f.id !== id))
        showMsg('🗑️ Óra törölve')
    }

    const handleUpdateFriendClass = async (id: string, updates: Partial<FriendScheduleEntry>) => {
        const { data, error } = await supabase
            .from('friend_schedule')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (!error && data) {
            setFriendSchedule((prev) => prev.map((f) => f.id === id ? data : f))
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '120px' }} />)}
            </div>
        )
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
            {/* Page Title */}
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>⚙️ Beállítások</h1>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                    Fiók, edzésciklus, és barát órarend kezelése
                </p>
            </div>

            {/* Toast */}
            {savingMsg && (
                <div className="animate-slide-up" style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
                    padding: '10px 18px', borderRadius: '8px',
                    background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    fontSize: '13px', fontWeight: 600,
                }}>
                    {savingMsg}
                </div>
            )}

            {/* Account */}
            <section style={{
                padding: '20px', borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>👤 Fiók</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.email}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Bejelentkezve</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '6px 14px', borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.3)', background: 'transparent',
                            color: '#f87171', fontSize: '12px', cursor: 'pointer',
                        }}
                    >
                        Kijelentkezés
                    </button>
                </div>
            </section>

            {/* Workout Cycle */}
            <section style={{
                padding: '20px', borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>🏋️ Edzésciklus</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                            Ciklus kezdete
                        </label>
                        <input
                            type="date"
                            value={cycleStartDate}
                            onChange={(e) => setCycleStartDate(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 12px', borderRadius: '6px',
                                border: '1px solid var(--color-border)', background: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text)', fontSize: '13px',
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSaveCycleStart}
                        className="gradient-accent"
                        style={{
                            padding: '8px 16px', borderRadius: '6px', border: 'none',
                            color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Mentés
                    </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                    Ettől a dátumtól számítódik a Push–Pull–Legs–Rest ciklus (10 hét, A/B hetek).
                </p>
            </section>

            {/* Friend Schedule */}
            <section style={{
                padding: '20px', borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700 }}>🎓 Barát órarendje</h3>
                </div>

                {DAY_NAMES.map((dayName, dayIdx) => {
                    const dayClasses = friendSchedule.filter((f) => f.day_of_week === dayIdx)
                    return (
                        <div key={dayIdx} style={{ marginBottom: '12px' }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: '6px',
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                    {dayName}
                                </span>
                                <button
                                    onClick={() => handleAddFriendClass(dayIdx)}
                                    style={{
                                        padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)',
                                        background: 'transparent', color: 'var(--color-text-secondary)',
                                        fontSize: '11px', cursor: 'pointer',
                                    }}
                                >
                                    + Óra
                                </button>
                            </div>
                            {dayClasses.length === 0 ? (
                                <div style={{
                                    padding: '6px 10px', borderRadius: '4px', background: 'var(--color-bg-tertiary)',
                                    fontSize: '11px', color: 'var(--color-text-secondary)',
                                }}>
                                    Nincs óra
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {dayClasses.map((cls) => (
                                        <div key={cls.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '6px 10px', borderRadius: '4px', background: 'var(--color-bg-tertiary)',
                                        }}>
                                            <input
                                                value={cls.event_name || ''}
                                                onChange={(e) => handleUpdateFriendClass(cls.id, { event_name: e.target.value })}
                                                placeholder="Óra neve"
                                                style={{
                                                    flex: 1, background: 'transparent', border: 'none',
                                                    color: 'var(--color-text)', fontSize: '12px', outline: 'none',
                                                }}
                                            />
                                            <input
                                                type="time"
                                                value={cls.start_time?.toString().slice(0, 5) || ''}
                                                onChange={(e) => handleUpdateFriendClass(cls.id, { start_time: e.target.value })}
                                                style={{
                                                    width: '80px', background: 'transparent', border: '1px solid var(--color-border)',
                                                    borderRadius: '4px', padding: '2px 4px', color: 'var(--color-text)',
                                                    fontSize: '11px',
                                                }}
                                            />
                                            <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>–</span>
                                            <input
                                                type="time"
                                                value={cls.end_time?.toString().slice(0, 5) || ''}
                                                onChange={(e) => handleUpdateFriendClass(cls.id, { end_time: e.target.value })}
                                                style={{
                                                    width: '80px', background: 'transparent', border: '1px solid var(--color-border)',
                                                    borderRadius: '4px', padding: '2px 4px', color: 'var(--color-text)',
                                                    fontSize: '11px',
                                                }}
                                            />
                                            <button
                                                onClick={() => handleDeleteFriendClass(cls.id)}
                                                style={{
                                                    width: '20px', height: '20px', borderRadius: '4px',
                                                    border: 'none', background: 'transparent',
                                                    color: '#f87171', cursor: 'pointer', fontSize: '11px',
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </section>

            {/* App Info */}
            <section style={{
                padding: '16px 20px', borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: '12px', color: 'var(--color-text-secondary)',
            }}>
                <span>FitSchedule Pro v1.0</span>
                <span>Next.js + Supabase</span>
            </section>
        </div>
    )
}
