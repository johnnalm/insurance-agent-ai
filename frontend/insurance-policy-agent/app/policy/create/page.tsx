import ProtectedRoute from "@/app/components/ProtectedRoute"
import PolicyChat from "@/components/policy-chat"

export default function CreatePolicyPage() {
  return (
    <ProtectedRoute>
    <div className="container py-10">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Crear Nueva Póliza</h1>
      <p className="text-muted-foreground mb-8">Utilice el asistente AI para crear una nueva póliza personalizada</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border overflow-hidden">
            <textarea
              className="w-full h-[600px] p-8 font-sans leading-relaxed resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Comience a escribir su póliza aquí..."
              defaultValue="# Nueva Póliza de Seguro

## Sección 1: Cobertura

Esta póliza cubre...

## Sección 2: Exclusiones

Esta póliza no cubre...

## Sección 3: Límites de Cobertura

El límite máximo de cobertura es...

## Sección 4: Prima y Pagos

La prima anual es..."
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <PolicyChat policyTitle="Nueva Póliza" isNew={true} />
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
