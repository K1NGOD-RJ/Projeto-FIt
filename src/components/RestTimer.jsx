import { useEffect, useState } from 'react'
import { formatTimer } from '../lib/util'

export default function RestTimer({ timer, setTimer }) {
  const [now, setNow] = useState(Date.now())
  const left = (timer.end - now) / 1000
  const finished = left <= 0

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!finished) return
    navigator.vibrate?.([200, 100, 200])
    const id = setTimeout(() => setTimer(null), 4000)
    return () => clearTimeout(id)
  }, [finished, setTimer])

  const add = (s) => setTimer({ ...timer, end: Math.max(Date.now(), timer.end) + s * 1000, total: timer.total + s })

  return (
    <div className={`timer ${finished ? 'finished' : ''}`} role="timer">
      <div className="timer-bar" style={{ width: `${Math.max(0, (left / timer.total) * 100)}%` }} />
      <div className="row between">
        <div>
          <p className="small muted">{finished ? 'Descanso acabou' : 'Descanso'}</p>
          <p className="timer-time">{finished ? 'Bora!' : formatTimer(left)}</p>
        </div>
        <div className="row gap">
          <button className="btn small" onClick={() => add(30)}>+30s</button>
          <button className="btn small" onClick={() => setTimer(null)}>Pular</button>
        </div>
      </div>
    </div>
  )
}
