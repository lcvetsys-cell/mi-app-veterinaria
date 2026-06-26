'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Buscar() {
  const [clientes, setClientes] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [turnos, setTurnos] = useState([])
  const [consultas, setConsultas] = useState([])
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    async function cargarTodo() {
      const [c, m, t, tu, co] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('mascotas').select('*'),
        supabase.from('tratamientos').select('*'),
        supabase.from('turnos').select('*'),
        supabase.from('consultas').select('*'),
      ])
      setClientes(c.data || [])
      setMascotas(m.data || [])
      setTratamientos(t.data || [])
      setTurnos(tu.data || [])
      setConsultas(co.data || [])
    }
    cargarTodo()
  }, [])

  function nombreDueño(clienteId) {
    const c = clientes.find((x) => x.id === clienteId)
    return c ? `${c.nombre} ${c.apellido}` : ''
  }

  function nombreMascota(mascotaId) {
    const m = mascotas.find((x) => x.id === mascotaId)
    return m ? m.nombre : ''
  }

  const texto = busqueda.toLowerCase()

  const clientesEncontrados = busqueda
    ? clientes.filter((c) => `${c.nombre} ${c.apellido}`.toLowerCase().includes(texto))
    : []

  const mascotasEncontradas = busqueda
    ? mascotas.filter((m) => m.nombre.toLowerCase().includes(texto) || nombreDueño(m.cliente_id).toLowerCase().includes(texto))
    : []

  const tratamientosEncontrados = busqueda
    ? tratamientos.filter((t) => {
        const m = mascotas.find((x) => x.id === t.mascota_id)
        return (
          (t.nombre || '').toLowerCase().includes(texto) ||
          (t.tipo || '').toLowerCase().includes(texto) ||
          (m && nombreDueño(m.cliente_id).toLowerCase().includes(texto))
        )
      })
    : []

  const turnosEncontrados = busqueda
    ? turnos.filter((tu) => {
        const m = mascotas.find((x) => x.id === tu.mascota_id)
        return m && nombreDueño(m.cliente_id).toLowerCase().includes(texto)
      })
    : []

  const consultasEncontradas = busqueda
    ? consultas.filter((co) => {
        const m = mascotas.find((x) => x.id === co.mascota_id)
        return (co.motivo || '').toLowerCase().includes(texto) || (m && nombreDueño(m.cliente_id).toLowerCase().includes(texto))
      })
    : []

  function Dato({ titulo, valor }) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 min-w-[120px]">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{titulo}</p>
        <p className="text-sm text-gray-800">{valor || '—'}</p>
      </div>
    )
  }

  function Seccion({ titulo, items, render }) {
    if (busqueda === '') return null
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-[var(--color-violet)]">{titulo} ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Sin resultados</p>
        ) : (
          <div className="flex flex-col gap-3">{items.map(render)}</div>
        )}
      </div>
    )
  }

  return (
    <div className="px-12 py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Búsqueda general</h1>

      <input
        placeholder="Buscar cliente, mascota, tratamiento..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full max-w-xl mb-8"
      />

      <Seccion
        titulo="Clientes"
        items={clientesEncontrados}
        render={(c) => (
          <div key={c.id} className="bg-white border border-[var(--color-line)] rounded-xl p-4 shadow-sm">
            <p className="font-semibold text-[var(--color-teal)] mb-2">{c.nombre} {c.apellido}</p>
            <div className="flex flex-wrap gap-2">
              <Dato titulo="Teléfono" valor={c.telefono} />
              <Dato titulo="Email" valor={c.email} />
              <Dato titulo="Dirección" valor={c.direccion} />
              <Dato titulo="Nacimiento" valor={c.fecha_nac} />
              <Dato titulo="Registro" valor={c.fecha_reg} />
            </div>
          </div>
        )}
      />

      <Seccion
        titulo="Mascotas"
        items={mascotasEncontradas}
        render={(m) => (
          <div key={m.id} className="bg-white border border-[var(--color-line)] rounded-xl p-4 shadow-sm">
            <p className="font-semibold text-[var(--color-teal)] mb-2">{m.nombre}</p>
            <div className="flex flex-wrap gap-2">
              <Dato titulo="Especie" valor={m.especie} />
              <Dato titulo="Sexo" valor={m.sexo} />
              <Dato titulo="Raza" valor={m.raza} />
              <Dato titulo="Nacimiento" valor={m.fecha_nacimiento} />
              <Dato titulo="Dueño" valor={nombreDueño(m.cliente_id)} />
            </div>
          </div>
        )}
      />

      <Seccion
        titulo="Tratamientos"
        items={tratamientosEncontrados}
        render={(t) => (
          <div key={t.id} className="bg-white border border-[var(--color-line)] rounded-xl p-4 shadow-sm">
            <p className="font-semibold text-[var(--color-teal)] mb-2">{t.nombre}</p>
            <div className="flex flex-wrap gap-2">
              <Dato titulo="Mascota" valor={nombreMascota(t.mascota_id)} />
              <Dato titulo="Tipo" valor={t.tipo} />
              <Dato titulo="Aplicación" valor={t.fecha_aplicacion} />
              <Dato titulo="Próxima" valor={t.fecha_proxima} />
              <Dato titulo="Notas" valor={t.notas} />
            </div>
          </div>
        )}
      />

      <Seccion
        titulo="Turnos"
        items={turnosEncontrados}
        render={(tu) => (
          <div key={tu.id} className="bg-white border border-[var(--color-line)] rounded-xl p-4 shadow-sm">
            <p className="font-semibold text-[var(--color-teal)] mb-2">{nombreMascota(tu.mascota_id)}</p>
            <div className="flex flex-wrap gap-2">
              <Dato titulo="Fecha" valor={tu.fecha} />
              <Dato titulo="Hora" valor={tu.hora} />
              <Dato titulo="Estado" valor={tu.estado} />
            </div>
          </div>
        )}
      />

      <Seccion
        titulo="Consultas"
        items={consultasEncontradas}
        render={(co) => (
          <div key={co.id} className="bg-white border border-[var(--color-line)] rounded-xl p-4 shadow-sm">
            <p className="font-semibold text-[var(--color-teal)] mb-2">{co.motivo || 'Sin motivo'}</p>
            <div className="flex flex-wrap gap-2">
              <Dato titulo="Mascota" valor={nombreMascota(co.mascota_id)} />
              <Dato titulo="Fecha" valor={co.fecha} />
              <Dato titulo="Diagnóstico" valor={co.diagnostico} />
            </div>
          </div>
        )}
      />
    </div>
  )
}