"use client";

// oxlint-disable react-doctor/jsx-no-constructed-context-values -- Context values in this file intentionally combine live state and setters; extracting them would not reduce meaningful consumer churn.

import { createContext, type ReactNode, useContext } from "react";

interface ProfitLossLegendHoverContextValue {
  hoveredIndex: number | null;
}

const ProfitLossLegendHoverContext =
  createContext<ProfitLossLegendHoverContextValue | null>(null);

export function ProfitLossLegendHoverProvider({
  hoveredIndex,
  children,
}: {
  hoveredIndex: number | null;
  children: ReactNode;
}) {
  return (
    <ProfitLossLegendHoverContext.Provider value={{ hoveredIndex }}>
      {children}
    </ProfitLossLegendHoverContext.Provider>
  );
}

export function useProfitLossLegendHover(): ProfitLossLegendHoverContextValue {
  const context = useContext(ProfitLossLegendHoverContext);
  return context ?? { hoveredIndex: null };
}
