const KEY = "city_wallet_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  window.localStorage.setItem(KEY, fresh);
  return fresh;
}

export function resetSessionId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
