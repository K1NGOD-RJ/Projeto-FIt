import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { normalizePlan } from '../lib/plan'
import { WEEKDAYS } from '../lib/util'
import { defaultPlan } from '../data/defaultPlan'

const blankExercise = () => ({ name: '', sets: '3', reps: '8–12', rest: '1 min 30', alts: [] })

export default function Plan() {
  const { profile, refreshProfile } = useAuth()
  const [plan, setPlan] = useState(() => normalizePlan(profile.plan))
  const [open, setOpen] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const update = (fn) => {
    setPlan((p) => { const next = structuredClone(p); fn(next); return next })
    setDirty(true)
  }

  function applyTemplate() {
    if (!confirm('Substituir seu plano pelo plano modelo?')) return
    setPlan(normalizePlan(structuredClone(defaultPlan)))
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    const clean = plan.map((d) => ({
      ...d,
      title: d.title.trim(),
      exercises: d.exercises.filter((ex) => ex.name.trim()).map((ex) => ({ ...ex, name: ex.name.trim() })),
    }))
    const { error } = await supabase.from('profiles').update({ plan: clean }).eq('id', profile.id)
    setSaving(false)
    if (error) return alert(error.message)
    setPlan(clean)
    setDirty(false)
    refreshProfile()
  }

  return (
    <>
      <header className="page-head row between">
        <h1>Plano</h1>
        <button className="btn small" onClick={applyTemplate}>Usar plano modelo</button>
      </header>
      <p className="muted small">Para copiar o plano de um amigo, abra o perfil dele em Amigos → Plano.</p>

      {plan.map((day, di) => (
        <section key={day.weekday} className="card">
          <button className="row between day-head" onClick={() => setOpen(open === di ? null : di)} aria-expanded={open === di}>
            <span>
              <span className="eyebrow">{WEEKDAYS[day.weekday]}</span>
              <span className="day-title">{day.exercises.length ? day.title || 'Sem nome' : 'Descanso'}</span>
            </span>
            <span className="muted small">{day.exercises.length || ''} {open === di ? '▴' : '▾'}</span>
          </button>

          {open === di && (
            <div className="stack">
              <label className="field">
                <span>Nome do treino</span>
                <input
                  value={day.title}
                  placeholder="Ex.: Peito"
                  onChange={(e) => update((p) => { p[di].title = e.target.value })}
                />
              </label>

              {day.exercises.map((ex, ei) => {
                const set = (key) => (e) => update((p) => { p[di].exercises[ei][key] = e.target.value })
                return (
                  <div key={ei} className="plan-ex">
                    <div className="row gap">
                      <input className="grow" value={ex.name} placeholder="Exercício" onChange={set('name')} />
                      <button
                        className="icon-btn"
                        disabled={ei === 0}
                        aria-label="Subir"
                        onClick={() => update((p) => { const list = p[di].exercises; [list[ei - 1], list[ei]] = [list[ei], list[ei - 1]] })}
                      >↑</button>
                      <button
                        className="icon-btn danger"
                        aria-label="Remover"
                        onClick={() => update((p) => { p[di].exercises.splice(ei, 1) })}
                      >×</button>
                    </div>
                    <div className="grid3">
                      <label className="field"><span>Séries</span><input value={ex.sets} onChange={set('sets')} /></label>
                      <label className="field"><span>Reps</span><input value={ex.reps} onChange={set('reps')} /></label>
                      <label className="field"><span>Descanso</span><input value={ex.rest} onChange={set('rest')} /></label>
                    </div>
                    <label className="field">
                      <span>Alternativas (separe por ;)</span>
                      <input
                        value={ex.alts.join('; ')}
                        onChange={(e) => update((p) => { p[di].exercises[ei].alts = e.target.value.split(';').map((a) => a.trimStart()) })}
                        onBlur={() => update((p) => { p[di].exercises[ei].alts = ex.alts.map((a) => a.trim()).filter(Boolean) })}
                      />
                    </label>
                  </div>
                )
              })}

              <button className="btn" onClick={() => update((p) => { p[di].exercises.push(blankExercise()) })}>
                + Exercício
              </button>
            </div>
          )}
        </section>
      ))}

      {dirty && (
        <div className="save-bar">
          <button className="btn primary block" onClick={save} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar plano'}
          </button>
        </div>
      )}
    </>
  )
}
