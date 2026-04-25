"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/",       label: "Now",    icon: "ph-storefront" },
  { href: "/wallet", label: "Wallet", icon: "ph-wallet" },
  { href: "/map",    label: "Map",    icon: "ph-map-trifold" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-5 left-1/2 z-50 inline-flex -translate-x-1/2 gap-1 rounded-pill border border-border-1 bg-white/70 p-1.5 shadow-3 backdrop-blur-xl backdrop-saturate-150">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-1.5 rounded-pill px-4 py-2.5 font-body text-small font-semibold no-underline transition-colors duration-150 ${
              isActive
                ? "bg-cw-paper-900 text-fg-on-dark"
                : "bg-transparent text-fg-2 hover:bg-cw-paper-100"
            }`}
          >
            <i className={`ph ${item.icon} text-base`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
