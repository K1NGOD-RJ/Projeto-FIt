// O treino em andamento fica salvo no aparelho, então fechar a aba não perde nada
import { setCount } from './util'

const KEY = 'treino:draft'

export function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(KEY))
  } catch {
    return null
  }
}

export function saveDraft(draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // sem armazenamento: o treino só vive enquanto a página estiver aberta
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nada a fazer
  }
}

const emptySet = () => ({ w: '', r: '', done: false })

export function exerciseFromPlan(ex) {
  return {
    name: ex.name,
    target: `${ex.sets} × ${ex.reps}`,
    reps: ex.reps,
    rest: ex.rest,
    alts: ex.alts || [],
    sets: Array.from({ length: setCount(ex.sets) }, emptySet),
  }
}

export function newExercise(name) {
  return { name, target: '', reps: '', rest: '', alts: [], sets: [emptySet(), emptySet(), emptySet()] }
}

export function draftFromPlanDay(day, date) {
  return { date, title: day.title || 'Treino livre', notes: '', exercises: day.exercises.map(exerciseFromPlan) }
}

// Reabre um treino salvo para editar
export function draftFromWorkout(w) {
  return {
    id: w.id,
    date: w.date,
    title: w.title,
    notes: w.notes || '',
    exercises: w.exercises.map((ex) => ({ alts: [], reps: '', rest: '', target: '', ...ex, sets: ex.sets.map((s) => ({ ...s, done: true })) })),
  }
}

export { emptySet }
