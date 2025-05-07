import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PolicyCard } from "@/components/policy-card"
import { PlusCircle, ArrowRight } from "lucide-react"

export default function DashboardPage() {
  // Datos de ejemplo para las pólizas
  const policies = [
    {
      id: "pol-001",
      title: "Seguro de Responsabilidad Civil",
      type: "Empresarial",
      lastUpdated: "2023-12-15",
      status: "Activa",
    },
    {
      id: "pol-002",
      title: "Seguro de Propiedad Comercial",
      type: "Empresarial",
      lastUpdated: "2024-01-20",
      status: "En revisión",
    },
    {
      id: "pol-003",
      title: "Seguro de Interrupción de Negocio",
      type: "Empresarial",
      lastUpdated: "2024-02-05",
      status: "Borrador",
    },
  ]

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Mis Pólizas</h1>
          <p className="text-muted-foreground">Gestiona tus pólizas de seguro existentes o crea nuevas.</p>
        </div>
        <Link href="/policy/create">
          <Button className="mt-4 md:mt-0 rounded-full bg-black text-white hover:bg-black/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            NUEVA PÓLIZA
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {policies.map((policy) => (
          <PolicyCard key={policy.id} policy={policy} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-yellow rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-4">Análisis de Pólizas</h3>
          <p className="mb-6">
            Nuestro asistente AI puede analizar tus pólizas existentes y sugerir mejoras para optimizar tu cobertura.
          </p>
          <Link href="/analyze" className="group inline-flex items-center text-black font-medium">
            Analizar ahora
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="card-purple rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-4">Plantillas Populares</h3>
          <p className="mb-6">
            Accede a nuestra biblioteca de plantillas de pólizas para diferentes industrias y necesidades.
          </p>
          <Link href="/templates" className="group inline-flex items-center text-white font-medium">
            Ver plantillas
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}
