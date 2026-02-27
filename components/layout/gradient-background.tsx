"use client"

const SPARKS = [
  { left: '12%', top: '18%', delay: '0s', size: 3 },
  { left: '78%', top: '25%', delay: '1.2s', size: 2 },
  { left: '45%', top: '65%', delay: '2.4s', size: 2.5 },
  { left: '88%', top: '72%', delay: '0.8s', size: 2 },
  { left: '28%', top: '82%', delay: '3.2s', size: 3 },
  { left: '62%', top: '12%', delay: '1.8s', size: 2 },
]

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Soft warm base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(145deg, oklch(0.98 0.006 80), oklch(0.975 0.004 250), oklch(0.98 0.003 290))',
        }}
      />

      {/* Aurora orb 1 - warm amber glow (top-right) */}
      <div
        className="aurora-orb-1 absolute rounded-full"
        style={{
          width: '45vw',
          height: '45vw',
          maxWidth: '650px',
          maxHeight: '650px',
          top: '-12%',
          right: '-8%',
          background: 'radial-gradient(circle, oklch(0.88 0.08 75 / 0.30), oklch(0.92 0.05 85 / 0.10), transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Aurora orb 2 - cool blue glow (bottom-left) */}
      <div
        className="aurora-orb-2 absolute rounded-full"
        style={{
          width: '40vw',
          height: '40vw',
          maxWidth: '550px',
          maxHeight: '550px',
          bottom: '-8%',
          left: '-6%',
          background: 'radial-gradient(circle, oklch(0.88 0.06 250 / 0.25), oklch(0.92 0.04 240 / 0.08), transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Aurora orb 3 - faint lavender center */}
      <div
        className="aurora-orb-3 absolute rounded-full"
        style={{
          width: '30vw',
          height: '30vw',
          maxWidth: '400px',
          maxHeight: '400px',
          top: '35%',
          left: '45%',
          background: 'radial-gradient(circle, oklch(0.93 0.04 300 / 0.18), transparent 70%)',
          filter: 'blur(45px)',
        }}
      />

      {/* Spark particles - tiny twinkling dots */}
      {SPARKS.map((spark, i) => (
        <div
          key={i}
          className="spark-particle absolute rounded-full"
          style={{
            left: spark.left,
            top: spark.top,
            width: spark.size,
            height: spark.size,
            background: `radial-gradient(circle, oklch(0.82 0.12 80), oklch(0.78 0.14 70 / 0.5))`,
            animationDelay: spark.delay,
            boxShadow: `0 0 ${spark.size * 3}px ${spark.size}px oklch(0.82 0.12 80 / 0.3)`,
          }}
        />
      ))}
    </div>
  )
}
