"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.error) {
        console.warn("Login error details:", res.error);
        setErrorMsg(res.error.message || "Invalid email or password. Please verify your credentials.");
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      console.error("Login unexpected error:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during sign in.";
      setErrorMsg(msg);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center bg-gray-950 px-4" id="login-main">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
      </div>

      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "420px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.9))",
              borderRadius: "16px",
              marginBottom: "16px",
              boxShadow: "0 0 32px rgba(139,92,246,0.4)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "4px",
              background: "linear-gradient(135deg, rgb(167,139,250), rgb(96,165,250))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Pixzora Social
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
            Admin Panel · Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-card-elevated"
          style={{ padding: "32px" }}
        >
          {/* Prominent in-page error message alert */}
          {errorMsg && (
            <div
              id="login-error-alert"
              style={{
                marginBottom: "20px",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#FCA5A5",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                animation: "fadeIn 0.2s ease-out",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, color: "#F87171" }} />
              <span style={{ lineHeight: 1.4 }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} id="login-form">
            {/* Email */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.8)",
                  marginBottom: "8px",
                }}
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "0.9375rem",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  Password
                </label>
              </div>

              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "0.9375rem",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  id="toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.45)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="sign-in-btn"
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "linear-gradient(135deg, rgb(139,92,246), rgb(109,40,217))",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: loading ? "wait" : "pointer",
                transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
                boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(139,92,246,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(139,92,246,0.4)";
                }
              }}
              disabled={loading}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Security notice */}
          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            🔒 Authorized Personnel Only · Managed by Super Admin
          </p>
        </div>

        {/* Privacy policy link */}
        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.8125rem", color: "rgba(255,255,255,0.3)" }}>
          <Link href="/privacy" style={{ color: "rgba(139,92,246,0.7)", textDecoration: "none" }}>
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/data-deletion" style={{ color: "rgba(139,92,246,0.7)", textDecoration: "none" }}>
            Data Deletion
          </Link>
        </p>
      </div>
    </main>
  );
}
