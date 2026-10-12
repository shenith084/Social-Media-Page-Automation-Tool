import { v2 as cloudinary } from "cloudinary";
import { StorageProvider, StorageUploadResult } from "./types";
import crypto from "crypto";

export class CloudinaryStorageProvider implements StorageProvider {
  name = "Cloudinary";
  private readonly folder: string;

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    this.folder = process.env.CLOUDINARY_FOLDER || "pixzora-social-automation";
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<StorageUploadResult> {
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    return new Promise((resolve, reject) => {
      const publicId = key.replace(/\.[^/.]+$/, ""); // strip extension for public_id
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          public_id: publicId,
          resource_type: "image",
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Cloudinary upload failed"));
            return;
          }

          resolve({
            key: result.public_id,
            publicUrl: result.secure_url,
            checksum: hash,
            sizeBytes: result.bytes,
          });
        }
      );

      uploadStream.end(buffer);
    });
  }

  async delete(key: string): Promise<void> {
    await cloudinary.uploader.destroy(key);
  }

  getPublicUrl(key: string): string {
    return cloudinary.url(key, { secure: true });
  }
}
