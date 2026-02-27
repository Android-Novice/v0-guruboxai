"use client"

interface ScanningAnimationProps {
  isActive: boolean
}

export function ScanningAnimation({ isActive }: ScanningAnimationProps) {
  if (!isActive) return null

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm">
      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.06]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px bg-foreground"
            style={{ top: `${(i + 1) * 12.5}%` }}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-foreground"
            style={{ left: `${(i + 1) * 8.33}%` }}
          />
        ))}
      </div>

      {/* Warm scanning sweep */}
      <div className="scan-line absolute top-0 bottom-0 w-px">
        <div
          className="h-full w-20"
          style={{
            background: 'linear-gradient(90deg, transparent, oklch(0.78 0.14 70 / 0.25), oklch(0.58 0.16 250 / 0.15), transparent)',
          }}
        />
      </div>

      {/* Data dots (amber/gold tones) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={`dot-${i}`}
          className="absolute scan-dot rounded-full"
          style={{
            width: i % 3 === 0 ? 6 : 4,
            height: i % 3 === 0 ? 6 : 4,
            left: `${10 + Math.sin(i * 1.3) * 35 + 35}%`,
            top: `${15 + Math.cos(i * 1.7) * 30 + 30}%`,
            animationDelay: `${i * 0.2}s`,
            background: i % 2 === 0
              ? 'oklch(0.78 0.14 70)'
              : 'oklch(0.58 0.16 250)',
          }}
        />
      ))}

      {/* Pulse lines */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`pulse-${i}`}
          className="scan-pulse absolute left-0 right-0 h-px"
          style={{
            top: `${25 + i * 25}%`,
            animationDelay: `${i * 0.7}s`,
            background: 'linear-gradient(90deg, transparent, oklch(0.78 0.14 70 / 0.3), oklch(0.58 0.16 250 / 0.2), transparent)',
          }}
        />
      ))}

      {/* Corner brackets */}
      <div className="absolute left-3 top-3 size-4 border-l border-t border-[oklch(0.78_0.14_70/0.4)]" />
      <div className="absolute right-3 top-3 size-4 border-r border-t border-[oklch(0.58_0.16_250/0.4)]" />
      <div className="absolute left-3 bottom-3 size-4 border-l border-b border-[oklch(0.58_0.16_250/0.4)]" />
      <div className="absolute right-3 bottom-3 size-4 border-r border-b border-[oklch(0.78_0.14_70/0.4)]" />
    </div>
  )
}
