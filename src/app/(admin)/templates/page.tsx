import { Metadata } from "next";
import { Palette, Bot, Sliders, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { templates, aiSettings } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Templates & AI Settings" };
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const currentTemplates = await db.select().from(templates).limit(10);
  const currentAiSettings = (await db.select().from(aiSettings).limit(1))[0];

  return (
    <div className="admin-page-container">
      {/* Top Header Row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "26px",
        gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Palette size={24} color="#6366F1" />
          </div>
          <div>
            <h1 style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: "-0.02em",
            }}>
              Templates & AI Settings
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#64748B",
              margin: "3px 0 0",
              fontWeight: 400,
            }}>
              Configure branding visuals, layout templates, and AI generation model adapters.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "26px" }}>
        {/* Template Branding */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "26px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Palette size={20} color="#6366F1" />
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Active Image Template
            </h2>
          </div>

          {currentTemplates.length > 0 ? (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Template Name</span>
                <div style={{ fontWeight: 700, fontSize: "1.0625rem", color: "#0F172A", marginTop: "2px" }}>
                  {currentTemplates[0].name}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Primary Colour</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <div
                      style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "6px",
                        background: currentTemplates[0].primaryColour || "#4F46E5",
                        border: "1px solid #E2E8F0",
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", fontFamily: "monospace", color: "#0F172A", fontWeight: 600 }}>
                      {currentTemplates[0].primaryColour || "#4F46E5"}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Font Family</span>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0F172A", marginTop: "6px" }}>
                    {currentTemplates[0].fontFamily} (OFL)
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "#DCFCE7",
                  border: "1px solid #BBF7D0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.8125rem",
                  color: "#16A34A",
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={16} />
                Sharp SVG overlay engine active (Zero external rendering cost)
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748B", fontSize: "0.875rem" }}>No custom templates configured.</p>
          )}
        </div>

        {/* AI Provider Config */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "26px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Bot size={20} color="#6366F1" />
            <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              AI Provider Adapters
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Text Generation</span>
                <span style={{ background: "#DCFCE7", color: "#16A34A", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px" }}>Active</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A" }}>
                {currentAiSettings?.textProvider || "Google Gemini API"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                Model: {currentAiSettings?.textModel || "gemini-3-flash-preview"} (Structured JSON mode)
              </div>
            </div>

            <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Image Generation</span>
                <span style={{ background: "#DCFCE7", color: "#16A34A", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px" }}>Active</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A" }}>
                {currentAiSettings?.imageProvider || "Cloudflare Workers AI"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                Model: FLUX.1 schnell (Daily free allowance)
              </div>
            </div>

            <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Image Fallback</span>
                <span style={{ background: "#E0F2FE", color: "#0284C7", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px" }}>Class A</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0F172A" }}>
                {currentAiSettings?.imageFallbackProvider || "Local Sharp Gradient / Pattern"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "2px" }}>
                Zero-cost failover if AI image quota is reached
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quota Limits Policy */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          padding: "26px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Sliders size={20} color="#D97706" />
          <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
            Free-Tier Guardrails & Concurrency
          </h2>
        </div>
        <p style={{ color: "#64748B", fontSize: "0.875rem", margin: "0 0 20px" }}>
          Configured system guardrails and resource allocation limits.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div style={{ padding: "16px 20px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Daily Cap</div>
            <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {currentAiSettings?.dailyGenerationCap || 50} posts
            </div>
          </div>
          <div style={{ padding: "16px 20px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Monthly Cap</div>
            <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {currentAiSettings?.monthlyGenerationCap || 1000} posts
            </div>
          </div>
          <div style={{ padding: "16px 20px", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Max Concurrency</div>
            <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              1 active job
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

