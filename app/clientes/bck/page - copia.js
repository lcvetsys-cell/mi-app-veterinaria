'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [fechaReg, setFechaReg] = useState('')
  const [editandoId, setEditandoId] = useState(null)

  async function obtenerClientes() {
    const { data, error } = await supabase.from('clientes').select('*')
    if (error) {
      console.log('error', error)
    } else {
      setClientes(data)
    }
  }

  useEffect(() => {
    obtenerClientes()
  }, [])

  function limpiarFormulario() {
    setNombre('')
    setApellido('')
    setTelefono('')
    setEmail('')
    setDireccion('')
    setFechaNac('')
    setFechaReg('')
    setEditandoId(null)
  }

  function empezarEdicion(cliente) {
    setEditandoId(cliente.id)
    setNombre(cliente.nombre || '')
    setApellido(cliente.apellido || '')
    setTelefono(cliente.telefono || '')
    setEmail(cliente.email || '')
    setDireccion(cliente.direccion || '')
    setFechaNac(cliente.fecha_nac || '')
    setFechaReg(cliente.fecha_reg || '')
  }

  async function guardarCliente(e) {
    e.preventDefault()

    const datos = {
      nombre,
      apellido,
      telefono,
      email,
      direccion,
      fecha_nac: fechaNac || null,
      fecha_reg: fechaReg || null,
    }

    let error
    if (editandoId) {
      const resultado = await supabase.from('clientes').update(datos).eq('id', editandoId)
      error = resultado.error
    } else {
      const resultado = await supabase.from('clientes').insert([datos])
      error = resultado.error
    }

    if (error) {
      console.log('error al guardar', error)
      alert('No se pudo guardar: ' + error.message)
    } else {
      limpiarFormulario()
      obtenerClientes()
    }
  }

  async function eliminarCliente(id) {
    const confirmar = window.confirm('¿Seguro que querés eliminar este cliente?')
    if (!confirmar) return

    const { error } = await supabase.from('clientes').delete().eq('id', id)

    if (error) {
      console.log('error al eliminar', error)
      alert('No se pudo eliminar: ' + error.message)
    } else {
      obtenerClientes()
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Clientes</h1>

      <form onSubmit={guardarCliente} className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-8 shadow-sm max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-violet)]">
          {editandoId ? 'Editar cliente' : 'Nuevo cliente'}
        </h2>
          <div className="grid grid-cols-1 gap-3 mb-6">
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full" />
          <input placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} className="w-full" />
          <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full" />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
          <input placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full" />
          <div className="flex gap-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
            <input type="date" value={fechaNac} onChange={(e) => setFechaNac(e.target.value)} className="w-full" title="Fecha de nacimiento" />
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Registro</label>
            <input type="date" value={fechaReg} onChange={(e) => setFechaReg(e.target.value)} className="w-full" title="Fecha de registro" />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit">
            {editandoId ? 'Guardar cambios' : 'Agregar cliente'}
          </button>
          {editandoId && (
            <button type="button" onClick={limpiarFormulario} className="!bg-gray-300 !text-gray-700">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-3">
        {clientes.map((cliente) => (
          <div key={cliente.id} className="bg-white border border-[var(--color-line)] rounded-xl p-4 flex justify-between items-start shadow-sm">
            <div>
              <p className="font-semibold text-[var(--color-teal)]">{cliente.nombre} {cliente.apellido}</p>
              <p className="text-sm text-gray-600">Tel: {cliente.telefono || '—'} · Email: {cliente.email || '—'}</p>
              <p className="text-sm text-gray-600">Dirección: {cliente.direccion || '—'}</p>
              <p className="text-sm text-gray-500">Nacimiento: {cliente.fecha_nac || '—'} · Registro: {cliente.fecha_reg || '—'}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => empezarEdicion(cliente)} className="!bg-[var(--color-teal)]">Editar</button>
              <button onClick={() => eliminarCliente(cliente.id)} className="!bg-[var(--color-coral)]">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}