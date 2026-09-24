"use client";

import { startTransition } from "react";
import { useFormStatus } from "react-dom";
import type { Status } from "@/lib/calc/engine";

export function SubmitButton({
  children,
  className = "btn",
  name,
  value,
  pending: pendingOverride,
}: {
  children: React.ReactNode;
  className?: string;
  name?: string;
  value?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingOverride ?? status.pending;
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value} aria-busy={pending}>
      {children}
    </button>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {state.ok}
      </p>
    );
  return null;
}

const DOT: Record<Status, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

export function StatusDot({ status, label }: { status: Status; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`inline-block h-3 w-3 rounded-full ${DOT[status]}`} aria-hidden />
      {label}
    </span>
  );
}

/**
 * onSubmit handler that runs a server action without React's automatic form
 * reset, so user input survives validation errors.
 */
export function submitWithoutReset(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}
