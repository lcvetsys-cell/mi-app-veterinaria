export async function POST(request) {
  try {
    const { telefono, mensaje } = await request.json()

    if (!telefono || !mensaje) {
      return Response.json({ error: 'Falta teléfono o mensaje' }, { status: 400 })
    }

    // Limpiamos el teléfono por si llega con "+" o "whatsapp:", CallMeBot solo quiere números
    const telefonoLimpio = telefono.replace(/[^0-9]/g, '')

    const url = `https://api.callmebot.com/whatsapp.php?phone=${telefonoLimpio}&text=${encodeURIComponent(mensaje)}&apikey=${process.env.CALLMEBOT_API_KEY}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Error al conectar con CallMeBot')
    }

    return Response.json({ success: true })
  } catch (error) {
    console.log('Error enviando WhatsApp:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}