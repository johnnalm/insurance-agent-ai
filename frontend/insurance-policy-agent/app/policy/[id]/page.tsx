import ProtectedRoute from "@/app/components/ProtectedRoute"
import { PolicyEditor } from "@/components/policy-editor"
import { notFound } from "next/navigation"

interface PolicyPageProps {
  params: {
    id: string
  }
}

export default function PolicyPage({ params }: PolicyPageProps) {
  const { id } = params

  // En un caso real, aquí cargaríamos la póliza desde una API o base de datos
  // Para este ejemplo, solo verificamos si es un ID válido de nuestro conjunto de datos
  if (!["pol-001", "pol-002", "pol-003"].includes(id) && id !== "create") {
    notFound()
  }

  const policyData = {
    title:
      id === "pol-001"
        ? "Seguro de Responsabilidad Civil"
        : id === "pol-002"
          ? "Seguro de Propiedad Comercial"
          : "Seguro de Interrupción de Negocio",
    content: `# Póliza de Seguro ${id}

## Sección 1: Cobertura

Esta póliza cubre daños a terceros causados por las operaciones del asegurado.

## Sección 2: Exclusiones

Esta póliza no cubre:
- Daños intencionales
- Actos de guerra o terrorismo
- Desastres naturales (a menos que se especifique lo contrario)

## Sección 3: Límites de Cobertura

El límite máximo de cobertura es de $1,000,000 por ocurrencia.

## Sección 4: Prima y Pagos

La prima anual es de $5,000, pagadera en cuotas mensuales.`,
  }

  return (
    <ProtectedRoute>
      <div className="container py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">{policyData.title}</h1>
          <p className="text-muted-foreground">Revise y modifique su póliza con ayuda del asistente AI</p>
        </div>

        <PolicyEditor initialPolicy={policyData} isNew={false} />
      </div>
    </ProtectedRoute>
  )
}
