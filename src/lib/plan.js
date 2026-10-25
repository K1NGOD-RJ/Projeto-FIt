// Sempre 7 dias, de segunda a domingo
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export function normalizePlan(plan = []) {
  return WEEK_ORDER.map((weekday) => {
    const day = plan.find((d) => d.weekday === weekday)
    return { weekday, title: day?.title || '', exercises: day?.exercises || [] }
  })
}

export const planIsEmpty = (plan = []) => plan.every((d) => !d.exercises?.length)
