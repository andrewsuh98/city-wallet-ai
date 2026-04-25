"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/wallet", label: "Wallet" },
  { href: "/merchant", label: "Merchant" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-[#0f0f0f]/95 backdrop-blur-sm px-4 py-3">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
