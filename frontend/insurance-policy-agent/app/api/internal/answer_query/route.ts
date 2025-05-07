import { NextResponse } from 'next/server'

// Ensure this URL points to your FastAPI backend
const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8000/api/internal/v1/answer_query';

export async function POST(request: Request) {
  try {
    const { query, thread_id } = await request.json();

    if (!query) {
      return NextResponse.json({ detail: 'Query is required' }, { status: 400 });
    }
    if (!thread_id) {
      return NextResponse.json({ detail: 'thread_id is required' }, { status: 400 });
    }

    const fastApiResponse = await fetch(FASTAPI_BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, thread_id }), // Forwarding thread_id
    });

    const data = await fastApiResponse.json();

    if (!fastApiResponse.ok) {
      // Forward FastAPI's error response
      return NextResponse.json(data || { detail: 'Error from backend service' }, { status: fastApiResponse.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in Next.js API route:', error);
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ detail: errorMessage }, { status: 500 });
  }
} 