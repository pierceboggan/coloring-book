export type PlanGoal = 'endurance' | 'build' | 'fun'

export interface WorkoutDay {
  day: string
  session: string
  focus: string
}

export interface WorkoutWeek {
  label: string
  focus: string
  intensity: 'easy' | 'moderate' | 'hard'
  notes?: string
  days: WorkoutDay[]
}

export interface WorkoutPlan {
  title: string
  goal: string
  summary: string
  howToUse: string[]
  weeks: WorkoutWeek[]
}

const PRESET_PLANS: Record<PlanGoal, WorkoutPlan> = {
  endurance: {
    title: 'Endurance & Base Builder',
    goal: 'Build aerobic capacity and establish consistent mileage.',
    summary:
      'A steady, repeatable rhythm that gradually stretches your long efforts while keeping most sessions comfortably easy.',
    howToUse: [
      'Keep the easy days truly conversational and resist the urge to speed up.',
      'Log perceived effort (RPE 1-10 scale) after each workout to watch for creeping fatigue.',
      'Add gentle mobility or core work after the shorter runs if you have extra time.',
    ],
    weeks: [
      {
        label: 'Week 1',
        focus: 'Find your rhythm and reinforce aerobic efficiency.',
        intensity: 'easy',
        notes: 'Aim for 75-80% of the week at easy effort. Keep strides relaxed.',
        days: [
          { day: 'Monday', session: '30-minute easy run + 6 x 20s strides', focus: 'Gentle aerobic activation' },
          { day: 'Tuesday', session: '45-minute easy run', focus: 'Steady cadence and light form drills' },
          { day: 'Wednesday', session: 'Cross-train or rest', focus: 'Low-impact cardio or mobility' },
          { day: 'Thursday', session: '40-minute progression run (last 10 minutes steady)', focus: 'Controlled aerobic pickup' },
          { day: 'Friday', session: 'Recovery jog 25 minutes', focus: 'Shake out legs and reset' },
          { day: 'Saturday', session: 'Long run 60-70 minutes at easy pace', focus: 'Endurance and fueling practice' },
          { day: 'Sunday', session: 'Optional walk, yoga, or full rest', focus: 'Absorb training load' },
        ],
      },
      {
        label: 'Week 2',
        focus: 'Extend your long run and sprinkle controlled pickups.',
        intensity: 'moderate',
        notes: 'Stay hydrated and practice fueling on long day.',
        days: [
          { day: 'Monday', session: '35-minute easy run + 6 x 20s strides', focus: 'Leg turnover without fatigue' },
          { day: 'Tuesday', session: '50-minute aerobic run with final 5 minutes steady', focus: 'Aerobic strength' },
          { day: 'Wednesday', session: 'Cross-train (bike/elliptical) 35 minutes', focus: 'Maintain aerobic load with less impact' },
          { day: 'Thursday', session: '45-minute run including 4 x 3 min steady (2 min easy between)', focus: 'Aerobic support intervals' },
          { day: 'Friday', session: 'Recovery jog 25-30 minutes + mobility', focus: 'Reset and loosen up' },
          { day: 'Saturday', session: 'Long run 75-85 minutes easy', focus: 'Build durability and fueling routine' },
          { day: 'Sunday', session: 'Optional 20-minute brisk walk or rest', focus: 'Gentle movement to aid recovery' },
        ],
      },
      {
        label: 'Week 3',
        focus: 'Consolidate gains with a cutback for freshness.',
        intensity: 'easy',
        notes: 'Reduce volume slightly to absorb adaptation and prepare for next block.',
        days: [
          { day: 'Monday', session: '30-minute relaxed run + drills', focus: 'Smooth stride mechanics' },
          { day: 'Tuesday', session: '40-minute easy run', focus: 'Aerobic maintenance' },
          { day: 'Wednesday', session: 'Rest or light cross-train', focus: 'Full recovery' },
          { day: 'Thursday', session: '35-minute run with 6 x 1-minute uptempo (1-minute easy)', focus: 'Touch on speed without stress' },
          { day: 'Friday', session: 'Recovery jog 20-25 minutes', focus: 'Circulate blood and stay loose' },
          { day: 'Saturday', session: 'Long run 60 minutes easy', focus: 'Refresh endurance without overload' },
          { day: 'Sunday', session: 'Rest, yoga, or easy walk', focus: 'Mental recharge' },
        ],
      },
    ],
  },
  build: {
    title: 'Build & Strength Cycle',
    goal: 'Introduce focused intensity while protecting recovery.',
    summary:
      'A balanced progression that layers tempo work and muscular strength to spark fitness gains without overreaching.',
    howToUse: [
      'Complete a dynamic warm-up before every quality session.',
      'Rate the hardest set each day; if recovery is lagging, skip the optional finisher.',
      'Fuel within 30 minutes post-workout to support muscle repair.',
    ],
    weeks: [
      {
        label: 'Week 1',
        focus: 'Lay the foundation with controlled tempo work.',
        intensity: 'moderate',
        notes: 'Keep tempo effort at a “comfortably hard” pace where conversation is limited.',
        days: [
          { day: 'Monday', session: 'Easy 30-minute run + 4 x 20s hill strides', focus: 'Prime legs for the week' },
          { day: 'Tuesday', session: '6 x 4-minute tempo (2-minute jog)', focus: 'Strengthen threshold' },
          { day: 'Wednesday', session: 'Mobility + 30-minute low-impact cross-train', focus: 'Circulation without impact' },
          { day: 'Thursday', session: 'Strength circuit: 3 rounds (lunges, step-ups, planks, band pulls)', focus: 'Muscular endurance' },
          { day: 'Friday', session: 'Recovery jog 25 minutes', focus: 'Flush out residual fatigue' },
          { day: 'Saturday', session: 'Long run 80 minutes with final 15 minutes steady', focus: 'Progressive endurance' },
          { day: 'Sunday', session: 'Rest or gentle yoga', focus: 'Full system reset' },
        ],
      },
      {
        label: 'Week 2',
        focus: 'Add muscular power while keeping recovery sacred.',
        intensity: 'hard',
        notes: 'Sleep 8+ hours and emphasize protein intake.',
        days: [
          { day: 'Monday', session: 'Easy 35-minute run + drills', focus: 'Smooth mechanics' },
          { day: 'Tuesday', session: '4 x (5-minute tempo + 4 x 30s hill sprints)', focus: 'Tempo + power blend' },
          { day: 'Wednesday', session: 'Strength: 4 rounds (deadlifts, single-leg squats, push presses, core plank series)', focus: 'Total-body strength' },
          { day: 'Thursday', session: '40-minute aerobic run', focus: 'Maintain volume at low intensity' },
          { day: 'Friday', session: 'Rest or mobility session', focus: 'Absorb muscular work' },
          { day: 'Saturday', session: 'Long run 90 minutes with rolling hills', focus: 'Strength-endurance and terrain practice' },
          { day: 'Sunday', session: 'Optional brisk walk or easy spin 30 minutes', focus: 'Light recovery stimulus' },
        ],
      },
      {
        label: 'Week 3',
        focus: 'Deload while keeping neuromuscular touch.',
        intensity: 'easy',
        notes: 'Back off volume by ~20% and feel sharp, not tired.',
        days: [
          { day: 'Monday', session: '30-minute easy run', focus: 'Relaxed movement' },
          { day: 'Tuesday', session: '3 x 8-minute tempo (2-minute jog)', focus: 'Shorter threshold stimulus' },
          { day: 'Wednesday', session: 'Strength maintenance: 2 rounds bodyweight circuit', focus: 'Keep muscles activated' },
          { day: 'Thursday', session: '35-minute aerobic run + 6 x 20s strides', focus: 'Leg speed without stress' },
          { day: 'Friday', session: 'Rest or mobility flow', focus: 'Soft tissue care' },
          { day: 'Saturday', session: 'Long run 70 minutes relaxed', focus: 'Refresh endurance' },
          { day: 'Sunday', session: 'Rest day', focus: 'Mentally reset for next block' },
        ],
      },
    ],
  },
  fun: {
    title: 'Have-Fun Adventure Mix',
    goal: 'Keep training playful with variety and social energy.',
    summary:
      'A flexible, good-vibes block that sprinkles in games, group sessions, and movement that keeps you smiling.',
    howToUse: [
      'Treat the structure as a menu—swap days around to match social plans.',
      'Capture a fun photo or note after each session to celebrate the highlight.',
      'If fatigue creeps in, downgrade intensity but keep the joyful element.',
    ],
    weeks: [
      {
        label: 'Week 1',
        focus: 'Play with pacing and explore new routes.',
        intensity: 'moderate',
        notes: 'Invite friends along and keep things light-hearted.',
        days: [
          { day: 'Monday', session: 'Group fun run 40 minutes + coffee cooldown', focus: 'Social connection' },
          { day: 'Tuesday', session: 'Trail adventure: 45-minute run with photo stops', focus: 'Exploration and agility' },
          { day: 'Wednesday', session: 'Dance class or cardio class of choice', focus: 'Movement joy' },
          { day: 'Thursday', session: 'Fartlek: 8 x 1-minute “pick a landmark” surge (1-minute easy)', focus: 'Unstructured speed play' },
          { day: 'Friday', session: 'Active recovery: 20-minute bike spin + stretching', focus: 'Stay loose and playful' },
          { day: 'Saturday', session: 'Park relay with friends (take turns running short loops)', focus: 'Friendly competition' },
          { day: 'Sunday', session: 'Rest + picnic walk', focus: 'Recharge with joy' },
        ],
      },
      {
        label: 'Week 2',
        focus: 'Add creative cross-training and mini challenges.',
        intensity: 'moderate',
        notes: 'Document your favorite moment each day.',
        days: [
          { day: 'Monday', session: 'Easy jog 35 minutes finishing with 5-minute gratitude walk', focus: 'Mindful movement' },
          { day: 'Tuesday', session: 'Track night: 12 x 200m at relaxed speed with friends', focus: 'Speed play in a group' },
          { day: 'Wednesday', session: 'Adventure cross-train (paddleboard, rock gym, etc.)', focus: 'Novel skill work' },
          { day: 'Thursday', session: 'Tempo treasure hunt: 3 x 8-minute steady finding landmarks', focus: 'Steady focus with fun twist' },
          { day: 'Friday', session: 'Rest or gentle yoga + playlist party', focus: 'Reset and enjoy music' },
          { day: 'Saturday', session: 'Destination long run 70 minutes with brunch finish', focus: 'Community + endurance' },
          { day: 'Sunday', session: 'Family walk, hike, or game day', focus: 'Active recovery and connection' },
        ],
      },
      {
        label: 'Week 3',
        focus: 'Celebrate consistency with a themed week.',
        intensity: 'easy',
        notes: 'Dress up, invite new friends, and keep everything light.',
        days: [
          { day: 'Monday', session: 'Costume run 30 minutes', focus: 'Laughter and community' },
          { day: 'Tuesday', session: 'Sunrise intervals: 6 x 2 minutes strong (2 minutes easy)', focus: 'Invigorating start' },
          { day: 'Wednesday', session: 'Rest or spa evening', focus: 'Treat yourself' },
          { day: 'Thursday', session: 'Scavenger hunt run with 6 check-in points', focus: 'Teamwork and curiosity' },
          { day: 'Friday', session: 'Active recovery: 30-minute swim or aqua jog', focus: 'Low-impact fun' },
          { day: 'Saturday', session: 'Adventure day—choose any joyful activity 60-90 minutes', focus: 'Follow enthusiasm' },
          { day: 'Sunday', session: 'Reflection walk + journal', focus: 'Celebrate the memories' },
        ],
      },
    ],
  },
}

export function isPlanGoal(goal: string): goal is PlanGoal {
  return goal === 'endurance' || goal === 'build' || goal === 'fun'
}

export function getWorkoutPlan(goal: PlanGoal): WorkoutPlan {
  return PRESET_PLANS[goal]
}

