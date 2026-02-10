// Shared TypeScript types for the application

export interface WorkoutPlan {
    id: string
    user_id: string
    name: string
    week_type: 'A' | 'B'
    order_in_cycle: number
    created_at: string
}

export interface Exercise {
    id: string
    workout_plan_id: string
    name: string
    sets: number
    reps: string
    rir: number
    rest_seconds: number
    order_index: number
    created_at: string
}

export interface WorkoutLog {
    id: string
    user_id: string
    exercise_id: string
    workout_date: string
    set_number: number
    reps_completed: number | null
    weight_kg: number | null
    rir_actual: number | null
    notes: string | null
    created_at: string
}

export interface WorkShift {
    id: string
    user_id: string
    shift_date: string
    start_time: string
    end_time: string
    duration_hours: number
    shift_type: 'délelőtt' | 'délután' | 'hétvége'
    created_at: string
}

export interface ScheduleEvent {
    id: string
    user_id: string
    event_type: 'workout' | 'girlfriend' | 'cooking' | 'other'
    event_date: string
    start_time: string
    end_time: string
    title: string | null
    description: string | null
    created_at: string
}

export interface WorkoutCycleState {
    id: string
    user_id: string
    cycle_start_date: string
    current_week: number
    current_week_type: 'A' | 'B'
    current_day_index: number
    last_updated: string
}

export interface FriendScheduleEntry {
    id: string
    user_id: string
    day_of_week: number
    start_time: string
    end_time: string
    is_available: boolean
    event_name: string | null
    is_night_shift: boolean
    notes: string | null
}

export interface FriendNightShift {
    id: string
    user_id: string
    night_shift_date: string
    start_time: string
    end_time: string
    sleep_until: string
    notes: string | null
    created_at: string
}

export interface CalendarDayData {
    date: Date
    workoutType: import('@/lib/workout-cycle').WorkoutType
    weekType: 'A' | 'B'
    weekNumber: number
    events: ScheduleEvent[]
    shifts: WorkShift[]
    friendClasses: FriendScheduleEntry[]
    friendNightShift: FriendNightShift | null
    friendSleeping: boolean // true if friend is sleeping this morning (night shift prev day)
}
