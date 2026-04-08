import * as React from "react";
import { X } from "lucide-react";

import { cn } from "./utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  React.useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "relative w-full max-w-2xl rounded-3xl border border-pink-100 bg-white shadow-2xl shadow-pink-200/40",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-pink-100 bg-white text-[var(--muted-foreground)] transition-colors hover:bg-pink-50 hover:text-[var(--primary)]"
        >
          <X size={16} />
        </button>

        <div className="border-b border-pink-100 px-6 py-5 sm:px-8">
          <h2
            id="dialog-title"
            className="pr-10 text-xl font-semibold text-[var(--primary)]"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {description}
            </p>
          )}
        </div>

        <div className="px-6 py-6 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
