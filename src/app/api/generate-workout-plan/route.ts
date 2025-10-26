import { NextRequest, NextResponse } from 'next/server'
import { getWorkoutPlan, isPlanGoal } from '@/lib/workoutPlans'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const goal = body?.goal

    if (typeof goal !== 'string' || !isPlanGoal(goal)) {
      return NextResponse.json({ error: 'Please choose a valid plan goal.' }, { status: 400 })
    }

    const plan = getWorkoutPlan(goal)
    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Failed to build workout plan', error)
    return NextResponse.json({ error: 'Unable to generate workout plan. Please try again.' }, { status: 500 })
  }
}
