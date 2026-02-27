"use client"

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base gradient */}
      <div className="gradient-bg absolute inset-0" />

      {/* Floating orbs for subtle depth */}
      <div
        className="orb-1 absolute rounded-full blur-3xl"
        style={{
          width: '40vw',
          height: '40vw',
          maxWidth: '600px',
          maxHeight: '600px',
          top: '-10%',
          right: '-5%',
          background: 'radial-gradient(circle, oklch(0.88 0.06 260 / 0.3), transparent 70%)',
        }}
      />
      <div
        className="orb-2 absolute rounded-full blur-3xl"
        style={{
          width: '35vw',
          height: '35vw',
          maxWidth: '500px',
          maxHeight: '500px',
          bottom: '-5%',
          left: '-5%',
          background: 'radial-gradient(circle, oklch(0.9 0.04 200 / 0.25), transparent 70%)',
        }}
      />
      <div
        className="orb-3 absolute rounded-full blur-3xl"
        style={{
          width: '25vw',
          height: '25vw',
          maxWidth: '400px',
          maxHeight: '400px',
          top: '40%',
          left: '50%',
          background: 'radial-gradient(circle, oklch(0.92 0.04 290 / 0.2), transparent 70%)',
        }}
      />
    </div>
  )
}
