import { Metadata } from "next";
import { Palette, Bot, Sparkles, Sliders, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { templates, aiSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Templates & AI Settings" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const currentTemplates = await db.select().from(templates).limit(10);
  const currentAiSettings = (await db.select().from(aiSettings).limit(1))[0];

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }} className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Palette size={26} style={{ color: "rgb(139,92,246)" }} />
          Templates & AI Settings
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          Configure branding visuals, layout templates, and AI generation model adapters.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Template Branding */}
        <div className="glass-card-elevated" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <Palette size={20} style={{ color: "rgb(139,92,246)" }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Active Image Template</h2>
          </div>

          {currentTemplates.length > 0 ? (
            <div>
              <div style={{ marginBottom: "14px" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Template Name</span>
                <div style={{ fontWeight: 600, fontSize: "1rem" }}>{currentTemplates[0].name}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Primary Colour</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "4px",
                        background: currentTemplates[0].primaryColour || "#8B5CF6",
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", fontFamily: "monospace" }}>
                      {currentTemplates[0].primaryColour || "#8B5CF6"}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Font Family</span>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem", marginTop: "4px" }}>
                    {currentTemplates[0].fontFamily} (OFL)
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "rgba(34,197,94,0.08)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.8125rem",
                  color: "rgb(134,239,172)",
                }}
              >
                <CheckCircle2 size={16} />
                Sharp SVG overlay engine active (Zero external rendering cost)
              </div>
            </div>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.4)" }}>No custom templates configured.</p>
          )}
        </div>

        {/* AI Provider Config */}
        <div className="glass-card-elevated" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
            <Bot size={20} style={{ color: "rgb(59,130,246)" }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>AI Provider Adapters</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Text Generation</span>
                <span className="badge badge-approved" style={{ fontSize: "0.7rem" }}>Active</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                {currentAiSettings?.textProvider || "Google Gemini API"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>
                Model: {currentAiSettings?.textModel || "gemini-1.5-flash"} (Structured JSON mode)
              </div>
            </div>

            <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Image Generation</span>
                <span className="badge badge-approved" style={{ fontSize: "0.7rem" }}>Active</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                {currentAiSettings?.imageProvider || "Cloudflare Workers AI"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>
                Model: FLUX.1 schnell (Daily free allowance)
              </div>
            </div>

            <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Image Fallback</span>
                <span className="badge badge-queued" style={{ fontSize: "0.7rem" }}>Class A</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                {currentAiSettings?.imageFallbackProvider || "Local Sharp Gradient / Pattern"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)" }}>
                Zero-cost failover if AI image quota is reached
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quota Limits Policy */}
      <div className="glass-card-elevated" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <Sliders size={20} style={{ color: "rgb(234,179,8)" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Free-Tier Guardrails & Concurrency</h2>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", marginBottom: "20px" }}>
          Limits configured in accordance with the Free-Tier Technology Policy (Section 2).
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Daily Cap</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "4px" }}>
              {currentAiSettings?.dailyGenerationCap || 50} posts
            </div>
          </div>
          <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Monthly Cap</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "4px" }}>
              {currentAiSettings?.monthlyGenerationCap || 1000} posts
            </div>
          </div>
          <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Max Concurrency</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "4px" }}>
              {currentAiSettings?.maxConcurrentGenerations || 3} workers
            </div>
          </div>
          <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Max Retries</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "4px" }}>
              {currentAiSettings?.maxRetries || 3} attempts
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
