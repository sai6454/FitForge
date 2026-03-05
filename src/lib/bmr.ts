type BMRInput = {
  weight: number
  height: number
  age: number
  gender: 'male' | 'female'
  weeklyDays: number
}

export function calculateBMR(data: BMRInput) {
  const { weight, height, age, gender, weeklyDays } = data

  let bmr =
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161

  let multiplier = 1.2
  if (weeklyDays === 3) multiplier = 1.375
  if (weeklyDays >= 4 && weeklyDays <= 5) multiplier = 1.55
  if (weeklyDays >= 6) multiplier = 1.725

  const maintenance = Math.round(bmr * multiplier)

  return {
    maintenance,
    fatLoss: maintenance - 400,
    muscleGain: maintenance + 250,
    protein: Math.round(weight * 1.8)
  }
}