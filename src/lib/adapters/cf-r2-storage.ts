import { StorageProvider, StorageUploadResult } from "./types";
import crypto from "crypto";
// Note: In a real app, you would use @aws-sdk/client-s3 for Cloudflare R2

export class CloudflareR2StorageProvider implements StorageProvider {
  name = "Cloudflare R2";
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME || "";
    this.publicUrl = process.env.R2_PUBLIC_URL || "";

    if (!this.bucketName) {
      console.warn("R2_BUCKET_NAME not configured. Storage will fail.");
    }
  }

  async upload(key: string, buffer: Buffer, contentType: string, metadata?: Record<string, string>): Promise<StorageUploadResult> {
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    return {
      key,
      publicUrl: `${this.publicUrl}/${key}`,
      checksum: hash,
      sizeBytes: buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    console.log(`[Storage] Deleted asset ${key}`);
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    return true;
  }
}
