import { useState, useEffect } from "react";

export type Market = "EU" | "US";

const STORAGE_KEY = "mdr_compliance_market";

export function useMarket() {
  const [market, setMarketState] = useState<Market>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Market) || "EU";
  });

  const setMarket = (newMarket: Market) => {
    setMarketState(newMarket);
    localStorage.setItem(STORAGE_KEY, newMarket);
  };

  return { market, setMarket };
}
