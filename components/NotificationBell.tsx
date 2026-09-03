"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { formatCurrency } from "@/lib/currency/currency";
import { formatRelativeTime } from "@/lib/format-time";

const EXPIRY_DAYS = 30;
const SELECT =
  "id, property_id, property_title, property_slug, property_image, type, old_price_value, new_price_value, old_price_display, new_price_display, read, created_at";

type NotificationType = "price_change" | "removed" | "available_again";

interface NotificationRow {
  id: string;
  property_id: string | null;
  property_title: string;
  property_slug: string;
  property_image: string | null;
  type: NotificationType;
  old_price_value: number | null;
  new_price_value: number | null;
  old_price_display: string | null;
  new_price_display: string | null;
  read: boolean;
  created_at: string;
}

function expiryCutoff(): string {
  return new Date(Date.now() - EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** The navbar bell: unread price-change alerts on the visitor's saved properties */
export default function NotificationBell() {
  const { dictionary, locale } = useLanguage();
  const { currency } = useCurrency();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const refresh = async (userId: string) => {
      const { data } = await supabase
        .from("notifications")
        .select(SELECT)
        .eq("user_id", userId)
        .gte("created_at", expiryCutoff())
        .order("created_at", { ascending: false });

      if (!active) return;
      const rows = (data ?? []) as unknown as NotificationRow[];
      setNotifications(rows);
      setUnreadCount(rows.filter((n) => !n.read).length);
    };

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return undefined;
      userIdRef.current = user.id;

      // No scheduled cleanup job exists — this is the only place expired
      // notifications actually get deleted, opportunistically on open.
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .lt("created_at", expiryCutoff());

      await refresh(user.id);

      return supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            setUnreadCount((count) => count + 1);
            refresh(user.id);
          }
        )
        .subscribe();
    };

    const channelPromise = init();

    return () => {
      active = false;
      channelPromise.then((channel) => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllRead = async () => {
    const userId = userIdRef.current;
    if (!userId || unreadCount === 0) return;
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await createClient()
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
  };

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) markAllRead();
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await createClient().from("notifications").delete().eq("id", id);
  };

  const handleDeleteAll = async () => {
    const userId = userIdRef.current;
    setNotifications([]);
    setUnreadCount(0);
    if (userId) await createClient().from("notifications").delete().eq("user_id", userId);
  };

  const priceDirection = (n: NotificationRow): "up" | "down" | null => {
    if (n.old_price_value == null || n.new_price_value == null) return null;
    if (n.new_price_value > n.old_price_value) return "up";
    if (n.new_price_value < n.old_price_value) return "down";
    return null;
  };

  const messageFor = (n: NotificationRow): string => {
    if (n.type === "removed") {
      return dictionary.notifications.removed.replace("{title}", n.property_title);
    }
    if (n.type === "available_again") {
      return dictionary.notifications.availableAgain.replace("{title}", n.property_title);
    }

    const direction = priceDirection(n);
    const template =
      direction === "up"
        ? dictionary.notifications.priceUp
        : direction === "down"
        ? dictionary.notifications.priceDown
        : dictionary.notifications.priceChanged;

    return template
      .replace("{title}", n.property_title)
      .replace("{old}", formatCurrency(n.old_price_value, currency, locale, "full") ?? n.old_price_display ?? "")
      .replace("{new}", formatCurrency(n.new_price_value, currency, locale, "full") ?? n.new_price_display ?? "");
  };

  /** "removed" notifications have nowhere useful to click through to — the
   * listing is hidden or gone, so the detail page would just 404. */
  const statusIcon = (n: NotificationRow): { icon: string; className: string } | null => {
    if (n.type === "removed") {
      return { icon: "visibility_off", className: "text-nordic-dark/40 dark:text-gray-500" };
    }
    if (n.type === "available_again") {
      return { icon: "visibility", className: "text-green-600 dark:text-hint-green" };
    }
    const direction = priceDirection(n);
    if (!direction) return null;
    return {
      icon: direction === "up" ? "trending_up" : "trending_down",
      className: direction === "up" ? "text-red-500" : "text-green-600 dark:text-hint-green",
    };
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={dictionary.notifications.title}
        className="text-nordic-dark dark:text-gray-300 hover:text-mosque dark:hover:text-white transition-colors relative"
      >
        <span className="material-icons">notifications_none</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-background-light dark:border-background-dark"></span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#152e2a] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 overflow-hidden z-50 animate-toast-in"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
            <span className="font-semibold text-sm text-nordic-dark dark:text-white">
              {dictionary.notifications.title}
            </span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                className="text-xs font-medium text-mosque dark:text-hint-green hover:underline"
              >
                {dictionary.notifications.clearAll}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto hide-scroll">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-nordic-dark/60 dark:text-gray-400">
                {dictionary.notifications.empty}
              </p>
            ) : (
              notifications.map((n) => {
                const icon = statusIcon(n);
                // The listing is hidden or gone — nothing to navigate to.
                const clickable = n.type !== "removed";

                const thumbnail = (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {n.property_image && (
                      <Image
                        src={n.property_image}
                        alt={n.property_title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    )}
                  </div>
                );

                const text = (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-nordic-dark dark:text-gray-200 line-clamp-2">
                      {messageFor(n)}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-nordic-dark/50 dark:text-gray-500">
                      {icon && (
                        <span className={`material-icons text-sm ${icon.className}`}>{icon.icon}</span>
                      )}
                      <span>{formatRelativeTime(n.created_at, locale)}</span>
                    </div>
                  </div>
                );

                return (
                  <div
                    key={n.id}
                    className={`group flex gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 ${
                      clickable ? "" : "opacity-70"
                    }`}
                  >
                    {clickable ? (
                      <Link
                        href={`/properties/${n.property_slug}`}
                        onClick={() => setOpen(false)}
                        className="flex flex-1 min-w-0 gap-3"
                      >
                        {thumbnail}
                        {text}
                      </Link>
                    ) : (
                      <div className="flex flex-1 min-w-0 gap-3">
                        {thumbnail}
                        {text}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      aria-label={dictionary.notifications.delete}
                      className="self-start opacity-0 group-hover:opacity-100 transition-opacity text-nordic-dark/40 dark:text-gray-500 hover:text-red-500"
                    >
                      <span className="material-icons text-base">close</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
