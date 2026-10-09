"use client";

import { useState } from "react";
import { Sparkles, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import { generateContentAction } from "@/app/actions/generate";
import { useRouter } from "next/navigation";

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly & Conversational" },
  { value: "inspiring", label: "Inspiring & Motivational" },
  { value: "educational", label: "Educational & Informative" },
  { value: "witty", label: "Witty & Humorous" },
  { value: "urgent", label: "Urgent & Action-Oriented" },
];

const TEMPLATE_OPTIONS = [
  { value: "default", label: "Default Template" },
  { value: "minimal", label: "Minimal Clean" },
  { value: "bold", label: "Bold & Vibrant" },
  { value: "corporate", label: "Corporate Professional" },
];

export default function GenerateContentPage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [postCount, setPostCount] = useState(1);
  const [referenceText, setReferenceText] = useState("");
  const [tone, setTone] = useState("professional");
  const [template, setTemplate] = useState("default");
  const [audience, setAudience] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsGenerating(true);
    
    const result = await generateContentAction(
      topic,
      instructions,
      postCount,
      tone,
      audience,
      referenceText
    );
    
    if (result.success) {
      router.push("/drafts");
    } else {
      alert("Error generating content: " + result.error);
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px" }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "6px" }}>
          Generate Content
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
          AI generates captions, headlines, image prompts and hashtags in British English.
          Generation does not publish or approve posts.
        </p>
      </div>

      {/* Privacy notice */}
      <div
        id="privacy-notice-generation"
        style={{
          display: "flex",
          gap: "10px",
          padding: "12px 16px",
          background: "rgba(234,179,8,0.08)",
          border: "1px solid rgba(234,179,8,0.2)",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <AlertCircle size={16} style={{ color: "rgb(234,179,8)", flexShrink: 0, marginTop: "1px" }} />
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
          <strong style={{ color: "rgba(234,179,8,0.9)" }}>Privacy notice:</strong> The free AI tier
          may use submitted prompts to improve its models. Do not include personal data, secrets, or
          confidential information in your topic, instructions, or reference material.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} id="generate-content-form">
        <div
          className="glass-card-elevated"
          style={{ padding: "28px", marginBottom: "20px" }}
        >
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "20px" }}>
            Content Details
          </h2>

          {/* Topic */}
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="topic"
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}
            >
              Topic <span style={{ color: "rgb(239,68,68)" }}>*</span>
            </label>
            <input
              id="topic"
              name="topic"
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 productivity tips for remote workers"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.9375rem",
                outline: "none",
              }}
            />
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: "20px" }}>
            <label
              htmlFor="instructions"
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}
            >
              Additional instructions
              <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>
                Optional
              </span>
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. Focus on actionable advice. Include a call-to-action."
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.9375rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Row: Post count + Tone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label
                htmlFor="post-count"
                style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}
              >
                Number of posts
              </label>
              <input
                id="post-count"
                name="postCount"
                type="number"
                min={1}
                max={10}
                value={postCount}
                onChange={(e) => setPostCount(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "0.9375rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="tone"
                style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}
              >
                Tone
              </label>
              <div style={{ position: "relative" }}>
                <select
                  id="tone"
                  name="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "0.9375rem",
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {TONE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ background: "rgb(22,22,42)" }}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.4)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row: Audience + Template */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label
                htmlFor="audience"
                style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}
              >
                Target audience
                <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>
                  Optional
                </span>
              </label>
              <input
                id="audience"
                name="audience"
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. UK small business owners"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "0.9375rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="template"
                style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}
              >
                Visual template
              </label>
              <div style={{ position: "relative" }}>
                <select
                  id="template"
                  name="template"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "0.9375rem",
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {TEMPLATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ background: "rgb(22,22,42)" }}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.4)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Reference material */}
          <div>
            <label
              htmlFor="reference-text"
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "8px" }}
            >
              Reference material
              <span style={{ marginLeft: "8px", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>
                Optional · treated as content context only
              </span>
            </label>
            <textarea
              id="reference-text"
              name="referenceText"
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              rows={4}
              placeholder="Paste relevant facts, article excerpts, or brand guidelines here..."
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.875rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            id="btn-generate-submit"
            type="submit"
            disabled={isGenerating || !topic.trim()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              background: isGenerating || !topic.trim()
                ? "rgba(139,92,246,0.4)"
                : "linear-gradient(135deg, rgb(139,92,246), rgb(109,40,217))",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: isGenerating || !topic.trim() ? "not-allowed" : "pointer",
              boxShadow: isGenerating || !topic.trim() ? "none" : "0 4px 16px rgba(139,92,246,0.35)",
              transition: "all 0.15s ease",
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate {postCount} Post{postCount > 1 ? "s" : ""}
              </>
            )}
          </button>

          <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)" }}>
            Generation runs in the background. You can navigate away.
          </p>
        </div>
      </form>
    </div>
  );
}
