import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const icon = (d) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

const icons = {
  train: icon(<><path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" /></>),
  feed: icon(<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2a4.5 4.5 0 0 1 4.5 4.8" /></>),
  history: icon(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  plan: icon(<><rect x="4" y="4.5" width="16" height="16" rx="2.5" /><path d="M4 9.5h16M9 3v3M15 3v3" /></>),
}

export default function Nav() {
  const { profile } = useAuth()
  const tabs = [
    { to: '/', label: 'Treinar', icon: icons.train, end: true },
    { to: '/feed', label: 'Amigos', icon: icons.feed },
    { to: `/u/${profile.id}`, label: 'Histórico', icon: icons.history },
    { to: '/plano', label: 'Plano', icon: icons.plan },
  ]
  return (
    <nav className="nav">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className="nav-item">
          {t.icon}
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
