interface SectionHeaderProps {
  label: string;
  icon?: string;
  count?: number;
  variant?: "cool" | "warm" | "fresh" | "dusk" | "neutral";
}

const VARIANT_CLASSES: Record<string, string> = {
  cool: "text-cw-cool",
  warm: "text-cw-warm",
  fresh: "text-cw-fresh",
  dusk: "text-cw-dusk",
  neutral: "text-fg-3",
};

export default function SectionHeader({ label, icon, count, variant = "neutral" }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 pb-2 pt-4">
      {icon && <i className={`ph ${icon} text-base ${VARIANT_CLASSES[variant]}`} />}
      <span className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
        {label}
      </span>
      {count != null && (
        <span className="text-micro text-fg-4">{count}</span>
      )}
    </div>
  );
}
