"use client";

import { startTransition } from "react";
import { useFormStatus } from "react-dom";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
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
      <p role="alert" className="flex items-start gap-2 rounded-lg bg-bad-soft px-3 py-2.5 text-sm text-bad">
        <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{state.error}</span>
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg bg-good-soft px-3 py-2.5 text-sm text-good">
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{state.ok}</span>
      </p>
    );
  return null;
}

const STATUS_STYLE: Record<Status, { cls: string; Icon: typeof CircleCheck }> = {
  green: { cls: "bg-good-soft text-good", Icon: CircleCheck },
  yellow: { cls: "bg-warn-soft text-warn", Icon: TriangleAlert },
  red: { cls: "bg-bad-soft text-bad", Icon: CircleX },
};

/** Status is always shown as icon + label, never colour alone. */
export function StatusPill({ status, label, size = "md" }: { status: Status; label: string; size?: "sm" | "md" }) {
  const { cls, Icon } = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${cls} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-[13px]"
      }`}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      {label}
    </span>
  );
}

/** Kept for existing call sites; renders the pill. */
export function StatusDot({ status, label }: { status: Status; label: string }) {
  return <StatusPill status={status} label={label} size="sm" />;
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
