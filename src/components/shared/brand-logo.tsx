"use client";

import { cn } from "@/lib/utils";

export function BrandLogo({ className, size = "md", showText = true }: { className?: string; size?: "sm" | "md" | "lg"; showText?: boolean }) {
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-xl";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative grid place-items-center rounded-2xl bg-antojo-gradient text-white shadow-glow", dim)}>
        <span className="font-display font-black tracking-tighter" style={{ fontSize: dim === "h-12 w-12" ? "1.6rem" : "1.05rem" }}>a</span>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-mango ring-2 ring-background" />
      </div>
      {showText && (
        <span className={cn("font-display font-extrabold tracking-tight text-foreground", text)}>
          Antojo
        </span>
      )}
    </div>
  );
}
