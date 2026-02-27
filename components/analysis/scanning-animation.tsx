"use client"

import { cn } from "@/lib/utils"

interface ScanningAnimationProps {
  isActive: boolean
}

export function ScanningAnimation({ isActive }: ScanningAnimationProps) {
  if (!isActive) return null

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border/50 bg-card/30">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px bg-primary"
            style={{ top: `${(i + 1) * 12.5}%` }}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-primary"
            style={{ left: `${(i + 1) * 8.33}%` }}
          />
        ))}
      </div>

      {/* Scanning line */}
      <div className="scan-line absolute top-0 bottom-0 w-px">
        <div className="h-full w-16 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Data dots */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`dot-${i}`}
          className={cn(
            "absolute size-1.5 rounded-full bg-primary scan-dot",
          )}
          style={{
            left: `${10 + Math.sin(i * 1.3) * 35 + 35}%`,
            top: `${15 + Math.cos(i * 1.7) * 30 + 30}%`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}

      {/* Horizontal pulse lines */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`pulse-${i}`}
          className="scan-pulse absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          style={{
            top: `${25 + i * 25}%`,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}

      {/* Corner brackets */}
      <div className="absolute left-3 top-3 size-4 border-l border-t border-primary/40" />
      <div className="absolute right-3 top-3 size-4 border-r border-t border-primary/40" />
      <div className="absolute left-3 bottom-3 size-4 border-l border-b border-primary/40" />
      <div className="absolute right-3 bottom-3 size-4 border-r border-b border-primary/40" />
    </div>
  )
}
