interface CashbackBalanceProps {
  balanceUsd: number;
  redemptionCount: number;
}

export default function CashbackBalance({
  balanceUsd,
  redemptionCount,
}: CashbackBalanceProps) {
  return (
    <div className="rounded-2xl bg-[#1A1A1A] p-5">
      <p className="text-xs uppercase tracking-wider text-white/50">
        Wallet balance
      </p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-400">
        ${balanceUsd.toFixed(2)}
      </p>
      <p className="mt-1 text-sm text-white/60">
        {redemptionCount} {redemptionCount === 1 ? "redemption" : "redemptions"}
      </p>
    </div>
  );
}
