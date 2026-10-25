import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, formatKg, formatSet, stats } from '../lib/util'

export default function WorkoutCard({ workout, author, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const { sets, volume } = stats(workout.exercises)

  return (
    <article className="card workout">
      <button className="workout-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="row between start">
          <div>
            {author && <p className="eyebrow">{author.name}</p>}
            <h3>{workout.title}</h3>
          </div>
          <span className="muted small nowrap">{formatDate(workout.date)}</span>
        </div>
        <p className="muted small">
          {workout.exercises.length} exercícios · {sets} séries{volume > 0 && ` · ${formatKg(volume)} kg`}
        </p>
      </button>

      {open && (
        <div className="workout-body">
          <ul className="plain-list">
            {workout.exercises.map((ex, i) => (
              <li key={i}>
                <span>{ex.name}</span>
                <span className="muted small">{ex.sets.map(formatSet).join(' · ')}</span>
              </li>
            ))}
          </ul>
          {workout.notes && <p className="notes">{workout.notes}</p>}
          <div className="row gap">
            {author && <Link to={`/u/${author.id}`} className="link small">Ver perfil</Link>}
            {onEdit && <button className="link small" onClick={onEdit}>Editar</button>}
            {onDelete && <button className="link small danger" onClick={onDelete}>Apagar</button>}
          </div>
        </div>
      )}
    </article>
  )
}
