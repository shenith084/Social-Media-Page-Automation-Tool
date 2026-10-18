"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  BookOpen,
  ListOrdered,
  Calendar,
  History,
  AlertTriangle,
  CalendarCheck,
  Palette,
  Users,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  X,
  LogOut,
  Shield,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "nav-dashboard" },
  { href: "/generate", label: "Generate Content", icon: Sparkles, id: "nav-generate" },
  { href: "/drafts", label: "Draft Library", icon: BookOpen, id: "nav-drafts" },
  { href: "/queue", label: "Publishing Queue", icon: ListOrdered, id: "nav-queue" },
  { href: "/calendar", label: "Calendar", icon: Calendar, id: "nav-calendar" },
  { href: "/history", label: "Published History", icon: History, id: "nav-history" },
  { href: "/recovery", label: "Recovery", icon: AlertTriangle, id: "nav-recovery" },
  { type: "separator", label: "CONFIGURATION" },
  { href: "/settings", label: "Page & Schedule", icon: CalendarCheck, id: "nav-settings" },
  { href: "/templates", label: "Templates & AI", icon: Palette, id: "nav-templates" },
  { href: "/users", label: "Users & Permissions", icon: Users, id: "nav-users" },
  { href: "/usage", label: "Usage & Audit", icon: BarChart3, id: "nav-usage" },
] as const;

// 4 main mobile tabs + 1 "More" button
const MOBILE_PRIMARY_TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Generate", icon: Sparkles },
  { href: "/drafts", label: "Drafts", icon: BookOpen },
  { href: "/queue", label: "Queue", icon: ListOrdered },
];

// Secondary items revealed in the "See More" bottom drawer
const MORE_CONTENT_ITEMS = [
  { href: "/calendar", label: "Calendar", icon: Calendar, desc: "Schedule & posting slots" },
  { href: "/history", label: "Published History", icon: History, desc: "Live Facebook posts" },
  { href: "/recovery", label: "Recovery Queue", icon: AlertTriangle, desc: "Failed & retry posts" },
];

const MORE_CONFIG_ITEMS = [
  { href: "/settings", label: "Page & Schedule", icon: CalendarCheck, desc: "Meta page & automation rules" },
  { href: "/templates", label: "Templates & AI", icon: Palette, desc: "Layouts & AI providers" },
  { href: "/users", label: "Users & Permissions", icon: Users, desc: "Staff RBAC management" },
  { href: "/usage", label: "Usage & Audit", icon: BarChart3, desc: "Free tier metrics & logs" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Close the sheet when route changes
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // Is any item inside "More" currently active?
  const isMoreActive =
    MORE_CONTENT_ITEMS.some((i) => pathname === i.href || pathname.startsWith(i.href + "/")) ||
    MORE_CONFIG_ITEMS.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  return (
    <>
      {/* =====================================================================
          1. DESKTOP SIDEBAR (Visible > 860px)
          ===================================================================== */}
      <aside
        id="admin-sidebar"
        className="desktop-sidebar"
        style={{
          width: "220px",
          minWidth: "220px",
          height: "100vh",
          maxHeight: "100vh",
          background: "#0F1123",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          zIndex: 20,
          flexShrink: 0,
        }}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div style={{ padding: "22px 18px 18px", position: "relative", zIndex: 2 }}>
          <Link
            href="/dashboard"
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.4)",
              }}
            >
              <BarChart3 size={19} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "white", lineHeight: 1.2 }}>
                Pixzora Social
              </div>
              <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.3 }}>
                Admin Panel
              </div>
            </div>
          </Link>
        </div>

        {/* Page connected badge */}
        <div style={{ padding: "0 14px 16px", position: "relative", zIndex: 2 }}>
          <Link
            href="/settings"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              padding: "7px 12px",
              background: "rgba(6, 78, 59, 0.45)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#10B981",
                  boxShadow: "0 0 6px #10B981",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#34D399", fontWeight: 500 }}>
                Page connected
              </span>
            </div>
            <ChevronRight size={13} color="#10B981" />
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0 10px", position: "relative", zIndex: 2 }} role="navigation">
          {NAV_ITEMS.map((item, i) => {
            if ("type" in item && item.type === "separator") {
              return (
                <div
                  key={`sep-${i}`}
                  style={{
                    padding: "16px 8px 6px",
                    fontSize: "0.625rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.35)",
                  }}
                >
                  {item.label}
                </div>
              );
            }
            const navItem = item as { href: string; label: string; icon: React.ElementType; id: string };
            const Icon = navItem.icon;
            const isActive = pathname === navItem.href || pathname.startsWith(navItem.href + "/");

            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                id={navItem.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  marginBottom: "2px",
                  textDecoration: "none",
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                  background: isActive ? "#4F46E5" : "transparent",
                  boxShadow: isActive ? "0 2px 8px rgba(79, 70, 229, 0.35)" : "none",
                  transition: "all 0.15s ease",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon
                    size={16}
                    style={{ color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.5)", flexShrink: 0 }}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} color="#FFFFFF" style={{ flexShrink: 0 }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area with Decorative Wave Background */}
        <div style={{ position: "relative", marginTop: "auto", overflow: "hidden" }}>
          <svg
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              height: "130px",
              pointerEvents: "none",
              zIndex: 1,
            }}
            viewBox="0 0 220 130"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0,45 C70,15 150,85 220,35 L220,130 L0,130 Z" fill="rgba(49, 46, 129, 0.45)" />
            <path d="M0,75 C80,45 140,110 220,65 L220,130 L0,130 Z" fill="rgba(67, 56, 202, 0.3)" />
          </svg>

          {/* User profile row */}
          <div style={{ padding: "16px 14px", position: "relative", zIndex: 2 }}>
            <div
              id="sidebar-user-menu"
              style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              title="Click to sign out"
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#6366F1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                S
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.9)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.name || "Shenith Chanidu"}
                </div>
                <div
                  style={{
                    fontSize: "0.6875rem",
                    color: "rgba(255,255,255,0.4)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Admin
                </div>
              </div>
              <ChevronDown size={14} color="rgba(255,255,255,0.4)" />
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          2. MOBILE TOP HEADER (Visible <= 860px)
          ===================================================================== */}
      <header
        className="mobile-top-header"
        style={{
          height: "56px",
          background: "#0F1123",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "0 16px",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 30,
          flexShrink: 0,
          width: "100%",
        }}
      >
        <Link
          href="/dashboard"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BarChart3 size={17} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "white", lineHeight: 1.1 }}>
              Pixzora Social
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.45)" }}>
              Admin Panel
            </div>
          </div>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Connected badge */}
          <Link
            href="/settings"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 8px",
              background: "rgba(6, 78, 59, 0.45)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              borderRadius: "6px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 5px #10B981",
              }}
            />
            <span style={{ fontSize: "0.6875rem", color: "#34D399", fontWeight: 600 }}>
              Connected
            </span>
          </Link>

          {/* User Avatar button */}
          <button
            onClick={() => setIsMoreOpen(true)}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "#6366F1",
              border: "none",
              color: "white",
              fontWeight: 700,
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Open menu"
          >
            S
          </button>
        </div>
      </header>

      {/* =====================================================================
          3. MOBILE BOTTOM NAVIGATION BAR (Visible <= 860px)
          ===================================================================== */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "64px",
          background: "#0F1123",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          zIndex: 40,
          padding: "0 6px",
          justifyContent: "space-around",
          alignItems: "center",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
        }}
        aria-label="Mobile Navigation"
      >
        {MOBILE_PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                flex: 1,
                height: "100%",
                textDecoration: "none",
                color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.55)",
                transition: "all 0.15s ease",
                position: "relative",
              }}
            >
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    width: "32px",
                    height: "3px",
                    borderRadius: "0 0 3px 3px",
                    background: "#818CF8",
                    boxShadow: "0 0 8px #818CF8",
                  }}
                />
              )}
              <div
                style={{
                  width: "34px",
                  height: "26px",
                  borderRadius: "14px",
                  background: isActive ? "rgba(99, 102, 241, 0.25)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} style={{ color: isActive ? "#818CF8" : "inherit" }} />
              </div>
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: "0.01em",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* 5th Tab: "See More" Button */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            flex: 1,
            height: "100%",
            background: "transparent",
            border: "none",
            color: isMoreOpen || isMoreActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.55)",
            cursor: "pointer",
            position: "relative",
            padding: 0,
          }}
          aria-label="See more pages"
          aria-expanded={isMoreOpen}
        >
          {(isMoreOpen || isMoreActive) && (
            <span
              style={{
                position: "absolute",
                top: 0,
                width: "32px",
                height: "3px",
                borderRadius: "0 0 3px 3px",
                background: "#818CF8",
                boxShadow: "0 0 8px #818CF8",
              }}
            />
          )}
          <div
            style={{
              width: "34px",
              height: "26px",
              borderRadius: "14px",
              background: isMoreOpen || isMoreActive ? "rgba(99, 102, 241, 0.25)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreHorizontal size={18} style={{ color: isMoreOpen || isMoreActive ? "#818CF8" : "inherit" }} />
          </div>
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: isMoreOpen || isMoreActive ? 600 : 500,
              letterSpacing: "0.01em",
            }}
          >
            See More
          </span>
        </button>
      </nav>

      {/* =====================================================================
          4. "SEE MORE" BOTTOM SHEET / SLIDE-UP DRAWER
          ===================================================================== */}
      {isMoreOpen && (
        <div
          className="animate-fade-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="animate-slide-up"
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "85vh",
              background: "#0F1123",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
              overflowY: "auto",
              paddingBottom: "32px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div
              style={{
                width: "40px",
                height: "5px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.25)",
                margin: "12px auto 8px",
              }}
            />

            {/* Header */}
            <div
              style={{
                padding: "12px 20px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF" }}>
                  More Admin Pages
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                  Navigate schedule, logs, templates and system tools
                </div>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Category */}
            <div style={{ padding: "16px 16px 8px" }}>
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "0 8px 8px",
                }}
              >
                Publishing & Operations
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {MORE_CONTENT_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        textDecoration: "none",
                        background: isActive ? "#4F46E5" : "rgba(255, 255, 255, 0.04)",
                        border: `1px solid ${isActive ? "#6366F1" : "rgba(255, 255, 255, 0.06)"}`,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: isActive ? "rgba(255, 255, 255, 0.2)" : "rgba(99, 102, 241, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isActive ? "#FFFFFF" : "#818CF8",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#FFFFFF",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: isActive ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.5)",
                          }}
                        >
                          {item.desc}
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        style={{ color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.3)" }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Configuration Category */}
            <div style={{ padding: "8px 16px 12px" }}>
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "0 8px 8px",
                }}
              >
                Configuration & System
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {MORE_CONFIG_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        textDecoration: "none",
                        background: isActive ? "#4F46E5" : "rgba(255, 255, 255, 0.04)",
                        border: `1px solid ${isActive ? "#6366F1" : "rgba(255, 255, 255, 0.06)"}`,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: isActive ? "rgba(255, 255, 255, 0.2)" : "rgba(99, 102, 241, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isActive ? "#FFFFFF" : "#818CF8",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#FFFFFF",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: isActive ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.5)",
                          }}
                        >
                          {item.desc}
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        style={{ color: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.3)" }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Profile & Logout row */}
            <div style={{ padding: "8px 16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "#6366F1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                    }}
                  >
                    S
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "white" }}>
                      {user?.name || "Shenith Chanidu"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                      Admin Account
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await signOut();
                    router.push("/login");
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#F87171",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

