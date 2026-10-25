import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { clearDraft, emptySet, loadDraft, newExercise, saveDraft } from '../lib/draft'
import { formatSet, parseRest, repsTop } from '../lib/util'
import RestTimer from '../components/RestTimer'

export default function Workout() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(loadDraft)
  const [last, setLast] = useState({}) // nome do exercício → séries da última vez
  const [timer, setTimer] = useState(null)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (draft) saveDraft(draft)
  }, [draft])

  // Busca o que você fez da última vez em cada exercício
  useEffect(() => {
    supabase
      .from('workouts')
      .select('id, exercises')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data }) => {
        const map = {}
        for (const w of data || []) {
          if (w.id === draft?.id) continue
          for (const ex of w.exercises) if (!map[ex.name]) map[ex.name] = ex.sets
        }
        setLast(map)
      })
  }, [profile.id, draft?.id])

  if (!draft) return <Navigate to="/" replace />

  const update = (fn) => setDraft((d) => { const next = structuredClone(d); fn(next); return next })
  const setField = (ei, si, key, value) => update((d) => { d.exercises[ei].sets[si][key] = value })

  // Valor sugerido: série anterior de hoje, senão a mesma série da última vez
  function suggestion(ei, si) {
    const ex = draft.exercises[ei]
    const prev = ex.sets[si - 1]
    const lastSets = last[ex.name] || []
    const fromLast = lastSets[si] || lastSets[lastSets.length - 1]
    return {
      w: (prev?.w || fromLast?.w || '').toString(),
      r: (prev?.r || fromLast?.r || '').toString(),
    }
  }

  function toggleSet(ei, si) {
    const ex = draft.exercises[ei]
    const set = ex.sets[si]
    if (set.done) return setField(ei, si, 'done', false)
    const s = suggestion(ei, si)
    const w = set.w || s.w
    const r = set.r || s.r
    if (!r) return document.getElementById(`r-${ei}-${si}`)?.focus()
    update((d) => { d.exercises[ei].sets[si] = { w, r, done: true } })
    const seconds = parseRest(ex.rest)
    setTimer({ end: Date.now() + seconds * 1000, total: seconds, label: ex.name })
  }

  function addExercise(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    update((d) => { d.exercises.push(newExercise(name)) })
    setNewName('')
  }

  async function finish() {
    const exercises = draft.exercises
      .map(({ name, target, reps, rest, sets }) => ({
        name, target, reps, rest,
        sets: sets.filter((s) => s.r !== '').map((s) => ({ w: Number(s.w) || 0, r: Number(s.r) || 0 })),
      }))
      .filter((ex) => ex.sets.length)
    if (!exercises.length) return alert('Registre pelo menos uma série antes de finalizar.')

    setSaving(true)
    const row = { date: draft.date, title: draft.title.trim() || 'Treino', notes: draft.notes.trim() || null, exercises }
    const { error } = draft.id
      ? await supabase.from('workouts').update(row).eq('id', draft.id)
      : await supabase.from('workouts').insert(row)
    setSaving(false)
    if (error) return alert(`Não foi possível salvar: ${error.message}`)
    clearDraft()
    navigate(`/u/${profile.id}`)
  }

  function discard() {
    if (!confirm('Descartar este treino?')) return
    clearDraft()
    navigate('/')
  }

  return (
    <>
      <header className="page-head">
        <input
          className="title-input"
          value={draft.title}
          onChange={(e) => update((d) => { d.title = e.target.value })}
          aria-label="Nome do treino"
        />
        <input
          type="date"
          className="date-input"
          value={draft.date}
          onChange={(e) => update((d) => { d.date = e.target.value })}
          aria-label="Data"
        />
      </header>

      {draft.exercises.map((ex, ei) => (
        <ExerciseCard
          key={ei}
          ex={ex}
          ei={ei}
          lastSets={last[ex.name]}
          suggestion={suggestion}
          setField={setField}
          toggleSet={toggleSet}
          update={update}
        />
      ))}

      <form onSubmit={addExercise} className="row gap">
        <input
          className="grow"
          placeholder="Adicionar exercício"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn" disabled={!newName.trim()}>Adicionar</button>
      </form>

      <label className="field">
        <span>Observações</span>
        <textarea
          rows={2}
          value={draft.notes}
          onChange={(e) => update((d) => { d.notes = e.target.value })}
          placeholder="Como foi o treino?"
        />
      </label>

      <div className="stack">
        <button className="btn primary block" onClick={finish} disabled={saving}>
          {saving ? 'Salvando…' : draft.id ? 'Salvar alterações' : 'Finalizar treino'}
        </button>
        <button className="link danger center-block" onClick={discard}>Descartar</button>
      </div>

      {timer && <RestTimer timer={timer} setTimer={setTimer} />}
    </>
  )
}

function ExerciseCard({ ex, ei, lastSets, suggestion, setField, toggleSet, update }) {
  const [menu, setMenu] = useState(false)
  const top = repsTop(ex.reps)
  const hitTop = top && lastSets?.length && lastSets.every((s) => Number(s.r) >= top)

  return (
    <section className="card exercise">
      <div className="row between start">
        <div>
          <h3>{ex.name}</h3>
          <p className="muted small">
            {ex.target && <>Meta {ex.target}{ex.rest && ` · ${ex.rest}`}</>}
            {lastSets && <>{ex.target && <br />}Última: {lastSets.map(formatSet).join(' · ')}</>}
          </p>
          {hitTop && <p className="tip small">Bateu o topo da faixa na última vez: suba a carga.</p>}
        </div>
        <button className="icon-btn" onClick={() => setMenu(!menu)} aria-label="Opções">⋯</button>
      </div>

      {menu && (
        <div className="menu">
          {ex.alts.length > 0 && (
            <>
              <p className="muted small">Trocar por</p>
              <div className="chips wrap">
                {ex.alts.map((alt) => (
                  <button
                    key={alt}
                    className="chip"
                    onClick={() => { update((d) => { const e = d.exercises[ei]; e.alts = [e.name, ...e.alts.filter((a) => a !== alt)]; e.name = alt }); setMenu(false) }}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="row gap">
            <button className="btn small" disabled={ei === 0} onClick={() => update((d) => { const [e] = d.exercises.splice(ei, 1); d.exercises.splice(ei - 1, 0, e) })}>↑ Subir</button>
            <button className="btn small danger" onClick={() => update((d) => { d.exercises.splice(ei, 1) })}>Remover</button>
          </div>
        </div>
      )}

      <div className="sets">
        <div className="set-row head muted small">
          <span>Série</span><span>kg</span><span>Reps</span><span />
        </div>
        {ex.sets.map((s, si) => {
          const hint = suggestion(ei, si)
          return (
            <div key={si} className={`set-row ${s.done ? 'done' : ''}`}>
              <span className="muted">{si + 1}</span>
              <input
                inputMode="decimal"
                placeholder={hint.w || '–'}
                value={s.w}
                onChange={(e) => setField(ei, si, 'w', e.target.value.replace(',', '.'))}
                aria-label={`Carga da série ${si + 1}`}
              />
              <input
                id={`r-${ei}-${si}`}
                inputMode="numeric"
                placeholder={hint.r || '–'}
                value={s.r}
                onChange={(e) => setField(ei, si, 'r', e.target.value.replace(/\D/g, ''))}
                aria-label={`Repetições da série ${si + 1}`}
              />
              <button className="check" onClick={() => toggleSet(ei, si)} aria-label={s.done ? 'Desmarcar série' : 'Concluir série'}>
                ✓
              </button>
            </div>
          )
        })}
      </div>
      <div className="row gap">
        <button className="link small" onClick={() => update((d) => { d.exercises[ei].sets.push(emptySet()) })}>+ Série</button>
        {ex.sets.length > 1 && (
          <button className="link small muted" onClick={() => update((d) => { d.exercises[ei].sets.pop() })}>− Série</button>
        )}
      </div>
    </section>
  )
}
