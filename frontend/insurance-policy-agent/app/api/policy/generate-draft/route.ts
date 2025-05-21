import { NextResponse } from 'next/server';

export interface GenerateDraftRequest {
  prompt: string;
  currentPolicyText?: string;
}

export interface GenerateDraftResponse {
  draft_text: string;
}

// Assume the FastAPI backend is running on this URL
// TODO: Use an environment variable for this URL
const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body: GenerateDraftRequest = await request.json();
    const { prompt, currentPolicyText } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log(`BFF: Received request to generate draft with prompt: ${prompt.substring(0, 100)}... Current text provided: ${!!currentPolicyText}`);

    const fastapiResponse = await fetch(`${FASTAPI_BACKEND_URL}/api/internal/v1/generate-policy-draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ prompt, current_policy_text: currentPolicyText }),
    });

    if (!fastapiResponse.ok) {
      const errorBody = await fastapiResponse.text();
      console.error(`BFF: Error from FastAPI backend (${fastapiResponse.status}): ${errorBody}`);
      return NextResponse.json(
        { error: `Error from policy generation service: ${fastapiResponse.statusText}`, details: errorBody },
        { status: fastapiResponse.status }
      );
    }

    const responseData: GenerateDraftResponse = await fastapiResponse.json();
    console.log(`BFF: Successfully fetched draft from FastAPI. Length: ${responseData.draft_text.length}`);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('BFF: Error in generate-draft endpoint:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: 'Failed to generate policy draft', details: errorMessage }, { status: 500 });
  }
} 