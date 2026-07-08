"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const { dictionary } = useLanguage();

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Property listings pagination"
      className="mt-12 flex items-center justify-center gap-2"
    >
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={`?page=${currentPage - 1}`}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-nordic-dark/10 text-nordic-dark text-sm font-medium hover:border-mosque hover:text-mosque transition-all hover:shadow-md"
          aria-label="Previous page"
        >
          <span className="material-icons text-base">chevron_left</span>
          {dictionary.pagination.previous}
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-nordic-dark/5 text-nordic-muted/40 text-sm font-medium cursor-not-allowed select-none">
          <span className="material-icons text-base">chevron_left</span>
          {dictionary.pagination.previous}
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page) => {
          const isActive = page === currentPage;
          return isActive ? (
            <span
              key={page}
              aria-current="page"
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-mosque text-white text-sm font-semibold shadow-md shadow-mosque/20"
            >
              {page}
            </span>
          ) : (
            <Link
              key={page}
              href={`?page=${page}`}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-nordic-dark/10 text-nordic-dark text-sm font-medium hover:border-mosque hover:text-mosque transition-all hover:shadow-md"
              aria-label={`Page ${page}`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={`?page=${currentPage + 1}`}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-nordic-dark/10 text-nordic-dark text-sm font-medium hover:border-mosque hover:text-mosque transition-all hover:shadow-md"
          aria-label="Next page"
        >
          {dictionary.pagination.next}
          <span className="material-icons text-base">chevron_right</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-nordic-dark/5 text-nordic-muted/40 text-sm font-medium cursor-not-allowed select-none">
          {dictionary.pagination.next}
          <span className="material-icons text-base">chevron_right</span>
        </span>
      )}
    </nav>
  );
}
