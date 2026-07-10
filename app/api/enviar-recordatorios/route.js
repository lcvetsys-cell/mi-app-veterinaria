import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

export async function GET() {
  // --- INICIO DEL DEBUG ---
  console.log("DEBUG SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
  // --- FIN DEL DEBUG ---

  const hoy = new Date().toISOString().split('T')[0]
  const fechaTurnos = sumarDias(hoy, 2)
  const fechaTratamientos = sumarDias(hoy, 3)

  const resultados = []

  console.log("DEBUG FECHA BUSCADA TURNOS:", fechaTurnos)

  const diaDespuesTurnos = sumarDias(fechaTurnos, 1)

  const { data: turnos } = await supabaseAdmin
    .from('turnos')
    .select('*, mascotas(*, mascota_clientes(*, clientes(*)))')
    .gte('fecha', fechaTurnos)
    .lt('fecha', diaDespuesTurnos)

  console.log("DEBUG TURNOS ENCONTRADOS:", JSON.stringify(turnos, null, 2))

  for (const turno of turnos || []) {
    const mascota = turno.mascotas
    const tutores = mascota?.mascota_clientes?.map(mc => mc.clientes).filter(Boolean) || []

    if (tutores.length > 0) {
      let enviosExitosos = 0
      for (const tutor of tutores) {
        if (tutor.telefono) {
          const mensaje = `Hola ${tutor.nombre}! Te recordamos el turno de ${mascota.nombre} el ${turno.fecha} a las ${turno.hora}. Saludos, LC Vet.`
          try {
            await enviarMensaje(tutor.telefono, mensaje)
            enviosExitosos++
          } catch (e) {
            resultados.push(`Error turno ${mascota.nombre} a ${tutor.nombre}: ${e.message}`)
          }
        }
      }
      if (enviosExitosos > 0) {
        await supabaseAdmin.from('turnos').update({ recordatorio_enviado: true }).eq('id', turno.id)
        resultados.push(`Turno enviado: ${mascota.nombre}`)
      }
    }
  }

  const { data: tratamientos } = await supabaseAdmin
    .from('tratamientos')
    .select('*, mascotas(*, mascota_clientes(*, clientes(*)))')
    .eq('fecha_proxima', fechaTratamientos)

  for (const tratamiento de tratamientos || []) {
    const yaEnviado = await yaSeEnvio(tratamiento.id)
    if (yaEnviado) continue

    const mascota = tratamiento.mascotas
    const tutores = mascota?.mascota_clientes?.map(mc => mc.clientes).filter(Boolean) || []

    if (tutores.length > 0) {
      let enviosExitosos = 0
      for (const tutor of tutores) {
        if (tutor.telefono) {
          const mensaje = `Hola ${tutor.nombre}! Te recordamos que ${mascota.nombre} tiene "${tratamiento.nombre}" (${tratamiento.tipo}) programado para el ${tratamiento.fecha_proxima}. Saludos, LC Vet.`
          try {
            await enviarMensaje(tutor.telefono, mensaje)
            enviosExitosos++
          } catch (e) {
            resultados.push(`Error tratamiento ${mascota.nombre} a ${tutor.nombre}: ${e.message}`)
          }
        }
      }

      if (enviosExitosos > 0) {
        await supabaseAdmin.from('avisos').insert([{
          tratamiento_id: tratamiento.id,
          canal: 'whatsapp',
          estado_envio: 'enviado',
          fecha_envio: new Date().toISOString(),
        }])
        resultados.push(`Tratamiento enviado: ${mascota.nombre}`)
      }
    }
  }

  return Response.json({ ok: true, resultados })
}