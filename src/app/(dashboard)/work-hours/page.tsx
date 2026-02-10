'use client'

import { useState } from 'react'
import { format, addMonths, subMonths } from 'date-fns'
import { hu } from 'date-fns/locale'
import { useWorkShiftsCRUD } from '@/hooks/useWorkShifts'
import HoursProgress from '@/components/work-hours/HoursProgress'
import ShiftList from '@/components/work-hours/ShiftList'
import ShiftModal from '@/components/work-hours/ShiftModal'
import ShiftSuggestions from '@/components/work-hours/ShiftSuggestions'
import WorkHoursForecast from '@/components/work-hours/WorkHoursForecast'

export default function WorkHoursPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [showShiftModal, setShowShiftModal] = useState(false)

    const { shifts, loading, stats, createShift, deleteShift } = useWorkShiftsCRUD(currentMonth)

    const handleSaveShift = async (data: {
        shift_date: string
        start_time: string
        end_time: string
        duration_hours: number
        shift_type: 'délelőtt' | 'délután' | 'hétvége'
    }) => {
        await createShift(data)
    }

    const handleDeleteShift = async (id: string) => {
        await deleteShift(id)
    }

    return (
        <div>
            {/* Page Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        💼 Munkaidő
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Műszakok kezelése és munkaidő követés
                    </p>
                </div>
                <button
                    onClick={() => setShowShiftModal(true)}
                    className="gradient-accent"
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    + Műszak
                </button>
            </div>

            {/* Month Navigation */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '24px',
            }}>
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    ←
                </button>
                <span style={{ fontSize: '15px', fontWeight: 600, textTransform: 'capitalize', minWidth: '140px', textAlign: 'center' }}>
                    {format(currentMonth, 'yyyy. MMMM', { locale: hu })}
                </span>
                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    →
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
                    fontSize: '14px',
                    color: 'var(--color-text-secondary)',
                }}>
                    ⏳ Betöltés...
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
                        {/* Left: Progress Dashboard */}
                        <HoursProgress
                            totalHours={stats.totalHours}
                            monthlyTarget={stats.monthlyTarget}
                            progress={stats.progress}
                            remaining={stats.remaining}
                            byType={stats.byType}
                            weeks={stats.weeks}
                            shiftCount={stats.shiftCount}
                        />

                        {/* Right: Shift List */}
                        <ShiftList shifts={shifts} onDelete={handleDeleteShift} />
                    </div>

                    {/* Work Hours Forecast */}
                    <WorkHoursForecast
                        totalHours={stats.totalHours}
                        monthlyTarget={stats.monthlyTarget}
                        byType={stats.byType}
                        currentMonth={currentMonth}
                    />
                </>
            )}

            {/* Quick Stats Bar */}
            {!loading && (
                <div
                    className="animate-fade-in"
                    style={{
                        marginTop: '20px',
                        padding: '14px 20px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-around',
                        gap: '16px',
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Átlag/hét</div>
                        <div style={{ fontSize: '16px', fontWeight: 700 }}>
                            {stats.weeks.length > 0
                                ? Math.round((stats.totalHours / stats.weeks.length) * 10) / 10
                                : 0} h
                        </div>
                    </div>
                    <div style={{ width: '1px', background: 'var(--color-border)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Átlag/műszak</div>
                        <div style={{ fontSize: '16px', fontWeight: 700 }}>
                            {stats.shiftCount > 0
                                ? Math.round((stats.totalHours / stats.shiftCount) * 10) / 10
                                : 0} h
                        </div>
                    </div>
                    <div style={{ width: '1px', background: 'var(--color-border)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Státusz</div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: stats.progress >= 100 ? '#22c55e' : stats.progress >= 75 ? '#3b82f6' : '#f59e0b',
                        }}>
                            {stats.progress >= 100 ? '✅ Teljesítve' : stats.progress >= 75 ? '🔵 Jó úton' : '⏳ Folyamatban'}
                        </div>
                    </div>
                </div>
            )}

            {/* Shift Suggestions */}
            {!loading && (
                <ShiftSuggestions
                    onAccept={async (data) => {
                        await createShift(data)
                    }}
                />
            )}

            {/* Shift Modal */}
            {showShiftModal && (
                <ShiftModal
                    date={new Date()}
                    onSave={handleSaveShift}
                    onClose={() => setShowShiftModal(false)}
                />
            )}
        </div>
    )
}
