interface ContextBadge {
  icon: string;
  label: string;
}

interface ContextBarProps {
  badges?: ContextBadge[];
}

const defaultBadges: ContextBadge[] = [
  { icon: "Cloud with Rain", label: "Rain 11C" },
  { icon: "Clock", label: "Saturday afternoon" },
  { icon: "Ticket", label: "Broadway Week" },
  { icon: "Chart Decreasing", label: "3 quiet cafes" },
];

const iconMap: Record<string, string> = {
  "Cloud with Rain": "~",
  Clock: "T",
  Ticket: "*",
  "Chart Decreasing": "v",
};

export default function ContextBar({ badges = defaultBadges }: ContextBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-[#1a1a1a] border-b border-white/10 no-scrollbar">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className="flex items-center gap-1.5 shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80"
        >
          <span className="text-sm opacity-70">{iconMap[badge.icon] || "?"}</span>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
