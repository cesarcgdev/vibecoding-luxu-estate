"use client";

import React, { createContext, useContext, useState, useTransition } from "react";
import { setCurrency } from "@/app/actions/currency";
import type { Currency } from "./currency";

interface CurrencyContextProps {
  currency: Currency;
  changeCurrency: (currency: Currency) => void;
  isPending: boolean;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export function CurrencyProvider({
  children,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialCurrency: Currency;
}) {
  const [currency, setCurrencyState] = useState(initialCurrency);
  const [isPending, startTransition] = useTransition();

  const changeCurrency = (newCurrency: Currency) => {
    if (newCurrency === currency) return;

    startTransition(async () => {
      setCurrencyState(newCurrency);
      await setCurrency(newCurrency);
    });
  };

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency, isPending }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
