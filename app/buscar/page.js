'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

export default function Buscar() {
  const [clientes, setClientes] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [mascotaClientes, setMascotaClientes] = useState([])
  const [tratamientos, setTratamientos] = useState([])
  const [turnos, setTurnos] = useState([])
  const [consultas, setConsultas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function cargarTodo() {
      const [c, m, mc, t, tu, co] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('mascotas').select('*'),
        supabase.from('mascota_clientes').select('*'),
        supabase.from('tratamientos').select('*'),
        supabase.from('turnos').select('*'),
        supabase.from('consultas').select('*'),
      ])
      setClientes(c.data || [])
      setMascotas(m.data || [])
      setMascotaClientes(mc.data || [])
      setTratamientos(t.data || [])
      setTurnos(tu.data || [])
      setConsultas(co.data || [])
    }
    cargarTodo()
  }, [])

  function Dato({ titulo, valor }) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 min-w-[120px]">
        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{titulo}</p>
        <p className="text-sm text-gray-800">{valor || '—'}</p>
      </div>
    )
  }

  function tutoresDeMascota(mascotaId) {
    return mascotaClientes
      .filter((mc) => mc.mascota_id === mascotaId)
      .map((mc) => clientes.find((c) => c.id === mc.cliente_id))
      .filter(Boolean)
  }

  function mascotasDeCliente(clienteId) {
    return mascotaClientes
      .filter((mc) => mc.cliente_id === clienteId)
      .map((mc) => mascotas.find((m) => m.id === mc.mascota_id))
      .filter(Boolean)
  }

  const texto = busqueda.toLowerCase()
  const clienteIdsEncontrados = new Set()

  if (busqueda) {
    // Por nombre de cliente
    clientes.forEach((c) => {
      if (`${c.nombre} ${c.apellido}`.toLowerCase().includes(texto)) {
        clienteIdsEncontrados.add(c.id)
      }
    })

    // Por nombre, especie, raza o estado de mascota
    mascotas.forEach((m) => {
      if (
        (m.nombre || '').toLowerCase().includes(texto) ||
        (m.especie || '').toLowerCase().includes(texto) ||
        (m.raza || '').toLowerCase().includes(texto) ||
        (m.estado || '').toLowerCase().includes(texto)
      ) {
        tutoresDeMascota(m.id).forEach((t) => clienteIdsEncontrados.add(t.id))
      }
    })

    // Por tratamiento
    tratamientos.forEach((t) => {
      if (
        (t.nombre || '').toLowerCase().includes(texto) ||
        (t.tipo || '').toLowerCase().includes(texto) ||
        (t.notas || '').toLowerCase().includes(texto)
      ) {
        const mascota = mascotas.find((m) => m.id === t.mascota_id)
        if (mascota) tutoresDeMascota(mascota.id).forEach((tu) => clienteIdsEncontrados.add(tu.id))
      }
    })

    // Por consulta
    consultas.forEach((c) => {
      if (
        (c.motivo || '').toLowerCase().includes(texto) ||
        (c.diagnostico || '').toLowerCase().includes(texto)
      ) {
        const mascota = mascotas.find((m) => m.id === c.mascota_id)
        if (mascota) tutoresDeMascota(mascota.id).forEach((t) => clienteIdsEncontrados.add(t.id))
      }
    })

    // Por turno
    turnos.forEach((t) => {
      if ((t.estado || '').toLowerCase().includes(texto)) {
        const mascota = mascotas.find((m) => m.id === t.mascota_id)
        if (mascota) tutoresDeMascota(mascota.id).forEach((tu) => clienteIdsEncontrados.add(tu.id))
      }
    })
  }

  const clientesFiltrados = clientes.filter((c) => clienteIdsEncontrados.has(c.id))

  return (
    <div className="px-12 py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Búsqueda general</h1>

      <input
        placeholder="Buscar por cliente, mascota, tratamiento, consulta..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full max-w-xl mb-8"
      />

      {busqueda && clientesFiltrados.length === 0 && (
        <p className="text-sm text-gray-400">Sin resultados para "{busqueda}"</p>
      )}

      <div className="flex flex-col gap-10">
        {clientesFiltrados.map((cliente) => {
          const mascotasCliente = mascotasDeCliente(cliente.id)
          const mascotaIds = mascotasCliente.map((m) => m.id)
          const turnosCliente = turnos.filter((t) => mascotaIds.includes(t.mascota_id))
          const tratamientosCliente = tratamientos.filter((t) => mascotaIds.includes(t.mascota_id))
          const consultasCliente = consultas.filter((c) => mascotaIds.includes(c.mascota_id))

          return (
            <div key={cliente.id} className="bg-white border-2 border-[var(--color-teal)] rounded-xl p-6 shadow-sm">

              {/* Cliente */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">Cliente</p>
                  <p className="text-2xl font-semibold text-[var(--color-teal)]">{cliente.nombre} {cliente.apellido}</p>
                </div>
                <button onClick={() => router.push(`/clientes?editar=${cliente.id}`)} className="!bg-[var(--color-teal)] !text-sm shrink-0">Editar</button>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                <Dato titulo="Teléfono" valor={cliente.telefono} />
                <Dato titulo="Email" valor={cliente.email} />
                <Dato titulo="Dirección" valor={cliente.direccion} />
                <Dato titulo="Nacimiento" valor={cliente.fecha_nac} />
                <Dato titulo="Registro" valor={cliente.fecha_reg} />
              </div>

              {/* Mascotas */}
              {mascotasCliente.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-[var(--color-violet)] mb-2">Mascotas ({mascotasCliente.length})</p>
                  <div className="flex flex-col gap-2">
                    {mascotasCliente.map((m) => {
                      const tutores = tutoresDeMascota(m.id)
                      return (
                        <div key={m.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                          <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Dato titulo="Nombre" valor={m.nombre} />
                              <Dato titulo="Especie" valor={m.especie} />
                              <Dato titulo="Sexo" valor={m.sexo} />
                              <Dato titulo="Raza" valor={m.raza} />
                              <Dato titulo="Nacimiento" valor={m.fecha_nacimiento} />
                              <Dato titulo="Estado" valor={m.estado === 'fallecida' ? 'Fallecida' : 'Activa'} />
                              {m.estado === 'fallecida' && (
                                <Dato titulo="Fallecimiento" valor={m.fecha_fallecimiento} />
                              )}
                            </div>
                            {tutores.length > 1 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold w-full mb-1">Tutores</p>
                                {tutores.map((t) => (
                                  <span key={t.id} className="bg-[var(--color-teal)] text-white text-xs px-2 py-0.5 rounded-full">
                                    {t.nombre} {t.apellido}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => router.push(`/mascotas?editar=${m.id}`)} className="!bg-[var(--color-teal)] !text-sm shrink-0 ml-2">Editar</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Turnos */}
              {turnosCliente.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-[var(--color-violet)] mb-2">Turnos ({turnosCliente.length})</p>
                  <div className="flex flex-col gap-2">
                    {turnosCliente.map((t) => {
                      const mascota = mascotas.find((m) => m.id === t.mascota_id)
                      return (
                        <div key={t.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                          <div className="flex flex-wrap gap-2">
                            <Dato titulo="Mascota" valor={mascota?.nombre} />
                            <Dato titulo="Fecha" valor={t.fecha} />
                            <Dato titulo="Hora" valor={t.hora} />
                            <Dato titulo="Estado" valor={t.estado} />
                          </div>
                          <button onClick={() => router.push(`/turnos?editar=${t.id}`)} className="!bg-[var(--color-teal)] !text-sm shrink-0 ml-2">Editar</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tratamientos */}
              {tratamientosCliente.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-[var(--color-violet)] mb-2">Tratamientos ({tratamientosCliente.length})</p>
                  <div className="flex flex-col gap-2">
                    {tratamientosCliente.map((t) => {
                      const mascota = mascotas.find((m) => m.id === t.mascota_id)
                      return (
                        <div key={t.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                          <div className="flex flex-wrap gap-2">
                            <Dato titulo="Mascota" valor={mascota?.nombre} />
                            <Dato titulo="Nombre" valor={t.nombre} />
                            <Dato titulo="Tipo" valor={t.tipo} />
                            <Dato titulo="Próxima" valor={t.fecha_proxima} />
                            <Dato titulo="Notas" valor={t.notas} />
                          </div>
                          <button onClick={() => router.push(`/tratamientos?editar=${t.id}`)} className="!bg-[var(--color-teal)] !text-sm shrink-0 ml-2">Editar</button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Consultas */}
              {consultasCliente.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[var(--color-violet)] mb-2">Consultas ({consultasCliente.length})</p>
                  <div className="flex flex-col gap-2">
                    {consultasCliente.map((c) => {
                      const mascota = mascotas.find((m) => m.id === c.mascota_id)
                      return (
                        <div key={c.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                          <div className="flex flex-wrap gap-2">
                            <Dato titulo="Mascota" valor={mascota?.nombre} />
                            <Dato titulo="Motivo" valor={c.motivo} />
                            <Dato titulo="Fecha" valor={c.fecha} />
                            <Dato titulo="Diagnóstico" valor={c.diagnostico} />
                          </div>
                          <button onClick={() => router.push(`/consultas?editar=${c.id}`)} className="!bg-[var(--color-teal)] !text-sm shrink-0 ml-2">Editar</button>
                        </div>
                      )
                    })}
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