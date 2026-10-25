import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { weekStart } from '../lib/util'
import WorkoutCard from '../components/WorkoutCard'

export default function Feed() {
  const [people, setPeople] = useState([])
  const [workouts, setWorkouts] = useState(null)
  const [week, setWeek] = useState({})

  useEffect(() => {
    supabase.from('profiles').select('id, name').order('name').then(({ data }) => setPeople(data || []))
    supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setWorkouts(data || []))
    supabase
      .from('workouts')
      .select('user_id')
      .gte('date', weekStart())
      .then(({ data }) => {
        const counts = {}
        for (const w of data || []) counts[w.user_id] = (counts[w.user_id] || 0) + 1
        setWeek(counts)
      })
  }, [])

  const byId = Object.fromEntries(people.map((p) => [p.id, p]))
  const ranked = [...people].sort((a, b) => (week[b.id] || 0) - (week[a.id] || 0))

  return (
    <>
      <header className="page-head">
        <h1>Amigos</h1>
      </header>

      <section className="card">
        <p className="eyebrow">Esta semana</p>
        <ul className="plain-list">
          {ranked.map((p) => (
            <li key={p.id} className="row between">
              <Link to={`/u/${p.id}`} className="row gap person">
                <span className="avatar">{p.name[0]?.toUpperCase()}</span>
                {p.name}
              </Link>
              <span className="dots" aria-label={`${week[p.id] || 0} treinos`}>
                {Array.from({ length: Math.max(5, week[p.id] || 0) }, (_, i) => (
                  <i key={i} className={i < (week[p.id] || 0) ? 'on' : ''} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {workouts === null ? (
        <p className="muted center">Carregando…</p>
      ) : workouts.length === 0 ? (
        <p className="muted center">Ninguém registrou treinos ainda.</p>
      ) : (
        workouts.map((w) => <WorkoutCard key={w.id} workout={w} author={byId[w.user_id]} />)
      )}
    </>
  )
}
