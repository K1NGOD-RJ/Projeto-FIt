export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// Data local em YYYY-MM-DD (toISOString usaria UTC e erraria o dia à noite)
export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(iso) {
  const days = Math.round((parseDate(today()) - parseDate(iso)) / 86400000)
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  return parseDate(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Segunda-feira da semana atual, em YYYY-MM-DD
export function weekStart() {
  const d = parseDate(today())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// "2–3 min" → 120, "1 min 30" → 90, "45 s" → 45
export function parseRest(text = '') {
  const min = text.match(/(\d+)(?:\s*[–-]\s*\d+)?\s*min(?:\s*(\d+))?/)
  if (min) return Number(min[1]) * 60 + Number(min[2] || 0)
  const sec = text.match(/(\d+)\s*s/)
  return sec ? Number(sec[1]) : 90
}

// "8–12" → 12 (topo da faixa)
export function repsTop(text = '') {
  const nums = String(text).match(/\d+/g)
  return nums ? Number(nums[nums.length - 1]) : null
}

// "3" → 3, "2 por perna" → 2, "2–3" → 2
export function setCount(text) {
  return parseInt(text, 10) || 3
}

export function formatTimer(seconds) {
  const s = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function stats(exercises) {
  let sets = 0
  let volume = 0
  for (const ex of exercises) {
    for (const s of ex.sets) {
      sets++
      volume += (Number(s.w) || 0) * (Number(s.r) || 0)
    }
  }
  return { sets, volume: Math.round(volume) }
}

export const formatKg = (n) => n.toLocaleString('pt-BR')

export const formatSet = (s) => (s.w ? `${s.w}×${s.r}` : `${s.r}`)
