'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const router = useRouter()

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav style={{ padding: '1rem 3rem', borderBottom: '1px solid #ccc', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Link href="/clientes">Clientes</Link>
      <Link href="/mascotas">Mascotas</Link>
      <Link href="/consultas">Consultas</Link>
      <Link href="/turnos">Turnos</Link>
      <Link href="/tratamientos">Tratamientos</Link>
      <Link href="/buscar">Buscar</Link>
      <button onClick={cerrarSesion} style={{ marginLeft: 'auto' }}>Cerrar sesión</button>
    </nav>
  )
}