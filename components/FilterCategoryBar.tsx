"use client";

import React, { useState } from "react";
import FiltersModal from "./FiltersModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function FilterCategoryBar() {
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
      ? "whitespace-nowrap px-5 py-2 rounded-full bg-nordic-dark text-white text-sm font-medium shadow-lg shadow-nordic-dark/10 transition-transform hover:-translate-y-0.5"
      : "whitespace-nowrap px-5 py-2 rounded-full bg-white border border-nordic-dark/5 text-nordic-muted hover:text-nordic-dark hover:border-mosque/50 text-sm font-medium transition-all hover:bg-mosque/5";
  };

  return (
    <>
      <div className="flex items-center justify-center gap-3 overflow-x-auto hide-scroll py-2 px-4 -mx-4">
        <button onClick={() => handleTypeClick('All')} className={getButtonClass('All')}>
          All
        </button>
        <button onClick={() => handleTypeClick('House')} className={getButtonClass('House')}>
          House
        </button>
        <button onClick={() => handleTypeClick('Apartment')} className={getButtonClass('Apartment')}>
          Apartment
        </button>
        <button onClick={() => handleTypeClick('Villa')} className={getButtonClass('Villa')}>
          Villa
        </button>
        <button onClick={() => handleTypeClick('Penthouse')} className={getButtonClass('Penthouse')}>
          Penthouse
        </button>
        <div className="w-px h-6 bg-nordic-dark/10 mx-2"></div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="whitespace-nowrap flex items-center gap-1 px-4 py-2 rounded-full text-nordic-dark font-medium text-sm hover:bg-black/5 transition-colors"
        >
          <span className="material-icons text-base">tune</span> Filters
        </button>
      </div>
      
      <FiltersModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
