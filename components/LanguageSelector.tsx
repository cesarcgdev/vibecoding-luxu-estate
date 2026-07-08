"use client";

import React, { useState, useRef, useEffect } from "react";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const LANGUAGES = [
  { code: "en", label: "English", flag: "https://flagcdn.com/w40/gb.png" },
  { code: "es", label: "Español", flag: "https://flagcdn.com/w40/es.png" },
  { code: "fr", label: "Français", flag: "https://flagcdn.com/w40/fr.png" },
];

export default function LanguageSelector() {
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-nordic-dark/5 transition-colors text-sm font-medium text-nordic-dark"
        disabled={isPending}
      >
        <div className="relative w-5 h-3.5 overflow-hidden rounded-[2px] shadow-sm">
          <Image src={currentLang.flag} alt={currentLang.code} fill className="object-cover" unoptimized />
        </div>
        <span className="hidden sm:inline-block uppercase">{currentLang.code}</span>
        <span className="material-icons text-sm text-nordic-dark/60">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-nordic-dark/5 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-mosque/5 transition-colors ${
                locale === lang.code ? "text-mosque font-medium bg-mosque/5" : "text-nordic-dark"
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
