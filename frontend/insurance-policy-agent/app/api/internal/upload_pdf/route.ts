import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const document_type = formData.get("document_type");
    const description = formData.get("description");

    // Base URL for the FastAPI backend, with a fallback for local development
    const fastapiBaseUrl = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8000';

    if (!fastapiBaseUrl) {
      // This condition would only be hit if somehow process.env.FASTAPI_BACKEND_URL is explicitly set to an empty string
      // and the fallback was also empty, which is not the case here.
      // For robustness, we keep a check, though the primary check is handled by the fallback.
      return NextResponse.json(
        { error: "FastAPI backend URL is not configured" },
        { status: 500 }
      );
    }

    const uploadUrl = new URL("/api/internal/v1/upload-pdf", fastapiBaseUrl).toString();

    const backendResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      // FormData sets the Content-Type header automatically, including the boundary
      // So, no need to set it manually here.
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.text(); // Or .json() if FastAPI sends structured errors
      console.error("FastAPI error response:", errorData);
      return NextResponse.json(
        { error: "Failed to upload PDF to backend", details: errorData },
        { status: backendResponse.status }
      );
    }

    const responseData = await backendResponse.json();
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error("Error in Next.js PDF upload route:", error);
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: "Error processing PDF upload", details: errorMessage },
      { status: 500 }
    );
  }
} 