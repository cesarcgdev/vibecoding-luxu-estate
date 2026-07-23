"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Admin user info with a real placeholder avatar
  const adminUser = {
    email: "admin@luxestate.com",
    role: "Admin",
    image: "https://ui-avatars.com/api/?name=Admin+Luxe&background=19322F&color=fff",
  };

  const navLinks = [
    { name: "Dashboard", href: "/admin" },
    { name: "Properties", href: "/admin/properties" },
    { name: "Users", href: "/admin/users" },
  ];

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Basic logout handling for now
    router.push("/");
  };

  return (
    <header className="w-full bg-white dark:bg-[#152e2a] border-b border-gray-200 dark:border-primary/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Nav */}
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex-shrink-0 flex items-center">
              <h2 className="text-xl font-bold text-nordic dark:text-white tracking-tight">
                LuxeEstate <span className="text-primary">Admin</span>
              </h2>
            </Link>
            
            <nav className="hidden md:flex space-x-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-nordic text-white dark:bg-white dark:text-nordic shadow-sm"
                        : "text-nordic/70 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-primary/10 hover:text-nordic dark:hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={popoverRef}>
              <button 
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-primary/10 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-primary/20"
              >
                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gray-200">
                  <Image 
                    src={adminUser.image} 
                    alt="Admin Profile" 
                    fill 
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-nordic dark:text-white leading-tight">
                    {adminUser.email}
                  </p>
                  <p className="text-xs text-nordic/60 dark:text-gray-400 capitalize">
                    {adminUser.role}
                  </p>
                </div>
                <span className="material-icons text-nordic/50 dark:text-gray-400 text-sm ml-1">
                  {isPopoverOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Logout Popover */}
              {isPopoverOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-dropdown border border-gray-100 dark:border-gray-700 py-1 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 sm:hidden">
                    <p className="text-sm font-medium text-nordic dark:text-white truncate">{adminUser.email}</p>
                    <p className="text-xs text-nordic/60 dark:text-gray-400 truncate">{adminUser.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
                  >
                    <span className="material-icons text-[18px]">logout</span>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Mobile nav indicator */}
      <div className="md:hidden flex overflow-x-auto hide-scroll border-t border-gray-100 dark:border-primary/10 bg-white/50 dark:bg-[#152e2a]/50">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-nordic text-nordic dark:border-white dark:text-white"
                  : "border-transparent text-nordic/60 dark:text-gray-400 hover:text-nordic dark:hover:text-gray-200"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
