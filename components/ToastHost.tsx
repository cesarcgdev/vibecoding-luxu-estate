"use client";

import React, { useEffect, useState } from "react";
import { TOAST_EVENT, type ToastDetail } from "@/lib/toast";

interface Toast extends ToastDetail {
  id: number;
}

const DISPLAY_MS = 2500;
let nextId = 0;

/** Mounted once in the root layout; shows brief messages dispatched via showToast() */
export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const { message, variant } = (event as CustomEvent<ToastDetail>).detail;
      const id = nextId++;
      setToasts((current) => [...current, { id, message, variant }]);
      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, DISPLAY_MS);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-[70] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-toast-in pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.variant === "error" ? "bg-red-500" : "bg-nordic-dark dark:bg-hint-green dark:text-nordic-dark"
          }`}
        >
          <span className="material-icons text-lg">
            {toast.variant === "error" ? "error_outline" : "check_circle"}
          </span>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
