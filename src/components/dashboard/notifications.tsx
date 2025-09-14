"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Activity = {
  id: string;
  type: string;
  message: string;
  client_id?: string | null;
  document_id?: string | null;
  created_at: string;
};

type NotificationsContextValue = {
  items: Activity[];
  unreadCount: number;
  addItems: (newItems: Activity[]) => void;
  markAllRead: () => void;
  clear: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Activity[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const addItems = useCallback((newItems: Activity[]) => {
    if (!Array.isArray(newItems) || newItems.length === 0) return;
    setItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const deduped = newItems.filter((i) => !existingIds.has(i.id));
      if (deduped.length === 0) return prev;
      setUnreadCount((c) => c + deduped.length);
      return [...deduped, ...prev];
    });
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({ items, unreadCount, addItems, markAllRead, clear }),
    [items, unreadCount, addItems, markAllRead, clear]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
