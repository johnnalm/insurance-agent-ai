import { NextResponse } from 'next/server';

// Esta URL será usada por el servidor de Next.js para llamar al backend de FastAPI
// Debería estar configurada en tus variables de entorno para el contenedor del frontend
const FASTAPI_BASE_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8001'; // Ajustado al puerto 8001 como fallback
const FASTAPI_LOGIN_URL = `${FASTAPI_BASE_URL}/api/auth/login`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ detail: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    const fastApiResponse = await fetch(FASTAPI_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', // Buena práctica añadir Accept header
      },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await fastApiResponse.json();

    // Reenviar la respuesta del backend de FastAPI (incluyendo tokens y datos de usuario)
    // y su status code original.
    return NextResponse.json(responseData, { status: fastApiResponse.status });

  } catch (error: any) {
    console.error('[API LOGIN ERROR]', error);
    // No podemos acceder a error.response con fetch de la misma manera que con axios.
    // Devolvemos un error genérico si la llamada a FastAPI falló o no devolvió JSON válido.
    // El status de fastApiResponse ya se usa arriba si la respuesta fue JSON pero un error HTTP.
    // Este catch es más para errores de red o si fastApiResponse.json() falla.
    return NextResponse.json({ detail: 'Error interno del servidor al procesar el login' }, { status: 500 });
  }
} 