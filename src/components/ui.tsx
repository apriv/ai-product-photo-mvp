import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  DetailsHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

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

type TabItem = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
};

export function Tabs({
  items,
  value,
  onChange,
  className,
  itemClassName,
  disabled,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("grid gap-2", className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value;
        const itemDisabled = disabled || item.disabled;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={itemDisabled}
            onClick={() => {
              if (!itemDisabled) onChange(item.value);
            }}
            className={cn(
              "rounded-lg border p-3 text-left transition disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400",
              active
                ? "border-black bg-gray-50"
                : "border-gray-200 bg-white hover:border-black",
              itemClassName
            )}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{item.label}</span>
              {item.meta && (
                <span className="shrink-0 text-xs text-gray-500">
                  {item.meta}
                </span>
              )}
            </span>
            {item.description && (
              <span className="mt-1 block text-xs leading-5 text-gray-500">
                {item.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-6 text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
        className
      )}
      {...props}
    />
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  side = "left",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: "left" | "right";
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-gray-950/30"
        aria-label="关闭面板"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-y-0 flex w-80 max-w-[86vw] flex-col bg-white shadow-xl",
          side === "left" ? "left-0" : "right-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <div className="text-sm font-semibold text-gray-950">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            关闭
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Dropdown({
  label,
  children,
  className,
  align = "right",
  ...props
}: DetailsHTMLAttributes<HTMLDetailsElement> & {
  label: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <details className={cn("group relative", className)} {...props}>
      <summary className="inline-flex h-10 cursor-pointer list-none items-center justify-center rounded-lg bg-gray-950 px-4 text-sm font-medium text-white transition hover:bg-gray-800 [&::-webkit-details-marker]:hidden">
        {label}
        <span className="ml-2 text-xs opacity-70">⌄</span>
      </summary>
      <div
        className={cn(
          "absolute top-12 z-30 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg",
          align === "right" ? "right-0" : "left-0"
        )}
      >
        {children}
      </div>
    </details>
  );
}

export function DropdownLink({
  className,
  disabled,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span
        className={cn(
          "block cursor-not-allowed px-3 py-2 text-sm text-gray-400",
          className
        )}
      >
        {props.children}
      </span>
    );
  }

  return (
    <Link
      className={cn(
        "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-950",
        className
      )}
      {...props}
    />
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
