import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { draftFromWorkout, loadDraft, saveDraft } from '../lib/draft'
import { normalizePlan, planIsEmpty } from '../lib/plan'
import { WEEKDAYS, formatDate } from '../lib/util'
import WorkoutCard from '../components/WorkoutCard'

export default function Person() {
  const { id } = useParams()
  const { profile: me, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const isMe = id === me.id
  const [person, setPerson] = useState(null)
  const [workouts, setWorkouts] = useState(null)
  const [tab, setTab] = useState('treinos')

  useEffect(() => {
    setTab('treinos')
    setPerson(null)
    setWorkouts(null)
    supabase.from('profiles').select('*').eq('id', id).single().then(({ data }) => setPerson(data))
    supabase
      .from('workouts')
      .select('*')
      .eq('user_id', id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => setWorkouts(data || []))
  }, [id])

  if (!person) return <p className="muted center">Carregando…</p>

  function edit(w) {
    if (loadDraft() && !confirm('Isso substitui o treino em andamento. Continuar?')) return
    saveDraft(draftFromWorkout(w))
    navigate('/treino')
  }

  async function remove(w) {
    if (!confirm(`Apagar "${w.title}"?`)) return
    const { error } = await supabase.from('workouts').delete().eq('id', w.id)
    if (error) return alert(error.message)
    setWorkouts(workouts.filter((x) => x.id !== w.id))
  }

  async function rename() {
    const name = prompt('Seu nome', me.name)?.trim()
    if (!name) return
    await supabase.from('profiles').update({ name }).eq('id', me.id)
    setPerson({ ...person, name })
    refreshProfile()
  }

  async function copyPlan() {
    if (!confirm(`Substituir seu plano pelo de ${person.name}?`)) return
    const { error } = await supabase.from('profiles').update({ plan: person.plan }).eq('id', me.id)
    if (error) return alert(error.message)
    await refreshProfile()
    navigate('/plano')
  }

  return (
    <>
      <header className="page-head row between">
        <div className="row gap">
          <span className="avatar large">{person.name[0]?.toUpperCase()}</span>
          <div>
            <h1>{isMe ? 'Histórico' : person.name}</h1>
            <p className="muted small">{workouts ? `${workouts.length} treinos` : ' '}</p>
          </div>
        </div>
        {isMe && (
          <div className="row gap">
            <button className="btn small" onClick={rename}>Nome</button>
            <button className="btn small" onClick={() => supabase.auth.signOut()}>Sair</button>
          </div>
        )}
      </header>

      <div className="segmented">
        {['treinos', 'progresso', 'plano'].map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {workouts === null ? (
        <p className="muted center">Carregando…</p>
      ) : tab === 'treinos' ? (
        workouts.length ? (
          workouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onEdit={isMe ? () => edit(w) : undefined}
              onDelete={isMe ? () => remove(w) : undefined}
            />
          ))
        ) : (
          <p className="muted center">Nenhum treino registrado ainda.</p>
        )
      ) : tab === 'progresso' ? (
        <Progress workouts={workouts} />
      ) : (
        <PlanView plan={person.plan} onCopy={isMe ? null : copyPlan} />
      )}
    </>
  )
}

// Para cada exercício: carga máxima da primeira vez, da última e o recorde
function Progress({ workouts }) {
  const map = new Map()
  for (const w of [...workouts].reverse()) {
    for (const ex of w.exercises) {
      const top = Math.max(...ex.sets.map((s) => Number(s.w) || 0))
      const entry = map.get(ex.name) || { name: ex.name, first: top, best: 0, count: 0 }
      entry.last = top
      entry.lastDate = w.date
      entry.best = Math.max(entry.best, top)
      entry.count++
      map.set(ex.name, entry)
    }
  }
  const rows = [...map.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate))
  if (!rows.length) return <p className="muted center">Sem dados ainda.</p>

  return (
    <section className="card">
      <ul className="plain-list">
        {rows.map((r) => {
          const diff = r.last - r.first
          return (
            <li key={r.name}>
              <div className="row between">
                <span>{r.name}</span>
                <span className="nowrap">
                  {r.last ? `${r.last} kg` : '—'}
                  {diff !== 0 && <span className={diff > 0 ? 'up' : 'down'}> {diff > 0 ? '+' : ''}{diff}</span>}
                </span>
              </div>
              <span className="muted small">
                {r.count}× · recorde {r.best} kg · {formatDate(r.lastDate)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function PlanView({ plan, onCopy }) {
  if (planIsEmpty(plan)) return <p className="muted center">Sem plano cadastrado.</p>
  return (
    <>
      {normalizePlan(plan).filter((d) => d.exercises.length).map((d) => (
        <section key={d.weekday} className="card">
          <p className="eyebrow">{WEEKDAYS[d.weekday]}</p>
          <h3>{d.title}</h3>
          <ul className="plain-list">
            {d.exercises.map((ex, i) => (
              <li key={i} className="row between">
                <span>{ex.name}</span>
                <span className="muted small nowrap">{ex.sets} × {ex.reps}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {onCopy && <button className="btn block" onClick={onCopy}>Copiar este plano para mim</button>}
    </>
  )
}
