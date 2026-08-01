"use client";

import { useEffect, useId, useRef } from "react";

/**
 * TANGENT CMS — Accessible confirmation dialog.
 *
 * Replaces window.confirm() for destructive actions (article archiving).
 * - Centered overlay with dark backdrop
 * - Focus is trapped inside while open (Tab wraps)
 * - Escape cancels; backdrop click cancels
 * - Focus returns to the trigger element on close
 * - Body scroll is locked while open
 * - Full dark-mode support
 */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Disable the confirm button (e.g. while the destructive action runs). */
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Override for the confirm button classes (defaults to accent-red). */
  confirmClassName?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Archive",
  cancelLabel = "Cancel",
  confirmDisabled = false,
  onConfirm,
  onCancel,
  confirmClassName,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keep the latest handlers in refs so the keydown effect only depends on
  // `open` — parent callbacks are often recreated on every render.
  const onCancelRef = useRef(onCancel);
  const onConfirmRef = useRef(onConfirm);
  useEffect(() => {
    onCancelRef.current = onCancel;
    onConfirmRef.current = onConfirm;
  });

  // Focus trap + Escape + scroll lock while open.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;

    const focusCancel = () => {
      const cancelButton = dialog?.querySelector<HTMLElement>("[data-dialog-cancel]");
      (cancelButton ?? dialog)?.focus();
    };

    focusCancel();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancelRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.getClientRects().length > 0);

      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="presentation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-[2px] animate-modal-backdrop-in"
        onClick={() => onCancelRef.current()}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] p-6 shadow-2xl animate-modal-card-in"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M8.25 3.75h7.5a1.5 1.5 0 011.5 1.5v2.25h-10.5V5.25a1.5 1.5 0 011.5-1.5z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-sans text-lg font-extrabold tracking-tight text-slate-900 dark:text-white"
            >
              {title}
            </h2>
            <div
              id={messageId}
              className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
            >
              {message}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            data-dialog-cancel
            onClick={() => onCancelRef.current()}
            className="w-full sm:w-auto rounded-lg border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-accent-primary dark:hover:text-accent-primary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-dialog-confirm
            disabled={confirmDisabled}
            onClick={() => {
              onConfirmRef.current();
              onCancelRef.current();
            }}
            className={`w-full sm:w-auto rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmClassName ?? "bg-accent-primary hover:bg-accent-hover"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
