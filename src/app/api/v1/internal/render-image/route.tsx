import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory cache for generated AI backgrounds so repeat loads are instant
const imageCache = new Map<string, string>();

async function getAiBackgroundImage(promptText: string): Promise<string | null> {
  const cacheKey = promptText.trim().toLowerCase();
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_WORKERS_AI_TOKEN;
  if (!accountId || !token) {
    return null;
  }

  try {
    const model = process.env.IMAGE_AI_MODEL || "@cf/black-forest-labs/flux-1-schnell";
    const enhancedPrompt = `${promptText}, cinematic lighting, photorealistic background, 8k wallpaper, clean aesthetic, no text`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: enhancedPrompt }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn("Cloudflare Workers AI returned non-200:", res.status);
      return null;
    }

    const data = await res.json();
    if (data?.result?.image) {
      const dataUrl = `data:image/jpeg;base64,${data.result.image}`;
      if (imageCache.size > 50) imageCache.clear();
      imageCache.set(cacheKey, dataUrl);
      return dataUrl;
    }
  } catch (err) {
    console.warn("AI background generation failed or timed out, fallback to gradient:", err);
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const headline = searchParams.get("headline") || "No headline provided";
    const prompt = searchParams.get("prompt") || searchParams.get("topic") || headline;

    const bgImage = await getAiBackgroundImage(prompt);

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a8a 100%)",
            color: "white",
            padding: "80px",
            textAlign: "center",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Layer 1: Photorealistic AI Generated Background Image */}
          {bgImage && (
            <img
              src={bgImage}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}

          {/* Layer 2: Gradient overlay scrim for contrast and legibility */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: bgImage
                ? "linear-gradient(180deg, rgba(15, 23, 42, 0.40) 0%, rgba(15, 23, 42, 0.70) 50%, rgba(15, 23, 42, 0.92) 100%)"
                : "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.15) 2%, transparent 0%)",
              backgroundSize: bgImage ? "auto" : "100px 100px",
            }}
          />

          {/* Layer 3: Brand Badge */}
          <div
            style={{
              position: "absolute",
              top: "60px",
              left: "60px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(15,23,42,0.8)",
              padding: "16px 32px",
              borderRadius: "16px",
              border: "2px solid rgba(255,255,255,0.25)",
            }}
          >
            <span style={{ fontSize: "30px", fontWeight: "bold", letterSpacing: "2px", color: "#38bdf8" }}>
              PIXZORA
            </span>
          </div>

          {/* Center Headline Frosted Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: "940px",
              padding: "54px 64px",
              background: "rgba(15, 23, 42, 0.72)",
              borderRadius: "28px",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: headline.length > 50 ? "68px" : "80px",
                fontWeight: 800,
                lineHeight: 1.25,
                textAlign: "center",
                color: "#ffffff",
                textShadow: "0px 4px 20px rgba(0,0,0,0.9)",
              }}
            >
              {headline}
            </div>
          </div>

          {/* Bottom Footer Badge */}
          <div
            style={{
              position: "absolute",
              bottom: "60px",
              display: "flex",
              alignItems: "center",
              fontSize: "26px",
              color: "rgba(255,255,255,0.85)",
              fontWeight: 500,
              background: "rgba(15,23,42,0.8)",
              padding: "12px 28px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            Viral reels • AI Generated Visual
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (e: any) {
    console.error("Failed to generate image:", e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
