import { NextResponse } from 'next/server'

// Base URL for the FastAPI backend
const BASE_FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8000';
const ANSWER_QUERY_ENDPOINT = new URL("/api/internal/v1/answer_query", BASE_FASTAPI_URL).toString();

export async function POST(request: Request) {
  try {
    const { query, thread_id, document_url, current_policy_text } = await request.json();

    if (!query) {
      return NextResponse.json({ detail: 'Query is required' }, { status: 400 });
    }
    // thread_id is optional for the agent, it will use a default if not provided
    // if (!thread_id) {
    //   return NextResponse.json({ detail: 'thread_id is required' }, { status: 400 });
    // }

    const bodyToFastAPI: any = { query };
    if (thread_id) {
        bodyToFastAPI.thread_id = thread_id;
    }
    if (document_url) { // Include document_url if present
        bodyToFastAPI.document_url = document_url;
    }
    if (current_policy_text) { // Include current_policy_text if present
        bodyToFastAPI.current_policy_text = current_policy_text;
    }

    const fastApiResponse = await fetch(ANSWER_QUERY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyToFastAPI),
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