import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

function obtenerHoyArgentina() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())
}

function sumarDias(fecha, dias) {
  const f = new Date(fecha + 'T12:00:00')
  f.setDate(f.getDate() + dias)
  return f.toISOString().split('T')[0]
}

async function yaSeEnvio(tratamientoId) {
  const { data } = await supabaseAdmin
    .from('avisos')
    .select('id')
    .eq('tratamiento_id', tratamientoId)
  return data && data.length > 0
}

async function enviarMensaje(telefono, mensaje) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:+${telefono}`,
    body: mensaje,
  })
}

async function obtenerTutoresDeMascota(mascotaId) {
  const { data: relaciones } = await supabaseAdmin
    .from('mascota_clientes')
    .select('cliente_id')
    .eq('mascota_id', mascotaId)

  if (!relaciones || relaciones.length === 0) return []

  const clienteIds = relaciones.map((r) => r.cliente_id)

  const { data: clientes } = await supabaseAdmin
    .from('clientes')
    .select('*')
    .in('id', clienteIds)

  return clientes || []
}

export async function GET() {
  const hoy = obtenerHoyArgentina()
  const fechaTurnos = sumarDias(hoy, 2)
  const fechaTratamientos = sumarDias(hoy, 3)

  const debug = {
    hoy,
    fechaTurnos,
    fechaTratamientos,
    turnosEncontrados: 0,
    tratamientosEncontrados: 0,
  }

  const resultados = []

  // --- TURNOS ---
  // Debug: traer TODOS los turnos sin filtro para ver qué hay
  const { data: todosTurnos, error: errorTodosTurnos } = await supabaseAdmin
    .from('turnos')
    .select('id, fecha, recordatorio_enviado')

  debug.errorTodosTurnos = errorTodosTurnos?.message || null
  debug.errorTodosTurnosCode = errorTodosTurnos?.code || null

  debug.todosTurnos = todosTurnos

  const { data: turnos, error: errorTurnos } = await supabaseAdmin
    .from('turnos')
    .select('*, mascotas(*)')
    .eq('fecha', fechaTurnos)

  debug.turnosEncontrados = turnos?.length || 0
  debug.errorTurnos = errorTurnos?.message || null

  for (const turno of turnos || []) {
    const mascota = turno.mascotas
    if (!mascota) {
      resultados.push(`Turno ${turno.id}: sin mascota asociada`)
      continue
    }

    const tutores = await obtenerTutoresDeMascota(mascota.id)
    resultados.push(`Turno ${turno.id} (${mascota.nombre}): ${tutores.length} tutores encontrados`)

    let enviosExitosos = 0
    for (const tutor of tutores) {
      if (tutor.telefono) {
        const mensaje = `Hola ${tutor.nombre}! Te recordamos el turno de ${mascota.nombre} el ${turno.fecha} a las ${turno.hora}. Saludos, LC Vet.`
        try {
          await enviarMensaje(tutor.telefono, mensaje)
          enviosExitosos++
          resultados.push(`✓ WhatsApp enviado a ${tutor.nombre} (${tutor.telefono})`)
        } catch (e) {
          resultados.push(`✗ Error enviando a ${tutor.nombre}: ${e.message}`)
        }
      } else {
        resultados.push(`- ${tutor.nombre} no tiene teléfono`)
      }
    }

    if (enviosExitosos > 0) {
      await supabaseAdmin.from('turnos').update({ recordatorio_enviado: true }).eq('id', turno.id)
    }
  }

  // --- TRATAMIENTOS ---
  const { data: tratamientos, error: errorTratamientos } = await supabaseAdmin
    .from('tratamientos')
    .select('*, mascotas(*)')
    .eq('fecha_proxima', fechaTratamientos)

  debug.tratamientosEncontrados = tratamientos?.length || 0
  debug.errorTratamientos = errorTratamientos?.message || null

  for (const tratamiento of tratamientos || []) {
    const yaEnviado = await yaSeEnvio(tratamiento.id)
    if (yaEnviado) {
      resultados.push(`Tratamiento ${tratamiento.id}: ya enviado anteriormente`)
      continue
    }

    const mascota = tratamiento.mascotas
    if (!mascota) {
      resultados.push(`Tratamiento ${tratamiento.id}: sin mascota asociada`)
      continue
    }

    const tutores = await obtenerTutoresDeMascota(mascota.id)
    resultados.push(`Tratamiento ${tratamiento.id} (${mascota.nombre}): ${tutores.length} tutores encontrados`)

    let enviosExitosos = 0
    for (const tutor of tutores) {
      if (tutor.telefono) {
        const mensaje = `Hola ${tutor.nombre}! Te recordamos que ${mascota.nombre} tiene "${tratamiento.nombre}" (${tratamiento.tipo}) programado para el ${tratamiento.fecha_proxima}. Saludos, LC Vet.`
        try {
          await enviarMensaje(tutor.telefono, mensaje)
          enviosExitosos++
          resultados.push(`✓ WhatsApp enviado a ${tutor.nombre} (${tutor.telefono})`)
        } catch (e) {
          resultados.push(`✗ Error enviando a ${tutor.nombre}: ${e.message}`)
        }
      } else {
        resultados.push(`- ${tutor.nombre} no tiene teléfono`)
      }
    }

    if (enviosExitosos > 0) {
      await supabaseAdmin.from('avisos').insert([{
        tratamiento_id: tratamiento.id,
        canal: 'whatsapp',
        estado_envio: 'enviado',
        fecha_envio: new Date().toISOString(),
      }])
    }
  }

  return Response.json({ ok: true, debug, resultados })
}