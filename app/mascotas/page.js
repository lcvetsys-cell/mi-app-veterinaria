'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

function MascotasContenido() {
  const [mascotas, setMascotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [mascotaClientes, setMascotaClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [especie, setEspecie] = useState('')
  const [sexo, setSexo] = useState('')
  const [raza, setRaza] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [fechaFallecimiento, setFechaFallecimiento] = useState('')
  const [estado, setEstado] = useState('activa')
  const [tutoresSeleccionados, setTutoresSeleccionados] = useState([])
  const [busquedaTutor, setBusquedaTutor] = useState('')
  const [mostrarOpciones, setMostrarOpciones] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [notificacion, setNotificacion] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const searchParams = useSearchParams()
  const router = useRouter()

  async function obtenerMascotas() {
    const { data, error } = await supabase.from('mascotas').select('*').order('nombre', { ascending: true })
    if (error) console.log('error', error)
    else setMascotas(data)
  }

  async function obtenerClientes() {
    const { data, error } = await supabase.from('clientes').select('*').order('nombre', { ascending: true })
    if (error) console.log('error', error)
    else setClientes(data)
  }

  async function obtenerMascotaClientes() {
    const { data, error } = await supabase.from('mascota_clientes').select('*')
    if (error) console.log('error', error)
    else setMascotaClientes(data)
  }

  useEffect(() => {
    obtenerMascotas()
    obtenerClientes()
    obtenerMascotaClientes()
  }, [])

  useEffect(() => {
    const editarId = searchParams.get('editar')
    if (editarId && mascotas.length > 0 && clientes.length > 0) {
      const mascota = mascotas.find((m) => m.id === parseInt(editarId))
      if (mascota) empezarEdicion(mascota)
    }
  }, [searchParams, mascotas, clientes])

  function mostrarNotificacion(mensaje) {
    setNotificacion(mensaje)
    setTimeout(() => setNotificacion(''), 3000)
  }

  function limpiarFormulario() {
    setNombre('')
    setEspecie('')
    setSexo('')
    setRaza('')
    setFechaNacimiento('')
    setFechaFallecimiento('')
    setEstado('activa')
    setTutoresSeleccionados([])
    setBusquedaTutor('')
    setEditandoId(null)
  }

  function empezarEdicion(mascota) {
    setEditandoId(mascota.id)
    setNombre(mascota.nombre || '')
    setEspecie(mascota.especie || '')
    setSexo(mascota.sexo || '')
    setRaza(mascota.raza || '')
    setFechaNacimiento(mascota.fecha_nacimiento || '')
    setFechaFallecimiento(mascota.fecha_fallecimiento || '')
    setEstado(mascota.estado || 'activa')
    const tutoresActuales = mascotaClientes
      .filter((mc) => mc.mascota_id === mascota.id)
      .map((mc) => clientes.find((c) => c.id === mc.cliente_id))
      .filter(Boolean)
    setTutoresSeleccionados(tutoresActuales)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function agregarTutor(cliente) {
    if (!tutoresSeleccionados.find((t) => t.id === cliente.id)) {
      setTutoresSeleccionados([...tutoresSeleccionados, cliente])
    }
    setBusquedaTutor('')
    setMostrarOpciones(false)
  }

  function quitarTutor(clienteId) {
    setTutoresSeleccionados(tutoresSeleccionados.filter((t) => t.id !== clienteId))
  }

  async function guardarMascota(e) {
    e.preventDefault()
    const datos = {
      nombre, especie, sexo, raza,
      fecha_nacimiento: fechaNacimiento || null,
      fecha_fallecimiento: fechaFallecimiento || null,
      estado,
    }
    let mascotaId = editandoId
    let error

    if (editandoId) {
      const r = await supabase.from('mascotas').update(datos).eq('id', editandoId)
      error = r.error
    } else {
      const r = await supabase.from('mascotas').insert([datos]).select()
      error = r.error
      if (!error) mascotaId = r.data[0].id
    }

    if (error) {
      alert('No se pudo guardar: ' + error.message)
      return
    }

    await supabase.from('mascota_clientes').delete().eq('mascota_id', mascotaId)
    if (tutoresSeleccionados.length > 0) {
      const relaciones = tutoresSeleccionados.map((t) => ({
        mascota_id: mascotaId,
        cliente_id: t.id,
      }))
      await supabase.from('mascota_clientes').insert(relaciones)
    }

    mostrarNotificacion(editandoId ? 'Mascota actualizada' : 'Mascota agregada')
    limpiarFormulario()
    obtenerMascotas()
    obtainMascotaClientes()
  }

  async function eliminarMascota(id) {
    const confirmar = window.confirm('¿Seguro que querés eliminar esta mascota?')
    if (!confirmar) return
    const { error } = await supabase.from('mascotas').delete().eq('id', id)
    if (error) alert('No se pudo eliminar: ' + error.message)
    else {
      obtenerMascotas()
      obtenerMascotaClientes()
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

  const clientesFiltrados = clientes.filter((c) =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(busquedaTutor.toLowerCase()) &&
    !tutoresSeleccionados.find((t) => t.id === c.id)
  )

  return (
    <div className="px-12 py-8 max-w-5xl mx-auto">

      {notificacion && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem',
          background: 'var(--color-teal)', color: 'white',
          padding: '0.75rem 1.5rem', borderRadius: '10px',
          fontWeight: '500', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          ✓ {notificacion}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Mascotas</h1>

      <form onSubmit={guardarMascota} className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-8 shadow-sm max-w-xl">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-violet)]">
          {editandoId ? 'Editar mascota' : 'Nueva mascota'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[7rem_1fr] items-center gap-y-3 gap-x-3 mb-6">
          <label className="text-xs font-medium text-gray-700">Nombre</label>
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Especie</label>
          <select value={especie} onChange={(e) => setEspecie(e.target.value)}>
            <option value="">Seleccionar especie</option>
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
          </select>

          <label className="text-xs font-medium text-gray-700">Sexo</label>
          <select value={sexo} onChange={(e) => setSexo(e.target.value)}>
            <option value="">Seleccionar sexo</option>
            <option value="macho">Macho</option>
            <option value="hembra">Hembra</option>
          </select>

          <label className="text-xs font-medium text-gray-700">Raza</label>
          <input placeholder="Raza" value={raza} onChange={(e) => setRaza(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Nacimiento</label>
          <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="activa">Activa</option>
            <option value="fallecida">Fallecida</option>
          </select>

          {estado === 'fallecida' && (
            <>
              <label className="text-xs font-medium text-gray-700">Fallecimiento</label>
              <input type="date" value={fechaFallecimiento} onChange={(e) => setFechaFallecimiento(e.target.value)} />
            </>
          )}

          <label className="text-xs font-medium text-gray-700">Tutores</label>
          <div>
            <div className="relative">
              <input
                placeholder="Buscar y agregar tutor..."
                value={busquedaTutor}
                onChange={(e) => { setBusquedaTutor(e.target.value); setMostrarOpciones(true) }}
                onFocus={() => setMostrarOpciones(true)}
                onBlur={() => setTimeout(() => setMostrarOpciones(false), 150)}
                className="w-full"
              />
              {mostrarOpciones && busquedaTutor && clientesFiltrados.length > 0 && (
                <div className="absolute z-10 bg-white border border-[var(--color-line)] rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                  {clientesFiltrados.map((cliente) => (
                    <div key={cliente.id} onClick={() => agregarTutor(cliente)} className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100">
                      {cliente.nombre} {cliente.apellido}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {tutoresSeleccionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tutoresSeleccionados.map((t) => (
                  <div key={t.id} className="flex items-center gap-1 bg-[var(--color-teal)] text-white text-xs px-3 py-1 rounded-full">
                    {t.nombre} {t.apellido}
                    <button
                      type="button"
                      onClick={() => quitarTutor(t.id)}
                      style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', marginLeft: '4px', fontSize: '14px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar mascota'}</button>
          {editandoId && (
            <button type="button" onClick={limpiarFormulario} className="!bg-gray-300 !text-gray-700">Cancelar</button>
          )}
        </div>
      </form>

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <input placeholder="Buscar mascota..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="max-w-sm" />
        <button type="button">Buscar</button>
        <div className="flex gap-2 ml-4">
          <button 
            type="button" 
            onClick={() => setFiltroEstado('todos')}
            className={`text-sm !px-3 !py-1 ${filtroEstado === 'todos' ? '!bg-[var(--color-violet)]' : '!bg-gray-200 !text-gray-700'}`}
          >
            Todos
          </button>
          <button 
            type="button" 
            onClick={() => setFiltroEstado('activa')}
            className={`text-sm !px-3 !py-1 ${filtroEstado === 'activa' ? '!bg-[var(--color-violet)]' : '!bg-gray-200 !text-gray-700'}`}
          >
            Activas
          </button>
          <button 
            type="button" 
            onClick={() => setFiltroEstado('fallecida')}
            className={`text-sm !px-3 !py-1 ${filtroEstado === 'fallecida' ? '!bg-[var(--color-violet)]' : '!bg-gray-200 !text-gray-700'}`}
          >
            Fallecidas
          </button>
        </div>
      </div>

      <hr className="border-t border-gray-200 mb-6" />

      <div className="flex flex-col gap-5">
        {mascotas
          .filter((mascota) => {
            if (filtroEstado !== 'todos' && mascota.estado !== filtroEstado) return false
            const tutores = mascotaClientes
              .filter((mc) => mc.mascota_id === mascota.id)
              .map((mc) => clientes.find((c) => c.id === mc.cliente_id))
              .filter(Boolean)
            if (busqueda === '') return true
            return tutores.some((t) => `${t.nombre} ${t.apellido}`.toLowerCase().includes(busqueda.toLowerCase())) ||
              mascota.nombre.toLowerCase().includes(busqueda.toLowerCase())
          })
          .map((mascota) => {
            const tutores = mascotaClientes
              .filter((mc) => mc.mascota_id === mascota.id)
              .map((mc) => clientes.find((c) => c.id === mc.cliente_id))
              .filter(Boolean)
            return (
              <div key={mascota.id} className={`bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${mascota.estado === 'fallecida' ? 'border-gray-300 opacity-70' : 'border-[var(--color-line)]'}`}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xl font-semibold text-[var(--color-teal)]">{mascota.nombre}</p>
                    {mascota.estado === 'fallecida' && (
                      <span className="text-xs text-gray-400 font-medium">Fallecida</span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => empezarEdicion(mascota)} className="!bg-[var(--color-teal)] !text-sm">Editar</button>
                    <button onClick={() => eliminarMascota(mascota.id)} className="!bg-[var(--color-coral)] !text-sm">Eliminar</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Dato titulo="Especie" valor={mascota.especie} />
                  <Dato titulo="Sexo" valor={mascota.sexo} />
                  <Dato titulo="Raza" valor={mascota.raza} />
                  <Dato titulo="Nacimiento" valor={mascota.fecha_nacimiento} />
                  <Dato titulo="Estado" valor={mascota.estado === 'fallecida' ? 'Fallecida' : 'Activa'} />
                  {mascota.estado === 'fallecida' && (
                    <Dato titulo="Fallecimiento" valor={mascota.fecha_fallecimiento} />
                  )}
                </div>
                {tutores.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2">Tutores</p>
                    <div className="flex flex-wrap gap-2">
                      {tutores.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => router.push(`/clientes?buscar=${encodeURIComponent(`${t.nombre} ${t.apellido}`)}`)}
                          className="bg-[var(--color-teal)] text-white text-xs px-3 py-1 rounded-full hover:opacity-80 cursor-pointer"
                        >
                          {t.nombre} {t.apellido}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default function Mascotas() {
  return (
    <Suspense>
      <MascotasContenido />
    </Suspense>
  )
}