"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, ArrowRight, Star, Filter } from "lucide-react"

// Tipos para las plantillas
interface Template {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  rating: number
  downloads: number
  featured?: boolean
}

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Datos de ejemplo para las plantillas
  const templates: Template[] = [
    {
      id: "template-001",
      title: "Seguro de Responsabilidad Civil Profesional",
      description: "Plantilla completa para profesionales independientes y pequeñas empresas de servicios.",
      category: "Empresarial",
      tags: ["Responsabilidad", "Profesional", "Servicios"],
      rating: 4.8,
      downloads: 1250,
      featured: true,
    },
    {
      id: "template-002",
      title: "Seguro de Propiedad Comercial",
      description: "Protección para edificios, inventario y equipos de negocios.",
      category: "Empresarial",
      tags: ["Propiedad", "Comercial", "Edificios"],
      rating: 4.6,
      downloads: 980,
    },
    {
      id: "template-003",
      title: "Seguro de Interrupción de Negocio",
      description: "Cobertura para pérdidas de ingresos durante interrupciones operativas.",
      category: "Empresarial",
      tags: ["Interrupción", "Ingresos", "Operaciones"],
      rating: 4.7,
      downloads: 845,
    },
    {
      id: "template-004",
      title: "Seguro de Vida Término",
      description: "Protección financiera básica para dependientes durante un período específico.",
      category: "Personal",
      tags: ["Vida", "Término", "Familiar"],
      rating: 4.5,
      downloads: 1560,
    },
    {
      id: "template-005",
      title: "Seguro de Salud Individual",
      description: "Cobertura médica completa para individuos.",
      category: "Personal",
      tags: ["Salud", "Médico", "Individual"],
      rating: 4.9,
      downloads: 2100,
      featured: true,
    },
    {
      id: "template-006",
      title: "Seguro de Auto Comercial",
      description: "Cobertura para flotas y vehículos de empresa.",
      category: "Empresarial",
      tags: ["Auto", "Vehículos", "Flota"],
      rating: 4.4,
      downloads: 760,
    },
    {
      id: "template-007",
      title: "Seguro de Hogar",
      description: "Protección completa para viviendas y contenido.",
      category: "Personal",
      tags: ["Hogar", "Vivienda", "Contenido"],
      rating: 4.7,
      downloads: 1890,
    },
    {
      id: "template-008",
      title: "Seguro de Ciberseguridad",
      description: "Protección contra ataques cibernéticos y violaciones de datos.",
      category: "Empresarial",
      tags: ["Ciberseguridad", "Datos", "Tecnología"],
      rating: 4.8,
      downloads: 1120,
      featured: true,
    },
  ]

  // Filtrar plantillas según búsqueda y categoría
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = activeCategory ? template.category === activeCategory : true

    return matchesSearch && matchesCategory
  })

  // Extraer categorías únicas
  const categories = Array.from(new Set(templates.map((template) => template.category)))

  // Plantillas destacadas
  const featuredTemplates = templates.filter((template) => template.featured)

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Plantillas de Pólizas</h1>
        <p className="text-muted-foreground mb-8">
          Explora nuestra biblioteca de plantillas profesionales para diferentes tipos de seguros.
        </p>
      </motion.div>

      {/* Sección de búsqueda y filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar plantillas..."
              className="pl-10 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setActiveCategory(null)}
            >
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className="rounded-full whitespace-nowrap"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Plantillas destacadas */}
      {featuredTemplates.length > 0 && !searchQuery && !activeCategory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Plantillas Destacadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-black text-white rounded-3xl p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge className="bg-yellow-400 text-black mb-2">Destacada</Badge>
                    <h3 className="text-xl font-bold">{template.title}</h3>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span>{template.rating}</span>
                  </div>
                </div>
                <p className="text-white/80 mb-6">{template.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {template.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">{template.downloads} descargas</span>
                  <Link href={`/policy/create?template=${template.id}`}>
                    <Button className="rounded-full bg-white text-black hover:bg-white/90">
                      Usar plantilla
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Lista de plantillas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {searchQuery || activeCategory ? "Resultados" : "Todas las Plantillas"}
          </h2>
          <div className="flex items-center text-sm text-muted-foreground">
            <Filter className="h-4 w-4 mr-2" />
            {filteredTemplates.length} plantillas
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl border p-6 transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline">{template.category}</Badge>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span>{template.rating}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">{template.title}</h3>
              <p className="text-muted-foreground mb-6 text-sm">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {template.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{template.downloads} descargas</span>
                <Link href={`/policy/create?template=${template.id}`}>
                  <Button variant="outline" size="sm" className="rounded-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Mensaje si no hay resultados */}
      {filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No se encontraron resultados</h3>
          <p className="text-muted-foreground mb-6">
            No hay plantillas que coincidan con tu búsqueda. Intenta con otros términos o categorías.
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setSearchQuery("")
              setActiveCategory(null)
            }}
          >
            Ver todas las plantillas
          </Button>
        </motion.div>
      )}

      {/* CTA para crear póliza personalizada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-16 bg-gray-50 rounded-3xl p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">¿No encuentras lo que buscas?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Crea una póliza personalizada desde cero con la ayuda de nuestro asistente de IA.
        </p>
        <Link href="/policy/create">
          <Button className="rounded-full bg-black text-white hover:bg-black/90">
            Crear póliza personalizada
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
