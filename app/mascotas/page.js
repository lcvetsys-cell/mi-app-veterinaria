'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

function MascotasContenido() {
  const [mascotas, setMascotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [especie, setEspecie] = useState('')
  const [sexo, setSexo] = useState('')
  const [raza, setRaza] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [busquedaDueño, setBusquedaDueño] = useState('')
  const [mostrarOpciones, setMostrarOpciones] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const searchParams = useSearchParams()

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

  useEffect(() => {
    obtenerMascotas()
    obtenerClientes()
  }, [])

  useEffect(() => {
    const editarId = searchParams.get('editar')
    if (editarId && mascotas.length > 0) {
      const mascota = mascotas.find((m) => m.id === parseInt(editarId))
      if (mascota) empezarEdicion(mascota)
    }
  }, [searchParams, mascotas])

  function limpiarFormulario() {
    setNombre('')
    setEspecie('')
    setSexo('')
    setRaza('')
    setFechaNacimiento('')
    setClienteId('')
    setBusquedaDueño('')
    setEditandoId(null)
  }

  function empezarEdicion(mascota) {
    setEditandoId(mascota.id)
    setNombre(mascota.nombre || '')
    setEspecie(mascota.especie || '')
    setSexo(mascota.sexo || '')
    setRaza(mascota.raza || '')
    setFechaNacimiento(mascota.fecha_nacimiento || '')
    setClienteId(mascota.cliente_id || '')
    const dueño = clientes.find((c) => c.id === mascota.cliente_id)
    setBusquedaDueño(dueño ? `${dueño.nombre} ${dueño.apellido}` : '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function seleccionarDueño(cliente) {
    setClienteId(cliente.id)
    setBusquedaDueño(`${cliente.nombre} ${cliente.apellido}`)
    setMostrarOpciones(false)
  }

  async function guardarMascota(e) {
    e.preventDefault()
    const datos = {
      nombre, especie, sexo, raza,
      fecha_nacimiento: fechaNacimiento || null,
      cliente_id: clienteId,
    }
    let error
    if (editandoId) {
      const r = await supabase.from('mascotas').update(datos).eq('id', editandoId)
      error = r.error
    } else {
      const r = await supabase.from('mascotas').insert([datos])
      error = r.error
    }
    if (error) {
      alert('No se pudo guardar: ' + error.message)
    } else {
      limpiarFormulario()
      obtenerMascotas()
    }
  }

  async function eliminarMascota(id) {
    const confirmar = window.confirm('¿Seguro que querés eliminar esta mascota?')
    if (!confirmar) return
    const { error } = await supabase.from('mascotas').delete().eq('id', id)
    if (error) alert('No se pudo eliminar: ' + error.message)
    else obtenerMascotas()
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
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(busquedaDueño.toLowerCase())
  )

  return (
    <div className="px-12 py-8 max-w-5xl mx-auto">
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

          <label className="text-xs font-medium text-gray-700">Dueño</label>
          <div className="relative">
            <input
              placeholder="Escribí para buscar..."
              value={busquedaDueño}
              onChange={(e) => { setBusquedaDueño(e.target.value); setClienteId(''); setMostrarOpciones(true) }}
              onFocus={() => setMostrarOpciones(true)}
              onBlur={() => setTimeout(() => setMostrarOpciones(false), 150)}
              className="w-full"
            />
            {mostrarOpciones && busquedaDueño && clientesFiltrados.length > 0 && (
              <div className="absolute z-10 bg-white border border-[var(--color-line)] rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                {clientesFiltrados.map((cliente) => (
                  <div key={cliente.id} onClick={() => seleccionarDueño(cliente)} className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100">
                    {cliente.nombre} {cliente.apellido}
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

      <div className="flex gap-2 mb-6">
        <input placeholder="Buscar mascota..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="max-w-sm" />
        <button type="button">Buscar</button>
      </div>

      <hr className="border-t border-gray-200 mb-6" />

      <div className="flex flex-col gap-5">
        {mascotas
          .filter((mascota) => {
            const dueño = clientes.find((c) => c.id === mascota.cliente_id)
            return dueño && `${dueño.nombre} ${dueño.apellido}`.toLowerCase().includes(busqueda.toLowerCase())
          })
          .map((mascota) => {
            const dueño = clientes.find((c) => c.id === mascota.cliente_id)
            return (
              <div key={mascota.id} className="bg-white border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xl font-semibold text-[var(--color-teal)]">{mascota.nombre}</p>
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
                  <Dato titulo="Dueño" valor={dueño ? `${dueño.nombre} ${dueño.apellido}` : null} />
                </div>
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