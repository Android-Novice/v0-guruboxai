"use client"

import { useEffect, useRef } from "react"

const SPARKS = [
  { left: '10%', top: '15%', delay: '0s', size: 5 },
  { left: '75%', top: '20%', delay: '1.4s', size: 4 },
  { left: '42%', top: '55%', delay: '2.8s', size: 4.5 },
  { left: '85%', top: '65%', delay: '0.6s', size: 3.5 },
  { left: '25%', top: '78%', delay: '3.5s', size: 5 },
  { left: '58%', top: '10%', delay: '2s', size: 4 },
  { left: '92%', top: '45%', delay: '1s', size: 3.5 },
  { left: '5%', top: '50%', delay: '4s', size: 4.5 },
]

export function GradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const orbs = [
      { x: 0.75, y: 0.15, r: 0.45, color: [255, 200, 80], baseOpacity: 0.18, speedX: 0.00008, speedY: 0.00006, phaseX: 0, phaseY: 0.5 },
      { x: 0.15, y: 0.75, r: 0.42, color: [100, 140, 255], baseOpacity: 0.14, speedX: 0.00007, speedY: 0.00009, phaseX: 1.5, phaseY: 0 },
      { x: 0.50, y: 0.45, r: 0.35, color: [180, 140, 255], baseOpacity: 0.10, speedX: 0.00005, speedY: 0.00007, phaseX: 3, phaseY: 2 },
    ]

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const orb of orbs) {
        const cx = canvas.width * (orb.x + Math.sin(time * orb.speedX + orb.phaseX) * 0.08)
        const cy = canvas.height * (orb.y + Math.cos(time * orb.speedY + orb.phaseY) * 0.06)
        const radius = Math.min(canvas.width, canvas.height) * orb.r
        const opacityPulse = orb.baseOpacity + Math.sin(time * 0.0003 + orb.phaseX) * 0.04

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        const [r, g, b] = orb.color
        grad.addColorStop(0, `rgba(${r},${g},${b},${opacityPulse})`)
        grad.addColorStop(0.4, `rgba(${r},${g},${b},${opacityPulse * 0.5})`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)

        ctx.fillStyle = grad
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Soft warm base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(145deg, oklch(0.98 0.006 80), oklch(0.975 0.004 250), oklch(0.98 0.003 290))',
        }}
      />

      {/* Canvas-based aurora orbs - smooth, large, always visible */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ filter: 'blur(80px)' }}
      />

      {/* Spark particles - golden twinkling dots */}
      {SPARKS.map((spark, i) => (
        <div
          key={i}
          className="spark-particle absolute rounded-full"
          style={{
            left: spark.left,
            top: spark.top,
            width: spark.size,
            height: spark.size,
            background: `radial-gradient(circle, oklch(0.85 0.14 75), oklch(0.78 0.14 70 / 0.6))`,
            animationDelay: spark.delay,
            boxShadow: `0 0 ${spark.size * 4}px ${spark.size * 1.5}px oklch(0.85 0.12 80 / 0.35)`,
          }}
        />
      ))}
    </div>
  )
}
