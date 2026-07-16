'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function Agenda() {
  const [turnos, setTurnos] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [mascotaClientes, setMascotaClientes] = useState([])
  const [filtro, setFiltro] = useState('7')
  const router = useRouter()

  useEffect(() => {
    async function cargarTodo() {
      const [t, tr, m, c, mc] = await Promise.all([
        supabase.from('turnos').select('*').order('fecha', { ascending: true }),
        supabase.from('tratamientos').select('*').order('fecha_proxima', { ascending: true }),
        supabase.from('mascotas').select('*'),
        supabase.from('clientes').select('*'),
        supabase.from('mascota_clientes').select('*'),
      ])
      setTurnos(t.data || [])
      setTratamientos(tr.data || [])
      setMascotas(m.data || [])
      setClientes(c.data || [])
      setMascotaClientes(mc.data || [])
    }
    cargarTodo()
  }, [])

  function tutoresDeMascota(mascotaId) {
    return mascotaClientes
      .filter((mc) => mc.mascota_id === mascotaId)
      .map((mc) => clientes.find((c) => c.id === mc.cliente_id))
      .filter(Boolean)
  }

  function hoy() {
    return new Date().toISOString().split('T')[0]
  }

  function fechaLimite() {
    if (filtro === 'todos') return null
    const f = new Date()
    f.setDate(f.getDate() + parseInt(filtro))
    return f.toISOString().split('T')[0]
  }

  function dentroDelFiltro(fecha) {
    if (!fecha) return false
    if (filtro === 'vencidos') return fecha < hoy()
    if (filtro === 'todos') return fecha >= hoy()
    return fecha >= hoy() && fecha <= fechaLimite()
  }

  function diasRestantes(fecha) {
    const hoyDate = new Date(hoy())
    const fechaDate = new Date(fecha)
    const diff = Math.round((fechaDate - hoyDate) / (1000 * 60 * 60 * 24))
    return diff
  }

  function colorUrgencia(dias) {
    if (dias <= 2) return 'bg-red-50 border-red-300'
    if (dias <= 7) return 'bg-orange-50 border-orange-300'
    return 'bg-white border-[var(--color-line)]'
  }

  function etiquetaUrgencia(dias) {
    if (dias === 0) return { texto: 'Hoy', color: 'bg-red-500' }
    if (dias === 1) return { texto: 'Mañana', color: 'bg-red-400' }
    if (dias <= 2) return { texto: `En ${dias} días`, color: 'bg-red-400' }
    if (dias <= 7) return { texto: `En ${dias} días`, color: 'bg-orange-400' }
    return { texto: `En ${dias} días`, color: 'bg-gray-400' }
  }

  // Armar lista combinada
  const items = []

  turnos
    .filter((t) => dentroDelFiltro(t.fecha))
    .forEach((t) => {
      const mascota = mascotas.find((m) => m.id === t.mascota_id)
      const tutores = mascota ? tutoresDeMascota(mascota.id) : []
      items.push({
        tipo: 'turno',
        fecha: t.fecha,
        dias: diasRestantes(t.fecha),
        turno: t,
        mascota,
        tutores,
      })
    })

  tratamientos
    .filter((t) => dentroDelFiltro(t.fecha_proxima))
    .forEach((t) => {
      const mascota = mascotas.find((m) => m.id === t.mascota_id)
      const tutores = mascota ? tutoresDeMascota(mascota.id) : []
      items.push({
        tipo: 'tratamiento',
        fecha: t.fecha_proxima,
        dias: diasRestantes(t.fecha_proxima),
        tratamiento: t,
        mascota,
        tutores,
      })
    })

  // Ordenar por fecha
  items.sort((a, b) => filtro === 'vencidos'
    ? b.fecha.localeCompare(a.fecha)
    : a.fecha.localeCompare(b.fecha)
  )

  function Dato({ titulo, valor }) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-[100px]">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">{titulo}</p>
        <p className="text-sm text-gray-800">{valor || '—'}</p>
      </div>
    )
  }

  return (
    <div className="px-12 py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Agenda</h1>

      {/* Filtro */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {[
          { valor: '2', etiqueta: 'Próximos 2 días' },
          { valor: '7', etiqueta: 'Próximos 7 días' },
          { valor: '30', etiqueta: 'Próximos 30 días' },
          { valor: 'todos', etiqueta: 'Todos' },
          { valor: 'vencidos', etiqueta: 'Vencidos' },
        ].map((op) => (
          <button
            key={op.valor}
            onClick={() => setFiltro(op.valor)}
            className={filtro === op.valor ? '!bg-[var(--color-teal)]' : '!bg-gray-200 !text-gray-700'}
          >
            {op.etiqueta}
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400">No hay turnos ni tratamientos para el período seleccionado.</p>
      )}

      <div className="flex flex-col gap-4">
        {items.map((item, index) => {
          const urgencia = etiquetaUrgencia(item.dias)
          return (
            <div key={index} className={`border rounded-xl p-5 shadow-sm ${colorUrgencia(item.dias)}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-white text-xs font-semibold px-3 py-1 rounded-full ${urgencia.color}`}>
                    {urgencia.texto}
                  </span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${item.tipo === 'turno' ? 'bg-[var(--color-violet)] text-white' : 'bg-[var(--color-teal)] text-white'}`}>
                    {item.tipo === 'turno' ? 'Turno' : 'Tratamiento'}
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/${item.tipo === 'turno' ? 'turnos' : 'tratamientos'}?editar=${item.tipo === 'turno' ? item.turno.id : item.tratamiento.id}`)}
                  className="!bg-[var(--color-teal)] !text-sm shrink-0"
                >
                  Editar
                </button>
              </div>

              <p className="text-lg font-semibold text-[var(--color-teal)] mb-2">
                {item.mascota ? item.mascota.nombre : 'Sin mascota'}
              </p>

              {item.tipo === 'turno' && (
                <div className="flex flex-wrap gap-2">
                  <Dato titulo="Fecha" valor={item.turno.fecha} />
                  <Dato titulo="Hora" valor={item.turno.hora} />
                  <Dato titulo="Estado" valor={item.turno.estado} />
                  {item.tutores.map((t) => (
                    <Dato key={t.id} titulo="Tutor" valor={`${t.nombre} ${t.apellido}`} />
                  ))}
                </div>
              )}

              {item.tipo === 'tratamiento' && (
                <div className="flex flex-wrap gap-2">
                  <Dato titulo="Tratamiento" valor={item.tratamiento.nombre} />
                  <Dato titulo="Tipo" valor={item.tratamiento.tipo} />
                  <Dato titulo="Fecha" valor={item.tratamiento.fecha_proxima} />
                  {item.tutores.map((t) => (
                    <Dato key={t.id} titulo="Tutor" valor={`${t.nombre} ${t.apellido}`} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}