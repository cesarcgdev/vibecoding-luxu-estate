"use client";

import React from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/** The Google/GitHub sign-in buttons, shared by /login and AuthGateModal */
export default function AuthButtons() {
  const { dictionary } = useLanguage();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleGithubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGoogleLogin}
        className="group w-full flex items-center justify-center gap-3 bg-white dark:bg-[#1a3833] border border-gray-100 dark:border-mosque/30 rounded-lg p-3.5 text-nordic-dark dark:text-white font-medium transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-hint-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
        <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
        </svg>
        <span className="relative z-10">{dictionary.auth.continueWithGoogle}</span>
      </button>
      <button
        onClick={handleGithubLogin}
        className="group w-full flex items-center justify-center gap-3 bg-white dark:bg-[#1a3833] border border-gray-100 dark:border-mosque/30 rounded-lg p-3.5 text-nordic-dark dark:text-white font-medium transition-all duration-300 hover:shadow-card hover:-translate-y-0.5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-hint-green/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
        <svg className="w-5 h-5 relative z-10 fill-current text-nordic-dark dark:text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
        </svg>
        <span className="relative z-10">{dictionary.auth.continueWithGithub}</span>
      </button>
    </div>
  );
}
