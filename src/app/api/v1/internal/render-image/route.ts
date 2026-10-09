import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const headline = searchParams.get("headline") || "New Post";
  const width = 1080;
  const height = 1080;

  // Split headline into max 30-character lines to prevent overflow
  const words = headline.split(" ");
  let lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > 25) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  // Create SVG text elements
  const lineHeight = 80;
  const startY = height / 2 - (lines.length * lineHeight) / 2 + 40;
  
  const textSvg = lines.map((line, i) => 
    `<text x="50%" y="${startY + (i * lineHeight)}" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="64" fill="#ffffff">${line}</text>`
  ).join("");

  // Create a beautiful gradient SVG as the template
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4c1d95" />
          <stop offset="50%" stop-color="#7c3aed" />
          <stop offset="100%" stop-color="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      
      <!-- Subtle grid overlay for texture -->
      <path d="M0,100 L1080,100 M0,200 L1080,200 M0,300 L1080,300 M0,400 L1080,400 M0,500 L1080,500 M0,600 L1080,600 M0,700 L1080,700 M0,800 L1080,800 M0,900 L1080,900 M0,1000 L1080,1000" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
      <path d="M100,0 L100,1080 M200,0 L200,1080 M300,0 L300,1080 M400,0 L400,1080 M500,0 L500,1080 M600,0 L600,1080 M700,0 L700,1080 M800,0 L800,1080 M900,0 L900,1080 M1000,0 L1000,1080" stroke="rgba(255,255,255,0.05)" stroke-width="2" />

      <!-- Text Overlay -->
      <g style="filter: drop-shadow(0px 10px 15px rgba(0,0,0,0.5));">
        ${textSvg}
      </g>
      
      <!-- Brand Logo / Name Placeholder -->
      <rect x="40" y="40" width="200" height="60" rx="10" fill="rgba(255,255,255,0.1)" />
      <text x="140" y="78" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="24" fill="rgba(255,255,255,0.8)">PIXZORA</text>
    </svg>
  `;

  try {
    // Render the SVG to a WebP image using Sharp
    const buffer = await sharp(Buffer.from(svg))
      .webp({ quality: 90 })
      .toBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Image generation failed:", error);
    return new NextResponse("Error generating image", { status: 500 });
  }
}
