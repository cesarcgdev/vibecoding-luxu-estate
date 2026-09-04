"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import LanguageSelector from "./LanguageSelector";
import CurrencySelector from "./CurrencySelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { FOCUS_SEARCH_EVENT } from "@/lib/search-filters";
import { describeSupabaseError } from "@/lib/supabase-errors";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { dictionary } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // The slide-open animation needs overflow-hidden to clip the growing panel,
  // but that same clipping cuts off LanguageSelector's dropdown once open —
  // so overflow only switches to visible after the slide finishes.
  const [mobilePanelSettled, setMobilePanelSettled] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata?.avatar_url) {
          setUserAvatar(session.user.user_metadata.avatar_url);
        }
      } catch (error) {
        // Auth being unreachable means "signed out", not a stuck avatar skeleton
        console.error("Could not read the auth session:", describeSupabaseError(error));
        setUserAvatar(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.user_metadata?.avatar_url) {
        setUserAvatar(session.user.user_metadata.avatar_url);
      } else {
        setUserAvatar(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // A route change means navigation already happened, so collapse the mobile panel
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobilePanelSettled(false);
      return;
    }
    const timer = setTimeout(() => setMobilePanelSettled(true), 300);
    return () => clearTimeout(timer);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // The local session is cleared either way, so still send them home
      console.error("Sign out failed:", describeSupabaseError(error));
    }
    setDropdownOpen(false);
    router.push("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  /** Both listing pages mount a search bar, so there just hand it focus */
  const handleSearchClick = (event: React.MouseEvent) => {
    if (pathname !== "/" && pathname !== "/rent") return;
    event.preventDefault();
    window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT));
  };

  const sections = [
    { href: "/", label: dictionary.navbar.buy },
    { href: "/rent", label: dictionary.navbar.rent },
    { href: "/saved", label: dictionary.navbar.savedHomes },
  ];

  const isCurrent = (href: string) => pathname === href;

  const desktopLinkClass = (href: string) =>
    isCurrent(href)
      ? "text-mosque dark:text-hint-green font-medium text-sm border-b-2 border-mosque dark:border-hint-green px-1 py-1 transition-colors"
      : "text-nordic-dark/70 dark:text-gray-400 hover:text-nordic-dark dark:hover:text-white font-medium text-sm hover:border-b-2 hover:border-nordic-dark/20 dark:hover:border-white/20 px-1 py-1 transition-all";

  const mobileLinkClass = (href: string) =>
    isCurrent(href)
      ? "block px-3 py-2 rounded-md text-base font-medium text-mosque dark:text-hint-green bg-mosque/10 dark:bg-hint-green/10"
      : "block px-3 py-2 rounded-md text-base font-medium text-nordic-dark dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5";

  return (
    <nav className="min-w-0 sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-nordic-dark/10 dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-nordic-dark dark:bg-white flex items-center justify-center transition-colors">
              <span className="material-icons text-white dark:text-nordic-dark text-lg">apartment</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-nordic-dark dark:text-white transition-colors">
              LuxeEstate
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            {sections.map((section) => (
              <Link
                key={section.label}
                className={desktopLinkClass(section.href)}
                href={section.href}
                aria-current={isCurrent(section.href) ? "page" : undefined}
              >
                {section.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
            <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
              <LanguageSelector />
              <CurrencySelector />

              {/* Theme Toggle Button */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="text-nordic-dark dark:text-gray-300 hover:text-mosque dark:hover:text-white transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Toggle Dark Mode"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                </button>
              )}
            </div>

            <Link
              href={pathname === "/rent" ? "/rent#search" : "/#search"}
              onClick={handleSearchClick}
              aria-label={dictionary.search.hint}
              title={dictionary.search.hint}
              className="text-nordic-dark dark:text-gray-300 hover:text-mosque dark:hover:text-white transition-colors"
            >
              <span className="material-icons">search</span>
            </Link>
            {userAvatar && <NotificationBell />}

            {loading ? (
              <div className="w-9 h-9 ml-2 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse border-l border-nordic-dark/10 dark:border-white/10 pl-2"></div>
            ) : userAvatar ? (
              <div className="relative border-l border-nordic-dark/10 dark:border-white/10 pl-4 ml-2">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 outline-none"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ring-2 ring-transparent hover:ring-mosque dark:hover:ring-hint-green transition-all relative">
                    <Image
                      alt="Profile"
                      className="object-cover"
                      src={userAvatar}
                      fill
                      unoptimized
                    />
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-[#152e2a] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 overflow-hidden py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium flex items-center gap-2 transition-colors"
                    >
                      <span className="material-icons text-sm">logout</span>
                      {dictionary.navbar.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 pl-4 border-l border-nordic-dark/10 dark:border-white/10 ml-2 text-sm font-medium text-nordic-dark dark:text-white hover:text-mosque dark:hover:text-hint-green transition-colors">
                <span className="material-icons text-xl">login</span>
                <span className="hidden sm:inline">{dictionary.navbar.login}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full text-nordic-dark dark:text-gray-300 hover:text-mosque dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-icons">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </div>
      <div
        id="mobile-menu"
        className={`md:hidden border-t border-nordic-dark/5 dark:border-white/5 bg-background-light dark:bg-background-dark transition-[max-height] duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[28rem]" : "max-h-0"
        } ${mobilePanelSettled ? "overflow-visible" : "overflow-hidden"}`}
      >
        <div className="px-4 py-2 space-y-1">
          {sections.map((section) => (
            <Link
              key={section.label}
              className={mobileLinkClass(section.href)}
              href={section.href}
              aria-current={isCurrent(section.href) ? "page" : undefined}
            >
              {section.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center px-4 py-3 border-t border-nordic-dark/5 dark:border-white/5">
          <div className="flex-1 flex justify-start">
            <LanguageSelector align="left" />
          </div>
          <div className="flex-1 flex justify-center">
            <CurrencySelector />
          </div>
          <div className="flex-1 flex justify-end">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="text-nordic-dark dark:text-gray-300 hover:text-mosque dark:hover:text-white transition-colors flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Toggle Dark Mode"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {theme === "dark" ? "light_mode" : "dark_mode"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
