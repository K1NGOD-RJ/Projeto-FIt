import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Nav from './components/Nav'
import Login from './pages/Login'
import Train from './pages/Train'
import Workout from './pages/Workout'
import Feed from './pages/Feed'
import Person from './pages/Person'
import Plan from './pages/Plan'

export default function App() {
  const { session, profile } = useAuth()

  if (session === undefined) return null
  if (!session) return <Login />
  if (!profile) return <div className="page muted center">Carregando…</div>

  return (
    <>
      <main className="page">
        <Routes>
          <Route path="/" element={<Train />} />
          <Route path="/treino" element={<Workout />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/u/:id" element={<Person />} />
          <Route path="/plano" element={<Plan />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Nav />
    </>
  )
}
