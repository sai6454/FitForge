'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('male')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [goal, setGoal] = useState('fat_loss')
  const [workoutType, setWorkoutType] = useState('home')
  const [weeklyDays, setWeeklyDays] = useState(3)

  const router = useRouter()

  const handleSubmit = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('profiles').upsert({
  id: user.id,
  age: Number(age),
  gender,
  height_cm: Number(height),
  weight_kg: Number(weight),
  goal,
  workout_type: workoutType,
  weekly_days: weeklyDays
})

    router.push('/dashboard')
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-96 space-y-3">
        <h1 className="text-xl font-bold">Complete Your Profile</h1>

        <input className="border p-2 w-full" placeholder="Age" onChange={(e)=>setAge(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Height (cm)" onChange={(e)=>setHeight(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Weight (kg)" onChange={(e)=>setWeight(e.target.value)} />

        <select className="border p-2 w-full" onChange={(e)=>setGender(e.target.value)}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <select className="border p-2 w-full" onChange={(e)=>setGoal(e.target.value)}>
          <option value="fat_loss">Fat Loss</option>
          <option value="muscle_gain">Muscle Gain</option>
          <option value="maintain">Maintain</option>
        </select>

        <select className="border p-2 w-full" onChange={(e)=>setWorkoutType(e.target.value)}>
          <option value="home">Home</option>
          <option value="gym">Gym</option>
        </select>

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white p-2"
        >
          Save & Continue
        </button>
      </div>
    </div>
  )
}