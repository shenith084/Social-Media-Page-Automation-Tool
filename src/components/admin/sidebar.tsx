"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  LayoutDashboard,
  Sparkles,
  BookImage,
  ListOrdered,
  CalendarDays,
  History,
  AlertTriangle,
  Settings,
  Palette,
  Users,
  BarChart2,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "nav-dashboard" },
  { href: "/generate", label: "Generate Content", icon: Sparkles, id: "nav-generate" },
  { href: "/drafts", label: "Draft Library", icon: BookImage, id: "nav-drafts" },
  { href: "/queue", label: "Publishing Queue", icon: ListOrdered, id: "nav-queue" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, id: "nav-calendar" },
  { href: "/history", label: "Published History", icon: History, id: "nav-history" },
  { href: "/recovery", label: "Recovery", icon: AlertTriangle, id: "nav-recovery" },
  { type: "separator", label: "Configuration" },
  { href: "/settings", label: "Page & Schedule", icon: Settings, id: "nav-settings" },
  { href: "/templates", label: "Templates & AI", icon: Palette, id: "nav-templates" },
  { href: "/users", label: "Users & Permissions", icon: Users, id: "nav-users" },
  { href: "/usage", label: "Usage & Audit", icon: BarChart2, id: "nav-usage" },
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
        width: "256px",
        height: "100dvh",
        position: "sticky",
        top: 0,
        background: "rgb(15, 15, 30)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        zIndex: 10,
      }}
      aria-label="Admin navigation"
    >
      {/* Brand */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.9))",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(139,92,246,0.3)",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "white", lineHeight: 1.2 }}>
              Pixzora Social
            </div>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.2 }}>
              Admin Panel
            </div>
          </div>
        </Link>
      </div>

      {/* Connection status pill */}
      <div style={{ padding: "12px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "rgb(34,197,94)",
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontSize: "0.75rem", color: "rgba(34,197,94,0.9)", fontWeight: 500 }}>
            Page connected
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "8px 12px" }} role="navigation">
        {NAV_ITEMS.map((item, i) => {
          if ("type" in item && item.type === "separator") {
            return (
              <div
                key={`sep-${i}`}
                style={{
                  padding: "16px 8px 8px",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {item.label}
              </div>
            );
          }

          const navItem = item as any;
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
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "8px",
                marginBottom: "2px",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "white" : "rgba(255,255,255,0.55)",
                background: isActive
                  ? "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.15))"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(139,92,246,0.25)"
                  : "1px solid transparent",
                transition: "all 0.15s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                }
              }}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={16}
                style={{
                  color: isActive ? "rgb(167,139,250)" : "rgba(255,255,255,0.4)",
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && (
                <ChevronRight size={14} style={{ color: "rgba(167,139,250,0.6)" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(139,92,246,0.6), rgba(59,130,246,0.6))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "rgba(255,255,255,0.85)", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
              {user?.name || "Administrator"}
            </div>
            <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
              {user?.email || "admin@pixzora.com"}
            </div>
          </div>
        </div>
        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
            id="sign-out-btn"
            style={{
              width: "100%",
              padding: "8px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "6px",
              color: "rgba(239,68,68,0.8)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
              e.currentTarget.style.color = "rgb(239,68,68)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              e.currentTarget.style.color = "rgba(239,68,68,0.8)";
            }}
          >
            Sign out
          </button>
      </div>
    </aside>
  );
}
