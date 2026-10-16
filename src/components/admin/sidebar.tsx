"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import {
  Home,
  Sparkles,
  BookOpen,
  ListOrdered,
  Calendar,
  History,
  AlertTriangle,
  CalendarCheck,
  Palette,
  Users,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home, id: "nav-dashboard" },
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

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <aside
      id="admin-sidebar"
      style={{
        width: "220px",
        minWidth: "220px",
        height: "100vh",
        maxHeight: "100vh",
        background: "#0F1123",
        display: "flex",
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
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(79, 70, 229, 0.4)",
          }}>
            <BarChart3 size={19} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "white", lineHeight: 1.2 }}>Pixzora Social</div>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.3 }}>Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Page connected badge */}
      <div style={{ padding: "0 14px 16px", position: "relative", zIndex: 2 }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "7px 12px",
          background: "rgba(6, 78, 59, 0.45)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          borderRadius: "8px",
          cursor: "pointer",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 6px #10B981",
            }} />
            <span style={{ fontSize: "0.75rem", color: "#34D399", fontWeight: 500 }}>Page connected</span>
          </div>
          <ChevronRight size={13} color="#10B981" />
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0 10px", position: "relative", zIndex: 2 }} role="navigation">
        {NAV_ITEMS.map((item, i) => {
          if ("type" in item && item.type === "separator") {
            return (
              <div key={`sep-${i}`} style={{
                padding: "16px 8px 6px",
                fontSize: "0.625rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
              }}>
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
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                }
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Icon size={16} style={{ color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.5)", flexShrink: 0 }} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} color="#FFFFFF" style={{ flexShrink: 0 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area with Decorative Wave Background */}
      <div style={{ position: "relative", marginTop: "auto", overflow: "hidden" }}>
        {/* Subtle decorative wave SVG */}
        <svg
          style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "130px", pointerEvents: "none", zIndex: 1 }}
          viewBox="0 0 220 130"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,45 C70,15 150,85 220,35 L220,130 L0,130 Z"
            fill="rgba(49, 46, 129, 0.45)"
          />
          <path
            d="M0,75 C80,45 140,110 220,65 L220,130 L0,130 Z"
            fill="rgba(67, 56, 202, 0.3)"
          />
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
          >
            <div style={{
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
            }}>
              S
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Shenith Chanidu
              </div>
              <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Admin
              </div>
            </div>
            <ChevronDown size={14} color="rgba(255,255,255,0.4)" />
          </div>
        </div>
      </div>
    </aside>
  );
}
