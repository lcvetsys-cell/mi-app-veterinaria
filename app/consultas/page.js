'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Consultas() {
  const [consultas, setConsultas] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [mascotaId, setMascotaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [motivo, setMotivo] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [editandoId, setEditandoId] = useState(null)

  async function obtenerConsultas() {
    const { data, error } = await supabase.from('consultas').select('*').order('fecha', { ascending: false })
    if (error) {
      console.log('error', error)
    } else {
      setConsultas(data)
    }
  }

  async function obtenerMascotas() {
    const { data, error } = await supabase.from('mascotas').select('*').order('nombre', { ascending: true })
    if (error) {
      console.log('error', error)
    } else {
      setMascotas(data)
    }
  }

  useEffect(() => {
    obtenerConsultas()
    obtenerMascotas()
  }, [])

  function limpiarFormulario() {
    setMascotaId('')
    setFecha('')
    setMotivo('')
    setDiagnostico('')
    setEditandoId(null)
  }

  function empezarEdicion(consulta) {
    setEditandoId(consulta.id)
    setMascotaId(consulta.mascota_id || '')
    setFecha(consulta.fecha || '')
    setMotivo(consulta.motivo || '')
    setDiagnostico(consulta.diagnostico || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function guardarConsulta(e) {
    e.preventDefault()

    const datos = {
      mascota_id: mascotaId,
      fecha: fecha || null,
      motivo,
      diagnostico,
    }

    let error
    if (editandoId) {
      const resultado = await supabase.from('consultas').update(datos).eq('id', editandoId)
      error = resultado.error
    } else {
      const resultado = await supabase.from('consultas').insert([datos])
      error = resultado.error
    }

    if (error) {
      console.log('error al guardar', error)
      alert('No se pudo guardar: ' + error.message)
    } else {
      limpiarFormulario()
      obtenerConsultas()
    }
  }

  async function eliminarConsulta(id) {
    const confirmar = window.confirm('¿Seguro que querés eliminar esta consulta?')
    if (!confirmar) return

    const { error } = await supabase.from('consultas').delete().eq('id', id)

    if (error) {
      console.log('error al eliminar', error)
      alert('No se pudo eliminar: ' + error.message)
    } else {
      obtenerConsultas()
    }
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
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Consultas</h1>

      <form onSubmit={guardarConsulta} className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-8 shadow-sm max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-violet)]">
          {editandoId ? 'Editar consulta' : 'Nueva consulta'}
        </h2>

        <div className="grid grid-cols-[7rem_1fr] items-center gap-y-3 gap-x-3 mb-6 max-w-sm">
          <label className="text-xs font-medium text-gray-700">Mascota</label>
          <select value={mascotaId} onChange={(e) => setMascotaId(e.target.value)}>
            <option value="">Seleccionar mascota</option>
            {mascotas.map((mascota) => (
              <option key={mascota.id} value={mascota.id}>
                {mascota.nombre}
              </option>
            ))}
          </select>

          <label className="text-xs font-medium text-gray-700">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Motivo</label>
          <input placeholder="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />

          <label className="text-xs font-medium text-gray-700">Diagnóstico</label>
          <input placeholder="Diagnóstico" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button type="submit">
            {editandoId ? 'Guardar cambios' : 'Agregar consulta'}
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
        {consultas.map((consulta) => {
          const mascota = mascotas.find((m) => m.id === consulta.mascota_id)
          return (
            <div key={consulta.id} className="bg-white border border-[var(--color-line)] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
<div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Motivo</p>
                  <p className="text-xl font-semibold text-[var(--color-teal)]">{consulta.motivo || 'Sin motivo'}</p>
                </div>                <div className="flex gap-2 shrink-0">
                  <button onClick={() => empezarEdicion(consulta)} className="!bg-[var(--color-teal)] !text-sm">Editar</button>
                  <button onClick={() => eliminarConsulta(consulta.id)} className="!bg-[var(--color-coral)] !text-sm">Eliminar</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Dato titulo="Mascota" valor={mascota ? mascota.nombre : 'Sin mascota'} />
                <Dato titulo="Fecha" valor={consulta.fecha} />
                <Dato titulo="Diagnóstico" valor={consulta.diagnostico} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}