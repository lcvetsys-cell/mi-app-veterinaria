'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Mascotas() {
  const [mascotas, setMascotas] = useState([])
  const [clientes, setClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [especie, setEspecie] = useState('')
  const [sexo, setSexo] = useState('')
  const [raza, setRaza] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [editandoId, setEditandoId] = useState(null)

  async function obtenerMascotas() {
const { data, error } = await supabase.from('mascotas').select('*').order('nombre', { ascending: true })
    if (error) {
      console.log('error', error)
    } else {
      setMascotas(data)
    }
  }

  async function obtenerClientes() {
    const { data, error } = await supabase.from('clientes').select('*')
    if (error) {
      console.log('error', error)
    } else {
      setClientes(data)
    }
  }

  useEffect(() => {
    obtenerMascotas()
    obtenerClientes()
  }, [])

  function limpiarFormulario() {
    setNombre('')
    setEspecie('')
    setSexo('')
    setRaza('')
    setFechaNacimiento('')
    setClienteId('')
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
  }

  async function guardarMascota(e) {
    e.preventDefault()

    const datos = {
      nombre,
      especie,
      sexo,
      raza,
      fecha_nacimiento: fechaNacimiento || null,
      cliente_id: clienteId,
    }

    let error
    if (editandoId) {
      const resultado = await supabase.from('mascotas').update(datos).eq('id', editandoId)
      error = resultado.error
    } else {
      const resultado = await supabase.from('mascotas').insert([datos])
      error = resultado.error
    }

    if (error) {
      console.log('error al guardar', error)
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

    if (error) {
      console.log('error al eliminar', error)
      alert('No se pudo eliminar: ' + error.message)
    } else {
      obtenerMascotas()
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

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mascotas</h1>

      <form onSubmit={guardarMascota} className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-8 shadow-sm max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-violet)]">
          {editandoId ? 'Editar mascota' : 'Nueva mascota'}
        </h2>

        <div className="grid grid-cols-[7rem_1fr] items-center gap-y-3 gap-x-3 mb-6 max-w-sm">
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
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Seleccionar dueño</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} {cliente.apellido}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button type="submit">
            {editandoId ? 'Guardar cambios' : 'Agregar mascota'}
          </button>
          {editandoId && (
            <button type="button" onClick={limpiarFormulario} className="!bg-gray-300 !text-gray-700">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <hr className="border-t border-gray-200 mb-6" />

      <div className="flex flex-col gap-5">
        {mascotas.map((mascota) => {
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