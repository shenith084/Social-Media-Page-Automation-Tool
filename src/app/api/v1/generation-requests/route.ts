import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

// Standard API response format
function successResponse<T>(data: T, message = "Success", status = 200) {
  return NextResponse.json(
    { success: true, message, data },
    { status }
  );
}

function errorResponse(
  message: string,
  errorCode: string,
  fieldErrors?: Record<string, string[]>,
  status = 400
) {
  return NextResponse.json(
    { success: false, message, errorCode, fieldErrors: fieldErrors ?? null, data: null },
    { status }
  );
}

const CreateGenerationRequestSchema = z.object({
  pageId: z.string().uuid("Invalid Page ID"),
  topic: z.string().min(3, "Topic must be at least 3 characters").max(500),
  instructions: z.string().max(2000).optional(),
  postCount: z.number().int().min(1).max(10).default(1),
  referenceText: z.string().max(8000).optional(),
  audience: z.string().max(200).optional(),
  tone: z.enum(["professional", "friendly", "inspiring", "educational", "witty", "urgent"]).optional(),
  templateId: z.string().uuid().optional(),
});

/**
 * POST /api/v1/generation-requests
 * Creates a new generation request and triggers the n8n workflow.
 * The UI never waits on generation — it returns immediately with the request ID.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateGenerationRequestSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        fieldErrors[key] = fieldErrors[key] ?? [];
        fieldErrors[key].push(issue.message);
      }
      return errorResponse(
        "Validation failed. Please correct the highlighted fields.",
        "VALIDATION_ERROR",
        fieldErrors,
        422
      );
    }

    // TODO: check daily generation cap from aiSettings
    // TODO: create generation_request record in DB
    // TODO: trigger n8n workflow via authenticated webhook
    // TODO: create audit log entry

    const mockRequestId = crypto.randomUUID();

    return successResponse(
      {
        requestId: mockRequestId,
        status: "requested",
        message: "Generation started. You will be notified when the batch is ready.",
        postCount: parsed.data.postCount,
      },
      "Generation request created",
      202
    );
  } catch (err) {
    console.error("[POST /api/v1/generation-requests]", err);
    return errorResponse(
      "An unexpected error occurred. Please try again.",
      "INTERNAL_ERROR",
      undefined,
      500
    );
  }
}

/**
 * GET /api/v1/generation-requests
 * List generation requests for the current page with pagination.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const pageId = searchParams.get("pageId");

  // TODO: fetch from DB, enforcing permissions
  const mockData = {
    items: [],
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  };

  return successResponse(mockData);
}
