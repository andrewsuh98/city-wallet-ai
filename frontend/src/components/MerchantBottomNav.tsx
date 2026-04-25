"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/merchant/dashboard", label: "Dashboard", icon: "ph-chart-line-up" },
  { href: "/merchant/settings",  label: "Settings",  icon: "ph-faders" },
];

export default function MerchantBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "inline-flex",
        gap: "4px",
        padding: "6px",
        borderRadius: "var(--radius-pill)",
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        border: "1px solid var(--border-1)",
        boxShadow: "var(--shadow-3)",
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "var(--radius-pill)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--fs-small)",
              fontWeight: 600,
              textDecoration: "none",
              border: "none",
              transition: `background var(--dur-1) var(--ease-out), color var(--dur-1) var(--ease-out)`,
              background: isActive ? "var(--cw-paper-900)" : "transparent",
              color: isActive ? "var(--fg-on-dark)" : "var(--fg-2)",
            }}
          >
            <i className={`ph ${item.icon}`} style={{ fontSize: "16px" }} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
