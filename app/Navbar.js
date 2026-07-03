'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const router = useRouter()
  const [menuAbierto, setMenuAbierto] = useState(false)

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav style={{ borderBottom: '1px solid #ccc', background: 'white' }}>

      {/* Barra principal */}
      <div style={{ padding: '1rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo / nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo-lcvet.png" alt="LC Vet" style={{ height: '40px', width: 'auto' }} />
          <span style={{ fontWeight: '600', color: 'var(--color-teal)', fontSize: '1.1rem' }}>LC Vet</span>
        </div>

        {/* Links — solo visibles en escritorio */}
        <div className="hidden sm:flex" style={{ gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/clientes">Clientes</Link>
          <Link href="/mascotas">Mascotas</Link>
          <Link href="/consultas">Consultas</Link>
          <Link href="/turnos">Turnos</Link>
          <Link href="/tratamientos">Tratamientos</Link>
          <Link href="/buscar">Buscar</Link>
          <button onClick={cerrarSesion} style={{ marginLeft: '1rem' }}>Cerrar sesión</button>
        </div>

        {/* Botón hamburguesa — solo visible en celular */}
        <button
          className="sm:hidden"
          onClick={() => setMenuAbierto(!menuAbierto)}
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-teal)', padding: '0' }}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
      </div>

      {/* Menú desplegable en celular */}
      {menuAbierto && (
        <div className="sm:hidden" style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 2rem 1rem', gap: '0.75rem', borderTop: '1px solid #eee' }}>
          <Link href="/clientes" onClick={() => setMenuAbierto(false)}>Clientes</Link>
          <Link href="/mascotas" onClick={() => setMenuAbierto(false)}>Mascotas</Link>
          <Link href="/consultas" onClick={() => setMenuAbierto(false)}>Consultas</Link>
          <Link href="/turnos" onClick={() => setMenuAbierto(false)}>Turnos</Link>
          <Link href="/tratamientos" onClick={() => setMenuAbierto(false)}>Tratamientos</Link>
          <Link href="/buscar" onClick={() => setMenuAbierto(false)}>Buscar</Link>
          <button onClick={cerrarSesion} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--color-coral)', fontWeight: '500', padding: '0', cursor: 'pointer', fontSize: '0.9rem' }}>
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  )
}