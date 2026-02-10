'use client'

import { useState, useMemo } from 'react'
import { format, addDays, getDay, startOfWeek } from 'date-fns'
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar'
import WeeklyCalendar from '@/components/calendar/WeeklyCalendar'
import DayDetail from '@/components/calendar/DayDetail'
import EventModal from '@/components/calendar/EventModal'
import WorkoutSuggestions from '@/components/calendar/WorkoutSuggestions'
import {
    useWorkoutCycle,
    useScheduleEvents,
    useWorkShifts,
    useFriendSchedule,
    useFriendNightShifts,
} from '@/hooks/useCalendarData'

type CalendarView = 'monthly' | 'weekly'

export default function CalendarPage() {
    const [calendarView, setCalendarView] = useState<CalendarView>('weekly')
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [currentWeek, setCurrentWeek] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showEventModal, setShowEventModal] = useState(false)
    const [modalDate, setModalDate] = useState<Date>(new Date())

    // Fetch all data
    const { cycle, loading: cycleLoading } = useWorkoutCycle()
    const { events, loading: eventsLoading, createEvent, deleteEvent } = useScheduleEvents(
        calendarView === 'weekly' ? currentWeek : currentMonth
    )
    const { shifts, loading: shiftsLoading } = useWorkShifts(
        calendarView === 'weekly' ? currentWeek : currentMonth
    )
    const { schedule: friendSchedule, loading: friendLoading } = useFriendSchedule()
    const { nightShifts, loading: nightLoading, createNightShift, deleteNightShift } = useFriendNightShifts(
        calendarView === 'weekly' ? currentWeek : currentMonth
    )

    const cycleStartDate = cycle ? new Date(cycle.cycle_start_date) : null
    const isLoading = cycleLoading || eventsLoading || shiftsLoading || friendLoading || nightLoading

    // Filtered data for selected date
    const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
    const selectedEvents = useMemo(
        () => (selectedDateStr ? events.filter((e) => e.event_date === selectedDateStr) : []),
        [events, selectedDateStr]
    )
    const selectedShifts = useMemo(
        () => (selectedDateStr ? shifts.filter((s) => s.shift_date === selectedDateStr) : []),
        [shifts, selectedDateStr]
    )
    const selectedNightShift = useMemo(
        () => (selectedDateStr ? nightShifts.find((ns) => ns.night_shift_date === selectedDateStr) || null : null),
        [nightShifts, selectedDateStr]
    )
    const selectedFriendClasses = useMemo(() => {
        if (!selectedDate) return []
        const dayOfWeek = ((getDay(selectedDate) + 6) % 7)
        return friendSchedule.filter((fs) => fs.day_of_week === dayOfWeek)
    }, [selectedDate, friendSchedule])
    const isFriendSleeping = useMemo(() => {
        if (!selectedDate) return false
        const prevDay = format(addDays(selectedDate, -1), 'yyyy-MM-dd')
        return nightShifts.some((ns) => ns.night_shift_date === prevDay)
    }, [selectedDate, nightShifts])

    // Handlers
    const handleAddEvent = (date: Date) => {
        setModalDate(date)
        setShowEventModal(true)
    }

    const handleSaveEvent = async (data: {
        event_type: 'workout' | 'girlfriend' | 'cooking' | 'other'
        event_date: string
        start_time: string
        end_time: string
        title: string
        description: string
    }) => {
        await createEvent(data)
    }

    const handleAddNightShift = async () => {
        if (!selectedDate) return
        await createNightShift(format(selectedDate, 'yyyy-MM-dd'))
    }

    const handleDeleteNightShift = async (id: string) => {
        await deleteNightShift(id)
    }

    const handleDeleteEvent = async (id: string) => {
        await deleteEvent(id)
    }

    return (
        <div>
            {/* Page Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '20px',
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        📅 Naptár
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Edzések, műszakok, és események egy helyen
                    </p>
                </div>

                {/* View Toggle */}
                <div style={{
                    display: 'flex', gap: '2px', padding: '3px',
                    borderRadius: '10px', background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                }}>
                    {([
                        { key: 'monthly' as const, label: 'Havi', icon: '📋' },
                        { key: 'weekly' as const, label: 'Heti', icon: '📊' },
                    ]).map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setCalendarView(key)
                                if (key === 'weekly') setCurrentWeek(currentMonth)
                                if (key === 'monthly') setCurrentMonth(currentWeek)
                            }}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: calendarView === key
                                    ? 'rgba(99,102,241,0.15)'
                                    : 'transparent',
                                color: calendarView === key
                                    ? '#818cf8'
                                    : 'var(--color-text-secondary)',
                                fontSize: '12px',
                                fontWeight: calendarView === key ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center', gap: '5px',
                            }}
                        >
                            {icon} {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '300px', fontSize: '14px', color: 'var(--color-text-secondary)',
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', marginBottom: '12px', animation: 'pulse-glow 2s infinite' }}>⏳</div>
                        Adatok betöltése...
                    </div>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: selectedDate ? '1fr 360px' : '1fr',
                    gap: '20px', alignItems: 'start',
                }}>
                    {/* Calendar View */}
                    <div style={{
                        padding: '20px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                    }}>
                        {calendarView === 'monthly' ? (
                            <MonthlyCalendar
                                currentMonth={currentMonth}
                                onMonthChange={setCurrentMonth}
                                cycleStartDate={cycleStartDate}
                                events={events}
                                shifts={shifts}
                                friendSchedule={friendSchedule}
                                nightShifts={nightShifts}
                                onDayClick={(date) => setSelectedDate(date)}
                                onAddEvent={handleAddEvent}
                            />
                        ) : (
                            <WeeklyCalendar
                                currentWeek={currentWeek}
                                onWeekChange={setCurrentWeek}
                                cycleStartDate={cycleStartDate}
                                events={events}
                                shifts={shifts}
                                friendSchedule={friendSchedule}
                                nightShifts={nightShifts}
                                onDayClick={(date) => setSelectedDate(date)}
                                onAddEvent={handleAddEvent}
                            />
                        )}
                    </div>

                    {/* Day Detail Panel */}
                    {selectedDate && (
                        <DayDetail
                            date={selectedDate}
                            cycleStartDate={cycleStartDate}
                            events={selectedEvents}
                            shifts={selectedShifts}
                            friendClasses={selectedFriendClasses}
                            nightShift={selectedNightShift}
                            friendSleeping={isFriendSleeping}
                            onAddEvent={() => handleAddEvent(selectedDate)}
                            onAddNightShift={handleAddNightShift}
                            onDeleteEvent={handleDeleteEvent}
                            onDeleteNightShift={handleDeleteNightShift}
                            onClose={() => setSelectedDate(null)}
                        />
                    )}
                </div>
            )}

            {/* Event Modal */}
            {showEventModal && (
                <EventModal
                    date={modalDate}
                    onSave={handleSaveEvent}
                    onClose={() => setShowEventModal(false)}
                />
            )}

            {/* Workout Suggestions */}
            {!isLoading && (
                <WorkoutSuggestions
                    onSchedule={(suggestion) => {
                        createEvent({
                            event_type: 'workout',
                            event_date: suggestion.date,
                            start_time: suggestion.suggestedStartTime,
                            end_time: suggestion.suggestedEndTime,
                            title: `${suggestion.workoutType} ${suggestion.weekType} edzés`,
                            description: `Javasolt időpont: ${suggestion.reason}`,
                        })
                    }}
                />
            )}

            {/* Cycle Info Card */}
            {cycle && (
                <div
                    className="animate-fade-in"
                    style={{
                        marginTop: '20px',
                        padding: '16px 20px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}
                >
                    <div>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Ciklus információ
                        </span>
                        <div style={{
                            fontSize: '15px', fontWeight: 600, marginTop: '4px',
                            display: 'flex', gap: '20px', flexWrap: 'wrap',
                        }}>
                            <span>📆 Kezdet: {format(new Date(cycle.cycle_start_date), 'yyyy.MM.dd.')}</span>
                            <span>📊 Hét: {cycle.current_week}/10</span>
                            <span style={{
                                padding: '2px 10px', borderRadius: '6px',
                                background: cycle.current_week_type === 'A' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                color: cycle.current_week_type === 'A' ? '#3b82f6' : '#22c55e',
                                fontWeight: 700,
                            }}>
                                {cycle.current_week_type} hét
                            </span>
                        </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                        <div>Push → Pull → Legs → Rest</div>
                        <div>10 hetes ciklus, A/B hetek</div>
                    </div>
                </div>
            )}
        </div>
    )
}
