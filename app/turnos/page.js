'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Turnos() {
  const [turnos, setTurnos] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [mascotaId, setMascotaId] = useState('')
  const [busquedaMascota, setBusquedaMascota] = useState('')
  const [mostrarOpciones, setMostrarOpciones] = useState(false)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [estado, setEstado] = useState('')
  const [editandoId, setEditandoId] = useState(null)

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

  useEffect(() => {
    obtenerTurnos()
    obtenerMascotas()
    obtenerClientes()
  }, [])

  function nombreConDueño(mascota) {
    const dueño = clientes.find((c) => c.id === mascota.cliente_id)
    return dueño ? `${mascota.nombre} — ${dueño.nombre} ${dueño.apellido}` : mascota.nombre
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
    setBusquedaMascota(mascota ? nombreConDueño(mascota) : '')
    setFecha(turno.fecha || '')
    setHora(turno.hora || '')
    setEstado(turno.estado || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function seleccionarMascota(mascota) {
    setMascotaId(mascota.id)
    setBusquedaMascota(nombreConDueño(mascota))
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

  function Dato({ titulo, valor }) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 min-w-[120px]">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{titulo}</p>
        <p className="text-sm text-gray-800 capitalize">{valor || '—'}</p>
      </div>
    )
  }

  const mascotasFiltradas = mascotas.filter((m) =>
    nombreConDueño(m).toLowerCase().includes(busquedaMascota.toLowerCase())
  )

  return (
    <div className="px-12 py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Turnos</h1>

      <form onSubmit={guardarTurno} className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-8 shadow-sm max-w-xl">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-violet)]">
          {editandoId ? 'Editar turno' : 'Nuevo turno'}
        </h2>

        <div className="grid grid-cols-[7rem_1fr] items-center gap-y-3 gap-x-3 mb-6">
          <label className="text-xs font-medium text-gray-700">Mascota</label>
          <div className="relative">
            <input
              placeholder="Escribí para buscar..."
              value={busquedaMascota}
              onChange={(e) => {
                setBusquedaMascota(e.target.value)
                setMascotaId('')
                setMostrarOpciones(true)
              }}
              onFocus={() => setMostrarOpciones(true)}
              onBlur={() => setTimeout(() => setMostrarOpciones(false), 150)}
              className="w-full"
            />
            {mostrarOpciones && busquedaMascota && mascotasFiltradas.length > 0 && (
              <div className="absolute z-10 bg-white border border-[var(--color-line)] rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                {mascotasFiltradas.map((mascota) => (
                  <div
                    key={mascota.id}
                    onClick={() => seleccionarMascota(mascota)}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                  >
                    {nombreConDueño(mascota)}
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

      <hr className="border-t border-gray-200 mb-6" />

      <div className="flex flex-col gap-5">
        {turnos.map((turno) => {
          const mascota = mascotas.find((m) => m.id === turno.mascota_id)
          return (
            <div key={turno.id} className="bg-white border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Turno</p>
                  <p className="text-xl font-semibold text-[var(--color-teal)]">{mascota ? nombreConDueño(mascota) : 'Sin mascota'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => empezarEdicion(turno)} className="!bg-[var(--color-teal)] !text-sm">Editar</button>
                  <button onClick={() => eliminarTurno(turno.id)} className="!bg-[var(--color-coral)] !text-sm">Eliminar</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Dato titulo="Fecha" valor={turno.fecha} />
                <Dato titulo="Hora" valor={turno.hora} />
                <Dato titulo="Estado" valor={turno.estado} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}