import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { WEEKDAYS, today } from '../lib/util'
import { normalizePlan, planIsEmpty } from '../lib/plan'
import { clearDraft, draftFromPlanDay, loadDraft, saveDraft } from '../lib/draft'

export default function Train() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const plan = normalizePlan(profile.plan)
  const [weekday, setWeekday] = useState(new Date().getDay())
  const [draft, setDraft] = useState(loadDraft)
  const day = plan.find((d) => d.weekday === weekday)
  const isToday = weekday === new Date().getDay()

  function start(d) {
    saveDraft(draftFromPlanDay(d, today()))
    navigate('/treino')
  }

  function discard() {
    if (!confirm('Descartar o treino em andamento?')) return
    clearDraft()
    setDraft(null)
  }

  return (
    <>
      <header className="page-head">
        <p className="eyebrow">{WEEKDAYS[new Date().getDay()]}</p>
        <h1>Olá, {profile.name}</h1>
      </header>

      {draft && (
        <section className="card highlight">
          <p className="eyebrow">Em andamento</p>
          <h2>{draft.title}</h2>
          <p className="muted small">{draft.exercises.length} exercícios</p>
          <div className="row gap">
            <Link to="/treino" className="btn primary grow">Continuar</Link>
            <button className="btn" onClick={discard}>Descartar</button>
          </div>
        </section>
      )}

      {planIsEmpty(plan) ? (
        <section className="card center stack">
          <p>Você ainda não tem um plano.</p>
          <Link to="/plano" className="btn primary">Montar meu plano</Link>
          <button className="link" onClick={() => start({ title: 'Treino livre', exercises: [] })}>
            Ou registrar um treino livre
          </button>
        </section>
      ) : (
        <>
          <div className="chips scroll">
            {plan.map((d) => (
              <button
                key={d.weekday}
                className={`chip ${d.weekday === weekday ? 'active' : ''} ${d.exercises.length ? '' : 'faded'}`}
                onClick={() => setWeekday(d.weekday)}
              >
                {WEEKDAYS[d.weekday].slice(0, 3)}
              </button>
            ))}
          </div>

          <section className="card">
            <p className="eyebrow">{isToday ? 'Hoje' : WEEKDAYS[weekday]}</p>
            {day.exercises.length ? (
              <>
                <h2>{day.title}</h2>
                <ul className="plain-list">
                  {day.exercises.map((ex, i) => (
                    <li key={i} className="row between">
                      <span>{ex.name}</span>
                      <span className="muted small nowrap">{ex.sets} × {ex.reps}</span>
                    </li>
                  ))}
                </ul>
                <button className="btn primary block" onClick={() => start(day)}>
                  Começar treino
                </button>
              </>
            ) : (
              <>
                <h2>Descanso</h2>
                <p className="muted">Nada planejado para este dia.</p>
              </>
            )}
          </section>

          <button className="link center-block" onClick={() => start({ title: 'Treino livre', exercises: [] })}>
            Registrar treino livre
          </button>
        </>
      )}
    </>
  )
}
