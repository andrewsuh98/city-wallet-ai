import type { CSSProperties } from "react";

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

const CHIP_STYLES = {
  cool:    { background: "var(--cw-cool-bg)",   color: "var(--cw-cool)" },
  warm:    { background: "var(--cw-warm-bg)",   color: "var(--cw-warm)" },
  fresh:   { background: "var(--cw-fresh-bg)",  color: "var(--cw-fresh)" },
  dusk:    { background: "var(--cw-dusk-bg)",   color: "var(--cw-dusk)" },
  neutral: { background: "var(--cw-paper-100)", color: "var(--fg-2)" },
};

const chipBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "4px 10px",
  borderRadius: "var(--radius-pill)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--fs-micro)",
  fontWeight: 600,
  letterSpacing: "var(--ls-caps)",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

export default function ContextBar({ badges = defaultBadges }: ContextBarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        overflowX: "auto",
        padding: "12px 20px",
        background: "var(--bg-page)",
        borderBottom: "1px solid var(--border-1)",
        scrollbarWidth: "none",
      }}
    >
      {badges.map((badge) => {
        const chipStyle = CHIP_STYLES[badge.variant ?? "neutral"];
        return (
          <span key={badge.label} style={{ ...chipBase, ...chipStyle }}>
            <i className={`ph ${badge.icon}`} style={{ fontSize: "13px" }} />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
