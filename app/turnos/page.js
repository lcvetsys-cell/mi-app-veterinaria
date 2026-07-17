'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

function TurnosContenido() {
  const [turnos, setTurnos] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [mascotaClientes, setMascotaClientes] = useState([])
  const [mascotaId, setMascotaId] = useState('')
  const [busquedaMascota, setBusquedaMascota] = useState('')
  const [mostrarOpciones, setMostrarOpciones] = useState(false)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [estado, setEstado] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [enviandoId, setEnviandoId] = useState(null)
  const searchParams = useSearchParams()

  async function obtenerTurnos() {
    const { data, error } = await supabase.from('turnos').select('*').order('fecha', { ascending: true })
    if (error) console.log('error', error)
    else setTurnos(data)
  }

  async function obtenerMascotas() {
    const { data, error } = await supabase.from('mascotas').select('*').order('nombre', { ascending: true })
    if (error) console.log('error', error)
    else setMascotas(data)
  }

  async function obtenerClientes() {
    const { data, error } = await supabase.from('clientes').select('*')
    if (error) console.log('error', error)
    else setClientes(data)
  }

  async function obtenerMascotaClientes() {
    const { data, error } = await supabase.from('mascota_clientes').select('*')
    if (error) console.log('error', error)
    else setMascotaClientes(data)
  }

  useEffect(() => {
    obtenerTurnos()
    obtenerMascotas()
    obtenerClientes()
    obtenerMascotaClientes()
  }, [])

  useEffect(() => {
    const editarId = searchParams.get('editar')
    if (editarId && turnos.length > 0) {
      const turno = turnos.find((t) => t.id === parseInt(editarId))
      if (turno) empezarEdicion(turno)
    }
  }, [searchParams, turnos])

  function tutoresDeMascota(mascotaId) {
    return mascotaClientes
      .filter((mc) => mc.mascota_id === mascotaId)
      .map((mc) => clientes.find((c) => c.id === mc.cliente_id))
      .filter(Boolean)
  }

  function nombreConTutores(mascota) {
    const tutores = tutoresDeMascota(mascota.id)
    if (tutores.length === 0) return mascota.nombre
    return `${mascota.nombre} — ${tutores.map((t) => `${t.nombre} ${t.apellido}`).join(', ')}`
  }

  function limpiarFormulario() {
    setMascotaId('')
    setBusquedaMascota('')
    setFecha('')
    setHora('')
    setEstado('')
    setEditandoId(null)
  }

  function empezarEdicion(turno) {
    setEditandoId(turno.id)
    setMascotaId(turno.mascota_id || '')
    const mascota = mascotas.find((m) => m.id === turno.mascota_id)
    setBusquedaMascota(mascota ? nombreConTutores(mascota) : '')
    setFecha(turno.fecha || '')
    setHora(turno.hora || '')
    setEstado(turno.estado || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function seleccionarMascota(mascota) {
    setMascotaId(mascota.id)
    setBusquedaMascota(nombreConTutores(mascota))
    setMostrarOpciones(false)
  }

  async function guardarTurno(e) {
    e.preventDefault()
    const datos = { mascota_id: mascotaId, fecha: fecha || null, hora: hora || null, estado }
    let error
    if (editandoId) {
      const r = await supabase.from('turnos').update(datos).eq('id', editandoId)
      error = r.error
    } else {
      const r = await supabase.from('turnos').insert([datos])
      error = r.error
    }
    if (error) {
      alert('No se pudo guardar: ' + error.message)
    } else {
      limpiarFormulario()
      obtenerTurnos()
    }
  }

  async function eliminarTurno(id) {
    const confirmar = window.confirm('¿Seguro que querés eliminar este turno?')
    if (!confirmar) return
    const { error } = await supabase.from('turnos').delete().eq('id', id)
    if (error) alert('No se pudo eliminar: ' + error.message)
    else obtenerTurnos()
  }

  async function enviarWhatsapp(turno, tutor) {
    const mascota = mascotas.find((m) => m.id === turno.mascota_id)
    if (!tutor.telefono) {
      alert(`${tutor.nombre} no tiene teléfono cargado`)
      return
    }
    setEnviandoId(`${turno.id}-${tutor.id}`)
    try {
      const mensaje = `Hola ${tutor.nombre}! Te recordamos el turno de ${mascota.nombre} el ${turno.fecha} a las ${turno.hora}. Saludos, LC Vet.`
      await fetch('/api/enviar-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: tutor.telefono, mensaje }),
      })
      alert('¡WhatsApp enviado!')
    } catch (error) {
      alert('Error de conexión: ' + error.message)
    } finally {
      setEnviandoId(null)
    }
  }

  function Dato({ titulo, valor }) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 min-w-[120px]">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{titulo}</p>
        <p className="text-sm text-gray-800 capitalize">{valor || '—'}</p>
      </div>
    )
  }

  const mascotasFiltradas = mascotas.filter((m) =>
    nombreConTutores(m).toLowerCase().includes(busquedaMascota.toLowerCase())
  )

  return (
    <div className="px-12 py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Turnos</h1>

      <form onSubmit={guardarTurno} className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-8 shadow-sm max-w-xl">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-violet)]">
          {editandoId ? 'Editar turno' : 'Nuevo turno'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[7rem_1fr] items-center gap-y-3 gap-x-3 mb-6">
          <label className="text-xs font-medium text-gray-700">Mascota</label>
          <div className="relative">
            <input
              placeholder="Escribí para buscar..."
              value={busquedaMascota}
              onChange={(e) => { setBusquedaMascota(e.target.value); setMascotaId(''); setMostrarOpciones(true) }}
              onFocus={() => setMostrarOpciones(true)}
              onBlur={() => setTimeout(() => setMostrarOpciones(false), 150)}
              className="w-full"
            />
            {mostrarOpciones && busquedaMascota && mascotasFiltradas.length > 0 && (
              <div className="absolute z-10 bg-white border border-[var(--color-line)] rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                {mascotasFiltradas.map((mascota) => (
                  <div key={mascota.id} onClick={() => seleccionarMascota(mascota)} className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100">
                    {nombreConTutores(mascota)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="text-xs font-medium text-gray-700">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Hora</label>
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Seleccionar estado</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar turno'}</button>
          {editandoId && (
            <button type="button" onClick={limpiarFormulario} className="!bg-gray-300 !text-gray-700">Cancelar</button>
          )}
        </div>
      </form>

      <div className="flex gap-2 mb-6">
        <input placeholder="Buscar turno..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="max-w-sm" />
        <button type="button">Buscar</button>
      </div>

      <hr className="border-t border-gray-200 mb-6" />

      <div className="flex flex-col gap-5">
        {turnos
          .filter((turno) => {
            if (busqueda === '') return true
            const mascota = mascotas.find((m) => m.id === turno.mascota_id)
            if (!mascota) return false
            const tutores = tutoresDeMascota(mascota.id)
            return tutores.some((t) => `${t.nombre} ${t.apellido}`.toLowerCase().includes(busqueda.toLowerCase())) ||
              mascota.nombre.toLowerCase().includes(busqueda.toLowerCase())
          })
          .map((turno) => {
            const mascota = mascotas.find((m) => m.id === turno.mascota_id)
            const tutores = mascota ? tutoresDeMascota(mascota.id) : []
            return (
              <div key={turno.id} className="bg-white border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Turno</p>
                    <p className="text-xl font-semibold text-[var(--color-teal)]">{mascota ? nombreConTutores(mascota) : 'Sin mascota'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {tutores.map((tutor) => (
                      <button
                        key={tutor.id}
                        onClick={() => enviarWhatsapp(turno, tutor)}
                        disabled={enviandoId === `${turno.id}-${tutor.id}`}
                        className="!bg-green-600 !text-sm"
                      >
                        {enviandoId === `${turno.id}-${tutor.id}` ? 'Enviando...' : `WhatsApp ${tutor.nombre}`}
                      </button>
                    ))}
                    <button onClick={() => empezarEdicion(turno)} className="!bg-[var(--color-teal)] !text-sm">Editar</button>
                    <button onClick={() => eliminarTurno(turno.id)} className="!bg-[var(--color-coral)] !text-sm">Eliminar</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Dato titulo="Fecha" valor={turno.fecha} />
                  <Dato titulo="Hora" valor={turno.hora} />
                  <Dato titulo="Estado" valor={turno.estado} />
                  <Dato titulo="Aviso" valor={turno.recordatorio_enviado ? 'Avisado' : 'No avisado'} />
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default function Turnos() {
  return (
    <Suspense>
      <TurnosContenido />
    </Suspense>
  )
}