'use client'

interface MuscleGroupSummaryProps {
    exerciseLogs: {
        exerciseName: string
        sets: number
        avgReps: number
        avgWeight: number
    }[]
}

// Mapping exercise names (Hungarian) to muscle groups
const MUSCLE_GROUP_MAP: Record<string, string[]> = {
    // Chest
    'fekvenyomás': ['mellkas'],
    'ferde fekvenyomás': ['mellkas', 'váll'],
    'tárogatás': ['mellkas'],
    'kábeles keresz': ['mellkas'],
    'dumbbell press': ['mellkas'],
    'nyomás': ['mellkas', 'váll'],
    'bench press': ['mellkas', 'tricepsz'],
    'chest press': ['mellkas'],
    'mellkas': ['mellkas'],
    // Back
    'húzódzkodás': ['hát', 'bicepsz'],
    'lehúzás': ['hát'],
    'evezés': ['hát'],
    'deadlift': ['hát', 'comhajlító'],
    'hátlehúzás': ['hát'],
    'széles lehúzás': ['hát'],
    'szűk lehúzás': ['hát', 'bicepsz'],
    'sorzat evezés': ['hát'],
    'hát': ['hát'],
    'pulldown': ['hát'],
    'row': ['hát'],
    // Shoulders
    'váll': ['váll'],
    'vállnyomás': ['váll', 'tricepsz'],
    'oldalemelés': ['váll'],
    'előreemelés': ['váll'],
    'face pull': ['váll', 'hát'],
    'arnold press': ['váll'],
    'lateral raise': ['váll'],
    'shoulder press': ['váll'],
    // Biceps
    'bicepsz': ['bicepsz'],
    'bicepsz hajlítás': ['bicepsz'],
    'curl': ['bicepsz'],
    'koncentrált': ['bicepsz'],
    'kalapács': ['bicepsz'],
    'hammer curl': ['bicepsz'],
    // Triceps
    'tricepsz': ['tricepsz'],
    'tricepsz nyújtás': ['tricepsz'],
    'tolódzkodás': ['tricepsz', 'mellkas'],
    'french press': ['tricepsz'],
    'pushdown': ['tricepsz'],
    'dip': ['tricepsz', 'mellkas'],
    // Quads
    'guggolás': ['combnyújtó', 'comhajlító'],
    'squat': ['combnyújtó', 'comhajlító'],
    'lábtolás': ['combnyújtó'],
    'leg press': ['combnyújtó'],
    'leg extension': ['combnyújtó'],
    'lábnyújtás': ['combnyújtó'],
    'kitörés': ['combnyújtó', 'comhajlító'],
    // Hamstrings
    'lábhajlítás': ['comhajlító'],
    'leg curl': ['comhajlító'],
    'román felhúzás': ['comhajlító', 'hát'],
    'rdl': ['comhajlító'],
    // Calves
    'vádli': ['vádli'],
    'vádliemelés': ['vádli'],
    'calf raise': ['vádli'],
    // Core
    'hasprés': ['core'],
    'plank': ['core'],
    'core': ['core'],
    'has': ['core'],
    'crunch': ['core'],
    'ab': ['core'],
}

const MUSCLE_GROUPS = [
    { key: 'mellkas', label: 'Mellkas', emoji: '🫁', color: '#ef4444' },
    { key: 'hát', label: 'Hát', emoji: '🔙', color: '#3b82f6' },
    { key: 'váll', label: 'Váll', emoji: '💪', color: '#8b5cf6' },
    { key: 'bicepsz', label: 'Bicepsz', emoji: '💪', color: '#06b6d4' },
    { key: 'tricepsz', label: 'Tricepsz', emoji: '💪', color: '#14b8a6' },
    { key: 'combnyújtó', label: 'Combnyújtó', emoji: '🦵', color: '#f59e0b' },
    { key: 'comhajlító', label: 'Comhajlító', emoji: '🦵', color: '#f97316' },
    { key: 'vádli', label: 'Vádli', emoji: '🦶', color: '#84cc16' },
    { key: 'core', label: 'Core', emoji: '🎯', color: '#ec4899' },
]

function classifyExercise(name: string): string[] {
    const lower = name.toLowerCase()
    for (const [key, groups] of Object.entries(MUSCLE_GROUP_MAP)) {
        if (lower.includes(key)) return groups
    }
    return ['egyéb']
}

export default function MuscleGroupSummary({ exerciseLogs }: MuscleGroupSummaryProps) {
    // Calculate volume per muscle group (sets × reps × weight)
    const volumeByGroup: Record<string, number> = {}
    const setsByGroup: Record<string, number> = {}

    exerciseLogs.forEach((log) => {
        const groups = classifyExercise(log.exerciseName)
        const volume = log.sets * log.avgReps * log.avgWeight
        groups.forEach((g) => {
            volumeByGroup[g] = (volumeByGroup[g] || 0) + volume
            setsByGroup[g] = (setsByGroup[g] || 0) + log.sets
        })
    })

    const maxVolume = Math.max(...Object.values(volumeByGroup), 1)

    // Push/Pull ratio
    const pushGroups = ['mellkas', 'váll', 'tricepsz']
    const pullGroups = ['hát', 'bicepsz']
    const pushVol = pushGroups.reduce((sum, g) => sum + (volumeByGroup[g] || 0), 0)
    const pullVol = pullGroups.reduce((sum, g) => sum + (volumeByGroup[g] || 0), 0)
    const pushPullRatio = pullVol > 0 ? Math.round((pushVol / pullVol) * 100) / 100 : 0

    // Upper/Lower ratio
    const upperGroups = ['mellkas', 'hát', 'váll', 'bicepsz', 'tricepsz']
    const lowerGroups = ['combnyújtó', 'comhajlító', 'vádli']
    const upperVol = upperGroups.reduce((sum, g) => sum + (volumeByGroup[g] || 0), 0)
    const lowerVol = lowerGroups.reduce((sum, g) => sum + (volumeByGroup[g] || 0), 0)
    const upperLowerRatio = lowerVol > 0 ? Math.round((upperVol / lowerVol) * 100) / 100 : 0

    const hasData = Object.keys(volumeByGroup).length > 0

    if (!hasData) return null

    return (
        <div
            className="animate-fade-in"
            style={{
                padding: '20px',
                borderRadius: 'var(--radius)',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
            }}
        >
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💪 Izomcsoport Összesítés
            </h3>

            {/* Volume Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {MUSCLE_GROUPS.map((mg) => {
                    const vol = volumeByGroup[mg.key] || 0
                    const sets = setsByGroup[mg.key] || 0
                    if (vol === 0) return null
                    const pct = (vol / maxVolume) * 100
                    return (
                        <div key={mg.key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text)' }}>
                                    {mg.emoji} {mg.label}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    {sets} szett · {Math.round(vol)} kg vol
                                </span>
                            </div>
                            <div style={{
                                height: '8px',
                                borderRadius: '4px',
                                background: 'rgba(255,255,255,0.06)',
                            }}>
                                <div style={{
                                    width: `${pct}%`,
                                    height: '100%',
                                    borderRadius: '4px',
                                    background: mg.color,
                                    transition: 'width 0.5s ease',
                                }} />
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Balance Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Push/Pull */}
                <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        Push / Pull arány
                    </div>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: pushPullRatio >= 0.8 && pushPullRatio <= 1.5 ? '#22c55e' : '#f59e0b',
                    }}>
                        {pushPullRatio || '–'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        optimális: 0.8 – 1.5
                    </div>
                </div>

                {/* Upper/Lower */}
                <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        Felső / Alsó test
                    </div>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: upperLowerRatio >= 1.0 && upperLowerRatio <= 2.0 ? '#22c55e' : '#f59e0b',
                    }}>
                        {upperLowerRatio || '–'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        optimális: 1.0 – 2.0
                    </div>
                </div>
            </div>
        </div>
    )
}
