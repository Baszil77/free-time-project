import clsx from "clsx";
import type { ComponentProps } from "react";

export function Button({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function SecondaryButton({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-ink transition hover:border-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={clsx(
        "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600",
        className
      )}
      {...props}
    />
  );
}
