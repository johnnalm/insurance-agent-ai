import { NextResponse } from 'next/server';

export interface EditPolicyRequest {
  current_policy_text: string;
  edit_instruction: string;
}

export interface EditPolicyResponse {
  edited_policy_text: string;
}

// Assume the FastAPI backend is running on this URL
// TODO: Use an environment variable for this URL
const FASTAPI_BACKEND_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const body: EditPolicyRequest = await request.json();
    const { current_policy_text, edit_instruction } = body;

    if (!current_policy_text || !edit_instruction) {
      return NextResponse.json({ error: 'Current policy text and edit instruction are required' }, { status: 400 });
    }

    console.log(`BFF: Received request to edit policy. Instruction: ${edit_instruction.substring(0,100)}...`);

    const fastapiResponse = await fetch(`${FASTAPI_BACKEND_URL}/api/internal/v1/edit-policy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ current_policy_text, edit_instruction }),
    });

    if (!fastapiResponse.ok) {
      const errorBody = await fastapiResponse.text();
      console.error(`BFF: Error from FastAPI backend (${fastapiResponse.status}): ${errorBody}`);
      return NextResponse.json(
        { error: `Error from policy editing service: ${fastapiResponse.statusText}`, details: errorBody },
        { status: fastapiResponse.status }
      );
    }

    const responseData: EditPolicyResponse = await fastapiResponse.json();
    console.log(`BFF: Successfully fetched edited policy from FastAPI. Length: ${responseData.edited_policy_text.length}`);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('BFF: Error in edit-policy endpoint:', error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: 'Failed to edit policy', details: errorMessage }, { status: 500 });
  }
} 