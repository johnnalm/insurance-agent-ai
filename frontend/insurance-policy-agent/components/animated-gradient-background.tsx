"use client"

import { useEffect, useRef } from "react"

export function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar el canvas para que ocupe toda la pantalla
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Crear gradientes animados
    const gradients = [
      {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 300 + 100,
        dx: Math.random() * 0.5 - 0.25,
        dy: Math.random() * 0.5 - 0.25,
        color: "rgba(37, 99, 235, 0.1)",
      },
      {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 300 + 100,
        dx: Math.random() * 0.5 - 0.25,
        dy: Math.random() * 0.5 - 0.25,
        color: "rgba(59, 130, 246, 0.1)",
      },
      {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 300 + 100,
        dx: Math.random() * 0.5 - 0.25,
        dy: Math.random() * 0.5 - 0.25,
        color: "rgba(96, 165, 250, 0.1)",
      },
    ]

    // Función de animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Dibujar cada gradiente
      gradients.forEach((gradient) => {
        // Actualizar posición
        gradient.x += gradient.dx
        gradient.y += gradient.dy

        // Rebotar en los bordes
        if (gradient.x < 0 || gradient.x > canvas.width) gradient.dx *= -1
        if (gradient.y < 0 || gradient.y > canvas.height) gradient.dy *= -1

        // Crear gradiente radial
        const grd = ctx.createRadialGradient(gradient.x, gradient.y, 0, gradient.x, gradient.y, gradient.radius)
        grd.addColorStop(0, gradient.color)
        grd.addColorStop(1, "rgba(255, 255, 255, 0)")

        // Dibujar gradiente
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(gradient.x, gradient.y, gradient.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 opacity-70" />
}
