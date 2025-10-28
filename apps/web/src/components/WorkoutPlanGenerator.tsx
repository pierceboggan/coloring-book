'use client'

import { useState } from 'react'
import { Activity, Dumbbell, PartyPopper, Loader2 } from 'lucide-react'
import type { PlanGoal, WorkoutPlan } from '@/lib/workoutPlans'

interface GoalOption {
  value: PlanGoal
  label: string
  tagline: string
  highlight: string
  icon: React.ComponentType<{ className?: string }>
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'endurance',
    label: 'Endurance / Base',
    tagline: 'Build your aerobic engine',
    highlight: 'Perfect for long-term consistency and durability.',
    icon: Activity,
  },
  {
    value: 'build',
    label: 'Build & Strength',
    tagline: 'Layer in purposeful intensity',
    highlight: 'Add tempo work and strength without burning out.',
    icon: Dumbbell,
  },
  {
    value: 'fun',
    label: 'Have Fun',
    tagline: 'Keep things playful',
    highlight: 'Mix up the routine and stay motivated with variety.',
    icon: PartyPopper,
  },
]

export default function WorkoutPlanGenerator() {
  const [selectedGoal, setSelectedGoal] = useState<PlanGoal | null>(null)
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGeneratePlan = async () => {
    if (!selectedGoal) {
      setError('Pick a goal to get a tailored plan.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-workout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: selectedGoal }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error ?? 'Unexpected error generating plan.'
        throw new Error(message)
      }

      const data = await response.json()
      setPlan(data.plan)
    } catch (fetchError) {
      console.error(fetchError)
      setPlan(null)
      setError(fetchError instanceof Error ? fetchError.message : 'Something went wrong. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1DB9B3]">Workout planner</p>
        <h1 className="text-4xl font-extrabold text-[#3A2E39]">Choose your training vibe</h1>
        <p className="mx-auto max-w-2xl text-base text-[#594144]">
          Start with a goal, then download a curated three-week outline with daily prompts, focus areas, and recovery cues.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {GOAL_OPTIONS.map((option) => {
          const Icon = option.icon
          const isSelected = option.value === selectedGoal

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedGoal(option.value)}
              className={`relative flex h-full flex-col items-start gap-3 rounded-[1.75rem] border-4 px-5 py-6 text-left transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#55C6C0] ${
                isSelected
                  ? 'border-[#55C6C0] bg-[#E0F7FA]/90 shadow-[12px_12px_0_0_#55C6C0]/40'
                  : 'border-[#FFB3BA] bg-white/90 shadow-[10px_10px_0_0_#FFB3BA]/30'
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white bg-[#FF6F91] text-white shadow-inner">
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6F91]">{option.tagline}</p>
                <p className="text-xl font-extrabold text-[#3A2E39]">{option.label}</p>
              </div>
              <p className="text-sm text-[#594144]">{option.highlight}</p>
              {isSelected && (
                <span className="absolute right-4 top-4 rounded-full border-2 border-[#55C6C0] bg-white px-3 py-1 text-xs font-semibold text-[#1DB9B3]">
                  Selected
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-[#594144]">Pick a vibe, then generate a plan tailored to that focus.</p>
        <button
          type="button"
          onClick={handleGeneratePlan}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full border-4 border-[#A0E7E5] bg-[#55C6C0] px-6 py-3 font-semibold text-white shadow-[8px_8px_0_0_#1DB9B3] transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate my plan'
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-[#FF6F91] bg-[#FFE6EB] px-4 py-3 text-sm font-semibold text-[#FF6F91]">
          {error}
        </div>
      )}

      {plan && (
        <section className="space-y-6 rounded-[2rem] border-4 border-[#A0E7E5] bg-white/90 p-6 shadow-[12px_12px_0_0_#55C6C0]/30">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1DB9B3]">{plan.goal}</p>
            <h2 className="text-3xl font-extrabold text-[#3A2E39]">{plan.title}</h2>
            <p className="text-sm text-[#594144]">{plan.summary}</p>
          </header>

          <div className="grid gap-3 md:grid-cols-3">
            {plan.howToUse.map((tip, index) => (
              <div
                key={index}
                className="rounded-2xl border-2 border-dashed border-[#FFB3BA] bg-[#FFF3BF]/60 px-4 py-3 text-sm font-medium text-[#594144]"
              >
                {tip}
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {plan.weeks.map((week) => (
              <article
                key={week.label}
                className="space-y-4 rounded-[1.75rem] border-4 border-[#FFB3BA] bg-[#FFE6EB]/80 p-5"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6F91]">{week.label}</p>
                    <h3 className="text-xl font-extrabold text-[#3A2E39]">{week.focus}</h3>
                  </div>
                  <span className="inline-flex items-center rounded-full border-2 border-[#FFB3BA] bg-white px-3 py-1 text-xs font-semibold text-[#FF6F91]">
                    {week.intensity.charAt(0).toUpperCase() + week.intensity.slice(1)} week
                  </span>
                </div>
                {week.notes && (
                  <p className="rounded-2xl border-2 border-dashed border-[#A0E7E5] bg-[#E0F7FA]/60 px-4 py-2 text-sm text-[#1DB9B3]">
                    {week.notes}
                  </p>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  {week.days.map((day) => (
                    <div
                      key={day.day}
                      className="rounded-2xl border-2 border-[#FFB3BA] bg-white/90 px-4 py-3 shadow-[6px_6px_0_0_#FFB3BA]/30"
                    >
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#FF6F91]">{day.day}</p>
                      <p className="mt-1 text-sm font-semibold text-[#3A2E39]">{day.session}</p>
                      <p className="mt-1 text-xs text-[#594144]">{day.focus}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
