'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

function ClientesContenido() {
  const [clientes, setClientes] = useState([])
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [fechaReg, setFechaReg] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [notificacion, setNotificacion] = useState('')
  const searchParams = useSearchParams()

  async function obtenerClientes() {
    const { data, error } = await supabase.from('clientes').select('*').order('nombre', { ascending: true })
    if (error) console.log('error', error)
    else setClientes(data)
  }

  useEffect(() => {
    obtenerClientes()
  }, [])

  useEffect(() => {
    const editarId = searchParams.get('editar')
    const buscarDesdeUrl = searchParams.get('buscar')
    
    if (buscarDesdeUrl) {
      setBusqueda(buscarDesdeUrl)
    }

    if (editarId && clientes.length > 0) {
      const cliente = clientes.find((c) => c.id === parseInt(editarId))
      if (cliente) empezarEdicion(cliente)
    }
  }, [searchParams, clients])

  function mostrarNotificacion(mensaje) {
    setNotificacion(mensaje)
    setTimeout(() => setNotificacion(''), 3000)
  }

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardarCliente(e) {
    e.preventDefault()
    const datos = {
      nombre, apellido, telefono, email, direccion,
      fecha_nac: fechaNac || null,
      fecha_reg: fechaReg || null,
    }
    let error
    if (editandoId) {
      const r = await supabase.from('clientes').update(datos).eq('id', editandoId)
      error = r.error
    } else {
      const r = await supabase.from('clientes').insert([datos])
      error = r.error
    }
    if (error) {
      alert('No se pudo guardar: ' + error.message)
    } else {
      mostrarNotificacion(editandoId ? 'Cliente actualizado' : 'Cliente agregado')
      limpiarFormulario()
      obtenerClientes()
    }
  }

  async function eliminarCliente(id) {
    const confirmar = window.confirm('¿Seguro que querés eliminar este cliente?')
    if (!confirmar) return
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) alert('No se pudo eliminar: ' + error.message)
    else obtenerClientes()
  }

  function Dato({ titulo, valor }) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 min-w-[120px]">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{titulo}</p>
        <p className="text-sm text-gray-800">{valor || '—'}</p>
      </div>
    )
  }

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

      <h1 className="text-3xl font-bold mb-6">Clientes</h1>

      <form onSubmit={guardarCliente} className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-8 shadow-sm max-w-xl">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-violet)]">
          {editandoId ? 'Editar cliente' : 'Nuevo cliente'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[7rem_1fr] items-center gap-y-3 gap-x-3 mb-6">
          <label className="text-xs font-medium text-gray-700">Nombre</label>
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <label className="text-xs font-medium text-gray-700">Apellido</label>
          <input placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          <label className="text-xs font-medium text-gray-700">Teléfono</label>
          <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <label className="text-xs font-medium text-gray-700">Email</label>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="text-xs font-medium text-gray-700">Dirección</label>
          <input placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          <label className="text-xs font-medium text-gray-700">Nacimiento</label>
          <input type="date" value={fechaNac} onChange={(e) => setFechaNac(e.target.value)} />
          <label className="text-xs font-medium text-gray-700">Registro</label>
          <input type="date" value={fechaReg} onChange={(e) => setFechaReg(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button type="submit">{editandoId ? 'Guardar cambios' : 'Agregar cliente'}</button>
          {editandoId && (
            <button type="button" onClick={limpiarFormulario} className="!bg-gray-300 !text-gray-700">Cancelar</button>
          )}
        </div>
      </form>

      <div className="flex gap-2 mb-6">
        <input placeholder="Buscar cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="max-w-sm" />
        <button type="button">Buscar</button>
      </div>

      <hr className="border-t border-gray-200 mb-6" />

      <div className="flex flex-col gap-5">
        {clientes
          .filter((cliente) => `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(busqueda.toLowerCase()))
          .map((cliente) => (
            <div key={cliente.id} className="bg-white border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xl font-semibold text-[var(--color-teal)]">{cliente.nombre} {cliente.apellido}</p>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => empezarEdicion(cliente)} className="!bg-[var(--color-teal)] !text-sm">Editar</button>
                  <button onClick={() => eliminarCliente(cliente.id)} className="!bg-[var(--color-coral)] !text-sm">Eliminar</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Dato titulo="Teléfono" valor={cliente.telefono} />
                <Dato titulo="Email" valor={cliente.email} />
                <Dato titulo="Dirección" valor={cliente.direccion} />
                <Dato titulo="Nacimiento" valor={cliente.fecha_nac} />
                <Dato titulo="Registro" valor={cliente.fecha_reg} />
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default function Clientes() {
  return (
    <Suspense>
      <ClientesContenido />
    </Suspense>
  )
}