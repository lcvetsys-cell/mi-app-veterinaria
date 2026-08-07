'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [menuAbierto, setMenuAbierto] = useState(false)

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (pathname === '/login') return null

  // Colores asignados
  const colores = {
    clientes: '#ea580c',      // Naranja
    mascotas: '#db2777',      // Rosa
    consultas: '#3b82f6',     // Celeste oscuro (Azul)
    turnos: 'var(--color-violet)', // Violeta
    tratamientos: 'var(--color-teal)', // Verde
    buscar: '#4f46e5',        // Índigo
    agenda: '#16a34a',        // Verde esmeralda
  }

  const estiloLink = (color) => ({
    color: color,
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'opacity 0.2s'
  })

  return (
    <nav style={{ borderBottom: '1px solid #ccc', background: 'white' }}>

      <div style={{ padding: '1rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/logo-lcvet.png" alt="LC Vet" style={{ height: '40px', width: 'auto' }} />
          <span style={{ fontWeight: '600', color: 'var(--color-teal)', fontSize: '1.1rem' }}>LC Vet</span>
        </div>

        <div className="hidden sm:flex" style={{ gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/clientes" style={estiloLink(colores.clientes)}>Clientes</Link>
          <Link href="/mascotas" style={estiloLink(colores.mascotas)}>Mascotas</Link>
          <Link href="/consultas" style={estiloLink(colores.consultas)}>Consultas</Link>
          <Link href="/turnos" style={estiloLink(colores.turnos)}>Turnos</Link>
          <Link href="/tratamientos" style={estiloLink(colores.tratamientos)}>Tratamientos</Link>
          <Link href="/buscar" style={estiloLink(colores.buscar)}>Buscar</Link>
          <Link href="/agenda" style={estiloLink(colores.agenda)}>Agenda</Link>
          <button onClick={cerrarSesion} style={{ marginLeft: '1rem', color: 'var(--color-coral)', fontWeight: '500' }}>Cerrar sesión</button>
        </div>

        <button
          className="sm:hidden"
          onClick={() => setMenuAbierto(!menuAbierto)}
          style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-teal)', padding: '0' }}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
      </div>

      {menuAbierto && (
        <div className="sm:hidden" style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 2rem 1rem', gap: '0.75rem', borderTop: '1px solid #eee' }}>
          <Link href="/clientes" onClick={() => setMenuAbierto(false)} style={estiloLink(colores.clientes)}>Clientes</Link>
          <Link href="/mascotas" onClick={() => setMenuAbierto(false)} style={estiloLink(colores.mascotas)}>Mascotas</Link>
          <Link href="/consultas" onClick={() => setMenuAbierto(false)} style={estiloLink(colores.consultas)}>Consultas</Link>
          <Link href="/turnos" onClick={() => setMenuAbierto(false)} style={estiloLink(colores.turnos)}>Turnos</Link>
          <Link href="/tratamientos" onClick={() => setMenuAbierto(false)} style={estiloLink(colores.tratamientos)}>Tratamientos</Link>
          <Link href="/buscar" onClick={() => setMenuAbierto(false)} style={estiloLink(colores.buscar)}>Buscar</Link>
          <Link href="/agenda" onClick={() => setMenuAbierto(false)} style={estiloLink(colores.agenda)}>Agenda</Link>
          <button onClick={cerrarSesion} style={{ textAlign: 'left', background: 'none', border: 'none', color: 'var(--color-coral)', fontWeight: '500', padding: '0', cursor: 'pointer', fontSize: '0.9rem' }}>
            Cerrar sesión
          </button>
        </div>
      )}
            <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'var(--color-teal)',
          color: 'white',
          fontSize: '1.5rem',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Ir arriba"
      >
        ↑
      </button>
    </nav>
  )
}