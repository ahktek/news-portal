"use client";

import { useEffect, useState } from "react";

/**
 * TANGENT CMS — Toast notifications.
 *
 * A provider-free pub/sub store: any component can call
 * `toast.success("...")` / `toast.warning("...")` / `toast.error("...")`
 * and every mounted <ToastViewport /> (rendered once in the dashboard
 * layout) re-renders. Toasts auto-dismiss — 4s for success/warning,
 * 6s for errors so they can be acted on.
 *
 * Placement: fixed bottom-right, stacked. Full dark-mode support.
 */

export type ToastType = "success" | "error" | "warning";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

// ─── Module-level store ────────────────────────────────────────────────────
let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  warning: 4000,
  error: 6000, // errors linger a little longer
};

function push(type: ToastType, message: string, duration?: number) {
  const effectiveDuration = duration ?? DEFAULT_DURATIONS[type];
  const id = nextId++;
  toasts = [...toasts, { id, type, message, duration: effectiveDuration }];
  emit();

  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emit();
    }, effectiveDuration);
  }
}

export const toast = {
  success: (message: string, duration?: number) => push("success", message, duration),
  warning: (message: string, duration?: number) => push("warning", message, duration),
  error: (message: string, duration?: number) => push("error", message, duration),
};

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

// ─── Icons ─────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
    </svg>
  );
}

// ─── Variant styling ───────────────────────────────────────────────────────
const VARIANT_CLASSES: Record<ToastType, string> = {
  success:
    "border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200",
  error:
    "border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/90 text-red-700 dark:text-red-300",
  warning:
    "border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300",
};

const ICON_CLASSES: Record<ToastType, string> = {
  success: "text-emerald-500 dark:text-emerald-400",
  error: "text-red-500 dark:text-red-400",
  warning: "text-amber-500 dark:text-amber-400",
};

// ─── Toast card ────────────────────────────────────────────────────────────
function ToastCard({ item }: { item: ToastItem }) {
  return (
    <div
      role={item.type === "error" ? "alert" : "status"}
      aria-atomic="true"
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-slate-900/5 dark:shadow-black/40 animate-toast-in ${VARIANT_CLASSES[item.type]}`}
    >
      <span className={`flex-shrink-0 pt-0.5 ${ICON_CLASSES[item.type]}`}>
        {item.type === "success" ? (
          <CheckIcon />
        ) : item.type === "error" ? (
          <XCircleIcon />
        ) : (
          <WarningIcon />
        )}
      </span>
      <p className="flex-1 min-w-0 text-sm font-semibold leading-snug pt-0.5">{item.message}</p>
      <button
        type="button"
        onClick={() => dismissToast(item.id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 -m-1 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Viewport ──────────────────────────────────────────────────────────────
/**
 * Mount once per layout/page that needs toasts. Renders nothing while
 * the queue is empty.
 */
export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const sync = () => setItems([...toasts]);
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  );
}
