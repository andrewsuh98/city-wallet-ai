"use client";

interface TasteChip {
  id: string;
  label: string;
  icon: string;
  customIcon?: React.ReactNode;
}

function BubbleTeaIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="152" y1="20" x2="136" y2="80" />
      <line x1="56" y1="80" x2="200" y2="80" />
      <path d="M72 80l12 148a8 8 0 0 0 8 7h72a8 8 0 0 0 8-7l12-148" />
      <circle cx="112" cy="176" r="12" fill="currentColor" stroke="none" />
      <circle cx="144" cy="168" r="12" fill="currentColor" stroke="none" />
      <circle cx="120" cy="204" r="12" fill="currentColor" stroke="none" />
      <circle cx="152" cy="200" r="12" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ALL_TASTES: TasteChip[] = [
  { id: "coffee", label: "Coffee", icon: "ph-coffee" },
  { id: "bubble_tea", label: "Bubble tea", icon: "", customIcon: <BubbleTeaIcon /> },
  { id: "pizza", label: "Pizza", icon: "ph-pizza" },
  { id: "sushi", label: "Sushi", icon: "ph-fish" },
  { id: "burgers", label: "Burgers", icon: "ph-hamburger" },
  { id: "brunch", label: "Brunch", icon: "ph-avocado" },
  { id: "tacos", label: "Tacos", icon: "ph-pepper" },
  { id: "ramen", label: "Ramen", icon: "ph-bowl-food" },
  { id: "bakery", label: "Bakery", icon: "ph-cookie" },
  { id: "desserts", label: "Desserts", icon: "ph-ice-cream" },
  { id: "cocktails", label: "Cocktails", icon: "ph-wine" },
  { id: "healthy", label: "Healthy", icon: "ph-leaf" },
];

interface CategoryChipsProps {
  selected: string;
  onSelect: (tasteId: string) => void;
  userTastes?: string[];
  availableTastes?: Set<string>;
}

function sortedChips(userTastes?: string[], availableTastes?: Set<string>): TasteChip[] {
  let chips = ALL_TASTES;

  if (userTastes && userTastes.length > 0) {
    const userSet = new Set(userTastes);
    const userFirst = chips.filter((t) => userSet.has(t.id));
    const rest = chips.filter((t) => !userSet.has(t.id));
    chips = [...userFirst, ...rest];
  }

  if (availableTastes) {
    const available = chips.filter((t) => availableTastes.has(t.id));
    const unavailable = chips.filter((t) => !availableTastes.has(t.id));
    return [...available, ...unavailable];
  }

  return chips;
}

export default function CategoryChips({ selected, onSelect, userTastes, availableTastes }: CategoryChipsProps) {
  const chips = sortedChips(userTastes, availableTastes);

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3">
      <button
        onClick={() => onSelect("all")}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-2 px-3.5 py-2 text-small font-semibold transition-colors duration-150 ${
          selected === "all"
            ? "bg-action-primary text-fg-on-red shadow-1"
            : "border border-border-2 bg-card text-fg-2 hover:bg-card-soft"
        }`}
      >
        <i className="ph ph-squares-four text-sm" />
        All
      </button>
      {chips.map(({ id, label, icon, customIcon }) => {
        const isActive = selected === id;
        const hasOffers = !availableTastes || availableTastes.has(id);

        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            disabled={!hasOffers}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-2 px-3.5 py-2 text-small font-semibold transition-colors duration-150 ${
              isActive
                ? "bg-action-primary text-fg-on-red shadow-1"
                : hasOffers
                  ? "border border-border-2 bg-card text-fg-2 hover:bg-card-soft"
                  : "border border-border-1 bg-card text-fg-4 opacity-40"
            }`}
          >
            {customIcon ?? <i className={`ph ${icon} text-sm`} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
