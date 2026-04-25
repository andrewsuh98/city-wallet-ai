interface CashbackBalanceProps {
  balanceUsd: number;
  redemptionCount: number;
}

export default function CashbackBalance({
  balanceUsd,
  redemptionCount,
}: CashbackBalanceProps) {
  return (
    <div className="rounded-4 border border-border-1 bg-card p-5 shadow-2">
      <p className="text-micro font-semibold uppercase tracking-[0.08em] text-fg-3">
        Wallet balance
      </p>
      <p
        className="mt-1 font-display text-display tabular-nums text-cw-fresh"
        style={{ letterSpacing: "var(--ls-tight)", fontVariationSettings: '"opsz" 96, "SOFT" 50' }}
      >
        ${balanceUsd.toFixed(2)}
      </p>
      <p className="mt-1 text-small text-fg-3">
        {redemptionCount} {redemptionCount === 1 ? "redemption" : "redemptions"}
      </p>
    </div>
  );
}
