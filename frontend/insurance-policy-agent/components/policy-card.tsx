import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Edit, BarChart } from "lucide-react"
import Link from "next/link"

interface PolicyCardProps {
  policy: {
    id: string
    title: string
    type: string
    lastUpdated: string
    status: string
  }
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const statusColor =
    policy.status === "Activa"
      ? "bg-green-100 text-green-800 hover:bg-green-200"
      : policy.status === "En revisión"
        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        : "bg-gray-100 text-gray-800 hover:bg-gray-200"

  return (
    <div className="bg-white rounded-3xl border p-6 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold">{policy.title}</h3>
        <Badge variant="outline" className={statusColor}>
          {policy.status}
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground mb-6">
        <div className="flex items-center mb-1">
          <FileText className="mr-2 h-4 w-4" />
          <span>ID: {policy.id}</span>
        </div>
        <div>
          {policy.type} • Actualizada: {new Date(policy.lastUpdated).toLocaleDateString()}
        </div>
      </div>

      <div className="flex justify-between">
        <Link href={`/policy/${policy.id}`}>
          <Button variant="outline" size="sm" className="rounded-full">
            <FileText className="mr-2 h-4 w-4" />
            Ver
          </Button>
        </Link>
        <div className="space-x-2">
          <Link href={`/policy/${policy.id}`}>
            <Button variant="outline" size="sm" className="rounded-full">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="rounded-full">
            <BarChart className="mr-2 h-4 w-4" />
            Analizar
          </Button>
        </div>
      </div>
    </div>
  )
}
