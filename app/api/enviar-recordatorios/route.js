import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function sumarDias(fecha, dias) {
  const f = new Date(fecha)
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
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:+${telefono}`,
    body: mensaje,
  })
}

export async function GET() {
  const hoy = new Date().toISOString().split('T')[0]
  const fechaTurnos = sumarDias(hoy, 2)
  const fechaTratamientos = sumarDias(hoy, 3)

  const resultados = []

  const { data: turnos } = await supabaseAdmin
    .from('turnos')
    .select('*, mascotas(*, clientes(*))')
    .eq('fecha', fechaTurnos)
    .eq('recordatorio_enviado', false)

  for (const turno of turnos || []) {
    const mascota = turno.mascotas
    const dueño = mascota?.clientes
    if (dueño?.telefono) {
      const mensaje = `Hola ${dueño.nombre}! Te recordamos el turno de ${mascota.nombre} el ${turno.fecha} a las ${turno.hora}. Saludos, LC Vet.`
      try {
        await enviarMensaje(dueño.telefono, mensaje)
        await supabaseAdmin.from('turnos').update({ recordatorio_enviado: true }).eq('id', turno.id)
        resultados.push(`Turno enviado: ${mascota.nombre}`)
      } catch (e) {
        resultados.push(`Error turno ${mascota.nombre}: ${e.message}`)
      }
    }
  }

  const { data: tratamientos } = await supabaseAdmin
    .from('tratamientos')
    .select('*, mascotas(*, clientes(*))')
    .eq('fecha_proxima', fechaTratamientos)

  for (const tratamiento of tratamientos || []) {
    const yaEnviado = await yaSeEnvio(tratamiento.id)
    if (yaEnviado) continue

    const mascota = tratamiento.mascotas
    const dueño = mascota?.clientes
    if (dueño?.telefono) {
      const mensaje = `Hola ${dueño.nombre}! Te recordamos que ${mascota.nombre} tiene "${tratamiento.nombre}" (${tratamiento.tipo}) programado para el ${tratamiento.fecha_proxima}. Saludos, LC Vet.`
      try {
        await enviarMensaje(dueño.telefono, mensaje)
        await supabaseAdmin.from('avisos').insert([{
          tratamiento_id: tratamiento.id,
          canal: 'whatsapp',
          estado_envio: 'enviado',
          fecha_envio: new Date().toISOString(),
        }])
        resultados.push(`Tratamiento enviado: ${mascota.nombre}`)
      } catch (e) {
        resultados.push(`Error tratamiento ${mascota.nombre}: ${e.message}`)
      }
    }
  }

  return Response.json({ ok: true, resultados })
}