// Workout cycle types and utility functions
import { addDays, startOfWeek, format, isSameDay } from 'date-fns'
import { hu } from 'date-fns/locale'

export type WorkoutType = 'PUSH' | 'PULL' | 'LEGS' | 'REST'
export type WeekType = 'A' | 'B'

export interface CycleDay {
    date: Date
    workoutType: WorkoutType
    weekType: WeekType
    weekNumber: number // 1-10
    dayLabel: string
}

export interface WorkoutCycle {
    cycleStartDate: Date
    currentWeek: number
    currentWeekType: WeekType
    currentDayIndex: number // 0=Push, 1=Pull, 2=Legs, 3=Rest
}

// The PPL cycle pattern: Push, Pull, Legs, Rest (repeating)
const CYCLE_PATTERN: WorkoutType[] = ['PUSH', 'PULL', 'LEGS', 'REST']

// Week types alternate: A, B, A, B, ... across the 10-week cycle
function getWeekType(weekNumber: number): WeekType {
    return weekNumber % 2 === 1 ? 'A' : 'B'
}

/**
 * Calculate the workout type and cycle position for any given date,
 * based on the cycle start date.
 */
export function getCycleDayForDate(cycleStartDate: Date, targetDate: Date): CycleDay {
    // Normalize both dates to local midnight to avoid UTC vs local timezone mismatches
    // (new Date('2026-02-16') = UTC midnight, new Date('2026-02-16T00:00:00') = local midnight)
    const startNorm = new Date(cycleStartDate.getFullYear(), cycleStartDate.getMonth(), cycleStartDate.getDate())
    const targetNorm = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())

    const diffTime = targetNorm.getTime() - startNorm.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    // Each week has 4 days in the cycle pattern (Push, Pull, Legs, Rest)
    // But mapped to 7-day calendar weeks
    // The cycle repeats every 4 days regardless of calendar week
    const dayInCycle = ((diffDays % (10 * 4)) + (10 * 4)) % (10 * 4) // Modulo for 10 weeks × 4 days
    const weekNumber = Math.floor(dayInCycle / 4) + 1
    const dayIndex = dayInCycle % 4

    const workoutType = CYCLE_PATTERN[dayIndex]
    const weekType = getWeekType(weekNumber)

    return {
        date: targetDate,
        workoutType,
        weekType,
        weekNumber,
        dayLabel: `${workoutType} ${weekType}`,
    }
}

/**
 * Generate cycle days for a date range
 */
export function generateCycleDays(
    cycleStartDate: Date,
    startDate: Date,
    numDays: number
): CycleDay[] {
    const days: CycleDay[] = []
    for (let i = 0; i < numDays; i++) {
        const date = addDays(startDate, i)
        days.push(getCycleDayForDate(cycleStartDate, date))
    }
    return days
}

/**
 * Get display info for a workout type
 */
export function getWorkoutTypeInfo(type: WorkoutType) {
    switch (type) {
        case 'PUSH':
            return {
                label: 'Push',
                color: '#3b82f6',
                bgColor: 'rgba(59, 130, 246, 0.15)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                emoji: '💪',
            }
        case 'PULL':
            return {
                label: 'Pull',
                color: '#22c55e',
                bgColor: 'rgba(34, 197, 94, 0.15)',
                borderColor: 'rgba(34, 197, 94, 0.3)',
                emoji: '🏋️',
            }
        case 'LEGS':
            return {
                label: 'Legs',
                color: '#f97316',
                bgColor: 'rgba(249, 115, 22, 0.15)',
                borderColor: 'rgba(249, 115, 22, 0.3)',
                emoji: '🦵',
            }
        case 'REST':
            return {
                label: 'Rest',
                color: '#6b7280',
                bgColor: 'rgba(107, 114, 128, 0.1)',
                borderColor: 'rgba(107, 114, 128, 0.2)',
                emoji: '😴',
            }
    }
}

/**
 * Format a date for display in Hungarian
 */
export function formatDateHu(date: Date, formatStr: string = 'yyyy. MMMM d.') {
    return format(date, formatStr, { locale: hu })
}

export function getDayNameHu(date: Date): string {
    return format(date, 'EEEE', { locale: hu })
}

export function isToday(date: Date): boolean {
    return isSameDay(date, new Date())
}
