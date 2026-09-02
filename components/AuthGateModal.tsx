"use client";

import React, { useEffect, useState } from "react";
import AuthButtons from "./AuthButtons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AUTH_GATE_EVENT } from "@/lib/auth-gate";

/**
 * Mounted once in the root layout. Any component (SaveButton, /saved's
 * logged-out CTA) can open it by dispatching AUTH_GATE_EVENT instead of
 * mounting its own copy.
 */
export default function AuthGateModal() {
  const { dictionary } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(AUTH_GATE_EVENT, open);
    return () => window.removeEventListener(AUTH_GATE_EVENT, open);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#152e2a] rounded-2xl shadow-2xl p-8 border border-white/50 dark:border-mosque/20">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-gray-400"
          aria-label="Close"
        >
          <span className="material-icons">close</span>
        </button>
        <h2 className="text-xl font-bold tracking-tight text-nordic-dark dark:text-white mb-2 pr-6">
          {dictionary.auth.modalTitle}
        </h2>
        <p className="text-sm text-nordic-muted dark:text-gray-400 mb-6">
          {dictionary.auth.modalSubtitle}
        </p>
        <AuthButtons />
      </div>
    </div>
  );
}
