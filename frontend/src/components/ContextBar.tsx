"use client";

import { useState, useEffect, useRef } from "react";

interface ContextBadge {
  icon: string;
  label: string;
  variant?: "cool" | "warm" | "fresh" | "dusk" | "neutral";
}

interface ContextBarProps {
  badges?: ContextBadge[];
}

const defaultBadges: ContextBadge[] = [
  { icon: "ph-cloud-rain", label: "Rain · 11°C", variant: "cool" },
  { icon: "ph-clock",      label: "Saturday · 14:00", variant: "neutral" },
  { icon: "ph-ticket",     label: "Broadway Week", variant: "dusk" },
  { icon: "ph-coffee",     label: "3 quiet cafes", variant: "fresh" },
];

const CHIP_CLASSES: Record<NonNullable<ContextBadge["variant"]>, string> = {
  cool:    "bg-cw-cool-bg text-cw-cool",
  warm:    "bg-cw-warm-bg text-cw-warm",
  fresh:   "bg-cw-fresh-bg text-cw-fresh",
  dusk:    "bg-cw-dusk-bg text-cw-dusk",
  neutral: "bg-cw-paper-100 text-fg-2",
};

const SCROLL_THRESHOLD = 8;

export default function ContextBar({ badges = defaultBadges }: ContextBarProps) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;

      if (delta > SCROLL_THRESHOLD) {
        setVisible(false);
      } else if (delta < -SCROLL_THRESHOLD) {
        setVisible(true);
      }

      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="no-scrollbar sticky top-0 z-30 flex gap-1.5 overflow-x-auto border-b border-border-1 bg-page px-5 py-3 transition-transform duration-300"
      style={{
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transitionTimingFunction: "var(--ease-out)",
      }}
    >
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-1 font-body text-micro font-semibold uppercase tracking-[0.08em] ${
            CHIP_CLASSES[badge.variant ?? "neutral"]
          }`}
        >
          <i className={`ph ${badge.icon} text-[13px]`} />
          {badge.label}
        </span>
      ))}
    </div>
  );
}
