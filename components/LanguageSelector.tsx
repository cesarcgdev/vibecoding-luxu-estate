"use client";

import React, { useState, useRef, useEffect } from "react";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const LANGUAGES = [
  { code: "en", label: "English", flag: "https://flagcdn.com/w40/gb.png" },
  { code: "es", label: "Español", flag: "https://flagcdn.com/w40/es.png" },
  { code: "fr", label: "Français", flag: "https://flagcdn.com/w40/fr.png" },
];

export default function LanguageSelector({
  align = "right",
}: {
  /** Which edge the dropdown hangs from — "right" fits the desktop icon
   * cluster, "left" fits it sitting first in the mobile panel's row. */
  align?: "left" | "right";
}) {
  const { locale, changeLanguage, isPending } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-nordic-dark/5 dark:hover:bg-white/10 transition-colors text-sm font-medium text-nordic-dark dark:text-gray-300"
        disabled={isPending}
      >
        <div className="relative w-5 h-3.5 overflow-hidden rounded-[2px] shadow-sm">
          <Image src={currentLang.flag} alt={currentLang.code} fill className="object-cover" unoptimized />
        </div>
        <span className="hidden sm:inline-block uppercase">{currentLang.code}</span>
        <span className="material-icons text-sm text-nordic-dark/60 dark:text-gray-400">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === "left" ? "left-0" : "right-0"} mt-2 w-36 bg-white dark:bg-[#152e2a] rounded-xl shadow-lg border border-nordic-dark/5 dark:border-white/10 py-2 z-50 animate-in fade-in slide-in-from-top-2`}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-mosque/5 dark:hover:bg-white/5 transition-colors ${
                locale === lang.code ? "text-mosque dark:text-hint-green font-medium bg-mosque/5 dark:bg-hint-green/10" : "text-nordic-dark dark:text-gray-300"
              }`}
            >
              <div className="relative w-5 h-3.5 overflow-hidden rounded-[2px] shadow-sm">
                <Image src={lang.flag} alt={lang.code} fill className="object-cover" unoptimized />
              </div>
              <span className="text-sm">{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
