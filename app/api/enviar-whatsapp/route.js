import twilio from 'twilio'

export async function POST(request) {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    // --- INICIO DEL DEBUG ---
    console.log("DEBUG TWILIO ACCOUNT SID:", process.env.TWILIO_ACCOUNT_SID)
    console.log("DEBUG FROM NUMBER:", process.env.TWILIO_WHATSAPP_NUMBER)
    // --- FIN DEL DEBUG ---

    const { telefono, mensaje } = await request.json()

    if (!telefono || !mensaje) {
      return Response.json({ error: 'Falta teléfono o mensaje' }, { status: 400 })
    }

    const resultado = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:+${telefono}`,
      body: mensaje,
    })

    return Response.json({ success: true, sid: resultado.sid })
  } catch (error) {
    console.log('Error enviando WhatsApp:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}