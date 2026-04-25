"use client";

interface TasteChip {
  id: string;
  label: string;
  icon: string;
}

const ALL_TASTES: TasteChip[] = [
  { id: "coffee", label: "Coffee", icon: "ph-coffee" },
  { id: "bubble_tea", label: "Bubble tea", icon: "ph-cup" },
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

function sortedChips(userTastes?: string[]): TasteChip[] {
  if (!userTastes || userTastes.length === 0) return ALL_TASTES;
  const userSet = new Set(userTastes);
  const first = ALL_TASTES.filter((t) => userSet.has(t.id));
  const rest = ALL_TASTES.filter((t) => !userSet.has(t.id));
  return [...first, ...rest];
}

export default function CategoryChips({ selected, onSelect, userTastes, availableTastes }: CategoryChipsProps) {
  const chips = sortedChips(userTastes);

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
      {chips.map(({ id, label, icon }) => {
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
            <i className={`ph ${icon} text-sm`} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
