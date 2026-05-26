import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

const buttonTones: Record<ButtonTone, string> = {
  primary:
    "bg-gray-950 text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-white",
  secondary:
    "border border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50 disabled:text-gray-400",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-950 disabled:text-gray-300",
  danger:
    "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:text-red-300",
};

export function Button({
  className,
  tone = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition disabled:cursor-not-allowed",
        buttonTones[tone],
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  tone = "primary",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  tone?: ButtonTone;
}) {
  return (
    <Link
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition",
        buttonTones[tone],
        className
      )}
      {...props}
    />
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "border-gray-200 bg-gray-50 text-gray-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-normal text-gray-950 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-8 text-center">
      <div className="text-sm font-medium text-gray-950">{title}</div>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
