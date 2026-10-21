"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  Tag,
  Hash,
  Smile,
  Users,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Send,
  RefreshCw,
  ChevronsUpDown,
} from "lucide-react";
import { generateContentAction } from "@/app/actions/generate";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useDialog } from "@/components/ui/dialog-provider";
import { GenerationLoadingModal } from "@/components/admin/generation-loading-modal";
import { startRouteProgress } from "@/components/ui/route-progress-bar";

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
  const { data: session } = useSession();
  const user = session?.user;

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [postCount, setPostCount] = useState(1);
  const [referenceText, setReferenceText] = useState("");
  const [tone, setTone] = useState("professional");
  const [template, setTemplate] = useState("default");
  const [audience, setAudience] = useState("");

  const { alert: showAlert } = useDialog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      await showAlert({
        title: "Topic Required",
        message: "Please enter a topic or theme before generating content.",
        type: "warning",
      });
      return;
    }
    setIsGenerating(true);
    setIsSuccess(false);
    setGenError(null);

    const result = await generateContentAction(topic, instructions, postCount, tone, audience, referenceText);
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        startRouteProgress();
        router.push("/drafts");
      }, 950);
    } else {
      setGenError(result.error || "Failed to generate content. Please try again.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "46px",
    padding: "10px 14px 10px 44px",
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    color: "#0F172A",
    fontSize: "0.875rem",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "all 0.15s ease",
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Top Header Row */}
      <div className="generate-header-responsive">
        {/* Left: icon + title + subtitle */}
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
            <Sparkles size={24} color="#6366F1" />
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
              Generate Content
            </h1>
            <p style={{
              fontSize: "0.875rem",
              color: "#64748B",
              margin: "3px 0 0",
              fontWeight: 400,
            }}>
              AI generates captions, headlines, image prompts and hashtags in British English. Generation does not publish or approve posts.
            </p>
          </div>
        </div>

        {/* Right: Top Button + Bell + Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
          <button
            id="btn-generate-top"
            form="generate-content-form"
            type="submit"
            disabled={isGenerating}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              background: "#4F46E5",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isGenerating ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Generate {postCount} Post{postCount > 1 ? "s" : ""}
          </button>


        </div>
      </div>

      {/* Main Content Area */}
      <div className="generate-body-responsive">



        {/* Content Details Card */}
        <form onSubmit={handleSubmit} id="generate-content-form">
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "30px 32px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}>
            {/* Card Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "26px" }}>
              <div style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <FileText size={20} color="#6366F1" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  Content Details
                </h2>
                <p style={{ fontSize: "0.84rem", color: "#64748B", margin: "3px 0 0" }}>
                  Fill in the details below to generate your social media content.
                </p>
              </div>
            </div>

            {/* Field 1: Topic */}
            <div style={{ marginBottom: "22px" }}>
              <label htmlFor="topic" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", marginBottom: "7px" }}>
                Topic <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Tag
                  size={16}
                  color="#6366F1"
                  style={{
                    position: "absolute",
                    left: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="topic"
                  name="topic"
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 5 productivity tips for remote workers"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Field 2: Additional instructions */}
            <div style={{ marginBottom: "22px" }}>
              <label htmlFor="instructions" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", marginBottom: "7px" }}>
                Additional instructions{" "}
                <span style={{ fontSize: "0.8125rem", color: "#94A3B8", fontWeight: 400, marginLeft: "4px" }}>
                  Optional
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <FileText
                  size={16}
                  color="#6366F1"
                  style={{
                    position: "absolute",
                    left: "15px",
                    top: "14px",
                    pointerEvents: "none",
                  }}
                />
                <textarea
                  id="instructions"
                  name="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="e.g. Focus on actionable advice. Include a call-to-action."
                  style={{
                    ...inputStyle,
                    height: "auto",
                    minHeight: "88px",
                    paddingTop: "12px",
                    paddingBottom: "12px",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {/* Row 3: Number of posts + Tone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "22px" }}>
              {/* Number of posts */}
              <div>
                <label htmlFor="postCount" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", marginBottom: "7px" }}>
                  Number of posts
                </label>
                <div style={{ position: "relative" }}>
                  <Hash
                    size={16}
                    color="#6366F1"
                    style={{
                      position: "absolute",
                      left: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="postCount"
                    name="postCount"
                    type="number"
                    min={1}
                    max={10}
                    value={postCount}
                    onChange={(e) => setPostCount(Number(e.target.value))}
                    style={{ ...inputStyle, paddingRight: "36px" }}
                  />
                  <ChevronsUpDown
                    size={14}
                    color="#94A3B8"
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>

              {/* Tone */}
              <div>
                <label htmlFor="tone" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", marginBottom: "7px" }}>
                  Tone
                </label>
                <div style={{ position: "relative" }}>
                  <Smile
                    size={16}
                    color="#6366F1"
                    style={{
                      position: "absolute",
                      left: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <select
                    id="tone"
                    name="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      cursor: "pointer",
                      paddingRight: "36px",
                    }}
                  >
                    {TONE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    color="#94A3B8"
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Target audience + Visual template */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "22px" }}>
              {/* Target audience */}
              <div>
                <label htmlFor="audience" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", marginBottom: "7px" }}>
                  Target audience
                </label>
                <div style={{ position: "relative" }}>
                  <Users
                    size={16}
                    color="#6366F1"
                    style={{
                      position: "absolute",
                      left: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    id="audience"
                    name="audience"
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. UK small business owners"
                    style={{ ...inputStyle, paddingRight: "36px" }}
                  />
                  <ChevronDown
                    size={15}
                    color="#94A3B8"
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>

              {/* Visual template */}
              <div>
                <label htmlFor="template" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", marginBottom: "7px" }}>
                  Visual template
                </label>
                <div style={{ position: "relative" }}>
                  <ImageIcon
                    size={16}
                    color="#6366F1"
                    style={{
                      position: "absolute",
                      left: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <select
                    id="template"
                    name="template"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      cursor: "pointer",
                      paddingRight: "36px",
                    }}
                  >
                    {TEMPLATE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    color="#94A3B8"
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Reference material */}
            <div style={{ marginBottom: "28px" }}>
              <label htmlFor="reference-text" style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#0F172A", marginBottom: "7px" }}>
                Reference material{" "}
                <span style={{ fontSize: "0.8125rem", color: "#94A3B8", fontWeight: 400, marginLeft: "4px" }}>
                  Optional &middot; treated as content context only
                </span>
              </label>
              <div style={{ position: "relative" }}>
                <FileText
                  size={16}
                  color="#6366F1"
                  style={{
                    position: "absolute",
                    left: "15px",
                    top: "14px",
                    pointerEvents: "none",
                  }}
                />
                <textarea
                  id="reference-text"
                  name="referenceText"
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                  rows={4}
                  placeholder="Paste relevant facts, article excerpts, or brand guidelines here..."
                  style={{
                    ...inputStyle,
                    height: "auto",
                    minHeight: "96px",
                    paddingTop: "12px",
                    paddingBottom: "12px",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>

            {/* Row 6: Submit Button & Info Note */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                id="btn-generate-submit"
                type="submit"
                disabled={isGenerating}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 24px",
                  background: "#4F46E5",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(79, 70, 229, 0.35)",
                  transition: "all 0.15s ease",
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Generate {postCount} Post{postCount > 1 ? "s" : ""}
                  </>
                )}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <RefreshCw size={14} color="#60A5FA" />
                <span style={{ fontSize: "0.8125rem", color: "#64748B" }}>
                  Generation runs in the background. You can navigate away.
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Interactive AI Generation Pipeline Loading Modal */}
      <GenerationLoadingModal
        isOpen={isGenerating}
        topic={topic}
        tone={tone}
        audience={audience}
        postCount={postCount}
        isSuccess={isSuccess}
        error={genError}
        onClose={() => {
          setIsGenerating(false);
          setGenError(null);
        }}
      />
    </div>
  );
}

