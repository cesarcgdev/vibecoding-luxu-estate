"use client";

import React, { useState } from "react";
import FiltersModal from "./FiltersModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function FilterCategoryBar() {
  const { dictionary } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentType = searchParams.get('type') || 'All';

  const handleTypeClick = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === 'All') {
      params.delete('type');
    } else {
      params.set('type', type);
    }
    params.delete('page');
    router.push(pathname + '?' + params.toString(), { scroll: false });
  };

  const getButtonClass = (type: string) => {
    return currentType === type
      ? "whitespace-nowrap px-5 py-2 rounded-full bg-nordic-dark dark:bg-white text-white dark:text-nordic-dark text-sm font-medium shadow-lg shadow-nordic-dark/10 transition-transform hover:-translate-y-0.5"
      : "whitespace-nowrap px-5 py-2 rounded-full bg-white dark:bg-[#152e2a] border border-nordic-dark/5 dark:border-white/10 text-nordic-muted dark:text-gray-300 hover:text-nordic-dark dark:hover:text-white hover:border-mosque/50 dark:hover:border-hint-green/50 text-sm font-medium transition-all hover:bg-mosque/5 dark:hover:bg-white/5";
  };

  return (
    <>
      <div className="flex items-center justify-start sm:justify-center gap-3 overflow-x-auto hide-scroll py-2 px-4 -mx-4">
        <button onClick={() => handleTypeClick('All')} className={getButtonClass('All')}>
          {dictionary.filters.all}
        </button>
        <button onClick={() => handleTypeClick('House')} className={getButtonClass('House')}>
          {dictionary.filters.house}
        </button>
        <button onClick={() => handleTypeClick('Apartment')} className={getButtonClass('Apartment')}>
          {dictionary.filters.apartment}
        </button>
        <button onClick={() => handleTypeClick('Villa')} className={getButtonClass('Villa')}>
          {dictionary.filters.villa}
        </button>
        <button onClick={() => handleTypeClick('Penthouse')} className={getButtonClass('Penthouse')}>
          {dictionary.filters.penthouse}
        </button>
        <div className="w-px h-6 bg-nordic-dark/10 dark:bg-white/20 mx-2 transition-colors"></div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="whitespace-nowrap flex items-center gap-1 px-4 py-2 rounded-full text-nordic-dark dark:text-gray-300 font-medium text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-icons text-base">tune</span> {dictionary.filters.filters}
        </button>
      </div>
      
      <FiltersModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
