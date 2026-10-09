import { ImageProvider, ImageGenerationRequest, GeneratedImage } from "./types";

export class CloudflareWorkersAiImageProvider implements ImageProvider {
  name = "Cloudflare Workers AI";
  private readonly endpoint: string;
  private readonly token: string;

  constructor() {
    const accountId = process.env.CF_ACCOUNT_ID;
    const token = process.env.CF_WORKERS_AI_TOKEN;

    if (!accountId || !token) {
      throw new Error("Missing Cloudflare Workers AI credentials");
    }

    const model = process.env.IMAGE_AI_MODEL || "@cf/black-forest-labs/flux-1-schnell";
    this.endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
    this.token = token;
  }

  async generateImage(req: ImageGenerationRequest): Promise<GeneratedImage> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: req.prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[CF Workers AI Error]", response.status, errorText);
        throw new Error(`Failed to generate image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        buffer,
        mimeType: response.headers.get("content-type") || "image/jpeg",
        width: req.width,
        height: req.height,
      };
    } catch (error) {
      console.error("[CloudflareWorkersAiImageProvider] Error:", error);
      throw error;
    }
  }

  async checkQuota(): Promise<{ remaining: number; resetAt: Date }> {
    return { remaining: 10000, resetAt: new Date(Date.now() + 86400000) };
  }
}
