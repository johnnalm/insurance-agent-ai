import { NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8001';
const FASTAPI_REGISTER_URL = `${FASTAPI_BASE_URL}/api/auth/register`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Asumiendo que el body contiene email, password, y opcionalmente first_name, last_name, phone

    const fastApiResponse = await fetch(FASTAPI_REGISTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await fastApiResponse.json();

    return NextResponse.json(responseData, { status: fastApiResponse.status });

  } catch (error: any) {
    console.error('[API REGISTER ERROR]', error);
    return NextResponse.json({ detail: 'Error interno del servidor al procesar el registro' }, { status: 500 });
  }
} 