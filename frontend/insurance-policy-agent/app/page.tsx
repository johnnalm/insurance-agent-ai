"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Star, Zap, ArrowRight, Play, ChevronDown } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"

export default function HomePage() {
  const [activeSection, setActiveSection] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8], [1, 0.8, 0.6, 0.4, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8], [1, 0.98, 0.96, 0.94, 0.92])

  // Animación automática para las secciones destacadas
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Datos para las secciones destacadas
  const features = [
    {
      title: "Creación Inteligente",
      description: "Genera pólizas personalizadas con IA en minutos, no en días",
      icon: Shield,
      color: "bg-yellow-400",
    },
    {
      title: "Análisis Detallado",
      description: "Comprende los términos complejos con explicaciones claras",
      icon: Zap,
      color: "bg-purple-500",
    },
    {
      title: "Modificación Visual",
      description: "Visualiza y compara cambios en tus pólizas de forma intuitiva",
      icon: Star,
      color: "bg-blue-500",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen" ref={containerRef}>
      {/* Hero Section con animaciones */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-yellow-200 blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-200 blur-3xl opacity-20"></div>
        </div>

        <div className="container px-4 md:px-6 z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium"
            >
              PROTECCIÓN PARA TODOS
            </motion.div>

            <div className="relative">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-5xl md:text-7xl font-bold tracking-tighter"
              >
                Pólizas de Seguro
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex justify-center my-4"
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, 0, -5, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "reverse",
                  }}
                  className="relative w-32 h-32 bubble"
                >
                  <Shield className="w-16 h-16 text-black" />
                </motion.div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-5xl md:text-7xl font-bold tracking-tighter"
              >
                Inteligentes
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="max-w-[700px] text-lg text-muted-foreground"
            >
              Crea, analiza y modifica pólizas de seguro con la ayuda de inteligencia artificial. Optimiza tus
              coberturas y entiende tus contratos de forma sencilla.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <Button asChild size="lg" className="rounded-full bg-black text-white hover:bg-black/90">
                <Link href="/policy/create">CREAR PÓLIZA</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full group">
                <Link href="/dashboard" className="flex items-center">
                  <Play className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                  VER DEMO
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="h-8 w-8 text-muted-foreground" />
        </motion.div>
      </section>

      {/* Sección de características con animación */}
      <section className="py-20 bg-gray-50">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">Revoluciona tu gestión de seguros</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nuestra plataforma combina inteligencia artificial con una interfaz intuitiva para transformar la forma en
              que trabajas con pólizas de seguro.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className={`${index === activeSection ? "bg-black text-white" : "bg-white"} p-8 rounded-3xl shadow-sm transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className={index === activeSection ? "text-white/80" : "text-muted-foreground"}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de estadísticas con animación */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium mb-4">
                ESTADÍSTICAS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">Optimiza tus pólizas y ahorra</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Nuestros clientes mejoran sus coberturas y reducen costos innecesarios gracias al análisis inteligente
                de sus pólizas.
              </p>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="group inline-flex items-center text-black font-medium">
                  Comenzar ahora
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "94%", label: "SATISFACCIÓN", color: "card-yellow" },
                { value: "30%", label: "AHORRO PROMEDIO", color: "bg-white border" },
                { value: "500+", label: "PÓLIZAS CREADAS", color: "bg-white border" },
                { value: "24h", label: "SOPORTE", color: "card-purple" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className={`${stat.color} rounded-3xl p-8 flex flex-col items-center justify-center text-center`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      delay: 0.2 + index * 0.1,
                    }}
                    viewport={{ once: true }}
                    className="text-5xl font-bold mb-2"
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sección de demostración con animación */}
      <section className="py-20 bg-gray-50">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">Cómo funciona</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nuestra plataforma simplifica todo el proceso de gestión de pólizas de seguro
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Crea o importa",
                description: "Crea una nueva póliza desde cero o importa una existente",
              },
              {
                step: "02",
                title: "Analiza y optimiza",
                description: "Nuestro asistente AI analiza la póliza y sugiere mejoras",
              },
              {
                step: "03",
                title: "Modifica y exporta",
                description: "Realiza cambios y exporta tu póliza optimizada",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-3xl shadow-sm"
              >
                <div className="text-6xl font-bold text-gray-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sección CTA con animación */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-black text-white p-12 rounded-3xl text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4">
              Comienza a optimizar tus pólizas hoy
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Únete a cientos de empresas que ya están ahorrando tiempo y dinero con nuestra plataforma
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-white/90">
                <Link href="/policy/create">CREAR MI PRIMERA PÓLIZA</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-bold text-xl">POLICYAI</span>
            </div>
            <div className="text-sm text-muted-foreground">© 2024 PolicyAI. Todos los derechos reservados.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
