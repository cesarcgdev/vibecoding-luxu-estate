"use client";

import React from "react";
import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";

export default function LoginPage() {
  return (
    <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4 antialiased text-nordic-dark dark:text-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-hint-green/30 rounded-full blur-3xl dark:bg-mosque/10"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-mosque/10 rounded-full blur-3xl"></div>
      </div>
      
      <main className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center w-14 h-14 bg-mosque rounded-xl mb-6 shadow-soft text-white hover:scale-105 transition-transform">
            <span className="material-icons text-3xl">apartment</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-nordic-dark dark:text-white mb-2">
            Welcome to LuxeEstate
          </h1>
          <p className="text-nordic-muted dark:text-gray-400">
            Unlock exclusive properties worldwide.
          </p>
        </div>
        
        <div className="bg-white dark:bg-[#152e2a] rounded-2xl shadow-soft p-8 sm:p-10 border border-white/50 dark:border-mosque/20 backdrop-blur-sm">
          <AuthButtons />

          <p className="mt-8 text-center text-sm text-nordic-muted dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="#" className="font-semibold text-mosque hover:text-mosque/80 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
        
        <div className="mt-8 text-center">
          <nav className="flex justify-center gap-6 text-xs text-nordic-muted/70 dark:text-gray-500">
            <Link href="#" className="hover:text-nordic-dark dark:hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-nordic-dark dark:hover:text-gray-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-nordic-dark dark:hover:text-gray-300 transition-colors">
              Help Center
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
