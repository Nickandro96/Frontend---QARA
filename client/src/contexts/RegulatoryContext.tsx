import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Market = "EU" | "US";
export type RegulatoryRole =
  | "manufacturer"
  | "importer"
  | "distributor"
  | "contractor"
  | "consultant";

interface RegulatoryContextType {
  market: Market;
  role: RegulatoryRole | null;
  setMarket: (market: Market) => void;
  setRole: (role: RegulatoryRole) => void;
  isContextSet: boolean;
}

const RegulatoryContext = createContext<RegulatoryContextType | undefined>(
  undefined
);

const STORAGE_KEY_MARKET = "mdr_compliance_market";
const STORAGE_KEY_ROLE = "mdr_compliance_role";

export function RegulatoryProvider({ children }: { children: ReactNode }) {
  const [market, setMarketState] = useState<Market>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_MARKET);
    return (stored as Market) || "EU";
  });

  const [role, setRoleState] = useState<RegulatoryRole | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_ROLE);
    return (stored as RegulatoryRole) || null;
  });

  const setMarket = (newMarket: Market) => {
    setMarketState(newMarket);
    localStorage.setItem(STORAGE_KEY_MARKET, newMarket);
  };

  const setRole = (newRole: RegulatoryRole) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEY_ROLE, newRole);
  };

  const isContextSet = role !== null;

  return (
    <RegulatoryContext.Provider
      value={{ market, role, setMarket, setRole, isContextSet }}
    >
      {children}
    </RegulatoryContext.Provider>
  );
}

export function useRegulatory() {
  const context = useContext(RegulatoryContext);
  if (!context) {
    throw new Error("useRegulatory must be used within RegulatoryProvider");
  }
  return context;
}
