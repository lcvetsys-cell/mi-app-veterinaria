'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

function TratamientosContenido() {
  const [tratamientos, setTratamientos] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [mascotaClientes, setMascotaClientes] = useState([])
  const [mascotaId, setMascotaId] = useState('')
  const [busquedaMascota, setBusquedaMascota] = useState('')
  const [mostrarOpciones, setMostrarOpciones] = useState(false)
  const [tipo, setTipo] = useState('')
  const [nombre, setNombre] = useState('')
  const [fechaAplicacion, setFechaAplicacion] = useState('')
  const [fechaProxima, setFechaProxima] = useState('')
  const [notas, setNotas] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [enviandoId, setEnviandoId] = useState(null)
  const searchParams = useSearchParams()

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

  async function obtenerMascotaClientes() {
    const { data, error } = await supabase.from('mascota_clientes').select('*')
    if (error) console.log('error', error)
    else setMascotaClientes(data)
  }

  useEffect(() => {
    obtenerTratamientos()
    obtenerMascotas()
    obtenerClientes()
    obtenerMascotaClientes()
  }, [])

  useEffect(() => {
    const editarId = searchParams.get('editar')
    if (editarId && tratamientos.length > 0) {
      const tratamiento = tratamientos.find((t) => t.id === parseInt(editarId))
      if (tratamiento) empezarEdicion(tratamiento)
    }
  }, [searchParams, tratamientos])

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
    setBusquedaMascota(mascota ? nombreConTutores(mascota) : '')
    setTipo(tratamiento.tipo || '')
    setNombre(tratamiento.nombre || '')
    setFechaAplicacion(tratamiento.fecha_aplicacion || '')
    setFechaProxima(tratamiento.fecha_proxima || '')
    setNotas(tratamiento.notas || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function seleccionarMascota(mascota) {
    setMascotaId(mascota.id)
    setBusquedaMascota(nombreConTutores(mascota))
    setMostrarOpciones(false)
  }

  async function guardarTratamiento(e) {
    e.preventDefault()
    const datos = {
      mascota_id: mascotaId, tipo, nombre,
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

  async function enviarWhatsapp(tratamiento, tutor) {
    const mascota = mascotas.find((m) => m.id === tratamiento.mascota_id)
    if (!tutor.telefono) {
      alert(`${tutor.nombre} no tiene teléfono cargado`)
      return
    }
    setEnviandoId(`${tratamiento.id}-${tutor.id}`)
    try {
      const mensaje = `Hola ${tutor.nombre}! Te recordamos que ${mascota.nombre} tiene "${tratamiento.nombre}" (${tratamiento.tipo}) programado para el ${tratamiento.fecha_proxima}. Saludos, LC Vet.`
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

  function irAlListado(e) {
    e.preventDefault()
    document.getElementById('lista-tratamientos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="px-12 py-8 max-w-5xl mx-auto">
      
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold whitespace-nowrap">Tratamientos</h1>
        <form onSubmit={irAlListado} className="flex gap-2 flex-1 max-w-sm">
          <input 
            placeholder="Buscar tratamiento..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
            className="w-full" 
          />
          <button type="submit">Buscar</button>
          <button 
            type="button" 
            onClick={() => { setBusqueda(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }} 
            className="!bg-gray-300 !text-gray-700"
          >
            Limpiar
          </button>
        </form>
      </div>

      <form onSubmit={guardarTratamiento} className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-8 shadow-sm max-w-xl">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-violet)]">
          {editandoId ? 'Editar tratamiento' : 'Nuevo tratamiento'}
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

      <div id="lista-tratamientos" className="flex flex-col gap-5">
        {tratamientos
          .filter((tratamiento) => {
            if (busqueda === '') return true
            const mascota = mascotas.find((m) => m.id === tratamiento.mascota_id)
            const tutores = mascota ? tutoresDeMascota(mascota.id) : []
            return tutores.some((t) => `${t.nombre} ${t.apellido}`.toLowerCase().includes(busqueda.toLowerCase())) ||
              mascota.nombre.toLowerCase().includes(busqueda.toLowerCase())
          })
          .map((tratamiento) => {
            const mascota = mascotas.find((m) => m.id === tratamiento.mascota_id)
            const tutores = mascota ? tutoresDeMascota(mascota.id) : []
            return (
              <div key={tratamiento.id} className="bg-white border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Tratamiento</p>
                    <p className="text-xl font-semibold text-[var(--color-teal)]">{tratamiento.nombre || 'Sin nombre'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {tutores.map((tutor) => (
                      <button
                        key={tutor.id}
                        onClick={() => enviarWhatsapp(tratamiento, tutor)}
                        disabled={enviandoId === `${tratamiento.id}-${tutor.id}`}
                        className="!bg-green-600 !text-sm"
                      >
                        {enviandoId === `${tratamiento.id}-${tutor.id}` ? 'Enviando...' : `WhatsApp ${tutor.nombre}`}
                      </button>
                    ))}
                    <button onClick={() => empezarEdicion(tratamiento)} className="!bg-[var(--color-teal)] !text-sm">Editar</button>
                    <button onClick={() => eliminarTratamiento(tratamiento.id)} className="!bg-[var(--color-coral)] !text-sm">Eliminar</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Dato titulo="Mascota" valor={mascota ? nombreConTutores(mascota) : 'Sin mascota'} />
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

export default function Tratamientos() {
  return (
    <Suspense>
      <TratamientosContenido />
    </Suspense>
  )
}