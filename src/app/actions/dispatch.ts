"use server";

import { revalidatePath } from "next/cache";

/**
 * Manually trigger the dispatch endpoint (for dev testing without n8n).
 * Calls POST /api/v1/internal/dispatch directly from within the server action.
 */
export async function manualDispatchAction() {
  try {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/v1/internal/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "manual" }),
      cache: "no-store",
    });

    const data = await res.json();
    revalidatePath("/dashboard");
    revalidatePath("/queue");
    revalidatePath("/history");
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}