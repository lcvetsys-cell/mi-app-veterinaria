'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Tratamientos() {
  const [tratamientos, setTratamientos] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [mascotaId, setMascotaId] = useState('')
  const [busquedaMascota, setBusquedaMascota] = useState('')
  const [mostrarOpciones, setMostrarOpciones] = useState(false)
  const [tipo, setTipo] = useState('')
  const [nombre, setNombre] = useState('')
  const [fechaAplicacion, setFechaAplicacion] = useState('')
  const [fechaProxima, setFechaProxima] = useState('')
  const [notas, setNotas] = useState('')
  const [editandoId, setEditandoId] = useState(null)

  async function obtenerTratamientos() {
    const { data, error } = await supabase.from('tratamientos').select('*').order('fecha_proxima', { ascending: true })
    if (error) console.log('error', error)
    else setTratamientos(data)
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
    obtenerTratamientos()
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
    setTipo('')
    setNombre('')
    setFechaAplicacion('')
    setFechaProxima('')
    setNotas('')
    setEditandoId(null)
  }

  function empezarEdicion(tratamiento) {
    setEditandoId(tratamiento.id)
    setMascotaId(tratamiento.mascota_id || '')
    const mascota = mascotas.find((m) => m.id === tratamiento.mascota_id)
    setBusquedaMascota(mascota ? nombreConDueño(mascota) : '')
    setTipo(tratamiento.tipo || '')
    setNombre(tratamiento.nombre || '')
    setFechaAplicacion(tratamiento.fecha_aplicacion || '')
    setFechaProxima(tratamiento.fecha_proxima || '')
    setNotas(tratamiento.notas || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function seleccionarMascota(mascota) {
    setMascotaId(mascota.id)
    setBusquedaMascota(nombreConDueño(mascota))
    setMostrarOpciones(false)
  }

  async function guardarTratamiento(e) {
    e.preventDefault()
    const datos = {
      mascota_id: mascotaId,
      tipo,
      nombre,
      fecha_aplicacion: fechaAplicacion || null,
      fecha_proxima: fechaProxima || null,
      notas,
    }
    let error
    if (editandoId) {
      const r = await supabase.from('tratamientos').update(datos).eq('id', editandoId)
      error = r.error
    } else {
      const r = await supabase.from('tratamientos').insert([datos])
      error = r.error
    }
    if (error) {
      alert('No se pudo guardar: ' + error.message)
    } else {
      limpiarFormulario()
      obtenerTratamientos()
    }
  }

  async function eliminarTratamiento(id) {
    const confirmar = window.confirm('¿Seguro que querés eliminar este tratamiento?')
    if (!confirmar) return
    const { error } = await supabase.from('tratamientos').delete().eq('id', id)
    if (error) alert('No se pudo eliminar: ' + error.message)
    else obtenerTratamientos()
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
      <h1 className="text-3xl font-bold mb-6">Tratamientos</h1>

      <form onSubmit={guardarTratamiento} className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-8 shadow-sm max-w-xl">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-violet)]">
          {editandoId ? 'Editar tratamiento' : 'Nuevo tratamiento'}
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

          <label className="text-xs font-medium text-gray-700">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Seleccionar tipo</option>
            <option value="vacunas">Vacunas</option>
            <option value="cardiologo">Cardiólogo</option>
            <option value="antiparasitario">Antiparasitario</option>
          </select>

          <label className="text-xs font-medium text-gray-700">Nombre</label>
          <input placeholder="Ej: Vacuna antirrábica" value={nombre} onChange={(e) => setNombre(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Aplicación</label>
          <input type="date" value={fechaAplicacion} onChange={(e) => setFechaAplicacion(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Próxima</label>
          <input type="date" value={fechaProxima} onChange={(e) => setFechaProxima(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Notas</label>
          <input placeholder="Notas" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar tratamiento'}</button>
          {editandoId && (
            <button type="button" onClick={limpiarFormulario} className="!bg-gray-300 !text-gray-700">Cancelar</button>
          )}
        </div>
      </form>

      <hr className="border-t border-gray-200 mb-6" />

      <div className="flex flex-col gap-5">
        {tratamientos.map((tratamiento) => {
          const mascota = mascotas.find((m) => m.id === tratamiento.mascota_id)
          return (
            <div key={tratamiento.id} className="bg-white border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Tratamiento</p>
                  <p className="text-xl font-semibold text-[var(--color-teal)]">{tratamiento.nombre || 'Sin nombre'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => empezarEdicion(tratamiento)} className="!bg-[var(--color-teal)] !text-sm">Editar</button>
                  <button onClick={() => eliminarTratamiento(tratamiento.id)} className="!bg-[var(--color-coral)] !text-sm">Eliminar</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Dato titulo="Mascota" valor={mascota ? nombreConDueño(mascota) : 'Sin mascota'} />
                <Dato titulo="Tipo" valor={tratamiento.tipo} />
                <Dato titulo="Aplicación" valor={tratamiento.fecha_aplicacion} />
                <Dato titulo="Próxima" valor={tratamiento.fecha_proxima} />
                <Dato titulo="Notas" valor={tratamiento.notas} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}