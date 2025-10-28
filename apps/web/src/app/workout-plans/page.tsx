import type { Metadata } from 'next'
import WorkoutPlanGenerator from '@/components/WorkoutPlanGenerator'

export const metadata: Metadata = {
  title: 'Workout Plan Generator',
  description: 'Generate three-week workout outlines tailored to your current goals.',
}

export default function WorkoutPlansPage() {
  return (
    <div className="min-h-screen bg-[#FFF5D6] px-4 py-12">
      <div className="mx-auto max-w-5xl rounded-[3rem] border-4 border-[#A0E7E5] bg-white/80 p-8 shadow-[18px_18px_0_0_#55C6C0]">
        <WorkoutPlanGenerator />
      </div>
    </div>
  )
}
