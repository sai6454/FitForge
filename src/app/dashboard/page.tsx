'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calculateBMR } from '@/lib/bmr'
import { useRouter } from 'next/navigation'
import { Flame, Dumbbell, Scale, Target, Trophy } from "lucide-react"

import {
LineChart,
Line,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer
} from "recharts"

export default function Dashboard(){

const [profile,setProfile] = useState<any>(null)
const [calories,setCalories] = useState<any>(null)
const [weightData,setWeightData] = useState<any[]>([])
const [newWeight,setNewWeight] = useState('')
const [goalWeight,setGoalWeight] = useState('')

const [goal,setGoal] = useState("fat_loss")
const [location,setLocation] = useState("home")
const [duration,setDuration] = useState(15)

const [generatedWorkout,setGeneratedWorkout] = useState<string[]>([])

const router = useRouter()

// LOAD WEIGHT HISTORY
const loadWeightData = async(userId:string)=>{

const {data} = await supabase
.from("weight_logs")
.select("*")
.eq("user_id",userId)
.order("logged_at",{ascending:true})

if(!data) return

const formatted = data.map((w)=>({
date:new Date(w.logged_at).toLocaleString(),
weight:w.weight
}))

setWeightData(formatted)

}

// FETCH PROFILE
const fetchProfile = async () => {

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    router.push('/auth')
    return
  }

  const user = session.user

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error(error)
    return
  }

  if (!data) {
    router.push('/onboarding')
    return
  }

  setProfile(data)

  await loadWeightData(user.id)

  const result = calculateBMR({
    weight: data.weight_kg,
    height: data.height_cm,
    age: data.age,
    gender: data.gender,
    weeklyDays: data.weekly_days
  })

  setCalories(result)
}

useEffect(()=>{
fetchProfile()
},[])

// LOGOUT
const handleLogout = async()=>{
await supabase.auth.signOut()
router.push('/auth')
}

// SAVE GOAL WEIGHT
const saveGoalWeight = async()=>{

const {data:{user}} = await supabase.auth.getUser()
if(!user) return

await supabase
.from('profiles')
.update({goal_weight:Number(goalWeight)})
.eq('id',user.id)

}

// WORKOUT GENERATOR
const generateWorkout = ()=>{

const last = profile?.last_muscle_group || "legs"

let next = "push"

if(last==="push") next="pull"
if(last==="pull") next="legs"
if(last==="legs") next="push"

let workout:string[]=[]

// workout size based on duration
let sets = 3
if(duration===30) sets=4
if(duration===45) sets=5

if(location==="home"){

if(next==="push"){
workout=[
`Pushups - ${sets} sets`,
`Pike Pushups - ${sets} sets`,
`Diamond Pushups - ${sets-1} sets`
]
}

if(next==="pull"){
workout=[
`Superman Hold - ${sets} sets`,
`Resistance Band Row - ${sets} sets`,
`Reverse Snow Angels - ${sets-1} sets`
]
}

if(next==="legs"){
workout=[
`Squats - ${sets} sets`,
`Lunges - ${sets} sets`,
`Glute Bridge - ${sets} sets`
]
}

}

if(location==="gym"){

if(next==="push"){
workout=[
`Bench Press - ${sets} sets`,
`Shoulder Press - ${sets} sets`,
`Tricep Pushdown - ${sets-1} sets`
]
}

if(next==="pull"){
workout=[
`Deadlift - ${sets} sets`,
`Lat Pulldown - ${sets} sets`,
`Bicep Curl - ${sets-1} sets`
]
}

if(next==="legs"){
workout=[
`Squats - ${sets} sets`,
`Leg Press - ${sets} sets`,
`Leg Curl - ${sets-1} sets`
]
}

}

if(goal==="fat_loss"){
workout.push("🚶 Walk 10,000 steps today")
}

setGeneratedWorkout(workout)

}

// WORKOUT COMPLETE
const handleWorkoutComplete = async()=>{

const {data:{user}} = await supabase.auth.getUser()
if(!user) return

const today = new Date().toISOString().split('T')[0]

let newStreak = profile.current_streak
const lastDate = profile.last_workout_date

if(!lastDate) newStreak=1
else{

const diff=Math.floor(
(new Date(today).getTime()-new Date(lastDate).getTime())/
(1000*60*60*24)
)

if(diff===1) newStreak=profile.current_streak+1
if(diff>2) newStreak=1
if(diff===0){
alert("Workout already logged today")
return
}

}

let newMuscle="push"

if(profile.last_muscle_group==="push") newMuscle="pull"
if(profile.last_muscle_group==="pull") newMuscle="legs"
if(profile.last_muscle_group==="legs") newMuscle="push"

await supabase
.from('profiles')
.update({
current_streak:newStreak,
last_workout_date:today,
last_muscle_group:newMuscle
})
.eq('id',user.id)

setProfile({
...profile,
current_streak:newStreak,
last_workout_date:today,
last_muscle_group:newMuscle
})

alert("Workout completed 🔥")

}

// UPDATE WEIGHT
const handleWeightUpdate = async()=>{

const {data:{user}} = await supabase.auth.getUser()
if(!user||!newWeight) return

const weightNumber = Number(newWeight)

await supabase.from("weight_logs").insert({
user_id:user.id,
weight:weightNumber
})

await supabase
.from("profiles")
.update({weight_kg:weightNumber})
.eq("id",user.id)

setProfile({...profile,weight_kg:weightNumber})

const updatedCalories = calculateBMR({
weight:weightNumber,
height:profile.height_cm,
age:profile.age,
gender:profile.gender,
weeklyDays:profile.weekly_days
})

setCalories(updatedCalories)

await loadWeightData(user.id)

setNewWeight('')
}

// GOAL PROGRESS
const progress =
goalWeight ?
Math.max(
0,
Math.min(
100,
((profile.weight_kg-Number(goalWeight))/profile.weight_kg)*100
)
)
:0

// TOOLTIP
const CustomTooltip=({active,payload,label}:any)=>{
if(active&&payload&&payload.length){
return(
<div className="bg-zinc-800 p-3 rounded-lg text-white">
<p>{label}</p>
<p className="text-green-400">Weight: {payload[0].value} kg</p>
</div>
)}
return null
}

if (!profile) {
  return <p className="p-6 text-white">Loading dashboard...</p>
}
return(

<div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white space-y-6">

{/* HEADER */}

<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">

<h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
<Dumbbell className="text-green-400"/>
FitForge Dashboard
</h1>

<button
onClick={handleLogout}
className="bg-red-500 px-4 py-2 rounded-lg"
>
Logout
</button>

</div>

{/* STAT CARDS */}

<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

<div className="bg-zinc-900 p-5 rounded-xl flex justify-between">
<div>
<p className="text-zinc-400 text-sm">Calories</p>
<p className="text-xl font-bold">{calories.maintenance}</p>
</div>
<Target/>
</div>

<div className="bg-zinc-900 p-5 rounded-xl flex justify-between">
<div>
<p className="text-zinc-400 text-sm">Streak</p>
<p className="text-xl font-bold">{profile.current_streak}</p>
</div>
<Flame/>
</div>

<div className="bg-zinc-900 p-5 rounded-xl flex justify-between">
<div>
<p className="text-zinc-400 text-sm">Weight</p>
<p className="text-xl font-bold">{profile.weight_kg} kg</p>
</div>
<Scale/>
</div>

</div>

{/* GOAL */}

<div className="bg-zinc-900 p-6 rounded-xl space-y-3">

<h2 className="font-semibold">Weight Goal</h2>

<input
type="number"
value={goalWeight}
onChange={(e)=>setGoalWeight(e.target.value)}
className="bg-zinc-800 p-2 rounded w-full"
/>

<button
onClick={saveGoalWeight}
className="bg-green-600 px-4 py-2 rounded"
>
Save Goal
</button>

<div className="w-full bg-zinc-800 h-4 rounded">

<div
className="bg-green-500 h-4 rounded"
style={{width:`${progress}%`}}
/>

</div>

</div>

{/* WORKOUT */}

<div className="bg-zinc-900 p-6 rounded-xl space-y-4">

<h2 className="font-semibold">Smart Workout Planner</h2>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

<select
value={goal}
onChange={(e)=>setGoal(e.target.value)}
className="bg-zinc-800 p-2 rounded"
>
<option value="fat_loss">Fat Loss</option>
<option value="muscle_gain">Muscle Gain</option>
</select>

<select
value={location}
onChange={(e)=>setLocation(e.target.value)}
className="bg-zinc-800 p-2 rounded"
>
<option value="home">Home</option>
<option value="gym">Gym</option>
</select>

<select
value={duration}
onChange={(e)=>setDuration(Number(e.target.value))}
className="bg-zinc-800 p-2 rounded"
>
<option value={15}>15 min</option>
<option value={30}>30 min</option>
<option value={45}>45 min</option>
</select>

</div>

<button
onClick={generateWorkout}
className="bg-blue-600 px-4 py-2 rounded"
>
Generate Workout
</button>

<ul className="list-disc pl-5">

{generatedWorkout.map((w,i)=>(
<li key={i}>{w}</li>
))}

</ul>

{goal==="fat_loss"&&(

<button
className="bg-yellow-500 px-4 py-2 rounded"
onClick={()=>alert("Steps verified")}
>
Verify 10k Steps
</button>

)}

<button
onClick={handleWorkoutComplete}
className="bg-green-500 px-4 py-2 rounded"
>
Complete Workout
</button>

</div>

{/* GRAPH */}

<div className="bg-zinc-900 p-6 rounded-xl">

<h2 className="font-semibold mb-4">Weight Progress</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={weightData}>

<XAxis dataKey="date"/>

<YAxis/>

<Tooltip content={<CustomTooltip/>}/>

<Line
type="natural"
dataKey="weight"
stroke="#22c55e"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>

</div>

)
}