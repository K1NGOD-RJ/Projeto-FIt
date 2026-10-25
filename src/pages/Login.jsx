import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MESSAGES = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'User already registered': 'Esse e-mail já tem conta. Entre com ele.',
  'Database error saving new user': 'Código de convite inválido.',
}

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', invite: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const signup = mode === 'signup'

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const email = form.email.trim()
    const { error } = signup
      ? await supabase.auth.signUp({
          email,
          password: form.password,
          options: { data: { name: form.name.trim(), invite: form.invite.trim() } },
        })
      : await supabase.auth.signInWithPassword({ email, password: form.password })
    setBusy(false)
    if (error) setError(MESSAGES[error.message] || error.message)
  }

  return (
    <main className="page login">
      <h1 className="brand">Treino</h1>
      <p className="muted">Registre seus treinos e veja os dos seus amigos.</p>

      <form onSubmit={submit} className="stack">
        {signup && (
          <label className="field">
            <span>Nome</span>
            <input value={form.name} onChange={set('name')} required autoComplete="given-name" />
          </label>
        )}
        <label className="field">
          <span>E-mail</span>
          <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        </label>
        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={6}
            autoComplete={signup ? 'new-password' : 'current-password'}
          />
        </label>
        {signup && (
          <label className="field">
            <span>Código de convite</span>
            <input value={form.invite} onChange={set('invite')} required autoCapitalize="characters" />
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Aguarde…' : signup ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <button className="link" onClick={() => { setMode(signup ? 'login' : 'signup'); setError('') }}>
        {signup ? 'Já tenho conta' : 'Criar conta com convite'}
      </button>
    </main>
  )
}
