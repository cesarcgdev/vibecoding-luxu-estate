"use client";

import React, { createContext, useContext, useState, useTransition } from "react";
import { setLanguage } from "@/app/actions/language";
import type { Dictionary, Locale } from "./dictionaries";

interface LanguageContextProps {
  locale: string;
  dictionary: Dictionary;
  changeLanguage: (locale: string) => void;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLocale,
  dictionary,
}: {
  children: React.ReactNode;
  initialLocale: string;
  dictionary: Dictionary;
}) {
  const [locale, setLocaleState] = useState(initialLocale);
  const [isPending, startTransition] = useTransition();

  const changeLanguage = (newLocale: string) => {
    if (newLocale === locale) return;
    
    startTransition(async () => {
      setLocaleState(newLocale);
      await setLanguage(newLocale);
    });
  };

  return (
    <LanguageContext.Provider value={{ locale, dictionary, changeLanguage, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
